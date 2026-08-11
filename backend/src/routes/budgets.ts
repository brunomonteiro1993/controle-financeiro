import { Router } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { upsertBudgetSchema, yearMonthSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;
  const parsed = yearMonthSchema.safeParse(req.query.yearMonth);

  if (!parsed.success) {
    res.status(400).json({ error: 'Informe yearMonth no formato YYYY-MM.' });
    return;
  }

  const yearMonth = parsed.data;

  const [budgetsResult, expensesResult] = await Promise.all([
    supabase
      .from('category_budgets')
      .select('id, category_id, year_month, amount, categories(id, name, color)')
      .eq('user_id', user.id)
      .eq('year_month', yearMonth),
    supabase
      .from('expenses')
      .select('category_id, amount')
      .eq('user_id', user.id)
      .eq('year_month', yearMonth),
  ]);

  if (budgetsResult.error) {
    res.status(500).json({ error: budgetsResult.error.message });
    return;
  }
  if (expensesResult.error) {
    res.status(500).json({ error: expensesResult.error.message });
    return;
  }

  const spentByCategory = new Map<string, number>();
  for (const e of expensesResult.data ?? []) {
    if (!e.category_id) continue;
    spentByCategory.set(
      e.category_id,
      (spentByCategory.get(e.category_id) ?? 0) + Number(e.amount)
    );
  }

  const budgets = (budgetsResult.data ?? []).map((b) => {
    const limit = Number(b.amount);
    const spent = spentByCategory.get(b.category_id) ?? 0;
    const percent = limit > 0 ? (spent / limit) * 100 : 0;
    const cat = b.categories as { id?: string; name?: string; color?: string } | null;

    return {
      id: b.id,
      categoryId: b.category_id,
      yearMonth: b.year_month,
      amount: limit,
      spent,
      remaining: limit - spent,
      percentUsed: Number(percent.toFixed(1)),
      exceeded: spent > limit,
      warning: percent >= 80 && spent <= limit,
      category: {
        id: cat?.id ?? b.category_id,
        name: cat?.name ?? 'Categoria',
        color: cat?.color ?? '#64748b',
      },
    };
  });

  res.json({
    budgets: budgets.sort((a, b) => b.percentUsed - a.percentUsed),
    alerts: budgets.filter((b) => b.exceeded || b.warning),
  });
});

router.put('/', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;
  const parsed = upsertBudgetSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { categoryId, yearMonth, amount } = parsed.data;

  const { data, error } = await supabase
    .from('category_budgets')
    .upsert(
      {
        user_id: user.id,
        category_id: categoryId,
        year_month: yearMonth,
        amount,
      },
      { onConflict: 'user_id,category_id,year_month' }
    )
    .select('id, category_id, year_month, amount, categories(id, name, color)')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const cat = data.categories as { id?: string; name?: string; color?: string } | null;

  res.json({
    budget: {
      id: data.id,
      categoryId: data.category_id,
      yearMonth: data.year_month,
      amount: Number(data.amount),
      category: {
        id: cat?.id ?? data.category_id,
        name: cat?.name ?? 'Categoria',
        color: cat?.color ?? '#64748b',
      },
    },
  });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;

  const { data, error } = await supabase
    .from('category_budgets')
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
    res.status(404).json({ error: 'Meta não encontrada.' });
    return;
  }

  res.status(204).send();
});

export default router;
