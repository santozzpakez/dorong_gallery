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
                <span className="text-xl font-black tracking-widest text-[#d4af37] font-serif">MENU</span>
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
                    className="flex items-center gap-4 px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest text-zinc-400 hover:text-[#d4af37] hover:bg-zinc-900/40 transition-all font-sans"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]/45"></span>
                    {link.name}
                  </Link>
                ))}
              </nav>

              <div className="p-6 border-t border-zinc-900 space-y-4">
                {user ? (
                  <div className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                    <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/35 flex items-center justify-center text-[#d4af37] font-black uppercase">
                      {user.email ? user.email.charAt(0) : (user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0) : 'U')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black truncate text-white">
                        {user.user_metadata?.full_name || user.email || user.phone}
                      </p>
                      <button onClick={logout} className="text-[9px] text-red-500 font-black uppercase tracking-widest hover:text-red-400 mt-0.5">Logout</button>
                    </div>
                  </div>
                ) : (
                  <Link 
                    href="/login" 
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center justify-center w-full py-4 rounded-2xl bg-gradient-to-r from-[#f3e5ab] via-[#d4af37] to-[#b39359] text-black font-black uppercase tracking-widest shadow-lg shadow-[#d4af37]/10"
                  >
                    Login
                  </Link>
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
                  <span className="text-xl font-black tracking-widest text-[#d4af37] font-serif">CART</span>
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
                      className="mt-6 text-[10px] font-black uppercase tracking-widest text-[#d4af37] hover:underline"
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
                          <p className="text-[10px] font-bold text-[#d4af37]">Rp {item.price.toLocaleString('id-ID')}</p>
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
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#f3e5ab] via-[#d4af37] to-[#b39359] text-black font-black uppercase tracking-widest shadow-xl shadow-[#d4af37]/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
      <div className="relative z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-900/65 shadow-lg">
        <div className="w-full px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 hover:bg-zinc-900 rounded-lg transition-colors group border border-zinc-800/40"
            >
              <div className="space-y-1.5">
                <span className="block w-5 h-0.5 bg-[#d4af37] rounded-full transition-transform group-hover:w-6"></span>
                <span className="block w-6 h-0.5 bg-[#d4af37] rounded-full transition-transform"></span>
                <span className="block w-4 h-0.5 bg-[#d4af37] rounded-full transition-transform group-hover:w-6"></span>
              </div>
            </button>

            {/* Animated Slide Toggle for Theme */}
            <button
              onClick={toggleTheme}
              className="relative w-10 h-5 rounded-full p-0.5 transition-colors duration-500 focus:outline-none flex-shrink-0 bg-zinc-900 border border-zinc-800"
              title="Toggle Light/Dark Mode"
            >
              <motion.div
                animate={{ x: theme === 'dark' ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] bg-[#d4af37] text-black shadow-md font-bold"
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </motion.div>
            </button>

            <Link href="/" className="flex items-center gap-4 group">
              {getUrl('logo') ? (
                <img
                  src={getUrl('logo')}
                  alt="Lumi Forge Logo"
                  className="h-10 w-auto md:h-14 object-contain transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="h-10 w-10 md:h-14 md:w-14 rounded-2xl bg-gradient-to-br from-[#f3e5ab] via-[#d4af37] to-[#aa7c11] flex items-center justify-center text-black font-black text-sm md:text-lg shadow-lg border border-[#d4af37]/30 transition-transform duration-300 group-hover:scale-105">
                  LF
                </div>
              )}
              <span className="text-2xl md:text-3xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-[#f3e5ab] via-[#d4af37] to-[#aa7c11] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-serif">
                LUMI FORGE
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-1.5 rounded-full transition-all text-sm border ${showSearch ? 'bg-[#d4af37] text-black border-[#d4af37] scale-110 shadow-md shadow-[#d4af37]/25' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}`}
              title="Search"
            >
              🔍
            </button>

            {/* Dynamic Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black transition-all bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
              >
                <span>{currentLangObj.flag}</span>
                <span className="uppercase">{currentLangObj.code}</span>
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
                          lang === opt.code ? 'text-[#d4af37] bg-zinc-900/60' : 'text-zinc-400'
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

            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={logout}
                  className="px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all hover:text-white"
                >
                  {t.logout}
                </button>
                {(user.email === 'admin@dorong.gallery' || adminRole) && (
                  <Link
                    href="/admin"
                    className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#f3e5ab] via-[#d4af37] to-[#b39359] text-black text-[10px] font-black uppercase tracking-widest shadow-md shadow-[#d4af37]/10 hover:scale-105 transition-all"
                  >
                    {t.adminPanel}
                  </Link>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-black tracking-widest border border-zinc-850 transition-all uppercase"
              >
                Login
              </Link>
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
              <div className="flex items-center gap-4 bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800 focus-within:border-[#d4af37]/50 transition-all">
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
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase bg-zinc-900 border border-zinc-800 text-[#d4af37]">
                            {c.type.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-white group-hover:text-[#d4af37] transition-colors text-sm">{c.name}</h3>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5 font-bold">{c.type}</p>
                          </div>
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#d4af37] text-xs">→</span>
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
      <div className="relative z-10 bg-black/90 backdrop-blur-md border-b border-[#d4af37]/20 shadow-md">
        <div className="w-full px-4 md:px-8 py-3 flex items-center justify-between">
          <nav className="flex gap-6 text-sm items-center">
            {navLinks.map(({ href, name }) => (
              <Link
                key={href}
                href={href}
                className="text-zinc-400 hover:text-[#d4af37] transition-all font-black tracking-widest text-[10px] uppercase font-sans"
              >
                {name}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative text-zinc-400 hover:text-[#d4af37] transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
          >
            <span>🛒</span>
            <span>{t.cart}</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-3 rounded-full bg-[#d4af37] px-1.5 py-0.5 text-[9px] text-black font-black shadow-md shadow-[#d4af37]/20">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
