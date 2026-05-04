"use client";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton className="skeleton-title" />
      <Skeleton className="skeleton-text" />
      <Skeleton className="skeleton-text short" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-table-row">
          <Skeleton style={{ width: "50%", height: 16 }} />
          <Skeleton style={{ width: 80, height: 16 }} />
          <Skeleton style={{ width: 100, height: 16 }} />
          <Skeleton style={{ width: 120, height: 16 }} />
        </div>
      ))}
    </div>
  );
}
