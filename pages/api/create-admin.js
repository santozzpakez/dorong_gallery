import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { email, password, role } = req.body

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' })
  }

  // Gunakan Service Role Key untuk melewati RLS dan membuat user tanpa login ke sesi klien
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  try {
    // 1. Buat user di auth.users Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Langsung dikonfirmasi
    })

    if (authError) {
      // Jika error karena sudah ada (misalnya user pernah login via Google)
      if (authError.message.includes('already registered')) {
        // Lanjutkan saja untuk memasukkan ke site_admins
        // Tapi perbarui passwordnya jika memungkinkan?
        // Admin update user password:
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        if (!listError) {
          const user = existingUsers.users.find(u => u.email === email)
          if (user) {
            await supabaseAdmin.auth.admin.updateUserById(user.id, { password: password })
          }
        }
      } else {
        return res.status(400).json({ error: authError.message })
      }
    }

    // 2. Tambahkan ke tabel site_admins
    const { error: dbError } = await supabaseAdmin
      .from('site_admins')
      .upsert({ email: email, role: role }, { onConflict: 'email' })

    if (dbError) {
      return res.status(400).json({ error: dbError.message })
    }

    return res.status(200).json({ message: 'Admin created successfully' })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
