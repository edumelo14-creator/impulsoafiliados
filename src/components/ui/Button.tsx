import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40';
  const variants = {
    primary:
      'bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] shadow-sm shadow-primary-600/20',
    ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
    outline:
      'border border-ink-200 text-ink-700 bg-white hover:border-ink-300 hover:bg-ink-50',
    danger: 'bg-error-600 text-white hover:bg-error-700 active:scale-[0.98]',
    success: 'bg-success-600 text-white hover:bg-success-700 active:scale-[0.98]',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
