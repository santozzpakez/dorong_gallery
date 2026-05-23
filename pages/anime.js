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
  const [allSeries, setAllSeries] = useState([])
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

      const normalize = (name) => {
        if (!name) return ''
        const clean = name.replace(/^cover\s*[—\-]?\s*/i, '').trim()
        return clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      }

      const seriesMap = new Map()

      // ── 1. Ambil dari Cache Global ──
      try {
        const globalOptionsRaw = getText('global-category-options')
        const globalCharsRaw = getText('global-character-options')
        let charsByType = {}
        
        if (globalOptionsRaw) {
          const parsed = JSON.parse(globalOptionsRaw)
          const categories = Array.isArray(parsed?.anime) ? parsed.anime : []
          if (globalCharsRaw) charsByType = JSON.parse(globalCharsRaw)
          
          categories.forEach(name => {
            const norm = normalize(name)
            if (norm) {
              const chars = charsByType?.anime?.[norm] || []
              seriesMap.set(norm, new Set(chars))
            }
          })
        }
      } catch (err) {
        console.warn('Gagal membaca cache kategori:', err)
      }

      // ── 2. Fallback localStorage ──
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem('dorong_admin_type_options') : null
        if (raw) {
          const categories = JSON.parse(raw)?.anime || []
          categories.forEach(name => {
            const norm = normalize(name)
            if (norm && !seriesMap.has(norm)) {
              seriesMap.set(norm, new Set())
            }
          })
        }
      } catch {}

      // ── 3. SELALU Scan Produk dari Database (agar produk baru langsung muncul) ──
      if (hasSupabaseConfig && supabase) {
        try {
          const { data: pData } = await supabase.from('products').select('subcategory').eq('category', 'anime')
          if (pData) {
            pData.forEach(item => {
              if (item.subcategory) {
                const parts = item.subcategory.split(' - ')
                const series = normalize(parts[0].trim())
                const char = parts[1]?.trim() || ''
                if (series) {
                  if (!seriesMap.has(series)) seriesMap.set(series, new Set())
                  if (char) seriesMap.get(series).add(char)
                }
              }
            })
          }
          
          // Juga scan Site Assets untuk cover images
          const { data: aData } = await supabase.from('site_assets').select('key, label').like('key', 'anime-cover-%')
          if (aData) {
            aData.forEach(asset => {
              const key = asset.key
              if (key.includes('sidebar') || key.includes('slot')) return
              const rawName = asset.label || key.replace('anime-cover-', '').replace(/-/g, ' ')
              const series = normalize(rawName)
              if (series && !seriesMap.has(series)) {
                seriesMap.set(series, new Set())
              }
            })
          }
        } catch (err) {
          console.error('Gagal scan database:', err)
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

      // Simpan SEMUA anime untuk modal "Semua Anime"
      setAllSeries(formatted)

      // ── 5. Resolusi Layout Sidebar (Featured 10) ──
      const sidebarSlugs = []
      for (let i = 1; i <= 10; i++) {
        const s = getText(`anime-sidebar-slot-${i}`)
        if (s) sidebarSlugs.push(s)
      }

      // Ambil yang sudah dikonfigurasi di sidebar
      const featured = sidebarSlugs.map(slug => formatted.find(x => x.slug === slug)).filter(Boolean)
      
      // Auto-fill sisa slot dari database (agar panel tidak kosong)
      const usedSlugs = new Set(featured.map(f => f.slug))
      const remaining = formatted.filter(x => !usedSlugs.has(x.slug))
      const finalList = [...featured, ...remaining].slice(0, 10)
      
      setSeriesList(finalList)

      setLoading(false)
    }

    loadSeries()
  }, [loaded])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      <Header />
      <main className="flex-grow pt-32 max-w-6xl mx-auto px-4 w-full pb-16">
        
        {/* Banner Box - Premium Brushed Metal style */}
        <div className="mb-8 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-zinc-800 via-zinc-950 to-black text-white shadow-[0_15px_35px_rgba(0,0,0,0.7)] relative overflow-hidden border border-zinc-850">
          {/* Accent golden blur spot */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-accent/3 rounded-full filter blur-[80px] pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark dark:from-zinc-200 dark:via-zinc-400 dark:to-zinc-600 font-serif">
              {t.title}
            </h1>
            <p className="text-zinc-400 mt-2 text-xs md:text-sm font-sans tracking-widest uppercase font-bold">
              {t.desc}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mb-6">
          <button className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/60 text-zinc-500 dark:text-zinc-400 hover:text-accent hover:border-accent/60 hover:bg-accent/5 transition-all font-black tracking-widest text-[9px] uppercase font-sans">
            {t.bundle}
          </button>
          <button 
            onClick={() => setShowAllModal(true)}
            className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/60 text-zinc-500 dark:text-zinc-400 hover:text-accent hover:border-accent/60 hover:bg-accent/5 transition-all font-black tracking-widest text-[9px] uppercase font-sans"
          >
            {t.all}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4"></div>
            {t.loading}
          </div>
        ) : seriesList.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-100 dark:bg-zinc-950/20">
            {t.empty}
          </div>
        ) : (
          <>
            {/* Charcoal Premium Container */}
            <div className="p-4 md:p-8 rounded-3xl bg-zinc-950/5 dark:bg-zinc-950/30 border border-zinc-200/50 dark:border-zinc-900 shadow-[0_15px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-md">
              <div className="flex flex-col md:flex-row gap-6 items-stretch">
                
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
                        className={`block group cursor-pointer rounded-lg overflow-hidden transition-all duration-300 min-w-[100px] md:min-w-0 flex-1 ${isActive ? 'ring-2 ring-accent shadow-[0_4px_15px_rgba(212,175,55,0.3)] scale-105 relative z-10' : 'hover:scale-102'}`}
                      >
                        <div className="h-16 md:h-20 bg-black border border-zinc-200 dark:border-zinc-850 shadow-sm relative">
                          {displayImage ? (
                            <img src={displayImage} className="w-full h-full object-cover" alt={series.name} loading="lazy" decoding="async" />
                          ) : (
                            <div className="w-full h-full bg-zinc-800" />
                          )}
                          <div className={`absolute inset-0 flex items-center justify-center p-1 text-center transition-all duration-300 ${isActive ? 'bg-black/20' : 'bg-black/70 group-hover:bg-black/40'}`}>
                            <span className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider leading-tight font-sans drop-shadow-md">
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
                        <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-850 bg-black h-full min-h-[300px] relative flex items-center justify-center shadow-2xl transition-all duration-300 hover:border-accent/45">
                          <div className="absolute inset-0 w-full h-full">
                            {displayImage ? (
                              <img 
                                key={displayImage}
                                src={displayImage} 
                                alt={activeSeries.name} 
                                className="w-full h-full object-cover opacity-85 dark:opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 transform-gpu"
                                loading="eager"
                                decoding="async"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-b from-zinc-200 to-zinc-300 dark:from-zinc-850 dark:to-zinc-950 group-hover:scale-105 transition-transform duration-700 z-0"></div>
                            )}
                          </div>
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-transparent flex flex-col justify-end p-6 z-10 pointer-events-none">
                            <div className="mb-2">
                               <span className="px-2 py-0.5 bg-accent text-black text-[9px] font-black uppercase tracking-widest rounded">Featured Selection</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark dark:from-zinc-200 dark:via-zinc-400 dark:to-zinc-600 font-serif">
                              {getText(`anime-cover-${activeSeries.slug}`) || activeSeries.name}
                            </h2>
                            <div className="mt-4 flex gap-4">
                              <span className="px-6 py-2 rounded-full bg-gradient-to-r from-accent-light via-accent to-accent-alt text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-md shadow-accent/15">{t.viewCollection} &rarr;</span>
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
                        className={`block group cursor-pointer rounded-lg overflow-hidden transition-all duration-300 min-w-[100px] md:min-w-0 flex-1 ${isActive ? 'ring-2 ring-accent shadow-[0_4px_15px_rgba(212,175,55,0.3)] scale-105 relative z-10' : 'hover:scale-102'}`}
                      >
                        <div className="h-16 md:h-20 bg-black border border-zinc-200 dark:border-zinc-850 shadow-sm relative">
                          {displayImage ? (
                            <img src={displayImage} className="w-full h-full object-cover" alt={series.name} loading="lazy" decoding="async" />
                          ) : (
                            <div className="w-full h-full bg-zinc-800" />
                          )}
                          <div className={`absolute inset-0 flex items-center justify-center p-1 text-center transition-all duration-300 ${isActive ? 'bg-black/20' : 'bg-black/70 group-hover:bg-black/40'}`}>
                            <span className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider leading-tight font-sans drop-shadow-md">
                              {getText(`anime-cover-${series.slug}`) || series.name}
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* All Categories Modal Overlay */}
            {showAllModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
                <div className="bg-[var(--bg)] border border-zinc-200 dark:border-zinc-850 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-100/50 dark:bg-zinc-950/40">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-black uppercase tracking-widest text-accent font-serif">{t.allTitle}</h2>
                      <button onClick={() => { setShowAllModal(false); setSearchAll(''); }} className="text-zinc-555 hover:text-red-500 transition-colors text-2xl font-bold">&times;</button>
                    </div>
                    {/* Search Bar */}
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder={t.searchPlaceholder}
                        value={searchAll}
                        onChange={(e) => setSearchAll(e.target.value)}
                        className="w-full bg-white/40 dark:bg-black/40 border border-zinc-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-sm focus:border-accent/50 focus:outline-none transition-all pl-10 text-[var(--text-main)]"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">🔍</span>
                    </div>
                  </div>
                  
                  <div className="p-2 overflow-y-auto custom-scrollbar flex-grow bg-black/10">
                    {allSeries
                      .filter(s => s.name.toLowerCase().includes(searchAll.toLowerCase()))
                      .map((series) => (
                      <Link 
                        key={series.slug} 
                        href={`/anime/${series.slug}`}
                        className="flex items-center justify-between p-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-850 transition-all group mb-1"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-xs uppercase">
                            {series.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-[var(--text-main)] group-hover:text-accent transition-colors">{series.name}</h3>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5 font-bold">{series.charCount} {t.characters}</p>
                          </div>
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-accent text-sm">→</span>
                      </Link>
                    ))}
                    {allSeries.filter(s => s.name.toLowerCase().includes(searchAll.toLowerCase())).length === 0 && (
                      <div className="text-center py-10 text-zinc-500 text-sm italic">{t.notFound}</div>
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
