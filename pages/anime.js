import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Link from 'next/link'
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient'
import { useSiteAssets } from '../lib/siteAssets'
import { useLanguage } from '../context/LanguageContext'

export default function Anime() {
  const { lang } = useLanguage()
  const { assets, getUrl, getText, loaded } = useSiteAssets()
  const [seriesList, setSeriesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(0)
  const [showAllModal, setShowAllModal] = useState(false)
  const [searchAll, setSearchAll] = useState('')

  const translations = {
    id: {
      title: 'Koleksi Anime',
      desc: 'Pilih series anime dulu, lalu pilih character favoritmu.',
      bundle: 'Paket Bundle',
      all: 'Semua Anime',
      loading: 'Memuat series...',
      empty: 'Belum ada produk Anime di database. Tambahkan lewat Admin Dashboard!',
      viewCollection: 'Lihat Koleksi',
      allTitle: 'Semua Anime',
      searchPlaceholder: 'Cari series anime...',
      characters: 'Karakter',
      notFound: 'Series tidak ditemukan...'
    },
    en: {
      title: 'Anime Collection',
      desc: 'Select your favorite anime series first, then choose your character.',
      bundle: 'Bundle Pack',
      all: 'All Anime',
      loading: 'Loading series...',
      empty: 'No Anime products in database. Add them via Admin Dashboard!',
      viewCollection: 'View Collection',
      allTitle: 'All Anime',
      searchPlaceholder: 'Search anime series...',
      characters: 'Characters',
      notFound: 'Series not found...'
    },
    jp: {
      title: 'アニメコレクション',
      desc: 'お気に入りのアニメシリーズを選んで、キャラクターを選択してください。',
      bundle: 'バンドルパック',
      all: 'すべてのアニメ',
      loading: 'シリーズを読み込み中...',
      empty: 'データベースにアニメ製品がありません。管理ダッシュボードから追加してください！',
      viewCollection: 'コレクションを見る',
      allTitle: 'すべてのアニメ',
      searchPlaceholder: 'アニメシリーズを検索...',
      characters: 'キャラクター',
      notFound: 'シリーズが見つかりません...'
    },
    kr: {
      title: '애니메이션 컬렉션',
      desc: '먼저 좋아하는 애니메이션 시리즈를 선택한 다음 캐릭터를 선택하세요.',
      bundle: '번들 팩',
      all: '모든 애니메이션',
      loading: '시리즈를 불러오는 중...',
      empty: '데이터베이스에 애니메이션 제품이 없습니다. 관리 대시보드에서 추가하세요!',
      viewCollection: '컬렉션 보기',
      allTitle: '모든 애니메이션',
      searchPlaceholder: '애니메이션 시리즈 검색...',
      characters: '캐릭터',
      notFound: '시리즈를 찾을 수 없습니다...'
    },
    cn: {
      title: '动漫收藏',
      desc: '先选择你喜欢的动漫系列，然后选择你的角色。',
      bundle: '捆绑包',
      all: '所有动漫',
      loading: '正在加载系列...',
      empty: '数据库中没有动漫产品。请通过管理仪表板添加！',
      viewCollection: '查看收藏',
      allTitle: '所有动漫',
      searchPlaceholder: '搜索动漫系列...',
      characters: '个角色',
      notFound: '未找到系列...'
    }
  }

  const t = translations[lang] || translations.id

  useEffect(() => {
    async function loadSeries() {
      if (!loaded) return // Tunggu Site Assets (Cache) siap

      // ── 1. Ambil dari Cache Global (SUPER CEPAT) ──
      const globalOptionsRaw = getText('global-category-options')
      const globalCharsRaw = getText('global-character-options')
      
      let categories = []
      let charsByType = {}
      
      try {
        if (globalOptionsRaw) {
          const parsed = JSON.parse(globalOptionsRaw)
          categories = Array.isArray(parsed?.anime) ? parsed.anime : []
        }
        if (globalCharsRaw) {
          charsByType = JSON.parse(globalCharsRaw)
        }
      } catch (err) {
        console.warn('Gagal membaca cache kategori:', err)
      }

      // Fallback ke localStorage jika cache global kosong (untuk admin di browser yang sama)
      if (categories.length === 0) {
        try {
          const raw = typeof window !== 'undefined' ? window.localStorage.getItem('dorong_admin_type_options') : null
          if (raw) categories = JSON.parse(raw)?.anime || []
        } catch {}
      }

      // ── 2. Buat map dan hitung karakter ──
      const seriesMap = new Map()
      const normalize = (name) => {
        if (!name) return ''
        const clean = name.replace(/^cover\s*[—\-]?\s*/i, '').trim()
        return clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      }

      categories.forEach(name => {
        const norm = normalize(name)
        if (norm) {
          // Ambil karakter dari cache global
          const chars = charsByType?.anime?.[norm] || []
          seriesMap.set(norm, new Set(chars))
        }
      })

      // ── 3. Jalur Darurat: Scan Produk (Hanya jika cache & local kosong) ──
      if (seriesMap.size === 0 && hasSupabaseConfig && supabase) {
        const { data } = await supabase.from('products').select('subcategory').eq('category', 'anime')
        if (data) {
          data.forEach(item => {
            if (item.subcategory && item.subcategory.includes(' - ')) {
              const parts = item.subcategory.split(' - ')
              const series = normalize(parts[0].trim())
              const char = parts[1].trim()
              if (series) {
                if (!seriesMap.has(series)) seriesMap.set(series, new Set())
                seriesMap.get(series).add(char)
              }
            }
          })
        }
      }

      // ── 4. Format & sort A–Z ──
      const formatted = Array.from(seriesMap.keys()).map(series => {
        const slug = series.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        return {
          name: series,
          slug: slug,
          charCount: seriesMap.get(series).size
        }
      })
      formatted.sort((a, b) => a.name.localeCompare(b.name))

      // ── 5. Resolusi Layout Sidebar (Featured 10) ──
      const sidebarSlugs = []
      for (let i = 1; i <= 10; i++) {
        const s = getText(`anime-sidebar-slot-${i}`)
        if (s) sidebarSlugs.push(s)
      }

      if (sidebarSlugs.length > 0) {
        // Gunakan urutan dari Admin Layout
        const featured = sidebarSlugs.map(slug => formatted.find(x => x.slug === slug)).filter(Boolean)
        // Jika ada slot kosong tapi user mau 10, kita bisa tambahkan fallback atau biarkan kosong sesuai pilihan
        setSeriesList(featured)
      } else {
        // Fallback: ambil 10 pertama alfabet jika belum diatur sama sekali di admin
        setSeriesList(formatted.slice(0, 10))
      }

      setLoading(false)
    }

    loadSeries()
  }, [loaded])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      <Header />
      <main className="flex-grow pt-32 max-w-6xl mx-auto px-4 w-full pb-16">
        <h1 className="text-3xl font-black mb-1 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#9d4edd] to-[#00b4d8] dark:from-neon-purple dark:to-neon-cyan dark:neon-text-purple">{t.title}</h1>
        <p className="text-[#00b4d8] dark:text-neon-cyan mb-8 text-sm font-mono tracking-wide">{t.desc}</p>

        <div className="flex justify-end gap-3 mb-4">
          <button className="px-4 py-1.5 rounded-lg glass border border-[#9d4edd]/30 text-[#9d4edd] dark:text-neon-purple hover:bg-[#9d4edd] hover:text-white dark:hover:bg-neon-purple dark:hover:text-black transition-all font-bold tracking-wide text-[10px] uppercase">
            {t.bundle}
          </button>
          <button 
            onClick={() => setShowAllModal(true)}
            className="px-4 py-1.5 rounded-lg glass border border-[#00b4d8]/30 text-[#00b4d8] dark:text-neon-cyan hover:bg-[#00b4d8] hover:text-white dark:hover:bg-neon-cyan dark:hover:text-black transition-all font-bold tracking-wide text-[10px] uppercase"
          >
            {t.all}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            {t.loading}
          </div>
        ) : seriesList.length === 0 ? (
          <div className="text-center py-20 text-gray-500 border border-dashed border-gray-700 rounded-xl bg-white/5">
            {t.empty}
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              {/* Left Column (Max 5 items) */}
              <div className="w-full md:w-[15%] space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                {seriesList.slice(0, 5).map((series, i) => {
                  const coverKey = `anime-cover-${series.slug}`
                  const displayImage = assets[coverKey] || getUrl(coverKey) || ''
                  const isActive = active === i
                  
                  return (
                    <Link 
                      href={`/anime/${series.slug}`}
                      key={series.slug} 
                      onMouseEnter={() => setActive(i)} 
                      className={`block cursor-pointer rounded-lg overflow-hidden transition-all duration-300 min-w-[100px] md:min-w-0 flex-1 ${isActive ? 'ring-2 ring-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.4)] scale-105 opacity-100' : 'opacity-60 hover:opacity-100'}`}
                    >
                      <div className="h-16 md:h-20 bg-slate-300 dark:bg-gray-800 border border-gray-200 dark:border-white/5 shadow-sm relative">
                        {displayImage ? (
                          <img src={displayImage} className="w-full h-full object-cover" alt={series.name} loading="lazy" decoding="async" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#9d4edd]/20 to-[#00b4d8]/20" />
                        )}
                        <div className="absolute inset-0 bg-white/20 dark:bg-black/60 flex items-center justify-center p-1 text-center group-hover:bg-white/5 dark:group-hover:bg-black/20 transition-all">
                          <span className="text-slate-900 dark:text-white text-[9px] md:text-[10px] font-black uppercase tracking-tighter drop-shadow-sm leading-tight">
                            {getText(`anime-cover-${series.slug}`) || series.name}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Center Column (Large Preview) */}
              <div className="w-full md:w-[70%] flex">
                {seriesList[active] && (() => {
                  const activeSeries = seriesList[active]
                  const coverKey = `anime-cover-${activeSeries.slug}`
                  const displayImage = assets[coverKey] || getUrl(coverKey) || ''
                  
                  return (
                    <Link href={`/anime/${activeSeries.slug}`} className="block group w-full h-full">
                      <div className="rounded-2xl overflow-hidden glass border border-[#00b4d8]/20 dark:border-neon-cyan/20 cinematic-glow-cyan relative flex items-center justify-center bg-black h-full min-h-[300px]">
                        <div className="absolute inset-0 w-full h-full">
                          {displayImage ? (
                            <img 
                              key={displayImage}
                              src={displayImage} 
                              alt={activeSeries.name} 
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 transform-gpu"
                              loading="eager"
                              decoding="async"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#9d4edd]/20 via-black to-[#00b4d8]/20 group-hover:scale-110 transition-transform duration-700 z-0"></div>
                          )}
                        </div>
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6 z-10 pointer-events-none">
                          <div className="mb-2">
                             <span className="px-2 py-0.5 bg-neon-cyan text-black text-[9px] font-black uppercase tracking-widest rounded">Featured Selection</span>
                          </div>
                          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
                            {getText(`anime-cover-${activeSeries.slug}`) || activeSeries.name}
                          </h2>
                          <div className="mt-4 flex gap-4">
                            <span className="px-6 py-2 rounded-full bg-neon-cyan text-black font-black text-xs uppercase tracking-widest hover:scale-110 transition-all shadow-[0_0_20px_rgba(0,243,255,0.4)]">{t.viewCollection} &rarr;</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })()}
              </div>

              {/* Right Column (Max 5 items) */}
              <div className="w-full md:w-[15%] space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                {seriesList.slice(5, 10).map((series, idx) => {
                  const i = idx + 5
                  const coverKey = `anime-cover-${series.slug}`
                  const displayImage = assets[coverKey] || getUrl(coverKey) || ''
                  const isActive = active === i
                  
                  return (
                    <Link 
                      href={`/anime/${series.slug}`}
                      key={series.slug} 
                      onMouseEnter={() => setActive(i)} 
                      className={`block cursor-pointer rounded-lg overflow-hidden transition-all duration-300 min-w-[100px] md:min-w-0 flex-1 ${isActive ? 'ring-2 ring-neon-purple shadow-[0_0_10px_rgba(176,38,255,0.4)] scale-105 opacity-100' : 'opacity-60 hover:opacity-100'}`}
                    >
                      <div className="h-16 md:h-20 bg-slate-300 dark:bg-gray-800 border border-gray-200 dark:border-white/5 shadow-sm relative">
                        {displayImage ? (
                          <img src={displayImage} className="w-full h-full object-cover" alt={series.name} loading="lazy" decoding="async" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#9d4edd]/20 to-[#00b4d8]/20" />
                        )}
                        <div className="absolute inset-0 bg-white/20 dark:bg-black/60 flex items-center justify-center p-1 text-center group-hover:bg-white/5 dark:group-hover:bg-black/20 transition-all">
                          <span className="text-slate-900 dark:text-white text-[9px] md:text-[10px] font-black uppercase tracking-tighter drop-shadow-sm leading-tight">
                            {getText(`anime-cover-${series.slug}`) || series.name}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* All Categories Modal Overlay */}
            {showAllModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-[var(--bg)] border border-[#00b4d8]/30 dark:border-neon-cyan/50 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col cinematic-glow-cyan overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-gray-200 dark:border-white/10 bg-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-black uppercase tracking-widest text-[#00b4d8] dark:text-neon-cyan">{t.allTitle}</h2>
                      <button onClick={() => { setShowAllModal(false); setSearchAll(''); }} className="text-gray-500 hover:text-red-500 transition-colors text-2xl font-bold">&times;</button>
                    </div>
                    {/* Search Bar */}
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder={t.searchPlaceholder}
                        value={searchAll}
                        onChange={(e) => setSearchAll(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-neon-cyan focus:outline-none transition-all pl-10"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">🔍</span>
                    </div>
                  </div>
                  
                  <div className="p-2 overflow-y-auto custom-scrollbar flex-grow bg-black/20">
                    {seriesList
                      .filter(s => s.name.toLowerCase().includes(searchAll.toLowerCase()))
                      .map((series) => (
                      <Link 
                        key={series.slug} 
                        href={`/anime/${series.slug}`}
                        className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group mb-1"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan font-bold text-xs uppercase">
                            {series.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-[#00b4d8] dark:group-hover:text-neon-cyan transition-colors">{series.name}</h3>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{series.charCount} {t.characters}</p>
                          </div>
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-neon-cyan text-sm">→</span>
                      </Link>
                    ))}
                    {seriesList.filter(s => s.name.toLowerCase().includes(searchAll.toLowerCase())).length === 0 && (
                      <div className="text-center py-10 text-gray-500 text-sm italic">{t.notFound}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
