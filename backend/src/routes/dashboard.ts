import { Router } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { yearMonthSchema } from '../validators/schemas.js';

const router = Router();

router.get('/me', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, currency, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: profile?.full_name ?? null,
      currency: profile?.currency ?? 'BRL',
      createdAt: profile?.created_at ?? null,
    },
  });
});

router.get('/summary', requireAuth, async (req, res) => {
  const { user, supabase } = req as AuthedRequest;
  const parsed = yearMonthSchema.safeParse(req.query.yearMonth);

  if (!parsed.success) {
    res.status(400).json({ error: 'Informe yearMonth no formato YYYY-MM.' });
    return;
  }

  const yearMonth = parsed.data;

  const [incomeResult, expensesResult] = await Promise.all([
    supabase
      .from('monthly_incomes')
      .select('amount, notes')
      .eq('user_id', user.id)
      .eq('year_month', yearMonth)
      .maybeSingle(),
    supabase
      .from('expenses')
      .select('id, amount, category_id, description, expense_date, categories(name, color)')
      .eq('user_id', user.id)
      .eq('year_month', yearMonth)
      .order('expense_date', { ascending: false }),
  ]);

  if (incomeResult.error) {
    res.status(500).json({ error: incomeResult.error.message });
    return;
  }
  if (expensesResult.error) {
    res.status(500).json({ error: expensesResult.error.message });
    return;
  }

  const income = Number(incomeResult.data?.amount ?? 0);
  const expenses = expensesResult.data ?? [];
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = income - totalExpenses;
  const percentUsed = income > 0 ? Math.min(100, (totalExpenses / income) * 100) : 0;

  const byCategoryMap = new Map<
    string,
    { name: string; color: string; total: number; count: number }
  >();

  for (const expense of expenses) {
    const cat = expense.categories as { name?: string; color?: string } | null;
    const key = expense.category_id ?? 'sem-categoria';
    const name = cat?.name ?? 'Sem categoria';
    const color = cat?.color ?? '#64748b';
    const current = byCategoryMap.get(key) ?? { name, color, total: 0, count: 0 };
    current.total += Number(expense.amount);
    current.count += 1;
    byCategoryMap.set(key, current);
  }

  const byCategory = Array.from(byCategoryMap.values()).sort((a, b) => b.total - a.total);

  res.json({
    yearMonth,
    income,
    incomeNotes: incomeResult.data?.notes ?? null,
    totalExpenses,
    balance,
    percentUsed: Number(percentUsed.toFixed(1)),
    expenseCount: expenses.length,
    byCategory,
    recentExpenses: expenses.slice(0, 8).map((e) => ({
      id: e.id,
      description: e.description,
      amount: Number(e.amount),
      expenseDate: e.expense_date,
      categoryName: (e.categories as { name?: string } | null)?.name ?? 'Sem categoria',
      categoryColor: (e.categories as { color?: string } | null)?.color ?? '#64748b',
    })),
  });
});

export default router;
