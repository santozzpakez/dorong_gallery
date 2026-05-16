const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const envUrlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const envServiceKeyMatch = envFile.match(/SUPABASE_SERVICE_KEY=(.*)/);

const url = envUrlMatch ? envUrlMatch[1].trim() : '';
const serviceKey = envServiceKeyMatch ? envServiceKeyMatch[1].trim() : '';

async function fixPolicies() {
  const sql = `
    -- Enable RLS just in case
    alter table public.products enable row level security;
    
    -- Drop existing to be safe
    drop policy if exists "public read products" on public.products;
    drop policy if exists "public insert products" on public.products;
    
    -- Recreate table policies
    create policy "public read products" on public.products for select using (true);
    create policy "public insert products" on public.products for insert with check (true);

    -- STORAGE POLICIES
    drop policy if exists "anon read product images" on storage.objects;
    drop policy if exists "anon upload product images" on storage.objects;
    
    -- Give public access to the bucket
    create policy "anon read product images" on storage.objects for select using (bucket_id = 'product-images');
    create policy "anon upload product images" on storage.objects for insert with check (bucket_id = 'product-images');
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
       // fallback to management API query
       const projectRef = url.replace('https://', '').split('.')[0];
       const res2 = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
         method: 'POST',
         headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
         },
         body: JSON.stringify({ query: sql }),
       });
       if (!res2.ok) {
         console.log("Mgmt API failed:", await res2.text());
       } else {
         console.log("Fixed via Management API");
       }
    } else {
      console.log("Fixed via rpc/exec_sql");
    }
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}

fixPolicies();
