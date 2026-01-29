# BASE IMAGE
FROM node:22-alpine AS base
WORKDIR /app

# DEPS-PROD: Install production dependencies only (for scripts)
FROM base AS deps-prod
ARG GITHUB_TOKEN
RUN if [ -z "$GITHUB_TOKEN" ]; then exit 1; fi
RUN echo "@jl0810:registry=https://npm.pkg.github.com" > .npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> .npmrc
COPY package.json package-lock.json ./
RUN npm install --omit=dev --legacy-peer-deps --ignore-scripts

# Force-fix: Uninstall local deps and install from registry for production deps
# This prevents symlink conflicts when copying over the standalone folder
RUN npm uninstall @jl0810/auth @jl0810/db-client @jl0810/messaging && \
    npm install @jl0810/auth @jl0810/db-client @jl0810/messaging --legacy-peer-deps

# BUILDER
FROM base AS builder
ARG GITHUB_TOKEN
ARG NEXT_PUBLIC_SWETRIX_PROJECT_ID
ARG NEXT_PUBLIC_SWETRIX_API_URL

# Sanity check: Fail build if token is missing
RUN if [ -z "$GITHUB_TOKEN" ]; then \
    echo "❌ ERROR: GITHUB_TOKEN build argument is missing!"; \
    echo "Make sure to check 'Build Variable' for GITHUB_TOKEN in Dokploy settings."; \
    exit 1; \
    fi

# Configure GitHub Packages authentication
RUN echo "@jl0810:registry=https://npm.pkg.github.com" > .npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> .npmrc

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install dependencies using legacy-peer-deps to ignore conflicts
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Force-fix: Uninstall local deps and install from registry
# This ensures package.json and node_modules are correctly updated without lockfile conflicts
RUN npm uninstall @jl0810/auth @jl0810/db-client @jl0810/messaging && \
    npm install @jl0810/auth @jl0810/db-client @jl0810/messaging --legacy-peer-deps

# Ensure the .npmrc is still there for potential postinstall or build checks
RUN echo "@jl0810:registry=https://npm.pkg.github.com" > .npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> .npmrc

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
# Dummy DB URL to allow build to pass without real DB connection
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# Inject Swetrix build args into environment for Next.js build
ENV NEXT_PUBLIC_SWETRIX_PROJECT_ID=$NEXT_PUBLIC_SWETRIX_PROJECT_ID
ENV NEXT_PUBLIC_SWETRIX_API_URL=$NEXT_PUBLIC_SWETRIX_API_URL

# Run the build
RUN npm run build



# RUNNER
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy Next.js standalone output (app logic)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Fakesharp Pattern: Copy source & scripts
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# OVERWRITE node_modules with full production deps (ensures scripts have what they need)
COPY --from=deps-prod --chown=nextjs:nodejs /app/node_modules ./node_modules

# Install execution tools (tsx) globally
RUN npm install -g tsx dotenv

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
