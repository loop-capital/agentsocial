"use client";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, children, action, className = "" }: ChartCardProps) {
  return (
    <div className={`chart-card ${className}`}>
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">{title}</h3>
          {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="chart-card-action">{action}</div>}
      </div>
      <div className="chart-card-body">{children}</div>
    </div>
  );
}
