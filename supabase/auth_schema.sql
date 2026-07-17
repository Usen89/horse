-- ============================================================
-- Табун-Реестр — таблица профилей для авторизации (Supabase Auth)
-- ============================================================
-- НЕОБЯЗАТЕЛЬНО: авторизация (регистрация/вход) работает и без этого
-- скрипта — имя и роль хранятся в метаданных пользователя. Этот скрипт
-- добавляет таблицу public.profiles, чтобы профили сотрудников были видны
-- всей команде и доступны для SQL-отчётов.
--
-- Как применить: Supabase → SQL Editor → New query → вставить целиком → Run.
-- ============================================================

-- Профиль пользователя (1:1 с auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null default 'Пользователь',
  role text not null default 'Зоотехник',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Любой вошедший видит список профилей команды
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles
  for select to authenticated using (true);

-- Пользователь создаёт/редактирует только свой профиль
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Автоматическое создание профиля при регистрации
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'Зоотехник')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Перенос уже зарегистрированных пользователей в profiles (если есть)
insert into public.profiles (id, email, name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data->>'role', 'Зоотехник')
from auth.users u
on conflict (id) do nothing;

-- Готово. Профили создаются автоматически при каждой регистрации.
