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

  const [entriesResult, legacyIncome, expensesResult, budgetsResult] =
    await Promise.all([
      supabase
        .from('income_entries')
        .select('amount, source, description')
        .eq('user_id', user.id)
        .eq('year_month', yearMonth),
      supabase
        .from('monthly_incomes')
        .select('amount')
        .eq('user_id', user.id)
        .eq('year_month', yearMonth)
        .maybeSingle(),
      supabase
        .from('expenses')
        .select(
          'id, amount, category_id, description, expense_date, categories(name, color)'
        )
        .eq('user_id', user.id)
        .eq('year_month', yearMonth)
        .order('expense_date', { ascending: false }),
      supabase
        .from('category_budgets')
        .select('id, category_id, amount, categories(name, color)')
        .eq('user_id', user.id)
        .eq('year_month', yearMonth),
    ]);

  if (entriesResult.error) {
    res.status(500).json({ error: entriesResult.error.message });
    return;
  }
  if (expensesResult.error) {
    res.status(500).json({ error: expensesResult.error.message });
    return;
  }
  if (budgetsResult.error) {
    res.status(500).json({ error: budgetsResult.error.message });
    return;
  }

  const entries = entriesResult.data ?? [];
  let income = entries.reduce((sum, e) => sum + Number(e.amount), 0);

  // Fallback legado se ainda não migrou
  if (income === 0 && legacyIncome.data?.amount) {
    income = Number(legacyIncome.data.amount);
  }

  const expenses = expensesResult.data ?? [];
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = income - totalExpenses;
  const percentUsed = income > 0 ? Math.min((totalExpenses / income) * 100, 999) : 0;

  const byCategoryMap = new Map<
    string,
    { categoryId: string | null; name: string; color: string; total: number; count: number }
  >();

  for (const expense of expenses) {
    const cat = expense.categories as { name?: string; color?: string } | null;
    const key = expense.category_id ?? 'sem-categoria';
    const name = cat?.name ?? 'Sem categoria';
    const color = cat?.color ?? '#64748b';
    const current = byCategoryMap.get(key) ?? {
      categoryId: expense.category_id,
      name,
      color,
      total: 0,
      count: 0,
    };
    current.total += Number(expense.amount);
    current.count += 1;
    byCategoryMap.set(key, current);
  }

  const byCategory = Array.from(byCategoryMap.values()).sort((a, b) => b.total - a.total);

  const spentByCategory = new Map<string, number>();
  for (const item of byCategory) {
    if (item.categoryId) spentByCategory.set(item.categoryId, item.total);
  }

  const budgetAlerts = (budgetsResult.data ?? [])
    .map((b) => {
      const limit = Number(b.amount);
      const spent = spentByCategory.get(b.category_id) ?? 0;
      const percent = limit > 0 ? (spent / limit) * 100 : 0;
      const cat = b.categories as { name?: string; color?: string } | null;
      return {
        id: b.id,
        categoryId: b.category_id,
        categoryName: cat?.name ?? 'Categoria',
        categoryColor: cat?.color ?? '#64748b',
        amount: limit,
        spent,
        percentUsed: Number(percent.toFixed(1)),
        exceeded: spent > limit,
        warning: percent >= 80 && spent <= limit,
      };
    })
    .filter((b) => b.exceeded || b.warning);

  const incomeBySource = entries.reduce<Record<string, number>>((acc, e) => {
    const key = e.source || 'other';
    acc[key] = (acc[key] ?? 0) + Number(e.amount);
    return acc;
  }, {});

  res.json({
    yearMonth,
    income,
    incomeCount: entries.length,
    incomeBySource,
    incomeNotes: null,
    totalExpenses,
    balance,
    percentUsed: Number(Math.min(percentUsed, 100).toFixed(1)),
    expenseCount: expenses.length,
    byCategory,
    budgetAlerts,
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
