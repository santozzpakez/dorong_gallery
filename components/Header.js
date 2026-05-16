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
    { name: 'Decor', href: '/decor' },
  ]

  useEffect(() => {
    if (showSearch) {
      // ... (existing load logic)
      const STORAGE_TYPES = 'dorong_admin_type_options'
      try {
        const raw = localStorage.getItem(STORAGE_TYPES)
        if (raw) {
          const parsed = JSON.parse(raw)
          const cats = []
          if (parsed.anime) parsed.anime.forEach(name => cats.push({ name, type: 'anime', slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))
          if (parsed.kpop) parsed.kpop.forEach(name => cats.push({ name, type: 'kpop', slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))
          const decorCats = ['Japanese Street', 'Café Aesthetic', 'Gaming Room', 'Minimalist', 'Dark Luxury', 'Nature', 'Retro Vintage', 'Lofi & Music']
          decorCats.forEach(name => cats.push({ name, type: 'decor', slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))
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

      // Cari hasil yang mengandung query
      const matches = allCategories.filter(c => c.name.toLowerCase().includes(query))
      
      // Jika ada yang match persis atau hanya ada 1 hasil
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

  const headerBg = getUrl('header-bg')
// ... (existing translations and return)

  const translations = {
    id: {
      home: 'Beranda',
      anime: 'Anime',
      kpop: 'K-pop',
      decor: 'Decor',
      custom: 'Custom',
      catalog: 'Katalog',
      cart: 'Keranjang',
      searchPlaceholder: 'Cari anime, k-pop, atau decor...',
      noResults: 'Hasil tidak ditemukan...',
      logout: 'Keluar',
      adminPanel: 'Panel Admin'
    },
    en: {
      home: 'Home',
      anime: 'Anime',
      kpop: 'K-pop',
      decor: 'Decor',
      custom: 'Custom',
      catalog: 'Catalog',
      cart: 'Cart',
      searchPlaceholder: 'Search anime, k-pop, or decor...',
      noResults: 'No results found...',
      logout: 'Logout',
      adminPanel: 'Admin Panel'
    },
    jp: {
      home: 'ホーム',
      anime: 'アニメ',
      kpop: 'K-POP',
      decor: 'デコレーション',
      custom: 'カスタム',
      catalog: 'カタログ',
      cart: 'カート',
      searchPlaceholder: 'アニメ、K-POP、デコを検索...',
      noResults: '結果が見つかりません...',
      logout: 'ログアウト',
      adminPanel: '管理パネル'
    },
    kr: {
      home: '홈',
      anime: '애니메이션',
      kpop: 'K-팝',
      decor: '데코',
      custom: '커스텀',
      catalog: '카탈로그',
      cart: '장바구니',
      searchPlaceholder: '애니메이션, K-팝, 데코 검색...',
      noResults: '결과를 menemukan 수 없습니다...',
      logout: '로그아웃',
      adminPanel: '관리 패널'
    },
    cn: {
      home: '首页',
      anime: '动漫',
      kpop: '韩流',
      decor: '装饰',
      custom: '定制',
      catalog: '目录',
      cart: '购物车',
      searchPlaceholder: '搜索动漫、韩流或装饰...',
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 left-0 bottom-0 w-[280px] z-[70] shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-[#0d031a] border-r border-white/5' : 'bg-white border-r border-slate-200'}`}
            >
              <div className="p-6 flex items-center justify-between border-b border-white/5">
                <span className={`text-xl font-black tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>MENU</span>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
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
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${theme === 'dark' ? 'text-white/70 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan/40"></span>
                    {link.name}
                  </Link>
                ))}
              </nav>

              <div className="p-6 border-t border-white/5 space-y-4">
                {user ? (
                  <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center text-neon-cyan font-black uppercase">
                      {user.email ? user.email.charAt(0) : (user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0) : 'U')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {user.user_metadata?.full_name || user.email || user.phone}
                      </p>
                      <button onClick={logout} className="text-[9px] text-red-400 font-black uppercase tracking-widest hover:text-red-300">Logout</button>
                    </div>
                  </div>
                ) : (
                  <Link 
                    href="/login" 
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center justify-center w-full py-4 rounded-2xl bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-black uppercase tracking-widest shadow-lg shadow-neon-purple/20"
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 right-0 bottom-0 w-[350px] max-w-[90vw] z-[70] shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-[#0d031a] border-l border-white/5' : 'bg-white border-l border-slate-200'}`}
            >
              <div className="p-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🛒</span>
                  <span className={`text-xl font-black tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>CART</span>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                >
                  ✕
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="text-5xl mb-4 opacity-20">🛒</div>
                    <p className={`text-sm font-bold opacity-40 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {lang === 'id' ? 'Keranjangmu masih kosong' : 'Your cart is empty'}
                    </p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="mt-6 text-[10px] font-black uppercase tracking-widest text-neon-cyan hover:underline"
                    >
                      {lang === 'id' ? 'Mulai Belanja' : 'Start Shopping'}
                    </button>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className={`flex gap-4 p-3 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="w-16 h-20 rounded-lg overflow-hidden bg-black flex-shrink-0">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className={`text-[11px] font-black uppercase tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                          <p className="text-[10px] font-bold text-neon-pink">Rp {item.price.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 bg-black/20 rounded-lg px-2 py-1">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-white hover:text-neon-cyan transition-colors">−</button>
                            <span className="text-[10px] font-black text-white w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-white hover:text-neon-cyan transition-colors">+</button>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="text-[9px] font-black uppercase text-red-500/60 hover:text-red-500 transition-colors">Hapus</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className={`p-6 border-t ${theme === 'dark' ? 'border-white/5 bg-black/40' : 'border-slate-100 bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Total</span>
                    <span className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Rp {totalPrice.toLocaleString('id-ID')}</span>
                  </div>
                  <button 
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-black uppercase tracking-widest shadow-xl shadow-neon-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
      <div className="relative z-30 bg-gradient-to-r from-[#6d0099] via-[#9d4edd] to-[#ff007f] dark:from-[#3a0066] dark:via-[#7b00cc] dark:to-[#cc0066]">
        <div className="max-w-6xl mx-auto px-6 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors group"
            >
              <div className="space-y-1.5">
                <span className="block w-5 h-0.5 bg-white rounded-full transition-transform group-hover:w-6"></span>
                <span className="block w-6 h-0.5 bg-white rounded-full transition-transform"></span>
                <span className="block w-4 h-0.5 bg-white rounded-full transition-transform group-hover:w-6"></span>
              </div>
            </button>

            {/* Animated Slide Toggle for Theme */}
            <button
              onClick={toggleTheme}
              className={`relative w-10 h-5 rounded-full p-0.5 transition-colors duration-500 focus:outline-none flex-shrink-0 ${theme === 'dark' ? 'bg-[#1a0033] border border-neon-purple/50 shadow-[0_0_10px_rgba(176,38,255,0.2)]' : 'bg-slate-200 border border-slate-300 shadow-sm'}`}
              title="Toggle Light/Dark Mode"
            >
              <motion.div
                animate={{ x: theme === 'dark' ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] shadow-lg ${theme === 'dark' ? 'bg-neon-purple text-white shadow-[0_0_10px_rgba(176,38,255,0.8)]' : 'bg-white text-slate-600 shadow-md'}`}
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </motion.div>
            </button>

            <Link
              href="/"
              className="text-xl md:text-2xl font-black tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]"
              style={{ textShadow: '0 0-12px rgba(255,255,255,0.8), 0 0 24px rgba(255,0,127,0.6)' }}
            >
              DORONG
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-1.5 rounded-full transition-all text-sm ${showSearch ? 'bg-white text-black scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'bg-white/20 text-white hover:bg-white/30'}`}
              title="Search"
            >
              🔍
            </button>

            {/* Dynamic Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black transition-all bg-black/20 border border-white/10 text-white hover:bg-white/10`}
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
                    className="absolute right-0 mt-2 w-36 bg-[#1a0033]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[100]"
                  >
                    {langOptions.map((opt) => (
                      <button
                        key={opt.code}
                        onClick={() => {
                          switchLanguage(opt.code)
                          setIsLangOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all hover:bg-white/10 ${
                          lang === opt.code ? 'text-neon-cyan bg-white/5' : 'text-white/70'
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
                  className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                >
                  {t.logout}
                </button>
                {user.email === 'admin@dorong.gallery' && (
                  <Link
                    href="/admin/tema"
                    className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    {t.adminPanel}
                  </Link>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-[10px] font-black tracking-widest border border-white/40 transition-all uppercase"
              >
                Login
              </Link>
            )}

            {adminRole && (
              <Link
                href="/admin"
                className="px-3 py-1 rounded bg-purple-600/40 hover:bg-purple-600/60 text-white text-[10px] font-black tracking-widest border border-purple-500/60 transition-all uppercase shadow-lg shadow-purple-500/20"
              >
                Admin Panel
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
            className="relative z-10 bg-[#1a0033]/95 dark:bg-black/90 backdrop-blur-2xl border-b border-white/10 shadow-2xl"
          >
            <div className="max-w-6xl mx-auto px-6 py-4">
              <div className="flex items-center gap-4 bg-white/5 rounded-2xl px-4 py-3 border border-white/10 focus-within:border-neon-cyan transition-all">
                <span className="text-white opacity-40">🔍</span>
                <input 
                  autoFocus
                  type="text" 
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  className="flex-1 bg-transparent border-none text-white placeholder-white/40 text-base font-bold focus:outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white text-xs font-black">✕</button>
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
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase ${
                            c.type === 'anime' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' :
                            c.type === 'kpop' ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30' :
                            'bg-neon-pink/20 text-neon-pink border border-neon-pink/30'
                          }`}>
                            {c.type.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-white group-hover:text-neon-cyan transition-colors text-sm">{c.name}</h3>
                            <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">{c.type}</p>
                          </div>
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-neon-cyan text-xs">→</span>
                      </Link>
                    ))}
                  </div>
                  {allCategories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div className="text-center py-8 text-white/40 text-sm italic">{t.noResults}</div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row 2: Nav bar — semi-transparent dengan backdrop blur */}
      <div className="relative z-10 bg-gradient-to-r from-[#2d0050]/90 via-[#1a0033]/90 to-[#4a0030]/90 dark:from-black/80 dark:via-[#0d0020]/80 dark:to-black/80 backdrop-blur-md border-b border-[#ff007f]/30 dark:border-neon-purple/30">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <nav className="flex gap-6 text-sm items-center">
            {[
              { href: '/', label: t.home },
              { href: '/anime', label: t.anime },
              { href: '/kpop', label: t.kpop },
              { href: '/decor', label: t.decor },
              { href: '/custom', label: t.custom },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-white/80 hover:text-white transition-colors font-medium tracking-wide hover:drop-shadow-[0_0_6px_rgba(255,0,127,0.8)]"
              >
                {label}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative text-white/80 hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
          >
            <span className="text-lg">🛒</span>
            <span>{t.cart}</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-3 rounded-full bg-[#ff007f] dark:bg-neon-pink px-1.5 py-0.5 text-[10px] text-white font-bold shadow-[0_0_8px_rgba(255,0,127,0.6)]">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
