-- ============================================================
-- Табун-Реестр — схема базы данных Supabase (PostgreSQL)
-- ============================================================
-- Как применить:
--   1. Создайте проект на https://supabase.com (бесплатный тариф).
--   2. Откройте SQL Editor → New query.
--   3. Вставьте ЦЕЛИКОМ содержимое этого файла и нажмите Run.
--   4. Скопируйте Project URL и anon key (Settings → API)
--      в приложение: Профиль → Настройки → Облачная база.
--
-- Модель хранения: каждая запись — строка с первичным ключом id
-- и полным JSON-документом в колонке data (та же структура, что
-- в приложении). Ключевые поля продублированы генерируемыми
-- колонками — по ним удобно строить SQL-отчёты.
-- ============================================================

-- ---------- Лошади ----------
create table if not exists public.horses (
  id text primary key,
  data jsonb not null,
  name text generated always as (data->>'name') stored,
  status text generated always as (data->>'status') stored,
  gender text generated always as (data->>'gender') stored,
  kosek_id text generated always as (data->>'kosekId') stored,
  birth_date text generated always as (data->>'birthDate') stored,
  updated_at timestamptz not null default now()
);

-- ---------- Косяки (табунные группы) ----------
create table if not exists public.koseks (
  id text primary key,
  data jsonb not null,
  name text generated always as (data->>'name') stored,
  stallion_id text generated always as (data->>'stallionId') stored,
  updated_at timestamptz not null default now()
);

-- ---------- Вакцинации ----------
create table if not exists public.vaccinations (
  id text primary key,
  data jsonb not null,
  horse_id text generated always as (data->>'horseId') stored,
  disease text generated always as (data->>'disease') stored,
  status text generated always as (data->>'status') stored,
  next_due_date text generated always as (data->>'nextDueDate') stored,
  updated_at timestamptz not null default now()
);

-- ---------- Откорм ----------
create table if not exists public.fattening_records (
  id text primary key,
  data jsonb not null,
  horse_id text generated always as (data->>'horseId') stored,
  updated_at timestamptz not null default now()
);

-- ---------- Архив забоя ----------
create table if not exists public.cull_records (
  id text primary key,
  data jsonb not null,
  horse_id text generated always as (data->>'horseId') stored,
  cull_date text generated always as (data->>'cullDate') stored,
  updated_at timestamptz not null default now()
);

-- ---------- Администраторы ----------
create table if not exists public.administrators (
  id text primary key, -- = login
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- Автообновление updated_at ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['horses','koseks','vaccinations','fattening_records','cull_records','administrators']
  loop
    execute format('drop trigger if exists trg_touch_%I on public.%I', t, t);
    execute format(
      'create trigger trg_touch_%I before update on public.%I
       for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-- ---------- Безопасность (RLS) ----------
-- ВНИМАНИЕ: политики ниже дают полный доступ любому, у кого есть
-- Project URL + anon key (однопользовательский сценарий хозяйства).
-- Не публикуйте anon key в открытых источниках. Для многопользовательского
-- доступа с паролями подключите Supabase Auth и замените политики на
-- `to authenticated using (auth.uid() is not null)`.

do $$
declare t text;
begin
  foreach t in array array['horses','koseks','vaccinations','fattening_records','cull_records','administrators']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "farm full access" on public.%I', t);
    execute format(
      'create policy "farm full access" on public.%I
       for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Готово! Таблицы созданы. Вернитесь в приложение Табун-Реестр.
