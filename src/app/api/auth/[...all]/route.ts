import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

const { GET: authGET, POST: authPOST } = toNextJsHandler(auth);

export const GET = async (req: NextRequest) => {
  // DEBUG: Log cookies on Google Callback to diagnosis state_mismatch
  if (req.nextUrl.pathname.includes("callback/google")) {
    console.log("🔍 [Debug] Google Callback Handler Hit");
    console.log("   URL:", req.nextUrl.toString());

    const cookies = req.cookies.getAll();
    console.log("   Cookies Received count:", cookies.length);
    cookies.forEach((c) =>
      console.log(`   - ${c.name}: ${c.value.substring(0, 15)}...`),
    );

    const stateCookie = req.cookies.get("better-auth.state");
    const stateParam = req.nextUrl.searchParams.get("state");

    console.log("   Checking State Match:");
    console.log("     Cookie:", stateCookie?.value);
    console.log("     Param: ", stateParam);

    if (!stateCookie)
      console.error(
        "❌ [CRITICAL] better-auth.state cookie is MISSING on the server request!",
      );
    else if (stateCookie.value !== stateParam)
      console.error(
        "❌ [CRITICAL] State Mismatch! Cookie vs Param do not match.",
      );
    else console.log("✅ State Match Confirmed");
  }
  return authGET(req);
};

export const POST = async (req: NextRequest) => {
  return authPOST(req);
};
