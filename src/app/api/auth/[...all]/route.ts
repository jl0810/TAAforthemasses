import { auth } from "@/lib/auth"; // Ensure this matches export in src/lib/auth.ts
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
