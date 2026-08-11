import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { PiggyBank, TrendingDown, Wallet } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { currentYearMonth, formatBRL, formatDateBR } from '../lib/format';
import type { Summary } from '../types';
import { MonthPicker } from '../components/ui/MonthPicker';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';

export function DashboardPage() {
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    (async () => {
      try {
        await apiFetch('/api/recurring/apply', {
          method: 'POST',
          body: JSON.stringify({ yearMonth }),
        }).catch(() => undefined);

        const data = await apiFetch<Summary>(
          `/api/dashboard/summary?yearMonth=${yearMonth}`
        );
        if (active) setSummary(data);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [yearMonth]);

  const balanceTone =
    !summary
      ? 'default'
      : summary.balance >= 0
        ? 'ok'
        : 'danger';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Painel do mês
          </h1>
          <p className="mt-1 text-muted">
            Visão rápida da renda, gastos e saldo restante.
          </p>
        </div>
        <MonthPicker yearMonth={yearMonth} onChange={setYearMonth} />
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      {loading || !summary ? (
        <p className="text-sm text-muted">Carregando resumo…</p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Renda do mês"
              value={formatBRL(summary.income)}
              hint={
                summary.income === 0
                  ? 'Cadastre receitas em Receitas'
                  : `${summary.incomeCount || 0} receita(s)`
              }
              icon={<Wallet size={18} />}
            />
            <StatCard
              title="Gastos"
              value={formatBRL(summary.totalExpenses)}
              hint={`${summary.expenseCount} lançamento(s)`}
              icon={<TrendingDown size={18} />}
              tone="warn"
            />
            <StatCard
              title="Saldo restante"
              value={formatBRL(summary.balance)}
              hint={`${summary.percentUsed}% da renda utilizado`}
              icon={<PiggyBank size={18} />}
              tone={balanceTone}
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-line bg-surface/90 p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Uso da renda</h2>
              <span className="text-sm text-muted">{summary.percentUsed}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-paper">
              <div
                className={`h-full rounded-full transition-all ${
                  summary.percentUsed > 100
                    ? 'bg-danger'
                    : summary.percentUsed > 80
                      ? 'bg-accent'
                      : 'bg-brand'
                }`}
                style={{ width: `${Math.min(summary.percentUsed, 100)}%` }}
              />
            </div>
          </section>

          {summary.budgetAlerts && summary.budgetAlerts.length > 0 ? (
            <section className="space-y-2 rounded-2xl border border-accent/30 bg-orange-50/80 p-4 dark:bg-orange-950/30">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-accent">Alertas de meta</h2>
                <Link to="/metas" className="text-sm font-semibold text-brand">
                  Ver metas
                </Link>
              </div>
              {summary.budgetAlerts.map((a) => (
                <p key={a.id} className="text-sm">
                  <span className="font-medium">{a.categoryName}</span> —{' '}
                  {a.exceeded
                    ? `estourou (${formatBRL(a.spent)} / ${formatBRL(a.amount)})`
                    : `${a.percentUsed}% da meta`}
                </p>
              ))}
            </section>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-line bg-surface/90 p-5 shadow-sm">
              <h2 className="mb-4 font-semibold">Gastos por categoria</h2>
              {summary.byCategory.length === 0 ? (
                <p className="text-sm text-muted">Nenhum gasto neste mês.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.byCategory}
                        dataKey="total"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {summary.byCategory.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatBRL(Number(value ?? 0))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <ul className="mt-2 space-y-2">
                {summary.byCategory.slice(0, 5).map((cat) => (
                  <li
                    key={cat.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                    <span className="font-medium">{formatBRL(cat.total)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-line bg-surface/90 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-semibold">Últimos gastos</h2>
                <Link to="/gastos">
                  <Button type="button" variant="ghost" className="!px-2 !py-1">
                    Ver todos
                  </Button>
                </Link>
              </div>
              {summary.recentExpenses.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted">
                    Ainda não há lançamentos. Comece registrando um gasto.
                  </p>
                  <Link to="/gastos">
                    <Button type="button">Adicionar gasto</Button>
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {summary.recentExpenses.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 border-b border-line/70 pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-xs text-muted">
                          {formatDateBR(item.expenseDate)} · {item.categoryName}
                        </p>
                      </div>
                      <p className="font-semibold text-accent">
                        -{formatBRL(item.amount)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
