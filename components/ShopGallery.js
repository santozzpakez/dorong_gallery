import Image from 'next/image'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'

export default function ShopGallery() {
  const { lang } = useLanguage()
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const translations = {
    id: {
      viewAll: 'Lihat Semua',
      available: 'Produk Tersedia',
      loading: 'Memuat galeri...'
    },
    en: {
      viewAll: 'View All',
      available: 'Products Available',
      loading: 'Loading gallery...'
    },
    jp: {
      viewAll: 'すべて見る',
      available: '点の商品',
      loading: 'ギャラリーを読み込み中...'
    },
    kr: {
      viewAll: '모두 보기',
      available: '개의 상품',
      loading: '갤러리를 불러오는 중...'
    },
    cn: {
      viewAll: '查看全部',
      available: '件商品',
      loading: '正在加载画廊...'
    }
  }

  const t = translations[lang] || translations.id

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setLoading(false)
      return
    }
    let cancelled = false
    // Ambil lebih banyak produk (misal 40) untuk galeri foto kecil
    supabase
      .from('products')
      .select('*')
      .limit(40)
      .then(({ data, error: qError }) => {
        if (cancelled) return
        if (qError) setError(qError.message)
        else {
          // Acak urutan produk (shuffling)
          const shuffled = (data || []).sort(() => Math.random() - 0.5)
          setProducts(shuffled)
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!hasSupabaseConfig) {
    return (
      <section className="max-w-6xl mx-auto px-6 py-12 border-t border-white/5">
        <h2 className="text-3xl font-black mb-2 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Produk dari Admin</h2>
        <p className="text-gray-500 text-sm">Supabase belum terkonfigurasi.</p>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-6 py-12 border-t border-white/5">
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      </section>
    )
  }

  if (error || products.length === 0) return null // Sembunyikan jika kosong/error agar tidak merusak layout

  return (
    <section className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
      {/* Tampilan Grid Foto Kecil (6 kolom di desktop agar lebih besar) */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {products.map((p) => (
          <Link key={p.id} href={`/product/${p.id}`} className="group relative aspect-square overflow-hidden rounded-md bg-black/20 border border-white/5 hover:border-purple-500/50 transition-all">
            {p.image_url ? (
              <Image 
                src={p.image_url} 
                alt={p.title} 
                fill
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" 
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-700">NA</div>
            )}
            
            {/* Hover Overlay Simple */}
            <div className="absolute inset-0 bg-purple-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[10px] font-bold text-white uppercase tracking-tighter">View</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Tombol Lihat Semua di bagian bawah */}
      <div className="flex justify-center mt-12">
        <Link 
          href="/katalog" 
          className="px-10 py-3 rounded-full bg-gradient-to-r from-[#6d0099] via-[#9d4edd] to-[#ff007f] text-white text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all"
        >
          {t.viewAll} &rarr;
        </Link>
      </div>
    </section>
  )
}
