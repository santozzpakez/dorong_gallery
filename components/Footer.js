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
          className="absolute inset-0 bg-cover bg-center z-0 opacity-30"
          style={{ backgroundImage: `url(${footerBg})` }}
        />
      )}

      {/* Row 1: Top accent bar — neon pink-purple */}
      <div className="relative z-10 h-1 bg-gradient-to-r from-[#ff007f] via-[#9d4edd] to-[#00b4d8] dark:from-neon-pink dark:via-neon-purple dark:to-neon-cyan" />

      {/* Row 2: Main footer content */}
      <div className="relative z-10 bg-gradient-to-b from-[#1a0033] to-[#0d001a] dark:from-[#0a0012] dark:to-[#050008] py-10 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Brand row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div>
              <span
                className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#ff007f] via-[#9d4edd] to-[#00b4d8]"
                style={{ WebkitTextFillColor: 'transparent' }}
              >
                DORONG
              </span>
              <p className="text-xs text-purple-300/70 mt-1 font-mono tracking-widest">Premium Wall Art Gallery</p>
            </div>

            {/* Nav links */}
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-purple-300/70 hover:text-[#ff007f] dark:hover:text-neon-pink transition-colors hover:drop-shadow-[0_0_6px_rgba(255,0,127,0.7)]"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#9d4edd]/40 to-transparent mb-6" />

          {/* Row 3: Social & contact */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex gap-5 text-purple-300/60">
              <a href="#" className="hover:text-[#ff007f] dark:hover:text-neon-pink transition-colors hover:drop-shadow-[0_0_6px_rgba(255,0,127,0.7)]">Instagram</a>
              <a href="#" className="hover:text-[#9d4edd] dark:hover:text-neon-purple transition-colors hover:drop-shadow-[0_0_6px_rgba(157,78,221,0.7)]">Twitter</a>
              <a href="#" className="hover:text-[#00b4d8] dark:hover:text-neon-cyan transition-colors hover:drop-shadow-[0_0_6px_rgba(0,180,216,0.7)]">Facebook</a>
            </div>
            <div className="text-purple-300/60 text-xs">
              Contact: <a href="mailto:hello@dorong.gallery" className="hover:text-white transition-colors">hello@dorong.gallery</a>
            </div>
          </div>

          {/* Row 4: Copyright */}
          <div className="mt-6 text-center">
            <p className="text-xs text-purple-400/40 font-mono">
              © {new Date().getFullYear()} Dorong Gallery — {t.rights}
            </p>
            {/* Glow line bottom */}
            <div className="mt-4 h-px bg-gradient-to-r from-transparent via-[#ff007f]/30 to-transparent" />
          </div>
        </div>
      </div>
    </footer>
  )
}
