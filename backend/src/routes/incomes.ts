import { Router } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { upsertIncomeSchema, yearMonthSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;
  const parsed = yearMonthSchema.safeParse(req.query.yearMonth);

  if (!parsed.success) {
    res.status(400).json({ error: 'Informe yearMonth no formato YYYY-MM.' });
    return;
  }

  const { data, error } = await supabase
    .from('monthly_incomes')
    .select('id, year_month, amount, notes, updated_at')
    .eq('user_id', user.id)
    .eq('year_month', parsed.data)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({
    income: data
      ? {
          id: data.id,
          yearMonth: data.year_month,
          amount: Number(data.amount),
          notes: data.notes,
          updatedAt: data.updated_at,
        }
      : null,
  });
});

router.put('/', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;
  const parsed = upsertIncomeSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { yearMonth, amount, notes } = parsed.data;

  const { data, error } = await supabase
    .from('monthly_incomes')
    .upsert(
      {
        user_id: user.id,
        year_month: yearMonth,
        amount,
        notes: notes ?? null,
      },
      { onConflict: 'user_id,year_month' }
    )
    .select('id, year_month, amount, notes, updated_at')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({
    income: {
      id: data.id,
      yearMonth: data.year_month,
      amount: Number(data.amount),
      notes: data.notes,
      updatedAt: data.updated_at,
    },
  });
});

export default router;
