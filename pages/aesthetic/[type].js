import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { hasSupabaseConfig, supabase } from '../../lib/supabaseClient'
import ImageModal from '../../components/ImageModal'
import { useLanguage } from '../../context/LanguageContext'
import Image from 'next/image'

export default function AestheticTypePage() {
  const router = useRouter()
  const { lang } = useLanguage()
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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'aesthetic')
        .order('created_at', { ascending: false })

      if (error || !data) {
        setLoading(false)
        return
      }

      let resolvedName = ''
      const filteredProducts = []

      data.forEach(p => {
        if (p.subcategory) {
          const themeName = p.subcategory.trim()
          const tSlug = themeName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')

          if (tSlug === typeSlug) {
            resolvedName = themeName
            filteredProducts.push(p)
          }
        }
      })

      if (resolvedName) setTypeName(resolvedName)
      else setTypeName(typeSlug.replace(/-/g, ' ').toUpperCase())

      setProducts(filteredProducts)
      setLoading(false)
    }

    loadData()
  }, [typeSlug])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      <Header />
      <main className="flex-grow pt-28 max-w-6xl mx-auto px-4 pb-16 w-full">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-mono mb-6 flex-wrap">
          <Link href="/aesthetic" className="text-[#00f2fe] dark:text-neon-cyan hover:text-gray-900 dark:hover:text-white transition-colors">
            ← Aesthetic
          </Link>
          <span className="text-gray-500">/</span>
          <span className="text-gray-400">{typeName || '...'}</span>
        </div>

        {/* Header */}
        <h1 className="text-5xl font-black mt-2 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#4facfe] dark:from-neon-cyan dark:to-blue-500 dark:neon-text-cyan">
          {typeName || 'Loading...'}
        </h1>
        <p className="text-[#4facfe] dark:text-neon-cyan mt-3 mb-10 text-lg font-mono tracking-wide">
          {t.exclusiveCollection}
        </p>

        {/* Produk */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            {t.searching}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-xl border border-dashed border-gray-700">
            <p className="text-gray-400 mb-4">{t.empty}</p>
            <Link href="/admin" className="text-[#00f2fe] dark:text-neon-cyan text-sm hover:underline">
              {t.uploadViaAdmin}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6 font-mono">
              {lang === 'jp' || lang === 'kr' || lang === 'cn' ? `${products.length}${t.productsFound}` : `${products.length} ${t.productsFound}`}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`}>
                  <article className="rounded-2xl overflow-hidden glass border border-white/10 hover:border-neon-cyan/50 transition-all cursor-pointer group flex flex-col h-full shadow-lg">
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <div className="flex gap-2">
                          <span className="flex-1 bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-[10px] font-bold px-4 py-2 rounded-full text-center shadow-[0_0_15px_rgba(0,243,255,0.5)]">
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
                      <h2 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug">
                        {p.title}
                      </h2>
                      <div className="mt-auto pt-3">
                        <p className="text-sm text-cyan-500 dark:text-neon-cyan font-bold">
                          Rp {Number(p.price).toLocaleString('id-ID')}
                        </p>
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
