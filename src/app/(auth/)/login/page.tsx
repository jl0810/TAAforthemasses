import { Metadata } from "next";
import Link from "next/link";
import { UserAuthForm } from "@/components/auth/user-auth-form";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Login | My TAA Portfolio",
  description: "Secure quantitative access",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md z-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2">
            <ShieldCheck size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-black font-outfit tracking-tighter text-white">
            Welcome Back
          </h1>
          <p className="text-white/40 font-medium">
            Access your tactical command center
          </p>
        </div>

        <div className="glass-card p-1 rounded-[2.5rem] bg-white/5 border border-white/10 shadow-2xl">
          <div className="p-8">
            <UserAuthForm />
          </div>
        </div>

        <p className="text-center text-xs text-white/20 font-medium tracking-widest uppercase">
          New here?{" "}
          <Link
            href="/signup"
            className="text-indigo-400 hover:text-indigo-300 font-black transition-colors"
          >
            Gain Access
          </Link>
        </p>
      </div>
    </div>
  );
}
