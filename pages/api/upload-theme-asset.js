import { createClient } from '@supabase/supabase-js'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Support large files
    },
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { filePath, base64Data, contentType } = req.body

  if (!filePath || !base64Data) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'Supabase credentials are not configured on server' })
    }

    // Initialize Supabase Client with Service Role Key for full root admin access
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

    // Convert Base64 back to raw Buffer
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload directly to product-images bucket
    const { error: upErr } = await supabaseAdmin.storage
      .from('product-images')
      .upload(filePath, buffer, {
        upsert: true,
        contentType: contentType || 'application/octet-stream',
        cacheControl: '31536000'
      })

    if (upErr) {
      return res.status(500).json({ error: `Storage upload failed: ${upErr.message}` })
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return res.status(200).json({ publicUrl })
  } catch (err) {
    console.error('Server Upload Error:', err)
    return res.status(500).json({ error: err.message })
  }
}
