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
      .select('id, title, image_url')
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
      <section className="max-w-6xl mx-auto px-6 py-12 border-t border-zinc-200 dark:border-zinc-900">
        <h2 className="text-3xl font-black mb-2 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark font-serif">Produk dari Admin</h2>
        <p className="text-zinc-500 text-sm">Supabase belum terkonfigurasi.</p>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-6 py-12 border-t border-zinc-200 dark:border-zinc-900">
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
        </div>
      </section>
    )
  }

  if (error || products.length === 0) return null // Sembunyikan jika kosong/error agar tidak merusak layout

  return (
    <section className="max-w-6xl mx-auto px-6 py-20 border-t border-zinc-200 dark:border-zinc-900">
      {/* Tampilan Grid Foto Kecil */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {products.map((p) => (
          <Link key={p.id} href={`/product/${p.id}`} className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-200/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-900 hover:border-accent/50 transition-all duration-300">
            {p.image_url ? (
              <Image 
                src={p.image_url} 
                alt={p.title} 
                fill
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                className="object-cover opacity-70 group-hover:opacity-95 group-hover:scale-105 transition-all duration-500" 
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-500 dark:text-zinc-700">NA</div>
            )}
            
            {/* Hover Overlay Simple */}
            <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
              <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em] font-sans">View</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Tombol Lihat Semua di bagian bawah */}
      <div className="flex justify-center mt-12">
        <Link 
          href="/katalog" 
          className="px-10 py-3 rounded-full bg-gradient-to-r from-accent-light via-accent to-accent-alt text-black text-xs font-black uppercase tracking-[0.2em] shadow-md shadow-accent/10 hover:scale-105 active:scale-95 transition-all"
        >
          {t.viewAll} &rarr;
        </Link>
      </div>
    </section>
  )
}
