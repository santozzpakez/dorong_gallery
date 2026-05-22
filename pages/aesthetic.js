import Header from '../components/Header'
import Footer from '../components/Footer'
import { useState, useEffect } from 'react'
import { useSiteAssets } from '../lib/siteAssets'
import Link from 'next/link'
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'

export default function Aesthetic() {
  const { lang } = useLanguage()
  const { assets, getUrl, getText, loaded } = useSiteAssets()
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(0)
  const [showAllModal, setShowAllModal] = useState(false)
  const [searchAll, setSearchAll] = useState('')

  const translations = {
    id: {
      title: 'Aesthetic Collection',
      desc: 'Pilih tema estetika untuk ruanganmu.',
      bundle: 'Paket Hemat',
      all: 'Semua Tema',
      loading: 'Memuat tema...',
      empty: 'Belum ada produk Aesthetic di database. Tambahkan lewat Admin Dashboard!',
      noImage: 'No Image',
      uploadAdmin: 'Upload gambar di Admin → Tema → Aesthetic',
      topTheme: 'Premium Aesthetic Theme',
      viewCollection: 'Lihat Koleksi',
      allTitle: 'Semua Tema Aesthetic',
      searchPlaceholder: 'Cari tema aesthetic...',
      premiumPoster: 'High Quality Art Print',
      notFound: 'Tema tidak ditemukan...'
    },
    en: {
      title: 'Aesthetic Collection',
      desc: 'Choose an aesthetic theme for your space.',
      bundle: 'Value Pack',
      all: 'All Themes',
      loading: 'Loading themes...',
      empty: 'No Aesthetic products in database. Add them via Admin Dashboard!',
      noImage: 'No Image',
      uploadAdmin: 'Upload image in Admin → Theme → Aesthetic',
      topTheme: 'Premium Aesthetic Theme',
      viewCollection: 'View Collection',
      allTitle: 'All Aesthetic Themes',
      searchPlaceholder: 'Search aesthetic themes...',
      premiumPoster: 'High Quality Art Print',
      notFound: 'Theme not found...'
    }
  }

  const t = translations[lang] || translations.id

  useEffect(() => {
    async function loadThemes() {
      if (!loaded) return

      // 1. Ambil dari Cache Global
      const globalOptionsRaw = getText('global-category-options')

      let categories = []
      try {
        if (globalOptionsRaw) {
          const parsed = JSON.parse(globalOptionsRaw)
          categories = Array.isArray(parsed?.aesthetic) ? parsed.aesthetic : []
        }
      } catch (err) { }

      // Fallback ke localStorage
      if (categories.length === 0) {
        try {
          const raw = typeof window !== 'undefined' ? window.localStorage.getItem('dorong_admin_type_options') : null
          if (raw) categories = JSON.parse(raw)?.aesthetic || []
        } catch { }
      }

      // 2. Buat map dari tema
      const themeMap = new Map()
      const normalize = (name) => {
        if (!name) return ''
        return name.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      }

      categories.forEach(name => {
        const norm = normalize(name)
        if (norm && !themeMap.has(norm)) {
          const slug = norm.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          themeMap.set(norm, { name: norm, slug, assetKey: `aesthetic-${slug}` })
        }
      })

      // 3. Scan Produk (Jalur Darurat)
      if (themeMap.size === 0 && hasSupabaseConfig && supabase) {
        const { data } = await supabase.from('products').select('subcategory').eq('category', 'aesthetic')
        if (data) {
          data.forEach(p => {
            if (p.subcategory) {
              const themeName = normalize(p.subcategory.split(' - ')[0].trim())
              if (themeName && !themeMap.has(themeName)) {
                const slug = themeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
                themeMap.set(themeName, { name: themeName, slug, assetKey: `aesthetic-${slug}` })
              }
            }
          })
        }
      }

      const themeList = Array.from(themeMap.values())
      themeList.sort((a, b) => a.name.localeCompare(b.name))
      setThemes(themeList)
      setLoading(false)
    }
    loadThemes()
  }, [loaded])

  const displayThemes = themes.slice(0, 10)
  const leftThemes = displayThemes.slice(0, 5)
  const rightThemes = displayThemes.slice(5, 10)

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      <Header />
      <main className="flex-grow pt-32 max-w-6xl mx-auto px-4 w-full pb-16">
        
        {/* Banner Box - Premium Brushed Metal style */}
        <div className="mb-8 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-zinc-800 via-zinc-950 to-black text-white shadow-[0_15px_35px_rgba(0,0,0,0.7)] relative overflow-hidden border border-zinc-850">
          {/* Accent golden blur spot */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-accent/3 rounded-full filter blur-[80px] pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark font-serif">
              {t.title}
            </h1>
            <p className="text-zinc-400 mt-2 text-xs md:text-sm font-sans tracking-widest uppercase font-bold">
              {t.desc}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mb-6">
          <button className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/60 text-zinc-555 dark:text-zinc-400 hover:text-accent hover:border-accent/60 hover:bg-accent/5 transition-all font-black tracking-widest text-[9px] uppercase font-sans">
            {t.bundle}
          </button>
          <button
            onClick={() => setShowAllModal(true)}
            className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/60 text-zinc-555 dark:text-zinc-400 hover:text-accent hover:border-accent/60 hover:bg-accent/5 transition-all font-black tracking-widest text-[9px] uppercase font-sans"
          >
            {t.all}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4"></div>
            {t.loading}
          </div>
        ) : themes.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-100 dark:bg-zinc-950/20">
            {t.empty}
          </div>
        ) : (
          <>
            {/* Charcoal Premium Container */}
            <div className="p-4 md:p-8 rounded-3xl bg-zinc-950/5 dark:bg-zinc-950/30 border border-zinc-200/50 dark:border-zinc-900 shadow-[0_15px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-md">
              <div className="flex flex-col md:flex-row gap-6 items-stretch">
                
                {/* Left Column */}
                <div className="w-full md:w-[15%] space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                  {leftThemes.map((g, i) => {
                    const displayImage = assets[g.assetKey] || getUrl(g.assetKey) || ''
                    const isActive = active === i
                    return (
                      <div
                        key={g.slug}
                        onMouseEnter={() => setActive(i)}
                        className={`block cursor-pointer rounded-lg overflow-hidden transition-all duration-300 min-w-[100px] md:min-w-0 flex-1 ${isActive ? 'ring-1 ring-accent shadow-[0_4px_15px_rgb(var(--accent-main)/0.2)] scale-103 opacity-100' : 'opacity-50 hover:opacity-90'}`}
                      >
                        <Link href={`/aesthetic/${g.slug}`}>
                          <div className="h-16 md:h-20 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 shadow-sm relative">
                            {displayImage ? (
                              <img src={displayImage} className="w-full h-full object-cover" alt={g.name} />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center">
                                <span className="text-zinc-400 dark:text-zinc-650 text-[9px] text-center px-1 font-bold">{t.noImage}</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1 text-center hover:bg-black/35 transition-all">
                              <span className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider leading-tight font-sans">
                                {getText(g.assetKey) || g.name}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    )
                  })}
                </div>

                {/* Center Column */}
                <div className="w-full md:w-[70%] flex">
                  {themes[active] && (() => {
                    const activeTheme = themes[active]
                    const displayImage = assets[activeTheme.assetKey] || getUrl(activeTheme.assetKey) || ''
                    return (
                      <Link href={`/aesthetic/${activeTheme.slug}`} className="block group w-full h-full">
                        <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-black h-full min-h-[300px] relative flex items-center justify-center shadow-2xl transition-all duration-300 hover:border-accent/45">
                          <div className="absolute inset-0 w-full h-full">
                            {displayImage ? (
                              <img
                                key={displayImage}
                                src={displayImage}
                                alt={activeTheme.name}
                                className="w-full h-full object-cover opacity-60 dark:opacity-85 group-hover:opacity-85 group-hover:scale-105 transition-all duration-700 transform-gpu"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-b from-zinc-200 to-zinc-300 dark:from-zinc-850 dark:to-zinc-950 flex items-center justify-center text-zinc-405 dark:text-zinc-555 text-sm text-center px-4 font-bold">
                                {t.uploadAdmin}
                              </div>
                            )}
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-transparent flex flex-col justify-end p-6 z-10 pointer-events-none">
                            <div className="mb-2">
                              <span className="px-2 py-0.5 bg-accent text-black text-[9px] font-black uppercase tracking-widest rounded">{t.topTheme}</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark font-serif">
                              {getText(activeTheme.assetKey) || activeTheme.name}
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

                {/* Right Column */}
                <div className="w-full md:w-[15%] space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                  {rightThemes.map((g, idx) => {
                    const i = idx + 5
                    const displayImage = assets[g.assetKey] || getUrl(g.assetKey) || ''
                    const isActive = active === i
                    return (
                      <div
                        key={g.slug}
                        onMouseEnter={() => setActive(i)}
                        className={`block cursor-pointer rounded-lg overflow-hidden transition-all duration-300 min-w-[100px] md:min-w-0 flex-1 ${isActive ? 'ring-1 ring-accent shadow-[0_4px_15px_rgb(var(--accent-main)/0.2)] scale-103 opacity-100' : 'opacity-50 hover:opacity-90'}`}
                      >
                        <Link href={`/aesthetic/${g.slug}`}>
                          <div className="h-16 md:h-20 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 shadow-sm relative">
                            {displayImage ? (
                              <img src={displayImage} className="w-full h-full object-cover" alt={g.name} />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center">
                                <span className="text-zinc-400 dark:text-zinc-650 text-[9px] text-center px-1 font-bold">{t.noImage}</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1 text-center hover:bg-black/35 transition-all">
                              <span className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider leading-tight font-sans">
                                {getText(g.assetKey) || g.name}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Modal All Themes */}
            {showAllModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
                <div className="bg-[var(--bg)] border border-zinc-200 dark:border-zinc-850 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-100/50 dark:bg-zinc-950/40">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-black uppercase tracking-widest text-accent font-serif">{t.allTitle}</h2>
                      <button onClick={() => { setShowAllModal(false); setSearchAll(''); }} className="text-zinc-555 hover:text-red-500 transition-colors text-2xl font-bold">&times;</button>
                    </div>
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
                    {themes
                      .filter(g => g.name.toLowerCase().includes(searchAll.toLowerCase()))
                      .map((g) => (
                        <Link
                          key={g.slug}
                          href={`/aesthetic/${g.slug}`}
                          className="flex items-center justify-between p-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-850 transition-all group mb-1"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-xs uppercase">
                              {g.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-[var(--text-main)] group-hover:text-accent transition-colors">{g.name}</h3>
                              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5 font-bold">{t.premiumPoster}</p>
                            </div>
                          </div>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-accent text-sm">→</span>
                        </Link>
                      ))}
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
