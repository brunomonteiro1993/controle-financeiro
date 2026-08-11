import type { ReactNode } from 'react';

type Props = {
  title: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: 'default' | 'ok' | 'warn' | 'danger';
};

const tones = {
  default: 'text-ink',
  ok: 'text-ok',
  warn: 'text-accent',
  danger: 'text-danger',
};

export function StatCard({ title, value, hint, icon, tone = 'default' }: Props) {
  return (
    <article className="rounded-2xl border border-line bg-surface/90 p-5 shadow-sm shadow-teal-900/5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted">{title}</p>
        {icon ? (
          <span className="rounded-xl bg-brand-soft p-2 text-brand">{icon}</span>
        ) : null}
      </div>
      <p className={`font-display text-2xl font-semibold tracking-tight ${tones[tone]}`}>
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </article>
  );
}
