import Header from '../components/Header'
import Footer from '../components/Footer'
import { useState, useEffect } from 'react'
import { useSiteAssets } from '../lib/siteAssets'
import Link from 'next/link'
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'

export default function Kpop() {
  const { lang } = useLanguage()
  const { assets, getUrl, getText, loaded } = useSiteAssets()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(0)
  const [showAllModal, setShowAllModal] = useState(false)
  const [searchAll, setSearchAll] = useState('')

  const translations = {
    id: {
      title: 'K-pop Collection',
      desc: 'Pilih grup K-pop favoritmu.',
      bundle: 'Paket Bundle',
      all: 'Semua K-pop',
      loading: 'Memuat grup...',
      empty: 'Belum ada produk K-pop di database. Tambahkan lewat Admin Dashboard!',
      noImage: 'No Image',
      uploadAdmin: 'Upload gambar di Admin → Tema → K-pop',
      topIdol: 'Top Idol Group',
      viewCollection: 'Lihat Koleksi',
      allTitle: 'Semua K-pop',
      searchPlaceholder: 'Cari grup K-pop...',
      premiumPoster: 'Premium Group Poster',
      notFound: 'Grup tidak ditemukan...'
    },
    en: {
      title: 'K-pop Collection',
      desc: 'Pick your favorite K-pop group.',
      bundle: 'Bundle Pack',
      all: 'All K-pop',
      loading: 'Loading groups...',
      empty: 'No K-pop products in database. Add them via Admin Dashboard!',
      noImage: 'No Image',
      uploadAdmin: 'Upload image in Admin → Theme → K-pop',
      topIdol: 'Top Idol Group',
      viewCollection: 'View Collection',
      allTitle: 'All K-pop',
      searchPlaceholder: 'Search K-pop groups...',
      premiumPoster: 'Premium Group Poster',
      notFound: 'Group not found...'
    },
    jp: {
      title: 'K-POPコレクション',
      desc: 'お気に入りのK-POPグループを選んでください。',
      bundle: 'バンドルパック',
      all: 'すべてのK-POP',
      loading: 'グループを読み込み中...',
      empty: 'データベースにK-POP製品がありません。管理ダッシュボードから追加してください！',
      noImage: '画像なし',
      uploadAdmin: '管理 → テーマ → K-POPで画像をアップロード',
      topIdol: 'トップアイドルグループ',
      viewCollection: 'コレクションを見る',
      allTitle: 'すべてのK-POP',
      searchPlaceholder: 'K-POPグループを検索...',
      premiumPoster: 'プレミアムグループポスター',
      notFound: 'グループが見つかりません...'
    },
    kr: {
      title: 'K-팝 컬렉션',
      desc: '좋아하는 K-팝 그룹을 선택하세요.',
      bundle: '번들 팩',
      all: '모든 K-팝',
      loading: '그룹을 불러오는 중...',
      empty: '데이터베이스에 K-팝 제품이 없습니다. 관리 대시보드에서 추가하세요!',
      noImage: '이미지 없음',
      uploadAdmin: '관리자 → 테마 → K-팝에서 이미지 업로드',
      topIdol: '최고의 아이돌 그룹',
      viewCollection: '컬렉션 보기',
      allTitle: '모든 K-팝',
      searchPlaceholder: 'K-팝 그룹 검색...',
      premiumPoster: '프리미엄 그룹 포스터',
      notFound: '그룹을 찾을 수 없습니다...'
    },
    cn: {
      title: '韩流收藏',
      desc: '选择你最喜欢的韩流组合。',
      bundle: '捆绑包',
      all: '所有韩流',
      loading: '正在加载组合...',
      empty: '数据库中没有韩流产品。请通过管理仪表板添加！',
      noImage: '无图片',
      uploadAdmin: '在管理 → 主题 → 韩流中上传图片',
      topIdol: '顶级偶像组合',
      viewCollection: '查看收藏',
      allTitle: '所有韩流',
      searchPlaceholder: '搜索韩流组合...',
      premiumPoster: '高级组合海报',
      notFound: '未找到组合...'
    }
  }

  const t = translations[lang] || translations.id

  useEffect(() => {
    async function loadGroups() {
      if (!loaded) return // Tunggu Site Assets (Cache) siap

      // ── 1. Ambil dari Cache Global (SUPER CEPAT) ──
      const globalOptionsRaw = getText('global-category-options')
      
      let categories = []
      try {
        if (globalOptionsRaw) {
          const parsed = JSON.parse(globalOptionsRaw)
          categories = Array.isArray(parsed?.kpop) ? parsed.kpop : []
        }
      } catch (err) {
        console.warn('Gagal membaca cache kategori K-pop:', err)
      }

      // Fallback ke localStorage jika cache global kosong
      if (categories.length === 0) {
        try {
          const raw = typeof window !== 'undefined' ? window.localStorage.getItem('dorong_admin_type_options') : null
          if (raw) categories = JSON.parse(raw)?.kpop || []
        } catch {}
      }

      // ── 2. Buat map dari grup ──
      const groupMap = new Map()
      const normalize = (name) => {
        if (!name) return ''
        const clean = name.replace(/^cover\s*[—\-]?\s*/i, '').trim()
        return clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      }

      categories.forEach(name => {
        const norm = normalize(name)
        if (norm && !groupMap.has(norm)) {
          const slug = norm.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          groupMap.set(norm, { name: norm, slug, assetKey: `kpop-${slug}` })
        }
      })

      // ── 3. Jalur Darurat: Scan Produk & Site Assets ──
      if (groupMap.size === 0 && hasSupabaseConfig && supabase) {
        // A. Scan Products
        const { data: pData } = await supabase.from('products').select('subcategory').eq('category', 'kpop')
        if (pData) {
          pData.forEach(p => {
            if (p.subcategory) {
              const subName = p.subcategory.includes(' - ') ? p.subcategory.split(' - ')[0].trim() : p.subcategory.trim()
              const groupName = normalize(subName)
              if (groupName && !groupMap.has(groupName)) {
                const slug = groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
                groupMap.set(groupName, { name: groupName, slug, assetKey: `kpop-${slug}` })
              }
            }
          })
        }
        // B. Scan Site Assets
        const { data: aData } = await supabase.from('site_assets').select('key, label').like('key', 'kpop-%')
        if (aData) {
          aData.forEach(asset => {
            const key = asset.key
            if (key.includes('sidebar') || key.includes('slot')) return
            const rawName = asset.label || key.replace('kpop-', '').replace(/-/g, ' ')
            const groupName = normalize(rawName)
            if (groupName && !groupMap.has(groupName)) {
              const slug = groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
              groupMap.set(groupName, { name: groupName, slug, assetKey: `kpop-${slug}` })
            }
          })
        }
      }

      const groupList = Array.from(groupMap.values())
      groupList.sort((a, b) => a.name.localeCompare(b.name))

      // Featured Sidebar
      const sidebarSlugs = []
      for (let i = 1; i <= 10; i++) {
        const s = getText(`kpop-sidebar-slot-${i}`)
        if (s) sidebarSlugs.push(s)
      }

      if (sidebarSlugs.length > 0) {
        const featured = sidebarSlugs.map(slug => groupList.find(x => x.slug === slug)).filter(Boolean)
        setGroups(featured)
      } else {
        setGroups(groupList.slice(0, 10))
      }

      setLoading(false)
    }
    loadGroups()
  }, [loaded])

  const displayGroups = groups.slice(0, 10)
  const leftGroups = displayGroups.slice(0, 5)
  const rightGroups = displayGroups.slice(5, 10)

  return (
    <div className="min-h-screen bg-[#08080a] dark:bg-[var(--bg)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      <Header />
      <main className="flex-grow pt-32 max-w-6xl mx-auto px-4 w-full pb-16">
        
        {/* Banner Box - Premium Brushed Metal style */}
        <div className="mb-8 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-zinc-800 via-zinc-950 to-black text-white shadow-[0_15px_35px_rgba(0,0,0,0.7)] relative overflow-hidden border border-zinc-850">
          {/* Accent golden blur spot */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-[#d4af37]/3 rounded-full filter blur-[80px] pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-[#f3e5ab] via-[#d4af37] to-[#aa7c11] font-serif">
              {t.title}
            </h1>
            <p className="text-zinc-400 mt-2 text-xs md:text-sm font-sans tracking-widest uppercase font-bold">
              {t.desc}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mb-6">
          <button className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/60 text-zinc-555 dark:text-zinc-400 hover:text-[#d4af37] hover:border-[#d4af37]/60 hover:bg-[#d4af37]/5 transition-all font-black tracking-widest text-[9px] uppercase font-sans">
            {t.bundle}
          </button>
          <button
            onClick={() => setShowAllModal(true)}
            className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/60 text-zinc-555 dark:text-zinc-400 hover:text-[#d4af37] hover:border-[#d4af37]/60 hover:bg-[#d4af37]/5 transition-all font-black tracking-widest text-[9px] uppercase font-sans"
          >
            {t.all}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin mb-4"></div>
            {t.loading}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-100 dark:bg-zinc-950/20">
            {t.empty}
          </div>
        ) : (
          <>
            {/* Charcoal Premium Container */}
            <div className="p-4 md:p-8 rounded-3xl bg-zinc-950/5 dark:bg-zinc-950/30 border border-zinc-200/50 dark:border-zinc-900 shadow-[0_15px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-md">
              <div className="flex flex-col md:flex-row gap-6 items-stretch">
                
                {/* Left Column (max 5) */}
                <div className="w-full md:w-[15%] space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                  {leftGroups.slice(0, 5).map((g, i) => {
                    const displayImage = assets[g.assetKey] || getUrl(g.assetKey) || ''
                    const isActive = active === i
                    return (
                      <Link
                        href={`/kpop/${g.slug}`}
                        key={g.slug}
                        onMouseEnter={() => setActive(i)}
                        className={`block cursor-pointer rounded-lg overflow-hidden transition-all duration-300 min-w-[100px] md:min-w-0 flex-1 ${isActive ? 'ring-1 ring-[#d4af37] shadow-[0_4px_15px_rgba(212,175,55,0.2)] scale-103 opacity-100' : 'opacity-50 hover:opacity-90'}`}
                      >
                        <div className="h-16 md:h-20 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 shadow-sm relative">
                          {displayImage ? (
                            <img src={displayImage} className="w-full h-full object-cover" alt={g.name} loading="lazy" decoding="async" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center">
                              <span className="text-zinc-400 dark:text-zinc-600 text-[9px] text-center px-1 font-bold">{t.noImage}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1 text-center hover:bg-black/35 transition-all">
                            <span className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider leading-tight font-sans">
                              {getText(g.assetKey) || g.name}
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {/* Center Column (Large Preview) */}
                <div className="w-full md:w-[70%] flex">
                  {groups[active] && (() => {
                    const activeGroup = groups[active]
                    const displayImage = assets[activeGroup.assetKey] || getUrl(activeGroup.assetKey) || ''
                    return (
                      <Link href={`/kpop/${activeGroup.slug}`} className="block group w-full h-full">
                        <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-black h-full min-h-[300px] relative flex items-center justify-center shadow-2xl transition-all duration-300 hover:border-[#d4af37]/45">
                          <div className="absolute inset-0 w-full h-full">
                            {displayImage ? (
                              <img
                                key={displayImage}
                                src={displayImage}
                                alt={activeGroup.name}
                                className="w-full h-full object-cover opacity-60 dark:opacity-85 group-hover:opacity-85 group-hover:scale-105 transition-all duration-700 transform-gpu"
                                loading="eager"
                                decoding="async"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-b from-zinc-200 to-zinc-300 dark:from-zinc-850 dark:to-zinc-950 flex items-center justify-center text-zinc-400 dark:text-zinc-555 text-sm text-center px-4 font-bold">
                                {t.uploadAdmin}
                              </div>
                            )}
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-transparent flex flex-col justify-end p-6 z-10 pointer-events-none">
                            <div className="mb-2">
                              <span className="px-2 py-0.5 bg-[#d4af37] text-black text-[9px] font-black uppercase tracking-widest rounded">{t.topIdol}</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#f3e5ab] via-[#d4af37] to-[#aa7c11] font-serif">
                              {getText(activeGroup.assetKey) || activeGroup.name}
                            </h2>
                            <div className="mt-4 flex gap-4">
                              <span className="px-6 py-2 rounded-full bg-gradient-to-r from-[#f3e5ab] via-[#d4af37] to-[#b39359] text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-md shadow-[#d4af37]/15">{t.viewCollection} &rarr;</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })()}
                </div>

                {/* Right Column (max 5) */}
                <div className="w-full md:w-[15%] space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                  {rightGroups.slice(0, 5).map((g, idx) => {
                    const i = idx + 5
                    const displayImage = assets[g.assetKey] || getUrl(g.assetKey) || ''
                    const isActive = active === i
                    return (
                      <Link
                        href={`/kpop/${g.slug}`}
                        key={g.slug}
                        onMouseEnter={() => setActive(i)}
                        className={`block cursor-pointer rounded-lg overflow-hidden transition-all duration-300 min-w-[100px] md:min-w-0 flex-1 ${isActive ? 'ring-1 ring-[#d4af37] shadow-[0_4px_15px_rgba(212,175,55,0.2)] scale-103 opacity-100' : 'opacity-50 hover:opacity-90'}`}
                      >
                        <div className="h-16 md:h-20 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 shadow-sm relative">
                          {displayImage ? (
                            <img src={displayImage} className="w-full h-full object-cover" alt={g.name} loading="lazy" decoding="async" />
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
                    )
                  })}
                </div>
              </div>
            </div>

            {/* All K-pop Modal */}
            {showAllModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
                <div className="bg-[var(--bg)] border border-zinc-200 dark:border-zinc-850 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-100/50 dark:bg-zinc-955/40">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-black uppercase tracking-widest text-[#d4af37] font-serif">{t.allTitle}</h2>
                      <button onClick={() => { setShowAllModal(false); setSearchAll(''); }} className="text-zinc-555 hover:text-red-500 transition-colors text-2xl font-bold">&times;</button>
                    </div>
                    {/* Search Bar */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={t.searchPlaceholder}
                        value={searchAll}
                        onChange={(e) => setSearchAll(e.target.value)}
                        className="w-full bg-white/40 dark:bg-black/40 border border-zinc-200 dark:border-zinc-850 rounded-xl px-4 py-3 text-sm focus:border-[#d4af37]/50 focus:outline-none transition-all pl-10 text-[var(--text-main)]"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">🔍</span>
                    </div>
                  </div>

                  <div className="p-2 overflow-y-auto custom-scrollbar flex-grow bg-black/10">
                    {groups
                      .filter(g => g.name.toLowerCase().includes(searchAll.toLowerCase()))
                      .map((g) => (
                        <Link
                          key={g.slug}
                          href={`/kpop/${g.slug}`}
                          className="flex items-center justify-between p-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-850 transition-all group mb-1"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37] font-bold text-xs uppercase">
                              {g.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-[var(--text-main)] group-hover:text-[#d4af37] transition-colors">{g.name}</h3>
                              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5 font-bold">{t.premiumPoster}</p>
                            </div>
                          </div>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#d4af37] text-sm">→</span>
                        </Link>
                      ))}
                    {groups.filter(g => g.name.toLowerCase().includes(searchAll.toLowerCase())).length === 0 && (
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
