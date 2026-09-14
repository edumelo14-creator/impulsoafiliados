import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  delta?: { value: string; positive: boolean };
  icon: ReactNode;
  accent?: 'primary' | 'accent' | 'success' | 'warning';
  spark?: number[];
}

const accentMap = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-600', stroke: '#ee4d2d' },
  accent: { bg: 'bg-accent-50', text: 'text-accent-600', stroke: '#06b6d4' },
  success: { bg: 'bg-success-50', text: 'text-success-600', stroke: '#22c55e' },
  warning: { bg: 'bg-warning-50', text: 'text-warning-600', stroke: '#f59e0b' },
};

export function StatCard({
  label,
  value,
  delta,
  icon,
  accent = 'primary',
  spark,
}: StatCardProps) {
  const a = accentMap[accent];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.bg} ${a.text}`}>
          {icon}
        </div>
        {delta && (
          <span
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
              delta.positive
                ? 'bg-success-50 text-success-600'
                : 'bg-error-50 text-error-600'
            }`}
          >
            {delta.positive ? '↑' : '↓'} {delta.value}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-ink-900">{value}</p>
      </div>
      {spark && spark.length > 1 && (
        <Sparkline data={spark} color={a.stroke} />
      )}
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 100;
  const h = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full" preserveAspectRatio="none" style={{ height: h }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.7"
      />
    </svg>
  );
}
