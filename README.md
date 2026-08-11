# SISFIN — Controle Financeiro Pessoal

App multi-usuário para registrar **renda mensal** e **gastos**, com dashboard de saldo e gastos por categoria.

## Stack

| Camada | Tecnologia | Deploy |
|--------|------------|--------|
| Frontend | React + TypeScript + Tailwind + Vite | **Vercel** |
| Backend | Node.js + Express + TypeScript | **Render** |
| Auth + DB | Supabase (Auth + Postgres + RLS) | Supabase |

Cada usuário só enxerga os próprios dados (RLS no Supabase + JWT validado na API).

## Funcionalidades

- Cadastro / login (Supabase Auth)
- Renda mensal por competência (`YYYY-MM`)
- CRUD de gastos com categorias
- Painel com saldo, % da renda usada, pizza por categoria e últimos lançamentos
- Navegação por mês

## 1. Supabase

1. Crie um projeto no [Supabase](https://supabase.com).
2. Em **SQL Editor**, execute o arquivo `supabase/schema.sql`.
3. Em **Authentication → Providers**, deixe Email habilitado.
4. (Opcional) Em **Authentication → Settings**, desative “Confirm email” para testes locais.
5. Copie em **Settings → API**:
   - Project URL
   - `anon` public key
   - `service_role` key (somente no backend — **nunca** no frontend)

## 2. Backend (local / Render)

```bash
cd backend
cp .env.example .env
# preencha SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, FRONTEND_URL
npm install
npm run dev
```

API em `http://localhost:3001` — health: `GET /health`.

### Deploy no Render

1. New → Web Service (ou use `render.yaml`).
2. Root directory: `backend`
3. Build: `npm install && npm run build`
4. Start: `npm start`
5. Variáveis:
   - `FRONTEND_URL` = URL do Vercel (ex.: `https://seu-app.vercel.app`)
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NODE_ENV=production`

## 3. Frontend (local / Vercel)

```bash
cd frontend
cp .env.example .env
# VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL=http://localhost:3001
npm install
npm run dev
```

App em `http://localhost:5173`.

### Deploy no Vercel

1. Importe o repositório e defina **Root Directory** = `frontend`.
2. Framework: Vite (já há `vercel.json` com SPA rewrite).
3. Variáveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` = URL da API no Render (ex.: `https://sisfin-api.onrender.com`)

Depois do deploy, atualize `FRONTEND_URL` no Render com a URL final do Vercel.

## Fluxo de autenticação

1. Frontend autentica no Supabase (email/senha).
2. Cada chamada à API envia `Authorization: Bearer <access_token>`.
3. Backend valida o JWT e consulta o Postgres com o cliente do usuário (RLS ativo).

## Estrutura

```
financeiro/
├── frontend/          # React (Vercel)
├── backend/           # Express API (Render)
└── supabase/
    └── schema.sql     # Tabelas + RLS + categorias padrão
```

## Próximos passos (ideias)

- Metas de orçamento por categoria
- Recorrência de gastos
- Exportação CSV
- Relatório anual
