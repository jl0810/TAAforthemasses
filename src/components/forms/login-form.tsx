"use client";

import React, { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Loader2, Mail, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Assuming sonner is installed or will use basic alert

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSocialSignIn(provider: "google" | "github" | "apple") {
    setLoading(true);
    await signIn.social({
      provider,
      callbackURL: "/dashboard", // Or wherever we want to go
    });
    setLoading(false);
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn.magicLink({
        email,
        callbackURL: "/dashboard",
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      setSubmitted(true);
      toast.success("Magic link sent! Check your email.");
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
          <Mail size={32} />
        </div>
        <h3 className="text-xl font-bold text-white">Check your email</h3>
        <p className="text-white/60 text-sm">
          We sent a magic link to{" "}
          <span className="text-white font-medium">{email}</span>.
          <br />
          Click the link to sign in.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-indigo-400 hover:text-indigo-300 text-sm font-medium mt-4"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-black font-outfit text-white tracking-tight">
          Welcome Back
        </h1>
        <p className="text-white/40 text-sm">
          Sign in to access your tactical strategies
        </p>
      </div>

      <div className="space-y-4">
        {/* Social Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleSocialSignIn("google")}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all border border-white/10 rounded-xl py-3 text-white font-medium text-sm disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Globe size={16} />
            )}
            Continue with Google
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0f172a] px-2 text-white/40">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Magic Link Form */}
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div className="space-y-2">
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            className={cn(
              "w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
            )}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Sign in with Magic Link
                <Mail size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-white/20">
        By clicking continue, you agree to our Terms of Service and Privacy
        Policy.
      </p>
    </div>
  );
}
