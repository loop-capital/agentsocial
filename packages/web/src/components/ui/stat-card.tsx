"use client";

import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
}

export function StatCard({ label, value, change, changeType = "neutral", icon }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card-inner">
        <div className="stat-header">
          <span className="stat-label">{label}</span>
          {icon && <span className="stat-icon">{icon}</span>}
        </div>
        <div className="stat-value">{value}</div>
        {change && (
          <div className={`stat-change ${changeType}`}>
            {changeType === "positive" && <span>▲</span>}
            {changeType === "negative" && <span>▼</span>}
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );
}