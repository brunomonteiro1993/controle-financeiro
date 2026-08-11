import { z } from 'zod';

export const yearMonthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'Use o formato YYYY-MM');

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

export function yearMonthFromDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}
