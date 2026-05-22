import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { hasSupabaseConfig, supabase } from '../../lib/supabaseClient'
import ImageModal from '../../components/ImageModal'
import { useLanguage } from '../../context/LanguageContext'
import Image from 'next/image'
import { useSiteAssets } from '../../lib/siteAssets'
import { getPriceInfo } from '../../lib/priceHelper'

export default function AestheticTypePage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const { getText } = useSiteAssets()
  const { type: typeSlug } = router.query

  const [products, setProducts] = useState([])
  const [typeName, setTypeName] = useState('')
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState(null)

  const translations = {
    id: {
      back: 'Kembali ke Aesthetic',
      exclusiveCollection: 'Koleksi seni eksklusif dengan tema ini.',
      searching: 'Mencari karya seni...',
      empty: 'Belum ada karya seni yang tersedia untuk tema ini.',
      uploadViaAdmin: 'Upload via Admin Dashboard →',
      productsFound: 'karya ditemukan',
      viewDetail: 'Lihat Detail',
      noImage: 'No Image'
    },
    en: {
      back: 'Back to Aesthetic',
      exclusiveCollection: 'Exclusive art collection with this theme.',
      searching: 'Searching for artworks...',
      empty: 'No artworks available for this theme yet.',
      uploadViaAdmin: 'Upload via Admin Dashboard →',
      productsFound: 'artworks found',
      viewDetail: 'View Detail',
      noImage: 'No Image'
    }
  }

  const t = translations[lang] || translations.id

  useEffect(() => {
    if (!typeSlug || !hasSupabaseConfig || !supabase) {
      if (!typeSlug) return
      setLoading(false)
      return
    }

    async function loadData() {
      // 1. Dapatkan nama asli subkategori dari Admin Panel / localStorage
      const STORAGE_TYPES = 'dorong_admin_type_options'
      let resolvedName = ''
      try {
        const rawTypes = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_TYPES) : null
        if (rawTypes) {
          const parsed = JSON.parse(rawTypes)
          const aestheticThemes = parsed?.aesthetic || []
          const matched = aestheticThemes.find(theme => 
            theme.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') === typeSlug
          )
          if (matched) resolvedName = matched
        }
      } catch {}

      if (!resolvedName) {
        resolvedName = typeSlug.replace(/-/g, ' ').toUpperCase()
      }

      // 2. Ambil dari database dengan filter subcategory spesifik (10x lebih cepat!)
      let { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'aesthetic')
        .eq('subcategory', resolvedName)
        .order('created_at', { ascending: false })

      // Fallback: gunakan ilike jika tidak ada kecocokan eksak
      if ((!data || data.length === 0) && !error) {
        const fallbackRes = await supabase
          .from('products')
          .select('*')
          .eq('category', 'aesthetic')
          .ilike('subcategory', `%${resolvedName}%`)
          .order('created_at', { ascending: false })
        if (fallbackRes.data && fallbackRes.data.length > 0) {
          data = fallbackRes.data
        }
      }

      if (error || !data) {
        setLoading(false)
        return
      }

      const filteredProducts = []
      let finalTypeName = resolvedName

      data.forEach(p => {
        if (p.subcategory) {
          const themeName = p.subcategory.trim()
          const tSlug = themeName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')

          if (tSlug === typeSlug) {
            finalTypeName = themeName
            filteredProducts.push(p)
          }
        }
      })

      const displayProducts = filteredProducts.length > 0 ? filteredProducts : data

      setTypeName(finalTypeName)
      setProducts(displayProducts)
      setLoading(false)
    }

    loadData()
  }, [typeSlug])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      <Header />
      <main className="flex-grow pt-28 max-w-6xl mx-auto px-4 pb-16 w-full">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-sans mb-6 flex-wrap font-bold uppercase tracking-wider">
          <Link href="/aesthetic" className="text-accent/80 hover:text-accent transition-colors">
            &larr; Aesthetic
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-500">{typeName || '...'}</span>
        </div>

        {/* Header */}
        <h1 className="text-3xl md:text-4xl font-black mt-2 uppercase tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark font-serif">
          {typeName || 'Loading...'}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 mb-10 text-xs md:text-sm font-sans tracking-widest uppercase font-bold">
          {t.exclusiveCollection}
        </p>

        {/* Produk */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4"></div>
            {t.searching}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl bg-zinc-100 dark:bg-zinc-950/20">
            <p className="text-zinc-400 mb-4 font-bold">{t.empty}</p>
            <Link href="/admin" className="text-accent text-xs hover:underline uppercase font-black tracking-widest">
              {t.uploadViaAdmin}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-500 mb-6 font-sans uppercase font-bold tracking-wider">
              {lang === 'jp' || lang === 'kr' || lang === 'cn' ? `${products.length}${t.productsFound}` : `${products.length} ${t.productsFound}`}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`}>
                  <article className="rounded-2xl overflow-hidden glass border border-zinc-200/80 dark:border-zinc-850/40 hover:border-accent/60 hover:shadow-[0_15px_30px_rgb(var(--accent-main)/0.15)] transition-all cursor-pointer group flex flex-col h-full shadow-lg">
                    <div className="aspect-[3/4] bg-black/40 relative overflow-hidden">
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt={p.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-white/5 flex items-center justify-center text-xs text-gray-500">
                          {t.noImage}
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <div className="flex gap-2">
                          <span className="flex-1 bg-gradient-to-r from-accent-light via-accent to-accent-alt text-black text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full text-center shadow-[0_4px_15px_rgb(var(--accent-main)/0.2)]">
                            {t.viewDetail}
                          </span>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setPreviewImage({ url: p.image_url, title: p.title })
                            }}
                            className="w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 transition-all hover:scale-110"
                            title="Preview Gambar"
                          >
                            🔍
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-grow bg-black/20">
                      <h2 className="font-bold text-sm text-[var(--text-main)] group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                        {p.title}
                      </h2>
                      <div className="mt-auto pt-3">
                        {(() => {
                          const pInfoS = getPriceInfo(getText, 'F4')
                          return pInfoS.hasDiscount ? (
                            <p className="text-sm text-accent font-black font-sans uppercase tracking-widest flex items-center gap-1.5 flex-wrap">
                              <span className="line-through text-gray-500 text-xs normal-case">Rp {pInfoS.original.toLocaleString('id-ID')}</span>
                              <span>Rp {pInfoS.discount.toLocaleString('id-ID')}</span>
                            </p>
                          ) : (
                            <p className="text-sm text-accent font-black font-sans uppercase tracking-widest">
                              Rp {pInfoS.original.toLocaleString('id-ID')}
                            </p>
                          )
                        })()}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
      
      <ImageModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url}
        title={previewImage?.title}
      />
    </div>
  )
}
