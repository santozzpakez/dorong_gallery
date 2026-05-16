import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useEffect, useState } from 'react'
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient'
import Link from 'next/link'
import ImageModal from '../components/ImageModal'
import { useLanguage } from '../context/LanguageContext'

export default function KatalogPage() {
  const { lang } = useLanguage()
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState(null)
  
  // PAGINATION & RANDOM STATE
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [shuffledIds, setShuffledIds] = useState([]) // Menyimpan urutan ID yang sudah dikocok
  const pageSize = 24 

  const translations = {
    id: {
      loading: 'Memuat katalog...',
      empty: 'Belum ada produk untuk ditampilkan.',
      view: '🔍 Preview Gambar',
      back: 'Kembali ke Home'
    },
    en: {
      loading: 'Loading catalog...',
      empty: 'No products to display.',
      view: '🔍 Preview Image',
      back: 'Back to Home'
    },
    jp: {
      loading: 'カタログを読み込み中...',
      empty: '表示する製品はありません。',
      view: '🔍 画像プレビュー',
      back: 'ホームに戻る'
    },
    kr: {
      loading: '카탈로그를 불러오는 중...',
      empty: '표시할 제품이 없습니다.',
      view: '🔍 이미지 미리보기',
      back: '홈으로 돌아가기'
    },
    cn: {
      loading: '正在加载目录...',
      empty: '暂无产品显示。',
      view: '🔍 预览图片',
      back: '返回首页'
    }
  }

  const t = translations[lang] || translations.id

  // STEP 1: Saat pertama kali load, ambil semua ID dan kocok
  useEffect(() => {
    initCatalog()
  }, [])

  // STEP 2: Setiap kali halaman berubah atau urutan ID siap, ambil data lengkapnya
  useEffect(() => {
    if (shuffledIds.length > 0) {
      fetchPageData()
    }
  }, [currentPage, shuffledIds])

  const initCatalog = async () => {
    if (!hasSupabaseConfig || !supabase) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Ambil hanya ID dari semua produk (sangat ringan)
      const { data, error: qError } = await supabase
        .from('products')
        .select('id')

      if (qError) throw qError
      
      const ids = data.map(item => item.id)
      // Kocok ID secara acak (Fisher-Yates Shuffle)
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }

      setShuffledIds(ids)
      setTotalCount(ids.length)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const fetchPageData = async () => {
    const from = (currentPage - 1) * pageSize
    const to = from + pageSize
    const idsToFetch = shuffledIds.slice(from, to)

    if (idsToFetch.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Ambil data lengkap HANYA untuk ID yang ada di halaman ini
      const { data, error: qError } = await supabase
        .from('products')
        .select('*')
        .in('id', idsToFetch)

      if (qError) throw qError

      // Susun kembali data agar urutannya sesuai dengan shuffledIds (karena .in mengembalikan urutan acak dari DB)
      const orderedData = idsToFetch.map(id => data.find(p => p.id === id)).filter(Boolean)
      
      setProducts(orderedData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <>
      <Head>
        <title>Katalog — Dorong Gallery</title>
        <meta name="description" content="Katalog produk dari admin" />
      </Head>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] transition-colors duration-300">
        <Header />
        <main className="pt-28 max-w-6xl mx-auto px-4 pb-16">
          {/* Judul dan deskripsi dihapus agar hanya fokus ke gambar produk */}

          {!hasSupabaseConfig && <p className="text-gray-400">Supabase belum dikonfigurasi (.env.local).</p>}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
          )}
          {error && <p className="text-red-300">{error}</p>}

          {!loading && !error && products.length === 0 && (
            <p className="text-gray-400 text-center py-20">{t.empty}</p>
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => (
                  <Link key={p.id} href={`/product/${p.id}`} className="group block">
                    <article className="rounded-xl overflow-hidden glass border border-white/10 group-hover:border-purple-500/50 transition-all shadow-lg hover:shadow-purple-500/20">
                      <div className="aspect-[3/4] bg-black/40 relative overflow-hidden">
                        {p.image_url ? (
                          <>
                            <img src={p.image_url} alt={p.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                            {/* Preview Trigger Overlay */}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setPreviewImage({ url: p.image_url, title: p.title })
                                }}
                                className="w-12 h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 transition-all hover:scale-110 shadow-2xl"
                                title={t.view}
                              >
                                🔍
                              </button>
                            </div>
                          </>
                        ) : null}
                      </div>
                      <div className="p-3">
                        <h2 className="font-semibold text-sm group-hover:text-purple-400 transition-colors">{p.title}</h2>
                        <p className="text-xs text-gray-500 mt-1">
                          {p.category}
                          {p.subcategory && p.subcategory !== p.category ? ` · ${p.subcategory}` : ''}
                        </p>
                        <p className="text-sm mt-2 font-bold text-pink-400">Rp {Number(p.price).toLocaleString('id-ID')}</p>
                      </div>
                    </article>
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
                      window.scrollTo(0,0)
                    }}
                    className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-sm disabled:opacity-30 hover:bg-white/5 transition-all"
                  >
                    &larr;
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1
                    // Logic untuk membatasi jumlah tombol angka jika terlalu banyak
                    if (totalPages > 7) {
                      if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                        if (Math.abs(pageNum - currentPage) === 2) return <span key={pageNum} className="opacity-30">...</span>
                        return null
                      }
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum)
                          window.scrollTo(0,0)
                        }}
                        className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                          currentPage === pageNum 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                          : 'border border-white/10 hover:bg-white/5'
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
                      window.scrollTo(0,0)
                    }}
                    className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-sm disabled:opacity-30 hover:bg-white/5 transition-all"
                  >
                    &rarr;
                  </button>
                </div>
              )}
            </>
          )}
        </main>
        <Footer />
      </div>

      <ImageModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url}
        title={previewImage?.title}
      />
    </>
  )
}
