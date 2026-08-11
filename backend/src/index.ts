import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import categoriesRouter from './routes/categories.js';
import dashboardRouter from './routes/dashboard.js';
import expensesRouter from './routes/expenses.js';
import incomesRouter from './routes/incomes.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl.split(',').map((o) => o.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'sisfin-api', env: env.nodeEnv });
});

app.use('/api/dashboard', dashboardRouter);
app.use('/api/incomes', incomesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/categories', categoriesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

app.listen(env.port, () => {
  console.log(`API SISFIN ouvindo na porta ${env.port}`);
});
