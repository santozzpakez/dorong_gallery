import { motion } from 'framer-motion'
import { useSiteAssets } from '../lib/siteAssets'
import { useLanguage } from '../context/LanguageContext'

export default function Hero() {
  const { getUrl } = useSiteAssets()
  const { lang } = useLanguage()
  
  // Ambil URL video "Preview Galeri" dari slot pertama ('home-video')
  const homeVideo = getUrl('home-video') || '/sublimation-sample.mp4'

  const translations = {
    id: {
      livePreview: 'Live Preview',
      premiumSubli: '✨ Premium Sublimation Metal Print',
      title1: 'Your Passion,',
      title2: 'In Premium Wall Art',
      description: 'Upgrade dekorasi ruanganmu dengan poster logam berkualitas tinggi khas LUMI FORGE. Tahan lama, bebas paku (pemasangan magnetik), dan dilapisi keindahan logam eksklusif platinum dan emas champagne.',
      shopNow: 'Belanja Sekarang',
      customOrder: 'Custom Order'
    },
    en: {
      livePreview: 'Live Preview',
      premiumSubli: '✨ Premium Sublimation Metal Print',
      title1: 'Your Passion,',
      title2: 'In Premium Wall Art',
      description: 'Upgrade your room decor with premium quality metal posters from LUMI FORGE. Durable, nail-free (magnetic mounting), and coated with exclusive platinum and champagne gold beauty.',
      shopNow: 'Shop Now',
      customOrder: 'Custom Order'
    },
    jp: {
      livePreview: 'ライブプレビュー',
      premiumSubli: '✨ プレミアム昇華メタルプリント',
      title1: 'あなたの情熱を',
      title2: 'プレミアム壁アートで表現',
      description: 'LUMI FORGEの高品質金属ポスターでお部屋をアップグレード。耐久性に優れ、釘不要（磁石取付）、プラチナとシャンパンゴールドの贅沢な美しさでコーティング。',
      shopNow: '今すぐ購入',
      customOrder: 'カスタムオーダー'
    },
    kr: {
      livePreview: '라이브 미리보기',
      premiumSubli: '✨ 프리미엄 승화 메탈 프린트',
      title1: '당신의 열정을',
      title2: '프리미엄 벽화로 표현',
      description: 'LUMI FORGE의 고품질 금속 포스터로 방을 업그레이드하세요. 내구성이 뛰어나고 못 없이 설치 가능(자석 장착)하며 플래티넘과 샴페인 골드의 고급스러운 아름다움으로 코팅되어 있습니다.',
      shopNow: '지금 구매',
      customOrder: '맞춤 주문'
    },
    cn: {
      livePreview: '实时预览',
      premiumSubli: '✨ 高级升华金属印刷',
      title1: '您的热情',
      title2: '采用高级壁画艺术呈现',
      description: '用LUMI FORGE优质金属海报升级您的房间。耐用、无需钉子（磁性安装），采用铂金和香槟金的奢华美感涂层。',
      shopNow: '立即购买',
      customOrder: '定制订单'
    }
  }

  const t = translations[lang] || translations.id

  const scrollToCategories = (e) => {
    e.preventDefault()
    const target = document.getElementById('categories')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative w-full h-[70vh] lg:h-[80vh] flex items-stretch overflow-hidden bg-[var(--bg)] border-b border-zinc-900/10 dark:border-zinc-900">
      
      {/* Background Subtle Platinum Line Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.04] bg-[linear-gradient(to_right,#d4af37_1px,transparent_1px),linear-gradient(to_bottom,#d4af37_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      {/* Main 60:40 Grid Split */}
      <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-10 items-stretch">
        
        {/* 60% LEFT SIDE: Pure & Sharp Video */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-6 relative w-full h-[250px] sm:h-[350px] lg:h-full overflow-hidden bg-black"
        >
          <video
            key={homeVideo}
            src={homeVideo}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-80"
          />
          
          {/* Subtle soft boundary fade to blend into the right column beautifully on desktop */}
          <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-r from-transparent to-zinc-100 dark:to-zinc-900 z-10 hidden lg:block pointer-events-none" />
          
          {/* Bottom transition fade for mobile view */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-100 dark:from-zinc-900 to-transparent z-10 block lg:hidden pointer-events-none" />

          {/* Glowing gold status badge on video */}
          <div className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-accent/30 text-[9px] text-accent font-black uppercase tracking-widest font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgb(var(--accent-main)/0.8)]" />
            {t.livePreview}
          </div>
        </motion.div>

        {/* 40% RIGHT SIDE: Content Copywriting */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="lg:col-span-4 flex flex-col justify-center p-8 sm:p-10 lg:p-14 space-y-6 text-left bg-gradient-to-br from-zinc-100 to-zinc-300 dark:from-zinc-900 dark:to-zinc-950 relative border-t lg:border-t-0 lg:border-l border-zinc-300 dark:border-zinc-800"
        >
          {/* Inner gold glow orb */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-accent/5 rounded-full filter blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/35 text-accent text-[10px] font-black uppercase tracking-widest font-sans">
              {t.premiumSubli}
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[0.95] uppercase font-sans text-[var(--text-main)]">
              {t.title1}<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark font-serif filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_2px_8px_rgb(var(--accent-main)/0.2)]">
                {t.title2}
              </span>
            </h1>
            
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-sans tracking-wide leading-relaxed font-bold">
              {t.description}
            </p>

            <div className="pt-3 flex flex-wrap gap-3">
              <a 
                href="#categories" 
                onClick={scrollToCategories}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-light via-accent to-accent-alt text-black font-black text-[10px] uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-md shadow-accent/15 cursor-pointer"
              >
                {t.shopNow}
              </a>
              <a 
                href="/custom" 
                className="px-6 py-3 rounded-xl border border-accent/30 hover:bg-accent/5 text-[var(--text-main)] font-black text-[10px] uppercase tracking-widest transition-all duration-300 hover:scale-105"
              >
                {t.customOrder}
              </a>
            </div>
          </div>
        </motion.div>

      </div>
      
    </section>
  )
}
