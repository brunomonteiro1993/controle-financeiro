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
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
};

export type Income = {
  id: string;
  yearMonth: string;
  amount: number;
  notes: string | null;
  updatedAt: string;
};

export type Summary = {
  yearMonth: string;
  income: number;
  incomeNotes: string | null;
  totalExpenses: number;
  balance: number;
  percentUsed: number;
  expenseCount: number;
  byCategory: Array<{
    name: string;
    color: string;
    total: number;
    count: number;
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
