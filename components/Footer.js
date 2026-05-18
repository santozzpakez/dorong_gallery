import { useLanguage } from '../context/LanguageContext'
import { useSiteAssets } from '../lib/siteAssets'
import Link from 'next/link'

export default function Footer() {
  const { getUrl } = useSiteAssets()
  const { lang } = useLanguage()
  const footerBg = getUrl('footer-bg')

  const translations = {
    id: {
      home: 'Beranda',
      anime: 'Anime',
      kpop: 'K-pop',
      aesthetic: 'Aesthetic',
      custom: 'Custom',
      catalog: 'Katalog',
      cart: 'Keranjang',
      rights: 'Hak cipta dilindungi undang-undang'
    },
    en: {
      home: 'Home',
      anime: 'Anime',
      kpop: 'K-pop',
      aesthetic: 'Aesthetic',
      custom: 'Custom',
      catalog: 'Catalog',
      cart: 'Cart',
      rights: 'All rights reserved'
    },
    jp: {
      home: 'ホーム',
      anime: 'アニメ',
      kpop: 'K-POP',
      aesthetic: 'エステティック',
      custom: 'カスタム',
      catalog: 'カタログ',
      cart: 'カート',
      rights: '全著作権所有'
    },
    kr: {
      home: '홈',
      anime: '애니메이션',
      kpop: 'K-팝',
      aesthetic: '에스테틱',
      custom: '커스텀',
      catalog: '카탈로그',
      cart: '장바구니',
      rights: '모든 권리 보유'
    },
    cn: {
      home: '首页',
      anime: '动漫',
      kpop: '韩流',
      aesthetic: '美学',
      custom: '定制',
      catalog: '目录',
      cart: '购物车',
      rights: '版权所有'
    }
  }

  const t = translations[lang] || translations.id

  const navLinks = [
    { href: '/', label: t.home },
    { href: '/anime', label: t.anime },
    { href: '/kpop', label: t.kpop },
    { href: '/aesthetic', label: t.aesthetic },
    { href: '/custom', label: t.custom },
    { href: '/katalog', label: t.catalog },
    { href: '/cart', label: t.cart },
  ]

  return (
    <footer className="relative mt-20 overflow-hidden">
      {/* Background image layer */}
      {footerBg && (
        <div
          className="absolute inset-0 bg-cover bg-center z-0 opacity-15"
          style={{ backgroundImage: `url(${footerBg})` }}
        />
      )}

      {/* Row 1: Top accent bar — thin golden divider */}
      <div className="relative z-10 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/35 to-transparent" />

      {/* Row 2: Main footer content */}
      <div className="relative z-10 bg-gradient-to-b from-[#08080a] to-[#020203] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Brand row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
            <div>
              <span className="text-2xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-b from-[#f3e5ab] via-[#d4af37] to-[#aa7c11] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-serif">
                LUMI FORGE
              </span>
              <p className="text-[9px] text-zinc-500 mt-1.5 uppercase tracking-[0.25em] font-sans">
                PREMIUM COLLECTIBLE METAL PRINTS
              </p>
            </div>

            {/* Nav links */}
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-zinc-400 hover:text-[#d4af37] transition-all font-black tracking-widest text-[10px] uppercase font-sans"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Divider */}
          <div className="h-px bg-zinc-900 mb-8" />

          {/* Row 3: Social & contact */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex gap-6 text-zinc-500">
              <a href="#" className="hover:text-[#d4af37] transition-colors font-black text-[9px] tracking-widest uppercase font-sans">Instagram</a>
              <a href="#" className="hover:text-[#d4af37] transition-colors font-black text-[9px] tracking-widest uppercase font-sans">Twitter</a>
              <a href="#" className="hover:text-[#d4af37] transition-colors font-black text-[9px] tracking-widest uppercase font-sans">Facebook</a>
            </div>
            <div className="text-zinc-500 text-[10px] font-black tracking-widest uppercase font-sans">
              Contact: <a href="mailto:hello@lumiforge.com" className="hover:text-[#d4af37] text-zinc-400 transition-colors ml-1">hello@lumiforge.com</a>
            </div>
          </div>

          {/* Row 4: Copyright */}
          <div className="mt-8 text-center">
            <p className="text-[10px] text-zinc-600 font-sans tracking-wide">
              © {new Date().getFullYear()} LUMI FORGE — {t.rights}
            </p>
            {/* Elegant thin bronze line */}
            <div className="mt-6 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/15 to-transparent" />
          </div>
        </div>
      </div>
    </footer>
  )
}
