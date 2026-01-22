"use client";

import React from "react";
import { Calculator, Target } from "lucide-react";
import { CalculationAudit, BacktestAudit } from "@/app/actions/market";
import { cn } from "@/lib/utils";

interface AuditTrailProps {
  type: "signal" | "trade";
  audit?: CalculationAudit;
  tradeAudit?: BacktestAudit;
  className?: string;
}

export function AuditTrail({
  type,
  audit,
  tradeAudit,
  className,
}: AuditTrailProps) {
  if (type === "signal" && audit) {
    return (
      <div
        className={cn(
          "space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10",
          className,
        )}
      >
        <div className="flex items-center gap-2 text-indigo-400 mb-1">
          <Calculator size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Calculation Auditor
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[9px] text-white/30 uppercase font-bold">
              Raw Price
            </span>
            <div className="text-xs font-mono text-white">
              ${audit.price.toFixed(2)}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-white/30 uppercase font-bold">
              MA Trend
            </span>
            <div className="text-xs font-mono text-white">
              ${audit.trend.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] text-white/30 uppercase font-bold">
              Formula
            </span>
            <span className="text-[10px] font-mono text-indigo-300/60">
              {audit.formula}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-white/30 uppercase font-bold">
              Result (Buffer)
            </span>
            <span
              className={cn(
                "text-xs font-black px-2 py-0.5 rounded-lg",
                audit.buffer >= 0
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/20 text-rose-400",
              )}
            >
              {audit.buffer.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "trade" && tradeAudit) {
    return (
      <div
        className={cn(
          "space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10",
          className,
        )}
      >
        <div className="flex items-center gap-2 text-indigo-400 mb-1">
          <Target size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Trade Auditor
          </span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-white/30">Target Slot Weight</span>
          <span className="font-mono text-white">
            {(tradeAudit.weight * 100).toFixed(0)}%
          </span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-white/30">Period Return</span>
          <span
            className={cn(
              "font-mono",
              tradeAudit.price >= 0 ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {(tradeAudit.price * 100).toFixed(2)}%
          </span>
        </div>

        <div className="pt-2 border-t border-white/5 text-[10px]">
          <span className="text-white/30 uppercase font-bold mr-2">
            Reason:
          </span>
          <span className="text-white/60">{tradeAudit.reason}</span>
        </div>
      </div>
    );
  }

  return null;
}
