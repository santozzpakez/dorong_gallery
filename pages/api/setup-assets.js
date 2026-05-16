/**
 * API Route: /api/setup-assets
 * Membuat tabel site_assets di Supabase menggunakan service key (server-side saja).
 * Dipanggil otomatis dari halaman /admin/tema.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceKey || !supabaseUrl) {
    return res.status(500).json({ error: 'Missing SUPABASE_SERVICE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env.local' })
  }

  const sql = `
    create table if not exists public.site_assets (
      key text primary key,
      label text not null,
      category text not null default 'other',
      image_url text not null,
      updated_at timestamptz default now()
    );
    alter table public.site_assets enable row level security;
    do $$ begin
      if not exists (select 1 from pg_policies where tablename='site_assets' and policyname='public read site_assets') then
        create policy "public read site_assets" on public.site_assets for select using (true);
      end if;
      if not exists (select 1 from pg_policies where tablename='site_assets' and policyname='public insert site_assets') then
        create policy "public insert site_assets" on public.site_assets for insert with check (true);
      end if;
      if not exists (select 1 from pg_policies where tablename='site_assets' and policyname='public update site_assets') then
        create policy "public update site_assets" on public.site_assets for update using (true);
      end if;
    end $$;
  `

  try {
    // Gunakan Supabase REST endpoint untuk execute SQL via service key
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
    })

    if (!response.ok) {
      // Coba endpoint alternatif: PostgreSQL direct via Supabase
      const projectRef = supabaseUrl.replace('https://', '').split('.')[0]
      const mgmtResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      })

      if (!mgmtResponse.ok) {
        const errText = await mgmtResponse.text()
        return res.status(500).json({ error: `Both endpoints failed. Management API: ${errText}` })
      }

      const data = await mgmtResponse.json()
      return res.status(200).json({ success: true, source: 'management-api', data })
    }

    return res.status(200).json({ success: true, source: 'rpc' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
