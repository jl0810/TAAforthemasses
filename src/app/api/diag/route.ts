import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    HAS_SECRET: !!process.env.BETTER_AUTH_SECRET,
    HAS_AUTH_SECRET: !!process.env.AUTH_SECRET,
    APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    EMAIL_FROM: process.env.EMAIL_FROM,
    HAS_USESEND_KEY: !!process.env.USESEND_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  });
}
