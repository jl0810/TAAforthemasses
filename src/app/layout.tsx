import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { NavDock } from "@/components/layout/nav-dock";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "TAA for the Masses | Quantitative Investment Dashboard",
  description:
    "Democratizing institutional-grade Tactical Asset Allocation signals for retail investors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="antialiased overflow-x-hidden pb-32">
        <div className="fixed inset-0 -z-10 bg-[#0f172a]" />

        {/* Animated Background Gradients */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-emerald-500/10 blur-[100px]" />
        </div>

        <main className="max-w-7xl mx-auto px-4 pt-8">{children}</main>

        <NavDock />
      </body>
    </html>
  );
}
