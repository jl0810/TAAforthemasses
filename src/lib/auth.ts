import { createAuth, createGetSession, createRequireAuth } from "@jl0810/auth";
import { db } from "@/lib/db";
import { userProfiles } from "@jl0810/db-client";
import { EmailService } from "@/lib/email";

export const auth = createAuth(
  {
    db,
    appName: "TAAforTheMasses",
    brandingColor: "#6366f1",
    websiteUrl:
      process.env.NEXT_PUBLIC_APP_URL || "https://taaforthemasses.com",
    supportEmail: "support@raydoug.com",
  },
  {
    socialProviders: {
      google: {
        clientId: process.env.AUTH_GOOGLE_ID!,
        clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      },
    },
    advanced: {
      trustedOrigins: ["http://localhost:3000", "https://taaforthemasses.com"],
      useSecureCookies: true, // Force Secure cookies even behind proxy
      cookiePrefix: "taa-auth",
      crossSubdomainCookies: {
        enabled: true,
        domain: ".taaforthemasses.com", // Allow sharing with subdomains if needed
      },
      defaultCookieAttributes: {
        secure: true,
        sameSite: "lax", // Recommended for OAuth top-level navigation
        httpOnly: true,
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user: unknown) => {
            const typedUser = user as { email: string; name?: string };
            console.log(
              `[Auth] New user created: ${typedUser.email}. Sending welcome email.`,
            );
            // Fire and forget - don't block the auth response
            EmailService.sendWelcomeEmail(
              typedUser.email,
              typedUser.name || "User",
            ).catch((err) => {
              console.error("[Auth] Failed to send welcome email:", err);
            });
          },
        },
      },
    },
  },
);

export const getSession = createGetSession(auth, {
  db,
  userProfilesTable: userProfiles,
  profileLookupField: "email",
  authLookupField: "email",
  adminEmails: ["jefflawson@gmail.com"],
  demoConfig: {
    enabled: true,
    demoUser: {
      userId: "00000000-0000-0000-0000-000000000001",
      profileId: "00000000-0000-0000-0000-000000000001",
      authUserId: "00000000-0000-0000-0000-000000000001",
      email: "demo@raydoug.com",
      name: "Tactical Alpha (Demo)",
      image: null,
    },
  },
});

export const requireAuth = createRequireAuth(getSession);
