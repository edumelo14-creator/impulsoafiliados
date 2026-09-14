import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export function Card({ children, className = '', title, subtitle, action }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-ink-200/70 bg-white shadow-card ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-ink-900">{title}</h3>
            )}
            {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

const statusStyles: Record<string, string> = {
  active: 'bg-success-50 text-success-700 ring-success-500/20',
  out_of_stock: 'bg-error-50 text-error-600 ring-error-500/20',
  paused: 'bg-ink-100 text-ink-600 ring-ink-400/20',
  pending: 'bg-warning-50 text-warning-600 ring-warning-500/20',
  shipped: 'bg-accent-50 text-accent-700 ring-accent-500/20',
  delivered: 'bg-success-50 text-success-700 ring-success-500/20',
  cancelled: 'bg-error-50 text-error-600 ring-error-500/20',
  ended: 'bg-ink-100 text-ink-600 ring-ink-400/20',
  scheduled: 'bg-primary-50 text-primary-600 ring-primary-500/20',
  sent: 'bg-success-50 text-success-700 ring-success-500/20',
  ready: 'bg-primary-50 text-primary-600 ring-primary-500/20',
  failed: 'bg-error-50 text-error-600 ring-error-500/20',
  skipped: 'bg-ink-100 text-ink-600 ring-ink-400/20',
};

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  out_of_stock: 'Sem estoque',
  paused: 'Pausado',
  pending: 'Pendente',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  ended: 'Encerrada',
  scheduled: 'Agendada',
  sent: 'Enviado',
  ready: 'Pronto',
  failed: 'Falhou',
  skipped: 'Pulado',
};

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] ?? 'bg-ink-100 text-ink-600 ring-ink-400/20';
  const label = statusLabels[status] ?? status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
