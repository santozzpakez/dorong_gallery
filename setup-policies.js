const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const envUrlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const envServiceKeyMatch = envFile.match(/SUPABASE_SERVICE_KEY=(.*)/);

const url = envUrlMatch ? envUrlMatch[1].trim() : '';
const serviceKey = envServiceKeyMatch ? envServiceKeyMatch[1].trim() : '';

async function fixPolicies() {
  const sql = `
    -- 1. Enable RLS
    alter table public.products enable row level security;
    alter table public.site_assets enable row level security;
    
    -- 2. Drop existing policies to prevent duplication/conflict
    drop policy if exists "public read products" on public.products;
    drop policy if exists "public insert products" on public.products;
    drop policy if exists "Only admins can insert products" on public.products;
    drop policy if exists "Only admins can update products" on public.products;
    drop policy if exists "Only admins can delete products" on public.products;
    
    drop policy if exists "public read site_assets" on public.site_assets;
    drop policy if exists "public upsert site_assets" on public.site_assets;
    drop policy if exists "public update site_assets" on public.site_assets;
    drop policy if exists "public insert site_assets" on public.site_assets;
    drop policy if exists "Only admins can manage site_assets" on public.site_assets;

    -- 3. Recreate products policies
    create policy "public read products" on public.products 
      for select using (true);
      
    create policy "Only admins can insert products" on public.products 
      for insert with check (
        exists (
          select 1 from public.site_admins 
          where email = auth.jwt()->>'email'
        )
      );
      
    create policy "Only admins can update products" on public.products 
      for update using (
        exists (
          select 1 from public.site_admins 
          where email = auth.jwt()->>'email'
        )
      );
      
    create policy "Only admins can delete products" on public.products 
      for delete using (
        exists (
          select 1 from public.site_admins 
          where email = auth.jwt()->>'email'
        )
      );

    -- 4. Recreate site_assets policies
    create policy "public read site_assets" on public.site_assets 
      for select using (true);
      
    create policy "Only admins can manage site_assets" on public.site_assets 
      for all using (
        exists (
          select 1 from public.site_admins 
          where email = auth.jwt()->>'email'
        )
      );

    -- 5. STORAGE POLICIES
    -- Drop existing storage policies
    drop policy if exists "storage read product images" on storage.objects;
    drop policy if exists "storage insert product images" on storage.objects;
    drop policy if exists "storage update product images" on storage.objects;
    drop policy if exists "storage delete product images" on storage.objects;
    
    drop policy if exists "storage read site assets" on storage.objects;
    drop policy if exists "storage insert site assets" on storage.objects;
    drop policy if exists "storage update site assets" on storage.objects;
    
    drop policy if exists "anon read product images" on storage.objects;
    drop policy if exists "anon upload product images" on storage.objects;
    drop policy if exists "auth read product images" on storage.objects;
    drop policy if exists "auth upload product images" on storage.objects;
    drop policy if exists "Only admins can insert storage" on storage.objects;
    drop policy if exists "Only admins can update storage" on storage.objects;
    drop policy if exists "Only admins can delete storage" on storage.objects;
    
    -- Read access for everyone
    create policy "storage read product images" on storage.objects 
      for select using (bucket_id = 'product-images' or bucket_id = 'site-assets');
      
    -- Write access only for admins
    create policy "Only admins can insert storage" on storage.objects 
      for insert with check (
        (bucket_id = 'product-images' or bucket_id = 'site-assets')
        and exists (
          select 1 from public.site_admins 
          where email = auth.jwt()->>'email'
        )
      );
      
    create policy "Only admins can update storage" on storage.objects 
      for update using (
        (bucket_id = 'product-images' or bucket_id = 'site-assets')
        and exists (
          select 1 from public.site_admins 
          where email = auth.jwt()->>'email'
        )
      );
      
    create policy "Only admins can delete storage" on storage.objects 
      for delete using (
        (bucket_id = 'product-images' or bucket_id = 'site-assets')
        and exists (
          select 1 from public.site_admins 
          where email = auth.jwt()->>'email'
        )
      );
  `;
  
  try {
    const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gagal menjalankan SQL via rpc/exec_sql:", errText);
    } else {
      console.log("Sukses menerapkan kebijakan RLS via rpc/exec_sql!");
    }
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}

fixPolicies();
