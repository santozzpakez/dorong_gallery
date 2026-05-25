import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'
import { useSiteAssets } from '../lib/siteAssets'
import { useLanguage } from '../context/LanguageContext'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'


export default function Header() {
  const router = useRouter()
  const { user, logout, adminRole } = useAuth()
  const { totalItems, items: cart, updateQuantity, removeItem, subtotal: totalPrice } = useCart()
  const { theme, toggleTheme } = useTheme()
  const { lang, switchLanguage } = useLanguage()
  const { getUrl } = useSiteAssets()
  const [showSearch, setShowSearch] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [allCategories, setAllCategories] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navLinks = [
    { name: lang === 'id' ? 'Beranda' : 'Home', href: '/' },
    { name: 'Anime', href: '/anime' },
    { name: 'K-pop', href: '/kpop' },
    { name: 'Aesthetic', href: '/aesthetic' },
    { name: 'Custom', href: '/custom' },
  ]

  useEffect(() => {
    if (showSearch) {
      const STORAGE_TYPES = 'dorong_admin_type_options'
      try {
        const raw = localStorage.getItem(STORAGE_TYPES)
        if (raw) {
          const parsed = JSON.parse(raw)
          const cats = []
          if (parsed.anime) parsed.anime.forEach(name => cats.push({ name, type: 'anime', slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))
          if (parsed.kpop) parsed.kpop.forEach(name => cats.push({ name, type: 'kpop', slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))
          if (parsed.aesthetic) parsed.aesthetic.forEach(name => cats.push({ name, type: 'aesthetic', slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))
          setAllCategories(cats)
        }
      } catch (e) { console.error(e) }
    } else {
      setSearchQuery('')
      setErrorMsg('')
    }
  }, [showSearch])

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const query = searchQuery.trim().toLowerCase()
      if (!query) return

      const matches = allCategories.filter(c => c.name.toLowerCase().includes(query))
      
      if (matches.length > 0) {
        const exact = matches.find(c => c.name.toLowerCase() === query) || matches[0]
        setShowSearch(false)
        setSearchQuery('')
        router.push(`/${exact.type}/${exact.slug}`)
      } else {
        setErrorMsg(lang === 'id' ? 'Hasil tidak ditemukan!' : 'Result not found!')
        setTimeout(() => setErrorMsg(''), 3000)
      }
    } else if (e.key === 'Escape') {
      setShowSearch(false)
    }
  }

  const headerBg = getUrl('cover-bg')

  const translations = {
    id: {
      home: 'Beranda',
      anime: 'Anime',
      kpop: 'K-pop',
      aesthetic: 'Aesthetic',
      custom: 'Custom',
      catalog: 'Katalog',
      cart: 'Keranjang',
      searchPlaceholder: 'Cari anime, k-pop, atau aesthetic...',
      noResults: 'Hasil tidak ditemukan...',
      logout: 'Keluar',
      adminPanel: 'Panel Admin'
    },
    en: {
      home: 'Home',
      anime: 'Anime',
      kpop: 'K-pop',
      aesthetic: 'Aesthetic',
      custom: 'Custom',
      catalog: 'Catalog',
      cart: 'Cart',
      searchPlaceholder: 'Search anime, k-pop, or aesthetic...',
      noResults: 'No results found...',
      logout: 'Logout',
      adminPanel: 'Admin Panel'
    },
    jp: {
      home: 'ホーム',
      anime: 'アニメ',
      kpop: 'K-POP',
      aesthetic: 'エステティック',
      custom: 'カスタム',
      catalog: 'カタログ',
      cart: 'カート',
      searchPlaceholder: 'アニメ、K-POP、エステティックを検索...',
      noResults: '結果が見つかりません...',
      logout: 'ログアウト',
      adminPanel: '管理パネル'
    },
    kr: {
      home: '홈',
      anime: '애니메이션',
      kpop: 'K-팝',
      aesthetic: '에스테틱',
      custom: '커스텀',
      catalog: '카탈로그',
      cart: '장바구니',
      searchPlaceholder: '애니메이션, K-팝, 에스테틱 검색...',
      noResults: '결과를 찾을 수 없습니다...',
      logout: '로그아웃',
      adminPanel: '관리 패널'
    },
    cn: {
      home: '首页',
      anime: '动漫',
      kpop: '韩流',
      aesthetic: '美学',
      custom: '定制',
      catalog: '目录',
      cart: '购物车',
      searchPlaceholder: '搜索动漫、韩流或美学...',
      noResults: '未找到结果...',
      logout: '登出',
      adminPanel: '管理面板'
    }
  }

  const langOptions = [
    { code: 'id', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'jp', name: 'Japanese', flag: '🇯🇵' },
    { code: 'kr', name: 'Korean', flag: '🇰🇷' },
    { code: 'cn', name: 'Chinese', flag: '🇨🇳' },
  ]

  const currentLangObj = langOptions.find(l => l.code === lang) || langOptions[0]
  const [isLangOpen, setIsLangOpen] = useState(false)

  const t = translations[lang] || translations.id

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {headerBg && (
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: `url(${headerBg})` }}
        />
      )}

      {/* Sidebar Overlay (Navigation) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 left-0 bottom-0 w-[280px] z-[70] shadow-2xl flex flex-col bg-[#08080a] border-r border-zinc-800`}
            >
              <div className="p-6 flex items-center justify-between border-b border-zinc-900">
                <span className="text-xl font-black tracking-widest text-accent font-serif">MENU</span>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <nav className="flex-grow p-4 space-y-2">
                {navLinks.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest text-zinc-400 hover:text-accent hover:bg-zinc-900/40 transition-all font-sans"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/45"></span>
                    {link.name}
                  </Link>
                ))}
              </nav>

              <div className="p-6 border-t border-zinc-900 space-y-4">
                {mounted && (
                  user ? (
                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                      <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/35 flex items-center justify-center text-accent font-black uppercase">
                        {user.email ? user.email.charAt(0) : (user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0) : 'U')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black truncate text-white">
                          {user.user_metadata?.full_name || user.email || user.phone}
                        </p>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); logout(); }} className="text-[9px] text-red-500 font-black uppercase tracking-widest hover:text-red-400 mt-0.5 cursor-pointer">Logout</button>
                      </div>
                    </div>
                  ) : (
                    <Link 
                      href="/login" 
                      onClick={() => setIsSidebarOpen(false)}
                      className="flex items-center justify-center w-full py-4 rounded-2xl bg-gradient-to-r from-accent-light via-accent to-accent-alt text-black font-black uppercase tracking-widest shadow-lg shadow-accent/10"
                    >
                      Login
                    </Link>
                  )
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Sidebar (Right Side) */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 right-0 bottom-0 w-[350px] max-w-[90vw] z-[70] shadow-2xl flex flex-col bg-[#08080a] border-l border-zinc-800`}
            >
              <div className="p-6 flex items-center justify-between border-b border-zinc-900">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🛒</span>
                  <span className="text-xl font-black tracking-widest text-accent font-serif">CART</span>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="text-5xl mb-4 opacity-25">🛒</div>
                    <p className="text-sm font-black opacity-60 text-zinc-400">
                      {lang === 'id' ? 'Keranjangmu masih kosong' : 'Your cart is empty'}
                    </p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="mt-6 text-[10px] font-black uppercase tracking-widest text-accent hover:underline"
                    >
                      {lang === 'id' ? 'Mulai Belanja' : 'Start Shopping'}
                    </button>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 rounded-2xl border bg-zinc-900/60 border-zinc-800/80">
                      <div className="w-16 h-20 rounded-lg overflow-hidden bg-black flex-shrink-0">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-[11px] font-black uppercase tracking-tight truncate text-white">{item.title}</h4>
                          <p className="text-[10px] font-bold text-accent">Rp {item.price.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 bg-black/50 rounded-lg px-2 py-1 border border-zinc-800">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-zinc-400 hover:text-white transition-colors">−</button>
                            <span className="text-[10px] font-black text-white w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-zinc-400 hover:text-white transition-colors">+</button>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="text-[9px] font-black uppercase text-red-500/60 hover:text-red-500 transition-colors">Hapus</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-zinc-900 bg-zinc-950/60">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total</span>
                    <span className="text-xl font-black text-white">Rp {totalPrice.toLocaleString('id-ID')}</span>
                  </div>
                  <button 
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent-light via-accent to-accent-alt text-black font-black uppercase tracking-widest shadow-xl shadow-accent/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    onClick={() => {
                      setIsCartOpen(false);
                      router.push('/checkout');
                    }}
                  >
                    Lanjutkan ke Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Row 1: Brand bar */}
      <div className="relative z-30 bg-gradient-to-b from-zinc-700 via-zinc-600 to-zinc-800 dark:from-[#a87f17] dark:via-[#cf9e20] dark:to-[#8a660f] border-b border-zinc-500 dark:border-[#6e520c] shadow-md transition-colors duration-500">
        <div className="w-full px-4 md:px-8 py-1 md:py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 rounded-xl transition-colors group border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/50"
            >
              <div className="space-y-1.5">
                <span className="block w-5 h-[3px] bg-accent dark:bg-zinc-300 rounded-full transition-transform group-hover:w-6"></span>
                <span className="block w-6 h-[3px] bg-accent dark:bg-zinc-300 rounded-full transition-transform"></span>
                <span className="block w-4 h-[3px] bg-accent dark:bg-zinc-300 rounded-full transition-transform group-hover:w-6"></span>
              </div>
            </button>
            <Link href="/" className="flex items-center gap-4 group">
              
              <div className="relative flex items-center justify-center">
                {getUrl('logo') ? (
                  <img
                    src={getUrl('logo')}
                    alt="Lumi Forge Logo"
                    className="relative z-10 h-12 w-auto md:h-16 object-contain scale-[1.15] md:scale-[1.2] transition-transform duration-300 group-hover:scale-[1.25] md:group-hover:scale-[1.3]"
                  />
                ) : (
                  <div className="relative z-10 h-12 w-12 md:h-16 md:w-16 rounded-2xl bg-gradient-to-br from-accent-light via-accent to-accent-dark flex items-center justify-center text-black font-black text-sm md:text-xl shadow-lg border border-accent/30 scale-[1.15] md:scale-[1.2] transition-transform duration-300 group-hover:scale-[1.25] md:group-hover:scale-[1.3]">
                    LF
                  </div>
                )}
              </div>
              
              <span className="relative z-10 text-2xl md:text-3xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white via-accent-light to-accent dark:from-zinc-200 dark:via-zinc-200 dark:to-zinc-200 drop-shadow-md dark:drop-shadow-none font-serif">
                LUMI FORGE
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Text-based Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-xl bg-transparent border border-zinc-500 text-zinc-300 hover:text-white hover:border-accent hover:shadow-[0_0_10px_rgba(212,175,55,0.2)] font-black text-[10px] uppercase tracking-widest transition-all mr-1 min-w-[65px] flex justify-center items-center"
              title="Toggle Theme"
            >
              {theme === 'dark' ? 'DARK' : 'LIGHT'}
            </button>

            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-xl transition-all text-lg border ${showSearch ? 'bg-accent text-black border-accent scale-110 shadow-md shadow-accent/25' : 'bg-transparent border-transparent text-zinc-300 hover:bg-zinc-700 hover:text-white'}`}
              title="Search"
            >
              🔍
            </button>

            {/* Dynamic Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-all bg-transparent border border-zinc-500 text-zinc-300 hover:text-white hover:border-accent hover:shadow-[0_0_10px_rgba(212,175,55,0.2)]"
              >
                <span className="uppercase font-black tracking-widest">{currentLangObj.code}</span>
                <span className={`transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              <AnimatePresence>
                {isLangOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-36 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl z-[100]"
                  >
                    {langOptions.map((opt) => (
                      <button
                        key={opt.code}
                        onClick={() => {
                          switchLanguage(opt.code)
                          setIsLangOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all hover:bg-zinc-900 ${
                          lang === opt.code ? 'text-accent bg-zinc-900/60' : 'text-zinc-400'
                        }`}
                      >
                        <span>{opt.flag}</span>
                        <span>{opt.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {mounted && (
              user ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); logout(); }}
                    className="px-4 py-1.5 rounded-full bg-red-700/90 border border-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-[0_0_10px_rgba(185,28,28,0.2)] hover:shadow-[0_0_15px_rgba(185,28,28,0.4)] cursor-pointer"
                  >
                    {t.logout}
                  </button>
                  {adminRole && (
                    <Link
                      href="/admin"
                      className="px-4 py-1.5 rounded-full bg-gradient-to-r from-accent-light via-accent to-accent-alt text-black text-[10px] font-black uppercase tracking-widest shadow-md shadow-accent/10 hover:scale-105 transition-all"
                    >
                      {t.adminPanel}
                    </Link>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 hover:text-white text-[10px] font-black tracking-widest border border-zinc-600 transition-all uppercase"
                >
                  Login
                </Link>
              )
            )}
          </div>
        </div>
      </div>

      {/* Search Bar Overlay — Slide down */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="relative z-10 bg-zinc-950/95 backdrop-blur-2xl border-b border-zinc-900 shadow-2xl"
          >
            <div className="w-full px-4 md:px-8 py-4">
              <div className="flex items-center gap-4 bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800 focus-within:border-accent/50 transition-all">
                <span className="text-zinc-500">🔍</span>
                <input 
                  autoFocus
                  type="text" 
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  className="flex-1 bg-transparent border-none text-white placeholder-zinc-650 text-base font-bold focus:outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white text-xs font-black">✕</button>
                )}
              </div>

              {/* Error Message */}
              {errorMsg && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  className="mt-2 text-red-500 text-xs font-bold uppercase tracking-widest pl-10"
                >
                  ⚠️ {errorMsg}
                </motion.p>
              )}

              {/* Quick Results List */}
              {searchQuery && (
                <div className="mt-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {allCategories
                      .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((c) => (
                      <Link 
                        key={`${c.type}-${c.slug}`} 
                        href={`/${c.type}/${c.slug}`}
                        onClick={() => setShowSearch(false)}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase bg-zinc-900 border border-zinc-800 text-accent">
                            {c.type.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-white group-hover:text-accent transition-colors text-sm">{c.name}</h3>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5 font-bold">{c.type}</p>
                          </div>
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-accent text-xs">→</span>
                      </Link>
                    ))}
                  </div>
                  {allCategories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div className="text-center py-8 text-zinc-500 text-sm italic">{t.noResults}</div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row 2: Nav bar — semi-transparent dengan backdrop blur */}
      <div className="relative z-10 bg-gradient-to-b from-zinc-600 via-zinc-700 to-zinc-800 dark:from-[#8a660f] dark:via-[#a87f17] dark:to-[#73540a] border-b border-zinc-500 dark:border-[#6e520c] shadow-md transition-colors duration-500">
        <div className="w-full px-4 md:px-8 py-2 md:py-2.5 flex items-center justify-between">
          <nav className="flex gap-6 text-sm items-center">
            {navLinks.map(({ href, name }) => (
              <Link
                key={href}
                href={href}
                className="text-zinc-300 hover:text-accent transition-all font-black tracking-widest text-[10px] uppercase font-sans"
              >
                {name}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative text-zinc-300 hover:text-accent transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
          >
            <span>🛒</span>
            <span>{t.cart}</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-3 rounded-full bg-accent px-1.5 py-0.5 text-[9px] text-black font-black shadow-md shadow-accent/20">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
