import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch } from '../lib/api';
import { currentYearMonth, formatBRL } from '../lib/format';
import type { Income } from '../types';
import { MonthPicker } from '../components/ui/MonthPicker';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function IncomePage() {
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setMessage('');

    apiFetch<{ income: Income | null }>(`/api/incomes?yearMonth=${yearMonth}`)
      .then((data) => {
        if (!active) return;
        setAmount(data.income ? String(data.income.amount) : '');
        setNotes(data.income?.notes ?? '');
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [yearMonth]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const parsed = Number(amount.replace(',', '.'));
      if (Number.isNaN(parsed) || parsed < 0) {
        throw new Error('Informe um valor válido.');
      }

      await apiFetch('/api/incomes', {
        method: 'PUT',
        body: JSON.stringify({
          yearMonth,
          amount: parsed,
          notes: notes.trim() || null,
        }),
      });
      setMessage('Renda salva com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Renda mensal
          </h1>
          <p className="mt-1 text-muted">
            Informe quanto você ganha neste mês para calcular o saldo.
          </p>
        </div>
        <MonthPicker yearMonth={yearMonth} onChange={setYearMonth} />
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-3xl border border-line bg-white/90 p-6 shadow-sm"
      >
        {loading ? (
          <p className="text-sm text-muted">Carregando…</p>
        ) : (
          <>
            <Input
              label="Valor da renda (R$)"
              type="number"
              min="0"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              hint={
                amount
                  ? `Prévia: ${formatBRL(Number(amount.replace(',', '.')) || 0)}`
                  : undefined
              }
            />
            <Input
              label="Observações (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: salário + freelance"
            />

            {error ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="rounded-xl bg-teal-50 px-3 py-2 text-sm text-ok">
                {message}
              </p>
            ) : null}

            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar renda'}
            </Button>
          </>
        )}
      </form>
    </div>
  );
}
