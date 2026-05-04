"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
  accentColor?: string;
}

export function QuickActionCard({
  icon: Icon,
  label,
  description,
  href,
  accentColor = "#3B82F6",
}: QuickActionCardProps) {
  return (
    <Link href={href} className="quick-action-card">
      <div className="quick-action-icon" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
        <Icon size={20} />
      </div>
      <div>
        <div className="quick-action-label">{label}</div>
        <div className="quick-action-desc">{description}</div>
      </div>
    </Link>
  );
}
