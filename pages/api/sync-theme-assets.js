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

    // Upsert into site_assets
    const { error: dbErr } = await supabaseAdmin
      .from('site_assets')
      .upsert(dbUpdates, { onConflict: 'key' })

    if (dbErr) {
      return res.status(500).json({ error: `Database upsert failed: ${dbErr.message}` })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Server DB Sync Error:', err)
    return res.status(500).json({ error: err.message })
  }
}
