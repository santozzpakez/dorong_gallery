import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { dbUpdates } = req.body

  if (!dbUpdates || !Array.isArray(dbUpdates)) {
    return res.status(400).json({ error: 'Missing or invalid dbUpdates parameter' })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'Supabase credentials are not configured on server' })
    }

    // Initialize Supabase Client with Service Role Key for full root admin bypass
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })

    // --- VERIFIKASI ADMIN ---
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Otorisasi gagal: Token otorisasi tidak ditemukan.' })
    }
    const token = authHeader.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'Otorisasi gagal: Format token tidak valid.' })
    }

    // Ambil informasi user berdasarkan token
    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !user) {
      console.error('[sync-theme-assets] Auth error:', userErr?.message)
      return res.status(401).json({ error: 'Otorisasi gagal: Sesi telah kedaluwarsa atau tidak valid.' })
    }

    // Cek apakah email user terdaftar di tabel site_admins
    const { data: adminData, error: adminErr } = await supabaseAdmin
      .from('site_admins')
      .select('role')
      .eq('email', user.email)
      .maybeSingle()

    if (adminErr || !adminData) {
      return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki hak akses admin.' })
    }

    // --- ENSURE text_value column exists ---
    // Jalankan ALTER TABLE untuk menambahkan kolom text_value jika belum ada
    // dan ubah image_url menjadi nullable agar upsert tidak gagal
    try {
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          ALTER TABLE public.site_assets ADD COLUMN IF NOT EXISTS text_value text;
          ALTER TABLE public.site_assets ALTER COLUMN image_url SET DEFAULT '';
          ALTER TABLE public.site_assets ALTER COLUMN image_url DROP NOT NULL;
        `
      })
    } catch (alterErr) {
      // Jika RPC exec_sql tidak tersedia, abaikan — kolom mungkin sudah ada
      console.warn('[sync-theme-assets] ALTER TABLE warning (non-fatal):', alterErr?.message)
    }

    // Pastikan setiap item memiliki image_url agar tidak melanggar constraint NOT NULL (fallback)
    const sanitizedUpdates = dbUpdates.map(item => ({
      ...item,
      image_url: item.image_url ?? ''
    }))

    // Upsert into site_assets
    const { data: upsertData, error: dbErr } = await supabaseAdmin
      .from('site_assets')
      .upsert(sanitizedUpdates, { onConflict: 'key' })
      .select()

    if (dbErr) {
      console.error('[sync-theme-assets] Database upsert failed:', dbErr)
      return res.status(500).json({ error: `Database upsert failed: ${dbErr.message}` })
    }

    console.log('[sync-theme-assets] Upsert successful:', sanitizedUpdates.map(u => u.key).join(', '))
    return res.status(200).json({ success: true, updated: sanitizedUpdates.length })
  } catch (err) {
    console.error('[sync-theme-assets] Server Error:', err)
    return res.status(500).json({ error: err.message })
  }
}
