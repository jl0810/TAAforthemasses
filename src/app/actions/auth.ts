"use server";

import { auth } from "@/lib/auth";

export async function requestMagicLink(email: string) {
  // Simple validation for now
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: "Invalid email format",
    };
  }

  // NOTE: This project is meant to be lite/stateless.
  // Rate limiting typically happens at the central @jl0810/auth level.
  // We return success to let the client proceed with signIn.magicLink()
  return {
    success: true,
  };
}
