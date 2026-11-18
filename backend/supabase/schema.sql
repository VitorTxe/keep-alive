-- Schema do banco de dados no Supabase (PostgreSQL)
-- Execute este script no SQL Editor do painel do Supabase.

create extension if not exists pgcrypto;

-- Tabela pública de usuários (espelha auth.users e se relaciona com public.projects)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sincroniza usuários já existentes em auth.users (caso existam)
insert into public.users (id, email)
select id, email
from auth.users
where email is not null
on conflict (id) do nothing;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  notification_email text,
  name text not null,
  ping_url text not null,
  secret_header text,
  provider_info text not null,
  is_active boolean not null default true,
  last_status text not null default 'PENDING'
    check (last_status in ('ONLINE', 'COLD_START', 'OFFLINE', 'PENDING')),
  last_ping_at timestamptz,
  last_latency_ms integer,
  db_size_mb double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migração idempotente caso a tabela projects já exista no Supabase
alter table public.projects
  add column if not exists user_id uuid;

alter table public.projects
  add column if not exists notification_email text;

alter table public.projects
  drop constraint if exists projects_user_id_fkey;

alter table public.projects
  add constraint projects_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

create index if not exists idx_projects_user_id
  on public.projects (user_id);

create table if not exists public.ping_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  http_status integer not null,
  status text not null
    check (status in ('ONLINE', 'COLD_START', 'OFFLINE')),
  http_latency_ms integer not null,
  db_latency_ms integer,
  error_message text,
  trigger_type text not null default 'CRON'
    check (trigger_type in ('CRON', 'MANUAL')),
  created_at timestamptz not null default now()
);

create index if not exists idx_ping_logs_project_created_at
  on public.ping_logs (project_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;

create trigger trg_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;

create trigger trg_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

-- Trigger para popular public.users automaticamente quando um usuário se cadastra no Auth
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

-- Habilita Row Level Security (RLS).
-- O backend utiliza SUPABASE_SERVICE_ROLE_KEY, que ignora RLS com segurança no servidor.
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.ping_logs enable row level security;
