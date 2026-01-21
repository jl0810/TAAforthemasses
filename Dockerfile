# BASE IMAGE
FROM node:22-alpine AS base
WORKDIR /app

# BUILDER
FROM base AS builder
ARG GITHUB_TOKEN

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
RUN npm uninstall @jl0810/auth @jl0810/db-client && \
    npm install @jl0810/auth @jl0810/db-client --legacy-peer-deps

# Ensure the .npmrc is still there for potential postinstall or build checks
RUN echo "@jl0810:registry=https://npm.pkg.github.com" > .npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> .npmrc

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
# Dummy DB URL to allow build to pass without real DB connection
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

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

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
