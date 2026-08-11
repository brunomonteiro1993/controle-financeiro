import { z } from 'zod';

export const yearMonthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'Use o formato YYYY-MM');

export const incomeSourceSchema = z.enum([
  'salary',
  'freelance',
  'bonus',
  'sales',
  'other',
]);

export const createIncomeEntrySchema = z.object({
  description: z.string().min(1).max(200),
  amount: z.number().positive('Valor deve ser maior que zero'),
  incomeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  source: incomeSourceSchema.optional().default('other'),
  notes: z.string().max(500).optional().nullable(),
});

export const updateIncomeEntrySchema = createIncomeEntrySchema.partial();

/** @deprecated mantido por compatibilidade */
export const upsertIncomeSchema = z.object({
  yearMonth: yearMonthSchema,
  amount: z.number().min(0, 'Valor deve ser >= 0'),
  notes: z.string().max(500).optional().nullable(),
});

export const createExpenseSchema = z.object({
  description: z.string().min(1).max(200),
  amount: z.number().positive('Valor deve ser maior que zero'),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  categoryId: z.string().uuid().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(1).max(80),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  icon: z.string().max(40).optional(),
});

export const upsertBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  yearMonth: yearMonthSchema,
  amount: z.number().min(0),
});

export const createRecurringSchema = z.object({
  description: z.string().min(1).max(200),
  amount: z.number().positive(),
  dayOfMonth: z.number().int().min(1).max(28),
  categoryId: z.string().uuid().optional().nullable(),
  startYearMonth: yearMonthSchema,
  endYearMonth: yearMonthSchema.optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  active: z.boolean().optional().default(true),
});

export const updateRecurringSchema = createRecurringSchema.partial();

export function yearMonthFromDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function dateInYearMonth(yearMonth: string, dayOfMonth: number): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const day = Math.min(dayOfMonth, lastDay);
  return `${yearMonth}-${String(day).padStart(2, '0')}`;
}

export function yearMonthLte(a: string, b: string): boolean {
  return a <= b;
}

export function yearMonthGte(a: string, b: string): boolean {
  return a >= b;
}
