"use client";

import { ReactNode } from "react";
import Link from "next/link";

interface QuickActionCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  accentColor: string;
}

export function QuickActionCard({ icon: Icon, label, description, href, accentColor }: QuickActionCardProps) {
  return (
    <Link href={href} className="quick-action-card">
      <div
        className="quick-action-icon"
        style={{ background: `${accentColor}15`, color: accentColor }}
      >
        <Icon size={18} strokeWidth={2} />
      </div>
      <div>
        <div className="quick-action-label">{label}</div>
        <div className="quick-action-desc">{description}</div>
      </div>
    </Link>
  );
}