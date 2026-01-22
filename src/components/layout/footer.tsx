import React from "react";
import { AlertTriangle } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full py-12 px-4 border-t border-white/5 mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
          <div className="max-w-md">
            <h3 className="text-white font-black font-outfit text-lg tracking-tighter mb-4">
              My TAA Portfolio
            </h3>
            <div className="flex gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
              <AlertTriangle className="text-amber-500 shrink-0" size={18} />
              <p className="text-[11px] leading-relaxed text-white/50">
                <strong className="text-amber-500">
                  NOT FINANCIAL ADVICE.
                </strong>{" "}
                The information provided on this platform is for educational and
                informational purposes only. Tactical Asset Allocation involves
                risk of loss. Past performance is not indicative of future
                results. Always consult with a licensed professional before
                investing.
              </p>
            </div>
          </div>

          <div className="text-[10px] text-white/20 font-medium uppercase tracking-widest mt-auto">
            © {new Date().getFullYear()} raydoug.com • Automated Signal
            Intelligence
          </div>
        </div>
      </div>
    </footer>
  );
}
