"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Rocket,
} from "lucide-react";

export function LandingHero() {
  return (
    <div className="space-y-10">
      {/* 🚀 COMEBACK ANNOUNCEMENT */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] p-8 bg-gradient-to-br from-emerald-500/20 via-indigo-500/20 to-purple-500/20 border-2 border-emerald-500/30"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.1),transparent)]" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center ring-2 ring-emerald-500/50">
              <Rocket className="text-emerald-400" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black font-outfit text-white tracking-tight">
                We&apos;re Back! 🎉
              </h3>
              <p className="text-white/60 text-sm mt-1">
                My TAA Portfolio has been rebuilt from the ground up with
                real-time data, faster signals, and a sleek new interface.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold text-sm uppercase tracking-wider">
              Live Now
            </span>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 max-w-3xl"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-6">
            <BarChart3 size={32} className="stroke-[2.5px]" />
          </div>

          <h1 className="text-5xl md:text-7xl font-black font-outfit tracking-tighter text-white leading-[1.1]">
            Institutional Grade <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              Tactical Allocation
            </span>
          </h1>

          <p className="text-xl text-white/40 max-w-2xl mx-auto leading-relaxed">
            Stop guessing. Start harvesting trends. Democratizing the &quot;Ivy
            5&quot; quantitative strategy for retail investors.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col md:flex-row gap-4 pt-4"
        >
          <Link
            href="/login"
            className="group relative px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-indigo-50 transition-all flex items-center gap-2"
          >
            View Live Signals
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
          </Link>

          <a
            href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=962461"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white/5 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-sm border border-white/10"
          >
            Read the Whitepaper
          </a>
        </motion.div>

        {/* Social Proof / Trust */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-white/30"
        >
          <div className="flex flex-col items-center gap-2">
            <ShieldCheck size={24} />
            <span className="text-sm font-medium uppercase tracking-wider">
              Risk Managed
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <TrendingUp size={24} />
            <span className="text-sm font-medium uppercase tracking-wider">
              Trend Following
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <BarChart3 size={24} />
            <span className="text-sm font-medium uppercase tracking-wider">
              Quant Verified
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
