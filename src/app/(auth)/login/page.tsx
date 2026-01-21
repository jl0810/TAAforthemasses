import React from "react";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <div className="glass-card p-8 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl bg-black/40">
      <LoginForm />
    </div>
  );
}
