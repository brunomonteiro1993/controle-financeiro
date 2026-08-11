import { Router } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import {
  createExpenseSchema,
  updateExpenseSchema,
  yearMonthFromDate,
  yearMonthSchema,
} from '../validators/schemas.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;
  const parsed = yearMonthSchema.safeParse(req.query.yearMonth);

  if (!parsed.success) {
    res.status(400).json({ error: 'Informe yearMonth no formato YYYY-MM.' });
    return;
  }

  const { data, error } = await supabase
    .from('expenses')
    .select(
      'id, description, amount, expense_date, year_month, notes, category_id, categories(id, name, color, icon)'
    )
    .eq('user_id', user.id)
    .eq('year_month', parsed.data)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({
    expenses: (data ?? []).map((e) => ({
      id: e.id,
      description: e.description,
      amount: Number(e.amount),
      expenseDate: e.expense_date,
      yearMonth: e.year_month,
      notes: e.notes,
      categoryId: e.category_id,
      category: e.categories,
    })),
  });
});

router.post('/', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;
  const parsed = createExpenseSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const payload = parsed.data;
  const yearMonth = yearMonthFromDate(payload.expenseDate);

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: user.id,
      description: payload.description,
      amount: payload.amount,
      expense_date: payload.expenseDate,
      year_month: yearMonth,
      category_id: payload.categoryId ?? null,
      notes: payload.notes ?? null,
    })
    .select(
      'id, description, amount, expense_date, year_month, notes, category_id, categories(id, name, color, icon)'
    )
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({
    expense: {
      id: data.id,
      description: data.description,
      amount: Number(data.amount),
      expenseDate: data.expense_date,
      yearMonth: data.year_month,
      notes: data.notes,
      categoryId: data.category_id,
      category: data.categories,
    },
  });
});

router.put('/:id', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;
  const parsed = updateExpenseSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const updates: Record<string, unknown> = {};
  const body = parsed.data;

  if (body.description !== undefined) updates.description = body.description;
  if (body.amount !== undefined) updates.amount = body.amount;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.categoryId !== undefined) updates.category_id = body.categoryId;
  if (body.expenseDate !== undefined) {
    updates.expense_date = body.expenseDate;
    updates.year_month = yearMonthFromDate(body.expenseDate);
  }

  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', req.params.id)
    .eq('user_id', user.id)
    .select(
      'id, description, amount, expense_date, year_month, notes, category_id, categories(id, name, color, icon)'
    )
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Despesa não encontrada.' });
    return;
  }

  res.json({
    expense: {
      id: data.id,
      description: data.description,
      amount: Number(data.amount),
      expenseDate: data.expense_date,
      yearMonth: data.year_month,
      notes: data.notes,
      categoryId: data.category_id,
      category: data.categories,
    },
  });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;

  const { data, error } = await supabase
    .from('expenses')
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
    res.status(404).json({ error: 'Despesa não encontrada.' });
    return;
  }

  res.status(204).send();
});

export default router;
