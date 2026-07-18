create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  preferred_language text not null default 'English',
  voice_language text not null default 'English',
  voice_style text not null default 'natural',
  coaching_style text not null default 'friendly',
  voice_enabled boolean not null default true,
  auto_tips boolean not null default false,
  large_text boolean not null default false,
  high_contrast boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  prompt_skill integer not null default 0 check (prompt_skill between 0 and 100),
  chatgpt_skill integer not null default 0 check (chatgpt_skill between 0 and 100),
  codex_skill integer not null default 0 check (codex_skill between 0 and 100),
  automation_skill integer not null default 0 check (automation_skill between 0 and 100),
  completed_lessons text[] not null default '{}',
  achievements text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can view their own progress" on public.user_progress;
create policy "Users can view their own progress"
on public.user_progress for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own progress" on public.user_progress;
create policy "Users can create their own progress"
on public.user_progress for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own progress" on public.user_progress;
create policy "Users can update their own progress"
on public.user_progress for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  category text not null check (category in ('technical', 'account', 'feedback', 'other')),
  message text not null check (char_length(message) between 10 and 2000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  created_at timestamptz not null default now()
);

-- These audit timestamps never expose messages to browser clients. They let a
-- support operator check whether the inbox notice and automatic confirmation
-- were accepted by the email provider.
alter table public.support_requests
  add column if not exists support_notification_sent_at timestamptz;

alter table public.support_requests
  add column if not exists confirmation_sent_at timestamptz;

alter table public.support_requests enable row level security;

-- Support tickets are created only by the authenticated support-email Edge
-- Function. Browser clients cannot insert tickets directly.
drop policy if exists "Users can create their own support requests" on public.support_requests;

create index if not exists support_requests_user_id_created_at_idx
on public.support_requests (user_id, created_at desc);

-- A signed-in account may submit up to five support messages per hour. This
-- protects the inbox without letting a browser client bypass the limit.
create or replace function public.enforce_support_request_limit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    select count(*)
    from public.support_requests
    where user_id = new.user_id
      and created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'support request limit reached';
  end if;
  return new;
end;
$$;

drop trigger if exists support_requests_rate_limit on public.support_requests;
create trigger support_requests_rate_limit
before insert on public.support_requests
for each row execute function public.enforce_support_request_limit();

-- Permanent account deletion is handled by the protected delete-account Edge
-- Function. Browser clients cannot remove records directly.
drop policy if exists "Users can delete their own support requests" on public.support_requests;
drop policy if exists "Users can delete their own profile" on public.profiles;
drop policy if exists "Users can delete their own progress" on public.user_progress;
