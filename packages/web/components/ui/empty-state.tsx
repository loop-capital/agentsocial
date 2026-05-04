"use client";

import { FileQuestion, Plus } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon ?? <FileQuestion size={32} strokeWidth={1.5} />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && (
        action.href ? (
          <Link href={action.href} className="btn btn-primary">
            <Plus size={16} />
            {action.label}
          </Link>
        ) : (
          <button className="btn btn-primary" onClick={action.onClick}>
            <Plus size={16} />
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
