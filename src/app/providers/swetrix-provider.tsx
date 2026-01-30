"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import * as swetrix from "swetrix";
import { onLCP, onCLS, onINP, onFCP, onTTFB } from "web-vitals";

const reportWebVitals = (metric: { name: string; value: number; id: string }) => {
  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SWETRIX_PROJECT_ID &&
    process.env.NEXT_PUBLIC_SWETRIX_API_URL
  ) {
    // Round values for easier analysis, except for CLS which is a small decimal
    const propertyValue =
      metric.name === "CLS" ? metric.value : Math.round(metric.value);

    swetrix.track({
      ev: metric.name,
      meta: {
        value: propertyValue,
        id: metric.id,
      },
    });
  }
};

function SwetrixInner() {
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

      // Enable automatic error tracking
      swetrix.trackErrors();

      // Explicitly track Google's Core Web Vitals
      try {
        onCLS(reportWebVitals);
        onLCP(reportWebVitals);
        onINP(reportWebVitals);
        onFCP(reportWebVitals);
        onTTFB(reportWebVitals);
      } catch (error) {
        console.error("[Swetrix] Error initializing web-vitals:", error);
      }
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
  }, [pathname, searchParams]);

  return null;
}

export function SwetrixProvider() {
  return (
    <Suspense fallback={null}>
      <SwetrixInner />
    </Suspense>
  );
}
