"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}

export function StatCard({ label, value, change, changeType = "positive", icon }: StatCardProps) {
  const isPositive = changeType === "positive";
  const isNegative = changeType === "negative";

  return (
    <div className="stat-card">
      <div className="stat-card-inner">
        <div className="stat-header">
          <span className="stat-label">{label}</span>
          {icon && <span className="stat-icon">{icon}</span>}
        </div>
        <div className="stat-value">{value}</div>
        <div className={`stat-change ${isPositive ? "positive" : isNegative ? "negative" : "neutral"}`}>
          {isPositive && <TrendingUp size={12} />}
          {isNegative && <TrendingDown size={12} />}
          <span>{change}</span>
        </div>
      </div>
    </div>
  );
}
