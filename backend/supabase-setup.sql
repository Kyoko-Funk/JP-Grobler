-- =====================================================================
--  Dombo's — Supabase setup for the scrapbook and the farewell reel.
--  Paste this whole file into Supabase → SQL Editor → New query → Run.
--
--  BEFORE RUNNING: change the reel password on the line marked ⬇ below.
--  (Safe to run again later — e.g. to change the password.)
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- 1. A table that remembers each upload: who, what, caption, and the tilt on the wall.
create table if not exists public.uploads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  kind        text not null check (kind in ('photo', 'video')),
  path        text not null unique check (path ~ '^(photos|videos)/[0-9a-f-]{36}\.[a-z0-9]{2,5}$'),
  guest_name  text not null check (char_length(guest_name) between 1 and 80),
  caption     text check (char_length(caption) <= 200),
  tilt        real not null default 0 check (tilt between -6 and 6)
);
alter table public.uploads enable row level security;

-- Guests may add uploads…
drop policy if exists "guests can add uploads" on public.uploads;
create policy "guests can add uploads" on public.uploads
  for insert to anon, authenticated with check (true);

-- …and everyone may see PHOTOS. Videos stay hidden (sealed for the honeymoon).
drop policy if exists "photos are public" on public.uploads;
create policy "photos are public" on public.uploads
  for select to anon, authenticated using (kind = 'photo');

-- 2. The storage "bucket" (folder in the cloud) for the actual files. 50 MB per file max.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('scrapbook', 'scrapbook', true, 52428800, array['image/*', 'video/*'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Guests may upload into it. Nobody may LIST its contents, so a video can
-- only be found by someone who already knows its random 36-character name.
drop policy if exists "guests can upload to scrapbook" on storage.objects;
create policy "guests can upload to scrapbook" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'scrapbook' and (storage.foldername(name))[1] in ('photos', 'videos'));

-- 3. The reel password, stored scrambled (hashed) where no guest can read it.
create table if not exists public.reel_secret (
  id       int primary key default 1 check (id = 1),
  pw_hash  text not null
);
alter table public.reel_secret enable row level security;  -- no policies = no public access

insert into public.reel_secret (id, pw_hash)
values (1, extensions.crypt('CHANGE-ME-honeymoon', extensions.gen_salt('bf')))   -- ⬇ YOUR PASSWORD GOES HERE
on conflict (id) do update set pw_hash = excluded.pw_hash;

-- 4. The vault door: hand over the list of videos only if the password is right.
create or replace function public.get_reel(pw text)
returns table (path text, guest_name text, caption text, created_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform pg_sleep(0.5); -- slows down anyone trying to guess
  if not exists (select 1 from public.reel_secret s where s.pw_hash = extensions.crypt(pw, s.pw_hash)) then
    raise exception 'wrong password' using errcode = '28P01';
  end if;
  return query
    select u.path, u.guest_name, u.caption, u.created_at
    from public.uploads u
    where u.kind = 'video'
    order by u.created_at;
end;
$$;

-- 5. A harmless counter so the scrapbook can say "12 sealed video messages".
create or replace function public.sealed_video_count()
returns int
language sql
security definer
set search_path = public
as $$ select count(*)::int from public.uploads where kind = 'video'; $$;

revoke all on function public.get_reel(text) from public;
revoke all on function public.sealed_video_count() from public;
grant execute on function public.get_reel(text) to anon, authenticated;
grant execute on function public.sealed_video_count() to anon, authenticated;
