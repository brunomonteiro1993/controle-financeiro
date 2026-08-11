import type { Expense, IncomeEntry } from '../types';
import { INCOME_SOURCE_LABELS } from '../types';
import { formatBRL, formatDateBR, labelYearMonth } from './format';

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMonthCsv(params: {
  yearMonth: string;
  expenses: Expense[];
  incomes: IncomeEntry[];
}) {
  const { yearMonth, expenses, incomes } = params;
  const lines: string[] = [
    'tipo;data;descricao;categoria_ou_fonte;valor;observacoes',
  ];

  for (const income of incomes) {
    lines.push(
      [
        'receita',
        income.incomeDate,
        `"${income.description.replace(/"/g, '""')}"`,
        INCOME_SOURCE_LABELS[income.source],
        String(income.amount).replace('.', ','),
        `"${(income.notes ?? '').replace(/"/g, '""')}"`,
      ].join(';')
    );
  }

  for (const expense of expenses) {
    lines.push(
      [
        'despesa',
        expense.expenseDate,
        `"${expense.description.replace(/"/g, '""')}"`,
        `"${(expense.category?.name ?? 'Sem categoria').replace(/"/g, '""')}"`,
        String(expense.amount).replace('.', ','),
        `"${(expense.notes ?? '').replace(/"/g, '""')}"`,
      ].join(';')
    );
  }

  downloadBlob(
    `sisfin-${yearMonth}.csv`,
    '\uFEFF' + lines.join('\n'),
    'text/csv;charset=utf-8;'
  );
}

export function exportMonthPdf(params: {
  yearMonth: string;
  expenses: Expense[];
  incomes: IncomeEntry[];
  totalIncome: number;
  totalExpenses: number;
}) {
  const { yearMonth, expenses, incomes, totalIncome, totalExpenses } = params;
  const balance = totalIncome - totalExpenses;
  const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!w) {
    throw new Error('Permita pop-ups para exportar o PDF.');
  }

  const incomeRows = incomes
    .map(
      (i) =>
        `<tr><td>${formatDateBR(i.incomeDate)}</td><td>${i.description}</td><td>${INCOME_SOURCE_LABELS[i.source]}</td><td style="text-align:right">${formatBRL(i.amount)}</td></tr>`
    )
    .join('');

  const expenseRows = expenses
    .map(
      (e) =>
        `<tr><td>${formatDateBR(e.expenseDate)}</td><td>${e.description}</td><td>${e.category?.name ?? 'Sem categoria'}</td><td style="text-align:right">${formatBRL(e.amount)}</td></tr>`
    )
    .join('');

  w.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>SISFIN — ${labelYearMonth(yearMonth)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
    h1 { margin: 0 0 4px; font-size: 22px; }
    h2 { margin: 24px 0 8px; font-size: 16px; }
    p { margin: 0 0 8px; color: #444; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th, td { border-bottom: 1px solid #ddd; padding: 8px 6px; text-align: left; }
    th { background: #f3f7f5; }
    .summary { display: flex; gap: 16px; margin: 16px 0; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px 16px; min-width: 140px; }
    .card strong { display: block; font-size: 16px; margin-top: 4px; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <h1>SISFIN — Relatório mensal</h1>
  <p>${labelYearMonth(yearMonth)}</p>
  <div class="summary">
    <div class="card">Receitas<strong>${formatBRL(totalIncome)}</strong></div>
    <div class="card">Despesas<strong>${formatBRL(totalExpenses)}</strong></div>
    <div class="card">Saldo<strong>${formatBRL(balance)}</strong></div>
  </div>
  <button onclick="window.print()">Imprimir / Salvar PDF</button>
  <h2>Receitas</h2>
  <table>
    <thead><tr><th>Data</th><th>Descrição</th><th>Fonte</th><th>Valor</th></tr></thead>
    <tbody>${incomeRows || '<tr><td colspan="4">Sem receitas</td></tr>'}</tbody>
  </table>
  <h2>Despesas</h2>
  <table>
    <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead>
    <tbody>${expenseRows || '<tr><td colspan="4">Sem despesas</td></tr>'}</tbody>
  </table>
  <script>setTimeout(() => window.print(), 300);</script>
</body>
</html>`);
  w.document.close();
}
