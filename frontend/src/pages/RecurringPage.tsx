import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { currentYearMonth, formatBRL } from '../lib/format';
import type { Category, RecurringExpense } from '../types';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';

type FormState = {
  description: string;
  amount: string;
  dayOfMonth: string;
  categoryId: string;
  startYearMonth: string;
  endYearMonth: string;
  notes: string;
  active: boolean;
};

const emptyForm = (): FormState => ({
  description: '',
  amount: '',
  dayOfMonth: '1',
  categoryId: '',
  startYearMonth: currentYearMonth(),
  endYearMonth: '',
  notes: '',
  active: true,
});

export function RecurringPage() {
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [recRes, catRes] = await Promise.all([
        apiFetch<{ recurring: RecurringExpense[] }>('/api/recurring'),
        apiFetch<{ categories: Category[] }>('/api/categories'),
      ]);
      setItems(recRes.recurring);
      setCategories(catRes.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function startCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm(),
      categoryId: categories[0]?.id ?? '',
    });
    setShowForm(true);
  }

  function startEdit(item: RecurringExpense) {
    setEditingId(item.id);
    setForm({
      description: item.description,
      amount: String(item.amount),
      dayOfMonth: String(item.dayOfMonth),
      categoryId: item.categoryId ?? '',
      startYearMonth: item.startYearMonth,
      endYearMonth: item.endYearMonth ?? '',
      notes: item.notes ?? '',
      active: item.active,
    });
    setShowForm(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const amount = Number(form.amount.replace(',', '.'));
      const dayOfMonth = Number(form.dayOfMonth);
      if (Number.isNaN(amount) || amount <= 0) {
        throw new Error('Informe um valor válido.');
      }
      const payload = {
        description: form.description.trim(),
        amount,
        dayOfMonth,
        categoryId: form.categoryId || null,
        startYearMonth: form.startYearMonth,
        endYearMonth: form.endYearMonth || null,
        notes: form.notes.trim() || null,
        active: form.active,
      };
      if (editingId) {
        await apiFetch(`/api/recurring/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/recurring', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('Excluir esta recorrência?')) return;
    try {
      await apiFetch(`/api/recurring/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir.');
    }
  }

  async function applyCurrentMonth() {
    setApplying(true);
    setMessage('');
    setError('');
    try {
      const res = await apiFetch<{ created: number }>('/api/recurring/apply', {
        method: 'POST',
        body: JSON.stringify({ yearMonth: currentYearMonth() }),
      });
      setMessage(
        res.created > 0
          ? `${res.created} gasto(s) lançado(s) neste mês.`
          : 'Nenhum lançamento novo (já estavam gerados).'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao aplicar.');
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Gastos recorrentes
          </h1>
          <p className="mt-1 text-muted">
            Aluguel, Netflix e outros — gerados automaticamente no mês.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={applying}
            onClick={() => void applyCurrentMonth()}
          >
            {applying ? 'Aplicando…' : 'Lançar no mês atual'}
          </Button>
          <Button type="button" onClick={startCreate}>
            <Plus size={16} />
            Nova recorrência
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger dark:bg-red-950/40">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-ok dark:bg-teal-950/40">
          {message}
        </p>
      ) : null}

      {showForm ? (
        <form
          onSubmit={onSubmit}
          className="grid gap-4 rounded-3xl border border-line bg-surface/90 p-6 shadow-sm md:grid-cols-2"
        >
          <h2 className="font-semibold md:col-span-2">
            {editingId ? 'Editar recorrência' : 'Nova recorrência'}
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
            label="Dia do mês (1–28)"
            type="number"
            min="1"
            max="28"
            required
            value={form.dayOfMonth}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dayOfMonth: e.target.value }))
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
          <Input
            label="Início (YYYY-MM)"
            required
            pattern="\d{4}-\d{2}"
            value={form.startYearMonth}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, startYearMonth: e.target.value }))
            }
          />
          <Input
            label="Fim (opcional)"
            pattern="\d{4}-\d{2}"
            placeholder="YYYY-MM"
            value={form.endYearMonth}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, endYearMonth: e.target.value }))
            }
          />
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, active: e.target.checked }))
              }
            />
            Ativa
          </label>
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando…' : editingId ? 'Atualizar' : 'Adicionar'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      <section className="rounded-3xl border border-line bg-surface/90 shadow-sm">
        {loading ? (
          <p className="p-5 text-sm text-muted">Carregando…</p>
        ) : items.length === 0 ? (
          <p className="p-5 text-sm text-muted">Nenhuma recorrência cadastrada.</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-medium">
                    {item.description}{' '}
                    {!item.active ? (
                      <span className="text-xs text-muted">(pausada)</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted">
                    Dia {item.dayOfMonth} ·{' '}
                    {item.category?.name ?? 'Sem categoria'} · desde{' '}
                    {item.startYearMonth}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-accent">
                    {formatBRL(item.amount)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    className="!px-2 !py-2"
                    onClick={() => startEdit(item)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="!px-2 !py-2"
                    onClick={() => void onDelete(item.id)}
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
