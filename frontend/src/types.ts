export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  expenseDate: string;
  yearMonth: string;
  notes: string | null;
  categoryId: string | null;
  recurringId?: string | null;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
};

export type IncomeSource = 'salary' | 'freelance' | 'bonus' | 'sales' | 'other';

export type IncomeEntry = {
  id: string;
  description: string;
  amount: number;
  incomeDate: string;
  yearMonth: string;
  source: IncomeSource;
  notes: string | null;
};

export type BudgetStatus = {
  id: string;
  categoryId: string;
  yearMonth: string;
  amount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  exceeded: boolean;
  warning: boolean;
  category: {
    id: string;
    name: string;
    color: string;
  };
};

export type RecurringExpense = {
  id: string;
  description: string;
  amount: number;
  dayOfMonth: number;
  active: boolean;
  startYearMonth: string;
  endYearMonth: string | null;
  categoryId: string | null;
  notes: string | null;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
};

export type Summary = {
  yearMonth: string;
  income: number;
  incomeCount: number;
  incomeBySource: Record<string, number>;
  incomeNotes: string | null;
  totalExpenses: number;
  balance: number;
  percentUsed: number;
  expenseCount: number;
  byCategory: Array<{
    categoryId?: string | null;
    name: string;
    color: string;
    total: number;
    count: number;
  }>;
  budgetAlerts: Array<{
    id: string;
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    amount: number;
    spent: number;
    percentUsed: number;
    exceeded: boolean;
    warning: boolean;
  }>;
  recentExpenses: Array<{
    id: string;
    description: string;
    amount: number;
    expenseDate: string;
    categoryName: string;
    categoryColor: string;
  }>;
};

export type AppUser = {
  id: string;
  email: string;
  fullName: string | null;
  currency: string;
};

export const INCOME_SOURCE_LABELS: Record<IncomeSource, string> = {
  salary: 'Salário',
  freelance: 'Freelance',
  bonus: '13º / Bônus',
  sales: 'Vendas',
  other: 'Outros',
};
