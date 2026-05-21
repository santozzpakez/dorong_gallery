import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
export const hasSupabaseConfig = Boolean(supabaseUrl) && Boolean(supabaseAnonKey)

// Singleton pattern: mencegah pembuatan koneksi Supabase baru setiap hot-reload.
// Tanpa ini, setiap HMR akan memanggil createClient() ulang, menumpuk koneksi
// yang tidak pernah ditutup, dan akhirnya semua query akan hang/stuck.
function getSupabaseClient() {
  if (!hasSupabaseConfig) return null

  if (process.env.NODE_ENV === 'development') {
    // Simpan di globalThis agar tetap hidup saat Next.js hot-reload
    if (!globalThis._supabaseClient) {
      globalThis._supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    }
    return globalThis._supabaseClient
  }

  // Production: buat instance baru (hanya dipanggil sekali)
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = getSupabaseClient()
