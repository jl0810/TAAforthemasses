import Link from "next/link";
import { UserButton } from "@/components/auth/user-button";
import { BarChart3 } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
            <BarChart3 size={20} className="stroke-[3px]" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-outfit text-white leading-tight">
              TAA<span className="text-indigo-400">.</span>
            </h1>
            <p className="text-[10px] font-bold tracking-wider text-white/40 uppercase">
              Tactical Alpha
            </p>
          </div>
        </Link>

        {/* Desktop Nav - Could add more links here later */}
        {/* <nav className="hidden md:flex items-center gap-8"></nav> */}

        <div className="flex items-center gap-4">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
