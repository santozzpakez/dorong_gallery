-- Jalankan seluruh skrip ini di Supabase → SQL Editor → Run.
-- Aman dijalankan ulang (DROP POLICY IF EXISTS, ON CONFLICT).

-- ========== TABLE site_assets ==========
create table if not exists public.site_assets (
  key text primary key,
  label text not null,
  category text not null default 'other',
  image_url text not null,
  updated_at timestamp with time zone default now()
);

alter table public.site_assets enable row level security;

drop policy if exists "public read site_assets" on public.site_assets;
create policy "public read site_assets"
on public.site_assets
for select
using (true);

drop policy if exists "public upsert site_assets" on public.site_assets;
drop policy if exists "public update site_assets" on public.site_assets;
drop policy if exists "Only admins can manage site_assets" on public.site_assets;

-- Izinkan modifikasi (insert/update/delete) hanya bagi admin
create policy "Only admins can manage site_assets"
on public.site_assets
for all
using (
  exists (
    select 1 from public.site_admins 
    where email = auth.jwt()->>'email'
  )
);

-- ========== STORAGE bucket (reuse product-images or create site-assets) ==========
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update set public = excluded.public;

update storage.buckets set public = true where id = 'site-assets';

-- ========== STORAGE policies for site-assets bucket ==========
drop policy if exists "storage read site assets" on storage.objects;
drop policy if exists "storage insert site assets" on storage.objects;
drop policy if exists "storage update site assets" on storage.objects;
drop policy if exists "storage delete site assets" on storage.objects;
drop policy if exists "Only admins can insert site storage" on storage.objects;
drop policy if exists "Only admins can update site storage" on storage.objects;
drop policy if exists "Only admins can delete site storage" on storage.objects;

-- Baca berkas publik diperbolehkan untuk siapa saja
create policy "storage read site assets"
on storage.objects
for select
using (bucket_id = 'site-assets');

-- Otorisasi upload hanya untuk admin
create policy "Only admins can insert site storage"
on storage.objects
for insert
with check (
  bucket_id = 'site-assets'
  and exists (
    select 1 from public.site_admins 
    where email = auth.jwt()->>'email'
  )
);

-- Otorisasi update hanya untuk admin
create policy "Only admins can update site storage"
on storage.objects
for update
using (
  bucket_id = 'site-assets'
  and exists (
    select 1 from public.site_admins 
    where email = auth.jwt()->>'email'
  )
);

-- Otorisasi delete hanya untuk admin
create policy "Only admins can delete site storage"
on storage.objects
for delete
using (
  bucket_id = 'site-assets'
  and exists (
    select 1 from public.site_admins 
    where email = auth.jwt()->>'email'
  )
);
