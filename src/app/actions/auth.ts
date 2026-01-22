"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function requestMagicLink(email: string) {
  // Simple validation for now
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: "Invalid email format",
    };
  }

  // We return success to let the client proceed with signIn.magicLink()
  return {
    success: true,
  };
}

export async function deleteAccount() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    await auth.api.deleteUser({
      body: {
        userId: session.user.id,
      },
      headers: await headers(), // Forward headers for potential internal checks
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete account:", error);
    return {
      success: false,
      error: "Failed to delete account",
    };
  }
}
