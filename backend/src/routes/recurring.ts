import { Router } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import {
  createRecurringSchema,
  dateInYearMonth,
  updateRecurringSchema,
  yearMonthGte,
  yearMonthLte,
  yearMonthSchema,
} from '../validators/schemas.js';

const router = Router();

function mapRecurring(row: {
  id: string;
  description: string;
  amount: number | string;
  day_of_month: number;
  active: boolean;
  start_year_month: string;
  end_year_month: string | null;
  category_id: string | null;
  notes: string | null;
  categories?: unknown;
}) {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    dayOfMonth: row.day_of_month,
    active: row.active,
    startYearMonth: row.start_year_month,
    endYearMonth: row.end_year_month,
    categoryId: row.category_id,
    notes: row.notes,
    category: row.categories ?? null,
  };
}

router.get('/', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;

  const { data, error } = await supabase
    .from('recurring_expenses')
    .select(
      'id, description, amount, day_of_month, active, start_year_month, end_year_month, category_id, notes, categories(id, name, color, icon)'
    )
    .eq('user_id', user.id)
    .order('description', { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ recurring: (data ?? []).map(mapRecurring) });
});

router.post('/', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;
  const parsed = createRecurringSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const payload = parsed.data;

  const { data, error } = await supabase
    .from('recurring_expenses')
    .insert({
      user_id: user.id,
      description: payload.description,
      amount: payload.amount,
      day_of_month: payload.dayOfMonth,
      active: payload.active ?? true,
      start_year_month: payload.startYearMonth,
      end_year_month: payload.endYearMonth ?? null,
      category_id: payload.categoryId ?? null,
      notes: payload.notes ?? null,
    })
    .select(
      'id, description, amount, day_of_month, active, start_year_month, end_year_month, category_id, notes, categories(id, name, color, icon)'
    )
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ recurring: mapRecurring(data) });
});

router.put('/:id', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;
  const parsed = updateRecurringSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const body = parsed.data;
  const updates: Record<string, unknown> = {};
  if (body.description !== undefined) updates.description = body.description;
  if (body.amount !== undefined) updates.amount = body.amount;
  if (body.dayOfMonth !== undefined) updates.day_of_month = body.dayOfMonth;
  if (body.active !== undefined) updates.active = body.active;
  if (body.startYearMonth !== undefined) updates.start_year_month = body.startYearMonth;
  if (body.endYearMonth !== undefined) updates.end_year_month = body.endYearMonth;
  if (body.categoryId !== undefined) updates.category_id = body.categoryId;
  if (body.notes !== undefined) updates.notes = body.notes;

  const { data, error } = await supabase
    .from('recurring_expenses')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', user.id)
    .select(
      'id, description, amount, day_of_month, active, start_year_month, end_year_month, category_id, notes, categories(id, name, color, icon)'
    )
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Recorrência não encontrada.' });
    return;
  }

  res.json({ recurring: mapRecurring(data) });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;

  const { data, error } = await supabase
    .from('recurring_expenses')
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
    res.status(404).json({ error: 'Recorrência não encontrada.' });
    return;
  }

  res.status(204).send();
});

/** Gera lançamentos do mês a partir das recorrências ativas */
router.post('/apply', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;
  const parsed = yearMonthSchema.safeParse(req.body.yearMonth ?? req.query.yearMonth);

  if (!parsed.success) {
    res.status(400).json({ error: 'Informe yearMonth no formato YYYY-MM.' });
    return;
  }

  const yearMonth = parsed.data;

  const { data: recurringList, error: recError } = await supabase
    .from('recurring_expenses')
    .select('id, description, amount, day_of_month, active, start_year_month, end_year_month, category_id, notes')
    .eq('user_id', user.id)
    .eq('active', true);

  if (recError) {
    res.status(500).json({ error: recError.message });
    return;
  }

  const { data: existing, error: existingError } = await supabase
    .from('expenses')
    .select('recurring_id')
    .eq('user_id', user.id)
    .eq('year_month', yearMonth)
    .not('recurring_id', 'is', null);

  if (existingError) {
    res.status(500).json({ error: existingError.message });
    return;
  }

  const already = new Set(
    (existing ?? []).map((e) => e.recurring_id).filter(Boolean) as string[]
  );

  const toInsert = (recurringList ?? [])
    .filter((r) => yearMonthGte(yearMonth, r.start_year_month))
    .filter((r) => !r.end_year_month || yearMonthLte(yearMonth, r.end_year_month))
    .filter((r) => !already.has(r.id))
    .map((r) => ({
      user_id: user.id,
      description: r.description,
      amount: r.amount,
      expense_date: dateInYearMonth(yearMonth, r.day_of_month),
      year_month: yearMonth,
      category_id: r.category_id,
      notes: r.notes,
      recurring_id: r.id,
    }));

  if (toInsert.length === 0) {
    res.json({ created: 0, message: 'Nenhum lançamento novo.' });
    return;
  }

  const { data: created, error: insertError } = await supabase
    .from('expenses')
    .insert(toInsert)
    .select('id');

  if (insertError) {
    res.status(500).json({ error: insertError.message });
    return;
  }

  res.json({ created: created?.length ?? 0 });
});

export default router;
