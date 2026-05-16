-- Create table for managing admins
create table if not exists public.site_admins (
  email text primary key,
  role text default 'regular', -- 'superior' or 'regular'
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.site_admins enable row level security;

-- Policies
create policy "Anyone can read admins" on public.site_admins
  for select using (true);

create policy "Only superiors can manage admins" on public.site_admins
  for all using (
    exists (
      select 1 from public.site_admins 
      where email = auth.jwt()->>'email' 
      and role = 'superior'
    )
  );

-- Insert you as the first Superior Admin
insert into public.site_admins (email, role)
values ('santozzpakez@gmail.com', 'superior')
on conflict (email) do update set role = 'superior';
