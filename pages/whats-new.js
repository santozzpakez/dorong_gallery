import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useEffect, useState } from 'react'
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient'
import Link from 'next/link'
import ImageModal from '../components/ImageModal'
import ProductImage from '../components/ProductImage'
import { useLanguage } from '../context/LanguageContext'
import { useSiteAssets } from '../lib/siteAssets'

export default function WhatsNewPage() {
  const { lang } = useLanguage()
  const { getText } = useSiteAssets()
  const [groupedProducts, setGroupedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewImage, setPreviewImage] = useState(null)

  const translations = {
    id: {
      title: 'Koleksi Terbaru',
      subtitle: 'Pantau rilisan produk sublimation metal print terbaru dari Lumi Forge secara real-time.',
      loading: 'Menyelaraskan linimasa terbaru...',
      empty: 'Belum ada produk baru yang diunggah.',
      viewDetails: 'Lihat Detail Rilisan ✧',
      uploadedAt: 'Diunggah',
      series: 'Seri',
      member: 'Karakter / Member',
      productsCount: 'produk baru',
      totalItems: 'Total Koleksi',
      metaTitle: 'Rilisan Terbaru — LUMI FORGE'
    },
    en: {
      title: "What's New",
      subtitle: 'Track the latest premium sublimation metal print releases from Lumi Forge in real-time.',
      loading: 'Syncing the latest timeline...',
      empty: 'No new products uploaded yet.',
      viewDetails: 'View Release Details ✧',
      uploadedAt: 'Released',
      series: 'Series',
      member: 'Character / Member',
      productsCount: 'new products',
      totalItems: 'Total Collection',
      metaTitle: "What's New — LUMI FORGE"
    },
    jp: {
      title: '新着アイテム',
      subtitle: 'Lumi Forgeの最新プレミアム昇化メタルプリント製品をリアルタイムでチェック。',
      loading: 'タイムラインを同期中...',
      empty: '新しい商品はまだアップロードされていません。',
      viewDetails: 'リリースの詳細を見る ✧',
      uploadedAt: 'リリース日',
      series: 'シリーズ',
      member: 'キャラクター / メンバー',
      productsCount: '個の新規アイテム',
      totalItems: '全コレクション',
      metaTitle: '新着リリース — LUMI FORGE'
    },
    kr: {
      title: '신상품 안내',
      subtitle: 'Lumi Forge의 프리미엄 승화 메탈 프린트 신규 릴리스를 실시간으로 확인하세요.',
      loading: '최신 타임라인 동기화 중...',
      empty: '아직 업로드된 신상품이 없습니다.',
      viewDetails: '출시 상세 보기 ✧',
      uploadedAt: '출시일',
      series: '시리즈',
      member: '캐릭터 / 멤버',
      productsCount: '개의 신규 상품',
      totalItems: '총 컬렉션',
      metaTitle: '신상품 출시 — LUMI FORGE'
    },
    cn: {
      title: '最新发布',
      subtitle: '实时关注 Lumi Forge 独家打造的最新款高品质升华金属板装饰画。',
      loading: '正在同步最新发布时间线...',
      empty: '暂无最新发布的产品。',
      viewDetails: '查看发布详情 ✧',
      uploadedAt: '发布日期',
      series: '系列',
      member: '角色 / 成员',
      productsCount: '个新上架商品',
      totalItems: '总系列商品',
      metaTitle: '最新产品推荐 — LUMI FORGE'
    }
  }

  const t = translations[lang] || translations.id

  const getCollectionUrl = (p) => {
    const cat = (p.category || '').toLowerCase()
    if (!p.subcategory) return `/${cat}`

    const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    if (p.subcategory.includes(' - ')) {
      const parts = p.subcategory.split(' - ')
      const seriesSlug = toSlug(parts[0].trim())
      const charSlug = toSlug(parts[1].trim())
      
      if (cat === 'anime') return `/anime/${seriesSlug}/${charSlug}`
      if (cat === 'kpop' || cat === 'k-pop') return `/kpop/${seriesSlug}/${charSlug}`
      return `/${cat}/${seriesSlug}` // fallback
    }

    const subcatSlug = toSlug(p.subcategory.trim())
    return `/${cat}/${subcatSlug}`
  }

  useEffect(() => {
    fetchLatestProducts()
  }, [])

  const fetchLatestProducts = async () => {
    if (!hasSupabaseConfig || !supabase) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Ambil 100 produk terbaru untuk dikelompokkan secara efektif
      const { data: rawProducts, error: qError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (qError) throw qError

      if (rawProducts && rawProducts.length > 0) {
        // Kelompokkan produk berdasarkan Tanggal Hari (YYYY-MM-DD) dan Subkategori
        const groups = {}
        rawProducts.forEach(p => {
          // Ambil bagian tanggal YYYY-MM-DD
          const dateKey = p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
          const sub = p.subcategory || p.category || 'Other'
          const groupKey = `${dateKey}||${sub}`

          if (!groups[groupKey]) {
            groups[groupKey] = {
              dateKey,
              category: p.category,
              subcategory: p.subcategory,
              created_at: p.created_at,
              products: []
            }
          }
          groups[groupKey].products.push(p)
        })

        // Proses setiap kelompok: Ambil 1 produk secara acak sebagai cover/frame utama
        const processedGroups = Object.values(groups).map(g => {
          const randomIndex = Math.floor(Math.random() * g.products.length)
          const randomProduct = g.products[randomIndex]
          
          return {
            ...g,
            id: randomProduct.id,
            title: randomProduct.title,
            image_url: randomProduct.image_url,
            // Simpan daftar semua id produk dalam kelompok ini untuk referensi jika dibutuhkan
            allProductIds: g.products.map(p => p.id)
          }
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

        setGroupedProducts(processedGroups)
      } else {
        setGroupedProducts([])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr, langCode) => {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr

    const now = new Date()
    const diffTime = Math.abs(now - d)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // Perbandingan tanggal hari ini
    const isToday = d.getDate() === now.getDate() && 
                    d.getMonth() === now.getMonth() && 
                    d.getFullYear() === now.getFullYear()

    // Perbandingan tanggal kemarin
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const isYesterday = d.getDate() === yesterday.getDate() && 
                        d.getMonth() === yesterday.getMonth() && 
                        d.getFullYear() === yesterday.getFullYear()

    if (isToday) {
      if (langCode === 'id') return 'Baru Saja (Hari Ini)'
      if (langCode === 'jp') return '今日アップロード'
      if (langCode === 'kr') return '오늘 업로드됨'
      if (langCode === 'cn') return '今日刚刚发布'
      return 'Just Uploaded (Today)'
    } else if (isYesterday) {
      if (langCode === 'id') return 'Kemarin'
      if (langCode === 'jp') return '昨日'
      if (langCode === 'kr') return '어제'
      if (langCode === 'cn') return '昨天'
      return 'Yesterday'
    }

    const months = {
      id: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      jp: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      kr: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
      cn: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    }

    const mList = months[langCode] || months.id
    const day = d.getDate()
    const month = mList[d.getMonth()]
    const year = d.getFullYear()

    if (langCode === 'jp' || langCode === 'kr' || langCode === 'cn') {
      return `${year}年 ${month} ${day}日`
    }
    return `${day} ${month} ${year}`
  }

  const getCategoryColor = (category) => {
    const cat = (category || '').toLowerCase()
    if (cat === 'anime') return 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20'
    if (cat === 'kpop' || cat === 'k-pop') return 'border-pink-500/30 text-pink-600 dark:text-pink-400 bg-pink-50/50 dark:bg-pink-950/20'
    if (cat === 'aesthetic') return 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
    return 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/20'
  }

  return (
    <>
      <Head>
        <title>{t.metaTitle}</title>
        <meta name="description" content={t.subtitle} />
      </Head>
      
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] transition-colors duration-300">
        <Header />
        
        {/* Banner Utama */}
        <main className="pt-36 max-w-6xl mx-auto px-4 pb-24 relative">
          
          {/* Efek Cahaya Latar Belakang */}
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-60 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header Konten */}
          <div className="text-center mb-20 relative z-10">
            <span className="px-6 py-2 rounded-full border border-yellow-250/30 bg-gradient-to-r from-accent/20 to-accent-alt/20 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-accent mb-4 inline-flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
              <span className="animate-pulse">●</span> LIVE CHRONOLOGY FEED
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-widest text-zinc-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-b dark:from-white dark:via-zinc-200 dark:to-zinc-500 font-serif uppercase mt-4">
              {t.title}
            </h1>
            <p className="mt-4 text-xs md:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto font-sans leading-relaxed">
              {t.subtitle}
            </p>
            <div className="flex justify-center items-center gap-4 mt-8">
              <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-accent/40" />
              <span className="text-accent text-sm">✧</span>
              <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-accent/40" />
            </div>
          </div>

          {!hasSupabaseConfig && (
            <p className="text-gray-400 text-center py-20">Supabase belum dikonfigurasi (.env.local).</p>
          )}

          {loading && (
            <div className="flex flex-col justify-center items-center py-32 gap-4">
              <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
              <p className="text-xs uppercase tracking-widest text-zinc-500 font-black animate-pulse">{t.loading}</p>
            </div>
          )}

          {error && <p className="text-red-400 text-center py-20">⚠️ {error}</p>}

          {!loading && !error && groupedProducts.length === 0 && (
            <p className="text-zinc-500 text-center py-20 italic">{t.empty}</p>
          )}

          {!loading && !error && groupedProducts.length > 0 && (
            <div className="relative z-10 mt-12 max-w-4xl mx-auto">
              
              {/* Garis Linimasa Vertikal - Rapi & Sejajar Kiri */}
              <div className="absolute left-6 md:left-8 top-0 bottom-0 w-[2px] bg-gradient-to-b from-accent/50 via-zinc-200 dark:via-zinc-800 to-transparent -translate-x-1/2" />

              <div className="space-y-10 md:space-y-12">
                {groupedProducts.map((p, idx) => {
                  // Parse Subcategory dan Character/Member secara aman
                  let series = p.subcategory || p.category || ''
                  let character = ''
                  if (p.subcategory && p.subcategory.includes(' - ')) {
                    const parts = p.subcategory.split(' - ')
                    series = parts[0].trim()
                    character = parts[1].trim()
                  }

                  // Hitung total produk dalam kelompok hari ini
                  const totalProductsToday = p.products.length

                  return (
                    <div 
                      key={`${p.dateKey}-${p.subcategory}`} 
                      className="relative flex items-start"
                    >
                      {/* Simpul Linimasa (Glow Node) - Sejajar Kiri */}
                      <div className="absolute left-6 md:left-8 -translate-x-1/2 top-6 z-20 flex items-center justify-center">
                        <div className="absolute w-7 h-7 rounded-full bg-accent/20 animate-ping pointer-events-none" />
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#f4d068] via-accent to-[#8a5d19] border-4 border-[var(--bg)] shadow-[0_0_12px_rgba(212,175,55,0.9)]" />
                      </div>

                      {/* Card Konten Produk - Selalu di Kanan dengan Spacing Rapi */}
                      <div className="w-full pl-14 md:pl-20 pr-4">
                        <div className="group relative bg-white/80 dark:bg-[#0d0d11]/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-900/60 hover:border-accent/40 dark:hover:border-accent/40 rounded-3xl p-6 transition-all duration-500 ease-out hover:-translate-y-1.5 shadow-xl hover:shadow-[0_15px_40px_rgba(212,175,55,0.1)]">
                          
                          {/* Inner glowing hover sheet background */}
                          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl pointer-events-none" />

                          {/* Detail Tanggal Rilisan */}
                          <div className="flex items-center justify-between mb-4 flex-wrap gap-2 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-950 px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-900">
                              🕒 {t.uploadedAt} {formatDate(p.created_at, lang)}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md border ${getCategoryColor(p.category)}`}>
                              {p.category}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-6 items-start relative z-10">
                            {/* Gambar Produk Cover (Diacak dari isi produk sejenis pada hari ini) */}
                            <div className="w-full sm:w-32 aspect-[3/4] bg-zinc-100 dark:bg-black/40 rounded-2xl overflow-hidden relative border border-zinc-200 dark:border-white/5 shadow-inner flex-shrink-0">
                              {p.image_url ? (
                                <>
                                  <ProductImage 
                                    src={p.image_url} 
                                    alt={p.title} 
                                    className="absolute inset-0 w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" 
                                  />
                                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setPreviewImage({ url: p.image_url, title: p.title })
                                      }}
                                      className="w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 transition-all hover:scale-110 shadow-2xl"
                                      title={t.viewDetails}
                                    >
                                      🔍
                                    </button>
                                  </div>
                                </>
                              ) : null}
                            </div>

                            {/* Deskripsi & Keterangan Metadata */}
                            <div className="flex-1 min-w-0 w-full">
                              <h2 className="text-xl font-bold font-serif text-zinc-900 dark:text-white group-hover:text-accent transition-colors truncate">
                                {p.title}
                              </h2>

                              {/* Informasi Seri/Subkategori */}
                              <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 w-20">{t.series}</span>
                                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900/60 px-3 py-1 rounded border border-zinc-200 dark:border-zinc-800/80 truncate max-w-[160px] sm:max-w-none">
                                    {series}
                                  </span>
                                </div>

                                {/* Informasi Karakter */}
                                {character && (
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 w-20">{t.member}</span>
                                    <span className="text-xs font-bold text-accent bg-gradient-to-r from-accent/10 to-accent-alt/10 px-3 py-1 rounded border border-accent/20 truncate max-w-[160px] sm:max-w-none">
                                      {character}
                                    </span>
                                  </div>
                                )}

                                {/* Pemberitahuan Berapa Item Terupload Hari Ini */}
                                <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-900/60 flex items-center gap-2">
                                  <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                    📦 {character || series} : <strong className="text-accent text-sm font-black">{totalProductsToday}</strong> {t.productsCount}
                                  </span>
                                </div>
                              </div>

                              {/* Tombol Aksi */}
                              <div className="mt-6 flex justify-end">
                                <Link 
                                  href={getCollectionUrl(p)}
                                  className="text-[10px] font-black uppercase tracking-widest text-accent group-hover:text-white border border-accent/30 group-hover:border-accent bg-transparent group-hover:bg-gradient-to-r group-hover:from-accent-light group-hover:via-accent group-hover:to-accent-alt group-hover:text-black px-4 py-2 rounded-xl transition-all shadow-[0_2px_10px_rgba(212,175,55,0.05)] shadow-accent/5 group-hover:scale-[1.05]"
                                >
                                  {t.viewDetails}
                                </Link>
                              </div>

                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

            </div>
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
