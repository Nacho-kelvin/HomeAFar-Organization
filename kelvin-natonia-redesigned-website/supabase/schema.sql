-- HomeAFar: forms, story moderation and admin access.
-- Run once in the Supabase SQL editor (Dashboard > SQL Editor), then run storage.sql.
-- Security model: visitors can only INSERT. Only users listed in public.admins can read, update or delete.

-- ---------- admins ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admins read own row" on public.admins;
create policy "admins read own row" on public.admins for select to authenticated using (user_id = auth.uid());
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

-- ---------- contact messages ----------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  subject text not null check (char_length(subject) between 3 and 150),
  message text not null check (char_length(message) between 10 and 5000),
  status text not null default 'new' check (status in ('new', 'read', 'archived'))
);
alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;

drop policy if exists "visitors send messages" on public.contact_messages;
create policy "visitors send messages" on public.contact_messages for insert to anon, authenticated with check (status = 'new');
drop policy if exists "admins read messages" on public.contact_messages;
create policy "admins read messages" on public.contact_messages for select to authenticated using (public.is_admin());
drop policy if exists "admins update messages" on public.contact_messages;
create policy "admins update messages" on public.contact_messages for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete messages" on public.contact_messages;
create policy "admins delete messages" on public.contact_messages for delete to authenticated using (public.is_admin());

-- ---------- stories ----------
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null check (char_length(title) between 3 and 150),
  display_name text not null check (char_length(display_name) between 2 and 80),
  email text not null check (char_length(email) between 5 and 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  country text not null check (char_length(country) between 2 and 80),
  category text not null check (category in ('Belonging','Loneliness & homesickness','Culture & identity','Challenges & discrimination','Growth & resilience','Finding community','Other')),
  body text not null check (char_length(body) between 100 and 10000),
  image_path text check (image_path ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$'),
  consent boolean not null check (consent = true),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  published_at timestamptz
);
alter table public.stories enable row level security;
revoke all on public.stories from anon, authenticated;
grant insert on public.stories to anon, authenticated;
grant select, update, delete on public.stories to authenticated;

drop policy if exists "visitors submit pending stories" on public.stories;
create policy "visitors submit pending stories" on public.stories for insert to anon, authenticated
  with check (status = 'pending' and consent = true and published_at is null and reviewed_at is null);
drop policy if exists "admins read stories" on public.stories;
create policy "admins read stories" on public.stories for select to authenticated using (public.is_admin());
drop policy if exists "admins update stories" on public.stories;
create policy "admins update stories" on public.stories for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete stories" on public.stories;
create policy "admins delete stories" on public.stories for delete to authenticated using (public.is_admin());

create or replace function public.stamp_story_review() returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.reviewed_at := now();
    new.published_at := case when new.status = 'approved' then now() else null end;
  end if;
  return new;
end $$;
drop trigger if exists stories_stamp_review on public.stories;
create trigger stories_stamp_review before update on public.stories for each row execute function public.stamp_story_review();

-- Public read access: ONLY approved stories, and ONLY safe columns (never email or status).
create or replace view public.public_stories with (security_invoker = false) as
  select id, title, display_name, country, category, body, image_path, published_at
  from public.stories where status = 'approved';
revoke all on public.public_stories from anon, authenticated;
grant select on public.public_stories to anon, authenticated;

-- ---------- community interest ----------
create table if not exists public.member_interests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  location text check (char_length(location) <= 120),
  interests text[] not null default '{}' check (interests <@ array['Membership','Volunteering','Sharing a story','Partnership','Events']::text[]),
  message text check (char_length(message) <= 2000),
  consent boolean not null check (consent = true),
  status text not null default 'new' check (status in ('new', 'contacted', 'archived'))
);
alter table public.member_interests enable row level security;
revoke all on public.member_interests from anon, authenticated;
grant insert on public.member_interests to anon, authenticated;
grant select, update, delete on public.member_interests to authenticated;
drop policy if exists "visitors register interest" on public.member_interests;
create policy "visitors register interest" on public.member_interests for insert to anon, authenticated with check (status = 'new' and consent = true);
drop policy if exists "admins read interests" on public.member_interests;
create policy "admins read interests" on public.member_interests for select to authenticated using (public.is_admin());
drop policy if exists "admins update interests" on public.member_interests;
create policy "admins update interests" on public.member_interests for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete interests" on public.member_interests;
create policy "admins delete interests" on public.member_interests for delete to authenticated using (public.is_admin());
