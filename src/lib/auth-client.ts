import { createSharedAuthClient } from "@jl0810/auth/client";

export const authClient = createSharedAuthClient();

export const { signIn, signOut, useSession } = authClient;
