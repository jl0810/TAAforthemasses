import { createAuth, createGetSession, createRequireAuth } from "@jl0810/auth";
import { db, schema } from "@/lib/db";
import { userProfiles } from "@jl0810/db-client";

export const auth = createAuth(
  {
    db,
    appName: "TAAforTheMasses",
    brandingColor: "#6366f1",
    websiteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    supportEmail: "support@raydoug.com",
  },
  {
    advanced: {
      trustedOrigins: ["http://localhost:3000"],
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
