import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { currentYearMonth, formatBRL } from '../lib/format';
import type { BudgetStatus, Category } from '../types';
import { MonthPicker } from '../components/ui/MonthPicker';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';

export function BudgetsPage() {
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [alerts, setAlerts] = useState<BudgetStatus[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [budgetRes, catRes] = await Promise.all([
        apiFetch<{ budgets: BudgetStatus[]; alerts: BudgetStatus[] }>(
          `/api/budgets?yearMonth=${yearMonth}`
        ),
        apiFetch<{ categories: Category[] }>('/api/categories'),
      ]);
      setBudgets(budgetRes.budgets);
      setAlerts(budgetRes.alerts);
      setCategories(catRes.categories);
      setCategoryId((prev) => prev || catRes.categories[0]?.id || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar.');
    } finally {
      setLoading(false);
    }
  }, [yearMonth]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const parsed = Number(amount.replace(',', '.'));
      if (!categoryId || Number.isNaN(parsed) || parsed < 0) {
        throw new Error('Informe categoria e valor válidos.');
      }
      await apiFetch('/api/budgets', {
        method: 'PUT',
        body: JSON.stringify({
          categoryId,
          yearMonth,
          amount: parsed,
        }),
      });
      setAmount('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('Remover esta meta?')) return;
    try {
      await apiFetch(`/api/budgets/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Metas por categoria
          </h1>
          <p className="mt-1 text-muted">
            Defina limites mensais e receba alertas ao se aproximar ou ultrapassar.
          </p>
        </div>
        <MonthPicker yearMonth={yearMonth} onChange={setYearMonth} />
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger dark:bg-red-950/40">
          {error}
        </p>
      ) : null}

      {alerts.length > 0 ? (
        <section className="space-y-2 rounded-2xl border border-accent/30 bg-orange-50/80 p-4 dark:bg-orange-950/30">
          <h2 className="font-semibold text-accent">Alertas</h2>
          {alerts.map((a) => (
            <p key={a.id} className="text-sm">
              <span className="font-medium">{a.category.name}</span>:{' '}
              {a.exceeded
                ? `estourou a meta (${formatBRL(a.spent)} / ${formatBRL(a.amount)})`
                : `${a.percentUsed}% da meta usado`}
            </p>
          ))}
        </section>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="grid gap-4 rounded-3xl border border-line bg-surface/90 p-6 shadow-sm md:grid-cols-3"
      >
        <Select
          label="Categoria"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Input
          label="Meta do mês (R$)"
          type="number"
          min="0"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={saving}>
            <Plus size={16} />
            {saving ? 'Salvando…' : 'Salvar meta'}
          </Button>
        </div>
      </form>

      <section className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted">Carregando…</p>
        ) : budgets.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma meta definida neste mês.</p>
        ) : (
          budgets.map((b) => (
            <article
              key={b.id}
              className="rounded-2xl border border-line bg-surface/90 p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: b.category.color }}
                  />
                  <h3 className="font-semibold">{b.category.name}</h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="!px-2 !py-2"
                  onClick={() => void onDelete(b.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              <p className="mb-2 text-sm text-muted">
                {formatBRL(b.spent)} de {formatBRL(b.amount)} ·{' '}
                {b.exceeded ? (
                  <span className="font-semibold text-danger">Estourado</span>
                ) : (
                  <span>resta {formatBRL(b.remaining)}</span>
                )}
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-paper">
                <div
                  className={`h-full rounded-full transition-all ${
                    b.exceeded
                      ? 'bg-danger'
                      : b.warning
                        ? 'bg-accent'
                        : 'bg-brand'
                  }`}
                  style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                />
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
