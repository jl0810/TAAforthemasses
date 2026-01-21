"use client";

import React from "react";
import { Settings, Shield, Bell, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

const MENU_ITEMS = [
  {
    icon: Shield,
    title: "Auth Settings",
    desc: "Manage MFA and central sessions",
    color: "text-indigo-400",
  },
  {
    icon: Settings,
    title: "Preferences",
    desc: "Toggle EMA/SMA, Dark Mode, and Alerts",
    color: "text-emerald-400",
  },
  {
    icon: Bell,
    title: "Notifications",
    desc: "Month-end signal flip alerts",
    color: "text-rose-400",
  },
  {
    icon: CreditCard,
    title: "Billing & Plans",
    desc: "Manage your Pro subscription",
    color: "text-amber-400",
  },
];

export function ProfileSettings() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {MENU_ITEMS.map((item, idx) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="glass-card p-8 rounded-[2rem] flex items-center gap-6 cursor-pointer hover:bg-white/5 transition-all group"
        >
          <div
            className={`p-4 rounded-2xl bg-white/5 ${item.color} group-hover:scale-110 transition-transform`}
          >
            <item.icon size={28} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{item.title}</h3>
            <p className="text-white/40 text-xs leading-relaxed">{item.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
