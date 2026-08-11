-- SISFIN / Controle Financeiro - Schema multi-usuário
-- Charset: utf8mb4 equivalente no Postgres (UTF8)
-- Execute no SQL Editor do Supabase

-- Perfis (espelha auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  currency text not null default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Renda mensal por competência (YYYY-MM)
create table if not exists public.monthly_incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  year_month text not null check (year_month ~ '^\d{4}-\d{2}$'),
  amount numeric(14, 2) not null check (amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year_month)
);

-- Categorias de despesa (padrão + customizadas)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#0d9488',
  icon text not null default 'tag',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- Gastos / lançamentos
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  description text not null,
  amount numeric(14, 2) not null check (amount > 0),
  expense_date date not null default current_date,
  year_month text not null check (year_month ~ '^\d{4}-\d{2}$'),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_expenses_user_month on public.expenses (user_id, year_month);
create index if not exists idx_expenses_user_date on public.expenses (user_id, expense_date desc);
create index if not exists idx_incomes_user_month on public.monthly_incomes (user_id, year_month);

-- Atualiza updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_incomes_updated on public.monthly_incomes;
create trigger trg_incomes_updated
  before update on public.monthly_incomes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_expenses_updated on public.expenses;
create trigger trg_expenses_updated
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- Cria perfil + categorias padrão no signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );

  insert into public.categories (user_id, name, color, icon, is_default) values
    (new.id, 'Moradia', '#0f766e', 'home', true),
    (new.id, 'Alimentação', '#ea580c', 'utensils', true),
    (new.id, 'Transporte', '#2563eb', 'car', true),
    (new.id, 'Saúde', '#dc2626', 'heart', true),
    (new.id, 'Lazer', '#7c3aed', 'smile', true),
    (new.id, 'Educação', '#0891b2', 'book', true),
    (new.id, 'Assinaturas', '#4f46e5', 'repeat', true),
    (new.id, 'Outros', '#64748b', 'tag', true);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.monthly_incomes enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Monthly incomes
drop policy if exists "incomes_all_own" on public.monthly_incomes;
create policy "incomes_all_own" on public.monthly_incomes
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Categories
drop policy if exists "categories_all_own" on public.categories;
create policy "categories_all_own" on public.categories
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Expenses
drop policy if exists "expenses_all_own" on public.expenses;
create policy "expenses_all_own" on public.expenses
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- === Inclu�do na v2 (tamb�m em migration_v2.sql) ===

-- SISFIN v2 — execute no SQL Editor se o schema base já existir

-- Receitas flexíveis (salário, freelance, 13º, vendas...)
create table if not exists public.income_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  description text not null,
  amount numeric(14, 2) not null check (amount > 0),
  income_date date not null default current_date,
  year_month text not null check (year_month ~ '^\d{4}-\d{2}$'),
  source text not null default 'other'
    check (source in ('salary', 'freelance', 'bonus', 'sales', 'other')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_income_entries_user_month
  on public.income_entries (user_id, year_month);

-- Metas por categoria / mês
create table if not exists public.category_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  year_month text not null check (year_month ~ '^\d{4}-\d{2}$'),
  amount numeric(14, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id, year_month)
);

-- Gastos recorrentes
create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  description text not null,
  amount numeric(14, 2) not null check (amount > 0),
  day_of_month int not null default 1 check (day_of_month between 1 and 28),
  active boolean not null default true,
  start_year_month text not null check (start_year_month ~ '^\d{4}-\d{2}$'),
  end_year_month text check (end_year_month is null or end_year_month ~ '^\d{4}-\d{2}$'),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Vínculo gasto ← recorrente (evita duplicar no mês)
alter table public.expenses
  add column if not exists recurring_id uuid references public.recurring_expenses (id) on delete set null;

create unique index if not exists uq_expenses_recurring_month
  on public.expenses (user_id, recurring_id, year_month)
  where recurring_id is not null;

-- Triggers updated_at
drop trigger if exists trg_income_entries_updated on public.income_entries;
create trigger trg_income_entries_updated
  before update on public.income_entries
  for each row execute function public.set_updated_at();

drop trigger if exists trg_budgets_updated on public.category_budgets;
create trigger trg_budgets_updated
  before update on public.category_budgets
  for each row execute function public.set_updated_at();

drop trigger if exists trg_recurring_updated on public.recurring_expenses;
create trigger trg_recurring_updated
  before update on public.recurring_expenses
  for each row execute function public.set_updated_at();

-- RLS
alter table public.income_entries enable row level security;
alter table public.category_budgets enable row level security;
alter table public.recurring_expenses enable row level security;

drop policy if exists "income_entries_all_own" on public.income_entries;
create policy "income_entries_all_own" on public.income_entries
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "budgets_all_own" on public.category_budgets;
create policy "budgets_all_own" on public.category_budgets
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "recurring_all_own" on public.recurring_expenses;
create policy "recurring_all_own" on public.recurring_expenses
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Migra renda mensal antiga para income_entries (uma vez)
insert into public.income_entries (user_id, description, amount, income_date, year_month, source, notes)
select
  mi.user_id,
  'Renda mensal',
  mi.amount,
  (mi.year_month || '-01')::date,
  mi.year_month,
  'salary',
  mi.notes
from public.monthly_incomes mi
where mi.amount > 0
  and not exists (
    select 1
    from public.income_entries ie
    where ie.user_id = mi.user_id
      and ie.year_month = mi.year_month
      and ie.source = 'salary'
      and ie.description = 'Renda mensal'
  );
