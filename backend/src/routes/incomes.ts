import { Router } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import {
  createIncomeEntrySchema,
  updateIncomeEntrySchema,
  yearMonthFromDate,
  yearMonthSchema,
} from '../validators/schemas.js';

const router = Router();

function mapEntry(row: {
  id: string;
  description: string;
  amount: number | string;
  income_date: string;
  year_month: string;
  source: string;
  notes: string | null;
}) {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    incomeDate: row.income_date,
    yearMonth: row.year_month,
    source: row.source,
    notes: row.notes,
  };
}

router.get('/', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;
  const parsed = yearMonthSchema.safeParse(req.query.yearMonth);

  if (!parsed.success) {
    res.status(400).json({ error: 'Informe yearMonth no formato YYYY-MM.' });
    return;
  }

  const { data, error } = await supabase
    .from('income_entries')
    .select('id, description, amount, income_date, year_month, source, notes')
    .eq('user_id', user.id)
    .eq('year_month', parsed.data)
    .order('income_date', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const entries = (data ?? []).map(mapEntry);
  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  res.json({ entries, total });
});

router.post('/', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;
  const parsed = createIncomeEntrySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const payload = parsed.data;
  const yearMonth = yearMonthFromDate(payload.incomeDate);

  const { data, error } = await supabase
    .from('income_entries')
    .insert({
      user_id: user.id,
      description: payload.description,
      amount: payload.amount,
      income_date: payload.incomeDate,
      year_month: yearMonth,
      source: payload.source,
      notes: payload.notes ?? null,
    })
    .select('id, description, amount, income_date, year_month, source, notes')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ entry: mapEntry(data) });
});

router.put('/:id', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;
  const parsed = updateIncomeEntrySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const body = parsed.data;
  const updates: Record<string, unknown> = {};
  if (body.description !== undefined) updates.description = body.description;
  if (body.amount !== undefined) updates.amount = body.amount;
  if (body.source !== undefined) updates.source = body.source;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.incomeDate !== undefined) {
    updates.income_date = body.incomeDate;
    updates.year_month = yearMonthFromDate(body.incomeDate);
  }

  const { data, error } = await supabase
    .from('income_entries')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', user.id)
    .select('id, description, amount, income_date, year_month, source, notes')
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Receita não encontrada.' });
    return;
  }

  res.json({ entry: mapEntry(data) });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;

  const { data, error } = await supabase
    .from('income_entries')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Receita não encontrada.' });
    return;
  }

  res.status(204).send();
});

export default router;
