'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: 'teal' | 'coral' | 'charcoal';
}

const colorClasses = {
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-500',
    change: 'text-teal-600',
  },
  coral: {
    bg: 'bg-coral-50',
    text: 'text-coral-500',
    change: 'text-coral-600',
  },
  charcoal: {
    bg: 'bg-charcoal-50',
    text: 'text-charcoal-500',
    change: 'text-charcoal-600',
  },
};

export default function StatCard({ title, value, change, changeType, icon, color }: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-xl border border-charcoal-100 p-6">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 ${colors.bg} ${colors.text} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        {change && (
          <span className={`text-xs font-medium ${changeType === 'positive' ? colors.change : changeType === 'negative' ? 'text-coral-500' : 'text-charcoal-400'}`}>
            {change}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-charcoal">{value}</p>
        <p className="text-sm text-charcoal-400 mt-1">{title}</p>
      </div>
    </div>
  );
}
