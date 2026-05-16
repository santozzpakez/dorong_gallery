import Header from '../components/Header'
import Footer from '../components/Footer'
import { useState, useEffect } from 'react'
import { useSiteAssets } from '../lib/siteAssets'
import Link from 'next/link'
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'

import { DECOR_CATEGORIES as CATS } from '../lib/assetSlots'

export default function Decor(){
  const { lang } = useLanguage()
  const { getUrl, getText } = useSiteAssets()
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(0)
  const [showAllModal, setShowAllModal] = useState(false)
  const [searchAll, setSearchAll] = useState('')

  useEffect(() => {
    async function loadThemes() {
      // ── 1. Baca daftar tema dari localStorage (definisi admin) ──
      const STORAGE_TYPES = 'dorong_admin_type_options'
      let adminThemes = []
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_TYPES) : null
        if (raw) {
          const parsed = JSON.parse(raw)
          adminThemes = Array.isArray(parsed?.decor) ? parsed.decor : []
        }
      } catch { /* abaikan */ }

      // ── 2. Buat map dari tema (Gunakan normalisasi untuk hindari duplikat) ──
      const themeMap = new Map()
      const normalize = (name) => {
        if (!name) return ''
        const clean = name.replace(/^cover\s*[—\-]?\s*/i, '').trim()
        return clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      }

      adminThemes.forEach(name => {
        const norm = normalize(name)
        if (norm && !themeMap.has(norm)) {
          const slug = norm.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
          themeMap.set(norm, { name: norm, key: `decor-${slug}`, slug })
        }
      })

      // ── 3. Merge dengan data dari database ──
      if (hasSupabaseConfig && supabase) {
        const { data } = await supabase
          .from('products')
          .select('subcategory')
          .eq('category', 'decor')

        if (data) {
          data.forEach(p => {
            if (p.subcategory) {
              const name = normalize(p.subcategory.trim())
              if (name && !themeMap.has(name)) {
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
                themeMap.set(name, { name, key: `decor-${slug}`, slug })
              }
            }
          })
        }
      }

      // ── 4. Resolusi Layout Sidebar (Featured 10) ──
      const list = Array.from(themeMap.values())
      list.sort((a, b) => a.name.localeCompare(b.name))

      const sidebarSlugs = []
      for (let i = 1; i <= 10; i++) {
        const s = getText(`decor-sidebar-slot-${i}`)
        if (s) sidebarSlugs.push(s)
      }

      if (sidebarSlugs.length > 0) {
        const featured = sidebarSlugs.map(slug => list.find(x => x.slug === slug)).filter(Boolean)
        setThemes(featured)
      } else {
        setThemes(list.slice(0, 10))
      }

      setLoading(false)
    }
    loadThemes()
  }, [])

  const translations = {
    id: {
      title: 'Koleksi Decor',
      desc: 'Pilih kategori dekorasi untuk estetika ruanganmu.',
      bundle: 'Paket Bundle',
      all: 'Semua Decor',
      loading: 'Memuat tema...',
      empty: 'Belum ada tema Decor di database.',
      premiumSeries: 'Koleksi Premium',
      viewCollection: 'Lihat Koleksi',
      allTitle: 'Semua Decor',
      searchPlaceholder: 'Cari tema decor...',
      notFound: 'Tema tidak ditemukan...'
    },
    en: {
      title: 'Decor Collection',
      desc: 'Select a decor category for your room aesthetics.',
      bundle: 'Bundle Pack',
      all: 'All Decor',
      loading: 'Loading themes...',
      empty: 'No Decor themes in database.',
      premiumSeries: 'Premium Collection',
      viewCollection: 'View Collection',
      allTitle: 'All Decor',
      searchPlaceholder: 'Search decor themes...',
      notFound: 'Theme not found...'
    },
    jp: {
      title: 'デコレーションコレクション',
      desc: 'お部屋の美学に合わせたデコレーションカテゴリーを選択してください。',
      bundle: 'バンドルパック',
      all: 'すべてのデコ',
      loading: 'テーマを読み込み中...',
      empty: 'データベースにデコテーマがありません。',
      premiumSeries: 'プレミアムコレクション',
      viewCollection: 'コレクションを見る',
      allTitle: 'すべてのデコ',
      searchPlaceholder: 'デコテーマを検索...',
      notFound: 'テーマが見つかりません...'
    },
    kr: {
      title: '데코 컬렉션',
      desc: '방의 미학을 위한 데코 카테고리를 선택하세요.',
      bundle: '번들 팩',
      all: '모든 데코',
      loading: '테마를 불러오는 중...',
      empty: '데이터베이스에 데코 테마가 없습니다.',
      premiumSeries: '프리미엄 컬렉션',
      viewCollection: '컬렉션 보기',
      allTitle: '모든 데코',
      searchPlaceholder: '데코 테마 검색...',
      notFound: '테마를 찾을 수 없습니다...'
    },
    cn: {
      title: '装饰收藏',
      desc: '选择适合您房间美学的装饰类别。',
      bundle: '捆绑包',
      all: '所有装饰',
      loading: '正在加载主题...',
      empty: '数据库中没有装饰主题。',
      premiumSeries: '高级系列',
      viewCollection: '查看收藏',
      allTitle: '所有装饰',
      searchPlaceholder: '搜索装饰主题...',
      notFound: '未找到主题...'
    }
  }

  const t = translations[lang] || translations.id

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
        ) : themes.length === 0 ? (
          <div className="text-center py-20 text-gray-500 border border-dashed border-gray-700 rounded-xl bg-white/5">
            {t.empty}
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4 items-stretch">
            {/* Left Column */}
            <div className="col-span-12 md:col-span-2 space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-hide">
              {themes.slice(0, 5).map((c, i) => {
                const displayImage = getUrl(c.key)
                const isActive = active === i
                return (
                  <Link 
                    key={c.key} 
                    href={`/decor/${c.slug}`}
                    onMouseEnter={() => setActive(i)} 
                    className={`block cursor-pointer rounded-lg overflow-hidden transition-all duration-300 min-w-[120px] md:min-w-0 flex-1 ${isActive ? 'ring-2 ring-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.4)] scale-105 z-10 opacity-100' : 'opacity-40 hover:opacity-100 hover:scale-[1.02]'}`}
                  >
                    <div className="h-16 md:h-20 bg-gray-800 relative">
                      <img src={displayImage} className="w-full h-full object-cover" alt={c.name} loading="lazy" decoding="async" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2 group-hover:bg-black/20 transition-colors">
                        <span className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center drop-shadow-md leading-tight">
                          {getText(c.key) || c.name}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Center Column */}
            <div className="col-span-12 md:col-span-8 flex">
              <Link href={`/decor/${themes[active]?.slug}`} className="block group w-full h-full">
                <div className="rounded-2xl overflow-hidden glass border border-[#00b4d8]/20 dark:border-neon-cyan/20 cinematic-glow-cyan relative flex items-center justify-center bg-black w-full h-full min-h-[300px]">
                  <img src={getUrl(themes[active]?.key)} alt={themes[active]?.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" loading="eager" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 dark:from-black/90 dark:via-black/20 to-transparent flex flex-col justify-end p-6">
                    <h2 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-gray-900 dark:text-white group-hover:text-[#00b4d8] dark:group-hover:text-neon-cyan dark:group-hover:neon-text-cyan transition-colors">
                      {getText(themes[active]?.key) || themes[active]?.name}
                    </h2>
                    <p className="text-[#9d4edd] dark:text-neon-purple mt-2 font-mono text-lg">{t.premiumSeries}</p>
                    <div className="mt-4">
                      <span className="px-6 py-2 rounded-full border border-[#00b4d8] dark:border-neon-cyan text-[#00b4d8] dark:text-neon-cyan font-bold text-sm tracking-wider group-hover:bg-[#00b4d8] group-hover:text-white dark:group-hover:bg-neon-cyan dark:group-hover:text-black transition-all shadow-[0_0_15px_rgba(0,243,255,0.2)]">{t.viewCollection} →</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Right Column */}
            <div className="col-span-12 md:col-span-2 space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-hide">
              {themes.slice(5, 10).map((c, idx) => {
                const i = idx + 5
                const displayImage = getUrl(c.key)
                const isActive = active === i
                return (
                  <Link 
                    key={c.key} 
                    href={`/decor/${c.slug}`}
                    onMouseEnter={() => setActive(i)} 
                    className={`block cursor-pointer rounded-lg overflow-hidden transition-all duration-300 min-w-[120px] md:min-w-0 flex-1 ${isActive ? 'ring-2 ring-neon-purple shadow-[0_0_10px_rgba(176,38,255,0.4)] scale-105 z-10 opacity-100' : 'opacity-40 hover:opacity-100 hover:scale-[1.02]'}`}
                  >
                    <div className="h-16 md:h-20 bg-gray-800 relative">
                      <img src={displayImage} className="w-full h-full object-cover" alt={c.name} loading="lazy" decoding="async" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2 group-hover:bg-black/20 transition-colors">
                        <span className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center drop-shadow-md leading-tight">
                          {getText(c.key) || c.name}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
        
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
                {themes
                  .filter(c => (getText(c.key) || c.name).toLowerCase().includes(searchAll.toLowerCase()))
                  .map((c) => (
                  <Link 
                    key={c.key} 
                    href={`/decor/${c.slug}`}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group mb-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan font-bold text-xs uppercase">
                        {(getText(c.key) || c.name).charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-[#00b4d8] dark:group-hover:text-neon-cyan transition-colors">
                          {getText(c.key) || c.name}
                        </h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{t.premiumSeries}</p>
                      </div>
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-neon-cyan text-sm">→</span>
                  </Link>
                ))}
                {themes.filter(c => (getText(c.key) || c.name).toLowerCase().includes(searchAll.toLowerCase())).length === 0 && (
                  <div className="text-center py-10 text-gray-500 text-sm italic">{t.notFound}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
