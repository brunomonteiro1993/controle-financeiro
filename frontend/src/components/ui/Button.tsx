import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  children: ReactNode;
};

const styles: Record<NonNullable<Props['variant']>, string> = {
  primary:
    'bg-brand text-white hover:bg-teal-800 shadow-sm shadow-teal-900/10',
  secondary:
    'bg-white text-ink border border-line hover:bg-paper',
  ghost: 'bg-transparent text-muted hover:text-ink hover:bg-white/60',
  danger: 'bg-red-50 text-danger border border-red-100 hover:bg-red-100',
};

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
