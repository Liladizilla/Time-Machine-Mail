create extension if not exists pgcrypto;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sender text not null,
  recipient text not null,
  subject text not null,
  body text not null,
  timeline_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'timeline_entry' check (status in ('draft', 'timeline_entry')),
  constraint subject_length check (char_length(subject) between 1 and 250),
  constraint body_length check (char_length(body) between 1 and 100000),
  constraint recipient_length check (char_length(recipient) between 3 and 320)
);

create index if not exists messages_user_timeline_idx on public.messages (user_id, timeline_at desc);
create index if not exists messages_user_created_idx on public.messages (user_id, created_at desc);

alter table public.messages enable row level security;

create policy "Users can read their own messages" on public.messages for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own messages" on public.messages for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own messages" on public.messages for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own messages" on public.messages for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists messages_set_updated_at on public.messages;
create trigger messages_set_updated_at before update on public.messages for each row execute function public.set_updated_at();
