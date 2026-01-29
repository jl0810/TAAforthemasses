"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import * as swetrix from "swetrix";

export function SwetrixProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize Swetrix only if env vars are present
    if (
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_SWETRIX_PROJECT_ID &&
      process.env.NEXT_PUBLIC_SWETRIX_API_URL
    ) {
      swetrix.init(process.env.NEXT_PUBLIC_SWETRIX_PROJECT_ID, {
        apiURL: process.env.NEXT_PUBLIC_SWETRIX_API_URL,
      });
    }
  }, []);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_SWETRIX_PROJECT_ID &&
      process.env.NEXT_PUBLIC_SWETRIX_API_URL
    ) {
      swetrix.trackViews();
    }
  }, [pathname]);

  return null;
}
