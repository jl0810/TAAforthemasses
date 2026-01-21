import React from "react";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0f172a]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">{children}</div>
    </div>
  );
}
