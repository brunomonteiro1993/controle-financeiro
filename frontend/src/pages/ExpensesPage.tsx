import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import {
  currentYearMonth,
  formatBRL,
  formatDateBR,
  todayISO,
} from '../lib/format';
import type { Category, Expense } from '../types';
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [expensesRes, categoriesRes] = await Promise.all([
        apiFetch<{ expenses: Expense[] }>(
          `/api/expenses?yearMonth=${yearMonth}`
        ),
        apiFetch<{ categories: Category[] }>('/api/categories'),
      ]);
      setExpenses(expensesRes.expenses);
      setCategories(categoriesRes.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar.');
    } finally {
      setLoading(false);
    }
  }, [yearMonth]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
      categoryId: expense.categoryId ?? categories[0]?.id ?? '',
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
      setForm(emptyForm());
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('Excluir este gasto?')) return;
    setError('');
    try {
      await apiFetch(`/api/expenses/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir.');
    }
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Gastos
          </h1>
          <p className="mt-1 text-muted">
            Lance despesas do mês e acompanhe por categoria.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthPicker yearMonth={yearMonth} onChange={setYearMonth} />
          <Button type="button" onClick={startCreate}>
            <Plus size={16} />
            Novo gasto
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      {showForm ? (
        <form
          onSubmit={onSubmit}
          className="grid gap-4 rounded-3xl border border-line bg-white/90 p-6 shadow-sm md:grid-cols-2"
        >
          <h2 className="md:col-span-2 font-semibold">
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
              label="Observações (opcional)"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-2">
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

      <section className="rounded-3xl border border-line bg-white/90 shadow-sm">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold">Lançamentos</h2>
          <p className="text-sm text-muted">Total: {formatBRL(total)}</p>
        </div>

        {loading ? (
          <p className="p-5 text-sm text-muted">Carregando…</p>
        ) : expenses.length === 0 ? (
          <div className="space-y-3 p-5">
            <p className="text-sm text-muted">Nenhum gasto neste mês.</p>
            <Button type="button" onClick={startCreate}>
              <Plus size={16} />
              Adicionar primeiro gasto
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-medium">{expense.description}</p>
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
                    aria-label="Editar"
                    onClick={() => startEdit(expense)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="!px-2 !py-2"
                    aria-label="Excluir"
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
