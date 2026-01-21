"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, PlayCircle, ShieldCheck, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Pulse",
    href: "/",
    icon: Activity,
  },
  {
    label: "Lab",
    href: "/playground",
    icon: PlayCircle,
  },
  {
    label: "Command",
    href: "/command",
    icon: ShieldCheck,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserCircle,
  },
];

export function NavDock() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="pointer-events-auto flex items-center gap-2 p-2 rounded-2xl glass-card backdrop-blur-2xl border-white/10"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-300",
                isActive ? "text-white" : "text-white/40 hover:text-white/70",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="dock-active"
                  className="absolute inset-0 bg-white/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              <Icon size={20} className={cn("relative z-10 mb-1")} />
              <span className="relative z-10 text-[10px] font-medium uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
}
