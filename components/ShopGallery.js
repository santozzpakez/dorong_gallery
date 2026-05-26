import ProductImage from './ProductImage'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'

export default function ShopGallery() {
  const { lang } = useLanguage()
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [shuffledIds, setShuffledIds] = useState([])
  const pageSize = 18

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

  // Step 1: Ambil semua ID produk dan kocok saat mount
  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    supabase
      .from('products')
      .select('id')
      .then(({ data, error: qError }) => {
        if (cancelled) return
        if (qError) {
          setError(qError.message)
          setLoading(false)
        } else {
          const ids = (data || []).map(item => item.id)
          // Fisher-Yates Shuffle
          for (let i = ids.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [ids[i], ids[j]] = [ids[j], ids[i]];
          }
          setShuffledIds(ids)
          setTotalCount(ids.length)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Step 2: Ambil data produk detail hanya untuk halaman aktif
  useEffect(() => {
    if (shuffledIds.length === 0) return
    let cancelled = false
    setLoading(true)

    const from = (currentPage - 1) * pageSize
    const to = from + pageSize
    const idsToFetch = shuffledIds.slice(from, to)

    if (idsToFetch.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }

    supabase
      .from('products')
      .select('id, title, image_url')
      .in('id', idsToFetch)
      .then(({ data, error: qError }) => {
        if (cancelled) return
        if (qError) {
          setError(qError.message)
        } else {
          // Urutkan kembali sesuai dengan shuffledIds slice
          const orderedData = idsToFetch
            .map(id => (data || []).find(p => p.id === id))
            .filter(Boolean)
          setProducts(orderedData)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentPage, shuffledIds])

  if (!hasSupabaseConfig) {
    return (
      <section className="max-w-6xl mx-auto px-6 py-12 border-t border-zinc-200 dark:border-zinc-900">
        <h2 className="text-3xl font-black mb-2 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark font-serif">Produk dari Admin</h2>
        <p className="text-zinc-500 text-sm">Supabase belum terkonfigurasi.</p>
      </section>
    )
  }

  if (loading && products.length === 0) {
    return (
      <section className="max-w-6xl mx-auto px-6 py-12 border-t border-zinc-200 dark:border-zinc-900">
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
        </div>
      </section>
    )
  }

  if (error || products.length === 0) return null // Sembunyikan jika kosong/error agar tidak merusak layout

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <section id="gallery-section" className="max-w-6xl mx-auto px-6 py-20 border-t border-zinc-200 dark:border-zinc-900 scroll-mt-20">
      {/* Tampilan Grid Foto Kecil */}
      <div className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 transition-opacity duration-300 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        {products.map((p) => (
          <Link key={p.id} href={`/product/${p.id}`} className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-200/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-900 hover:border-accent/50 transition-all duration-300">
            {p.image_url ? (
              <ProductImage 
                src={p.image_url} 
                alt={p.title} 
                className="absolute inset-0 w-full h-full opacity-70 group-hover:opacity-95 group-hover:scale-105 transition-all duration-500" 
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

      {/* PAGINATION UI */}
      {totalPages > 1 && (
        <div className="mt-16 flex justify-center items-center gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => {
              setCurrentPage(p => Math.max(1, p - 1))
              document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-sm disabled:opacity-20 hover:bg-accent/10 hover:border-accent/30 transition-all font-serif text-zinc-800 dark:text-zinc-200"
          >
            &larr;
          </button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1
            if (totalPages > 7) {
              if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                if (Math.abs(pageNum - currentPage) === 2) return <span key={pageNum} className="opacity-30 px-1 text-zinc-500">...</span>
                return null
              }
            }

            return (
              <button
                key={pageNum}
                onClick={() => {
                  setCurrentPage(pageNum)
                  document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className={`w-10 h-10 rounded-full font-bold text-xs transition-all ${
                  currentPage === pageNum 
                  ? 'bg-gradient-to-r from-accent-light via-accent to-accent-alt text-black shadow-lg shadow-accent/20 font-black' 
                  : 'border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-accent/10 hover:border-accent/30'
                }`}
              >
                {pageNum}
              </button>
            )
          })}

          <button 
            disabled={currentPage === totalPages}
            onClick={() => {
              setCurrentPage(p => Math.min(totalPages, p + 1))
              document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-sm disabled:opacity-20 hover:bg-accent/10 hover:border-accent/30 transition-all font-serif text-zinc-800 dark:text-zinc-200"
          >
            &rarr;
          </button>
        </div>
      )}

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
