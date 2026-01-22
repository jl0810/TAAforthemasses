import { createAuth, createGetSession, createRequireAuth } from "@jl0810/auth";
import { db, schema } from "@/lib/db";
import { userProfiles } from "@jl0810/db-client";
import { magicLink } from "better-auth/plugins";
import { renderMagicLinkEmail } from "@jl0810/messaging";

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
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          console.log(`[Auth] Attempting magic link send for ${email}`);
          try {
            const html = await renderMagicLinkEmail({
              magicLink: url,
              branding: {
                appName: "TAA for the Masses",
                primaryColor: "#6366f1",
                websiteUrl: "https://taaforthemasses.com",
                supportEmail: "support@raydoug.com",
                logoUrl: "https://taaforthemasses.com/logo.png",
              },
              userEmail: email,
            });

            const apiUrl =
              process.env.USESEND_API_URL || "http://usesend:3000/api/v1";
            const apiKey = process.env.USESEND_API_KEY;
            const fromEmail =
              process.env.EMAIL_FROM || "admin@taaforthemasses.com";

            console.log(`[Auth] Dispatching email via: ${apiUrl}/emails`);
            if (!apiKey)
              console.warn("[Auth] WARNING: USESEND_API_KEY is missing!");

            const response = await fetch(`${apiUrl}/emails`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: apiKey ? `Bearer ${apiKey}` : "",
              },
              body: JSON.stringify({
                to: email,
                from: fromEmail,
                subject: "Sign in to TAA for the Masses",
                html,
              }),
            });

            const bodyText = await response.text();

            if (!response.ok) {
              console.error(
                `[Auth] UseSend returned ${response.status}. Body: ${bodyText.substring(0, 500)}`,
              );
              throw new Error(
                `Email delivery failed with status ${response.status}`,
              );
            }

            try {
              const json = JSON.parse(bodyText);
              console.log("[Auth] Magic link dispatched successfully.", json);
            } catch (pE) {
              console.error(
                `[Auth] Failed to parse success response as JSON. Body: ${bodyText.substring(0, 500)}`,
              );
              // If we got here but status was OK, maybe it's fine?
              // But Better Auth's core might expect this to succeed or throw.
            }
          } catch (error) {
            console.error("[Auth] Fatal error in sendMagicLink:", error);
            throw error;
          }
        },
      }),
    ],
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
