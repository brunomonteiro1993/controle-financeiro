import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Download, FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { exportMonthCsv, exportMonthPdf } from '../lib/export';
import {
  currentYearMonth,
  formatBRL,
  formatDateBR,
  todayISO,
} from '../lib/format';
import type { Category, Expense, IncomeEntry } from '../types';
import { MonthPicker } from '../components/ui/MonthPicker';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';

type FormState = {
  description: string;
  amount: string;
  expenseDate: string;
  categoryId: string;
  notes: string;
};

const emptyForm = (): FormState => ({
  description: '',
  amount: '',
  expenseDate: todayISO(),
  categoryId: '',
  notes: '',
});

export function ExpensesPage() {
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [q, setQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // aplica recorrentes ao abrir o mês
      await apiFetch('/api/recurring/apply', {
        method: 'POST',
        body: JSON.stringify({ yearMonth }),
      }).catch(() => undefined);

      const params = new URLSearchParams({ yearMonth });
      if (q) params.set('q', q);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const [expensesRes, categoriesRes] = await Promise.all([
        apiFetch<{ expenses: Expense[] }>(`/api/expenses?${params}`),
        apiFetch<{ categories: Category[] }>('/api/categories'),
      ]);
      setExpenses(expensesRes.expenses);
      setCategories(categoriesRes.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar.');
    } finally {
      setLoading(false);
    }
  }, [yearMonth, q, categoryFilter, from, to]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  function startCreate() {
    const today = todayISO();
    setEditingId(null);
    setForm({
      ...emptyForm(),
      categoryId: categories[0]?.id ?? '',
      expenseDate: today.startsWith(yearMonth) ? today : `${yearMonth}-01`,
    });
    setShowForm(true);
  }

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      expenseDate: expense.expenseDate,
      categoryId: expense.categoryId ?? '',
      notes: expense.notes ?? '',
    });
    setShowForm(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const amount = Number(form.amount.replace(',', '.'));
      if (Number.isNaN(amount) || amount <= 0) {
        throw new Error('Informe um valor maior que zero.');
      }
      const payload = {
        description: form.description.trim(),
        amount,
        expenseDate: form.expenseDate,
        categoryId: form.categoryId || null,
        notes: form.notes.trim() || null,
      };
      if (editingId) {
        await apiFetch(`/api/expenses/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/expenses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('Excluir este gasto?')) return;
    try {
      await apiFetch(`/api/expenses/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir.');
    }
  }

  async function handleExport(kind: 'csv' | 'pdf') {
    setError('');
    try {
      const [allExpenses, incomes] = await Promise.all([
        apiFetch<{ expenses: Expense[] }>(
          `/api/expenses?yearMonth=${yearMonth}`
        ),
        apiFetch<{ entries: IncomeEntry[]; total: number }>(
          `/api/incomes?yearMonth=${yearMonth}`
        ),
      ]);
      if (kind === 'csv') {
        exportMonthCsv({
          yearMonth,
          expenses: allExpenses.expenses,
          incomes: incomes.entries,
        });
      } else {
        exportMonthPdf({
          yearMonth,
          expenses: allExpenses.expenses,
          incomes: incomes.entries,
          totalIncome: incomes.total,
          totalExpenses: allExpenses.expenses.reduce((s, e) => s + e.amount, 0),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao exportar.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Gastos
          </h1>
          <p className="mt-1 text-muted">
            Filtre, busque e exporte os lançamentos do mês.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthPicker yearMonth={yearMonth} onChange={setYearMonth} />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleExport('csv')}
          >
            <Download size={16} />
            CSV
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleExport('pdf')}
          >
            <FileText size={16} />
            PDF
          </Button>
          <Button type="button" onClick={startCreate}>
            <Plus size={16} />
            Novo gasto
          </Button>
        </div>
      </div>

      <section className="grid gap-3 rounded-3xl border border-line bg-surface/90 p-4 shadow-sm md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Busca</span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
                />
                <input
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 pl-9 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:bg-paper"
                  placeholder="Descrição do gasto"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setQ(searchInput.trim());
                  }}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setQ(searchInput.trim())}
              >
                Filtrar
              </Button>
            </div>
          </label>
        </div>
        <Select
          label="Categoria"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={[
            { value: '', label: 'Todas' },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="De"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            label="Até"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </section>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger dark:bg-red-950/40">
          {error}
        </p>
      ) : null}

      {showForm ? (
        <form
          onSubmit={onSubmit}
          className="grid gap-4 rounded-3xl border border-line bg-surface/90 p-6 shadow-sm md:grid-cols-2"
        >
          <h2 className="font-semibold md:col-span-2">
            {editingId ? 'Editar gasto' : 'Novo gasto'}
          </h2>
          <Input
            label="Descrição"
            required
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
          />
          <Input
            label="Valor (R$)"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.amount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, amount: e.target.value }))
            }
          />
          <Input
            label="Data"
            type="date"
            required
            value={form.expenseDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, expenseDate: e.target.value }))
            }
          />
          <Select
            label="Categoria"
            value={form.categoryId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, categoryId: e.target.value }))
            }
            options={[
              { value: '', label: 'Sem categoria' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <div className="md:col-span-2">
            <Input
              label="Observações"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando…' : editingId ? 'Atualizar' : 'Adicionar'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      <section className="rounded-3xl border border-line bg-surface/90 shadow-sm">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold">Lançamentos</h2>
          <p className="text-sm text-muted">Total filtrado: {formatBRL(total)}</p>
        </div>
        {loading ? (
          <p className="p-5 text-sm text-muted">Carregando…</p>
        ) : expenses.length === 0 ? (
          <p className="p-5 text-sm text-muted">Nenhum gasto encontrado.</p>
        ) : (
          <ul className="divide-y divide-line">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-medium">
                    {expense.description}
                    {expense.recurringId ? (
                      <span className="ml-2 text-xs text-muted">recorrente</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDateBR(expense.expenseDate)}
                    {expense.category ? ` · ${expense.category.name}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-accent">
                    -{formatBRL(expense.amount)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    className="!px-2 !py-2"
                    onClick={() => startEdit(expense)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="!px-2 !py-2"
                    onClick={() => void onDelete(expense.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
