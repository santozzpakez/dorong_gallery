import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import Hero from '../components/Hero'
import FeaturedCarousel from '../components/FeaturedCarousel'
import ShopGallery from '../components/ShopGallery'
import Footer from '../components/Footer'
import { useSiteAssets } from '../lib/siteAssets'
import { useLanguage } from '../context/LanguageContext'

export default function Home(){
  const { getUrl } = useSiteAssets()
  const { lang } = useLanguage()

  const translations = {
    id: {
      noImage: 'Tidak Ada Gambar',
      anime: 'ANIME',
      animeSubtitle: 'SENI & KERAJINAN',
      kpop: 'K-POP',
      kpopSubtitle: 'MUSIK & PERTUNJUKAN',
      aesthetic: 'AESTHETIC',
      aestheticSubtitle: 'SENI & DEKORASI',
      custom: 'CUSTOM',
      customSubtitle: 'KERAJINAN & DESAIN'
    },
    en: {
      noImage: 'No Image',
      anime: 'ANIME',
      animeSubtitle: 'ART & CRAFT',
      kpop: 'K-POP',
      kpopSubtitle: 'MUSIC & PERFORMANCE',
      aesthetic: 'AESTHETIC',
      aestheticSubtitle: 'ART & DECOR',
      custom: 'CUSTOM',
      customSubtitle: 'CRAFT & DESIGN'
    },
    jp: {
      noImage: '画像なし',
      anime: '- アニメ -',
      animeSubtitle: 'アート & クラフト',
      kpop: 'K-POP',
      kpopSubtitle: 'ミュージック & パフォーマンス',
      aesthetic: '- エステティック -',
      aestheticSubtitle: 'アート & デコ',
      custom: '- カスタム -',
      customSubtitle: 'クラフト & デザイン'
    },
    kr: {
      noImage: '이미지 없음',
      anime: '- 애니메이션 -',
      animeSubtitle: '아트 & 크래프트',
      kpop: '- K-팝 -',
      kpopSubtitle: '뮤직 & 퍼포먼스',
      aesthetic: '- 에스테틱 -',
      aestheticSubtitle: '아트 & 데코',
      custom: '- 커스텀 -',
      customSubtitle: '크래프트 & 디자인'
    },
    cn: {
      noImage: '无图片',
      anime: '- 动漫 -',
      animeSubtitle: '艺术 & 手工',
      kpop: '- 韩流 -',
      kpopSubtitle: '音乐 & 表演',
      aesthetic: '- 美学 -',
      aestheticSubtitle: '艺术 & 装饰',
      custom: '- 定制 -',
      customSubtitle: '工艺 & 设计'
    }
  }

  const t = translations[lang] || translations.id

  return (
    <>
      <Head>
        <title>LUMI FORGE — Premium Collectible Metal Prints</title>
        <meta name="description" content="Premium anime, k-pop, decor posters & sublimation printing" />
      </Head>
      <Header />
      <main className="pt-28 bg-[var(--bg)] min-h-screen transition-colors duration-300">
        <Hero />

        {/* Section Koleksi dengan Background Adaptif & Garis Pembatas */}
        <section id="categories" className="relative overflow-hidden border-b border-zinc-900/10 dark:border-zinc-900 bg-gradient-to-b from-[var(--bg)] via-zinc-50 dark:via-[#0a0a0c] to-[var(--bg)] py-24">
          
          {/* Subtle Premium Dot Pattern Texture */}
          <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(var(--accent-main)) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

          {/* Polished Dark Desk Metallic Ground Surface Shadow */}
          <div className="absolute bottom-0 left-0 w-full h-80 bg-gradient-to-t from-transparent via-accent/5 to-transparent pointer-events-none z-0" />

          {/* Premium Serif Ribbon Header Bar */}
          <div className="w-full mb-12 py-12 flex flex-col justify-center items-center relative overflow-hidden z-10 px-4">
            {/* Horizontal Vignette Background - Smooth Edges */}
            <div className="absolute inset-y-0 left-0 w-[25%] md:w-[35%] bg-gradient-to-r from-zinc-700/15 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-[25%] md:w-[35%] bg-gradient-to-l from-zinc-700/15 to-transparent pointer-events-none" />
            
            {/* Background Glow Behind Title */}
            <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-gradient-to-r from-transparent via-accent/5 dark:via-accent/10 to-transparent blur-3xl pointer-events-none" />
            
            <div className="relative flex flex-col items-center">
              <span className="px-8 py-2.5 rounded-full border border-yellow-200/50 bg-gradient-to-r from-[#aa771c] via-[#f4d068] to-[#aa771c] text-[9px] md:text-xs font-black uppercase tracking-[0.4em] text-black mb-8 font-serif shadow-[0_4px_20px_rgba(212,175,55,0.4)] flex items-center gap-3 relative overflow-hidden">
                {/* Sheen effect over the gold */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                <span className="relative z-10 text-black/70">✧</span>
                <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">META-GRAPHICS PREMIUM COLLECTION</span>
                <span className="relative z-10 text-black/70">✧</span>
              </span>
              
              <h2 className="relative z-10 text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-[#dfb342] via-[#bf953f] to-[#8a5d19] font-serif text-center filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.25)] dark:drop-shadow-[0_2px_15px_rgba(212,175,55,0.4)]">
                COLLECTIONS
              </h2>
              
              {/* Elegant Royal Divider Line */}
              <div className="flex items-center gap-6 md:gap-10 w-full max-w-[95%] mx-auto mt-10">
                <div className="h-[2px] flex-grow bg-gradient-to-r from-transparent via-accent/60 to-accent shadow-[0_0_5px_rgba(212,175,55,0.3)]" />
                <div className="w-3 h-3 rotate-45 border-2 border-accent shadow-[0_0_10px_rgba(212,175,55,0.6)]" />
                <div className="w-2.5 h-2.5 rotate-45 bg-accent shadow-[0_0_12px_rgba(212,175,55,0.8)]" />
                <div className="w-3 h-3 rotate-45 border-2 border-accent shadow-[0_0_10px_rgba(212,175,55,0.6)]" />
                <div className="h-[2px] flex-grow bg-gradient-to-l from-transparent via-accent/60 to-accent shadow-[0_0_5px_rgba(212,175,55,0.3)]" />
              </div>
            </div>
          </div>

          {/* 3D Skewed Brushed-Metal Cards Deck with Desk Background */}
          <div className="relative w-full bg-cover bg-center bg-no-repeat overflow-hidden pt-16 pb-[14rem] md:pb-[18rem]" style={{ backgroundImage: "url('/bg-desk.png')" }}>
            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8" >
              <div className="flex flex-col md:flex-row justify-center items-center gap-10 md:gap-6 lg:gap-10" >
              
              {/* CARD 1: ANIME */}
              <Link 
                href="/anime" 
                style={{ backgroundImage: "url('/wood-texture.png')" }}
                className="group relative w-full md:w-[20%] lg:w-[18%] aspect-[4/5] rounded-sm bg-cover bg-center shadow-[-20px_20px_30px_rgba(0,0,0,0.4)] hover:shadow-[-30px_30px_50px_rgba(0,0,0,0.6)] transition-all duration-700 ease-out cursor-pointer md:[transform:perspective(2000px)_rotateY(-55deg)_rotateX(5deg)] hover:!transform-none z-10 hover:z-50"
              >
                
                
                
                {/* Wood Frame Miter Joints & Grooves */}
                <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                  {/* 4 Diagonal Corner Seams (Miter Joints) */}
                  <div className="absolute top-0 left-0 w-[23px] h-[2px] bg-black/80 origin-top-left rotate-45" />
                  <div className="absolute top-0 right-0 w-[23px] h-[2px] bg-black/80 origin-top-right -rotate-45" />
                  <div className="absolute bottom-0 left-0 w-[23px] h-[2px] bg-black/80 origin-bottom-left -rotate-45" />
                  <div className="absolute bottom-0 right-0 w-[23px] h-[2px] bg-black/80 origin-bottom-right rotate-45" />
                  
                  {/* Decorative Carved Grooves */}
                  <div className="absolute inset-[6px] border border-black/70 shadow-[0_1px_1px_rgba(255,255,255,0.2)] rounded-sm" />
                  <div className="absolute inset-[10px] border border-black/40 rounded-sm" />
                  <div className="absolute inset-0 border-[2px] border-white/20 rounded-sm" />
                </div>
                
                {/* Frame Inner Contents (Wrapped for overflow) */}
                <div className="absolute inset-[16px] overflow-hidden rounded-[14px] bg-gradient-to-br from-zinc-50 via-zinc-200 to-zinc-400 dark:from-zinc-300 dark:via-zinc-400 dark:to-zinc-500 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-20 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-[75%] overflow-hidden">
                  {getUrl("cover-anime") ? (
                    <img src={getUrl("cover-anime")} alt="Anime" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-all duration-700 ease-out"  />
                  ) : (
                    <div className="w-full h-full bg-zinc-800"  />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[35%] flex flex-col justify-end items-center pb-5 z-10 pointer-events-none">
                  <h3 className="text-2xl lg:text-3xl font-serif text-zinc-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide">{t.anime}</h3>
                  
                </div>
                </div>
              </Link>

              {/* CARD 2: K-POP */}
              <Link 
                href="/kpop" 
                style={{ backgroundImage: "url('/wood-texture.png')" }}
                className="group relative w-full md:w-[20%] lg:w-[18%] aspect-[4/5] rounded-sm bg-cover bg-center shadow-[-20px_20px_30px_rgba(0,0,0,0.4)] hover:shadow-[-30px_30px_50px_rgba(0,0,0,0.6)] transition-all duration-700 ease-out cursor-pointer md:[transform:perspective(2000px)_rotateY(-55deg)_rotateX(5deg)] hover:!transform-none z-10 hover:z-50"
              >
                
                
                
                {/* Wood Frame Miter Joints & Grooves */}
                <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                  {/* 4 Diagonal Corner Seams (Miter Joints) */}
                  <div className="absolute top-0 left-0 w-[23px] h-[2px] bg-black/80 origin-top-left rotate-45" />
                  <div className="absolute top-0 right-0 w-[23px] h-[2px] bg-black/80 origin-top-right -rotate-45" />
                  <div className="absolute bottom-0 left-0 w-[23px] h-[2px] bg-black/80 origin-bottom-left -rotate-45" />
                  <div className="absolute bottom-0 right-0 w-[23px] h-[2px] bg-black/80 origin-bottom-right rotate-45" />
                  
                  {/* Decorative Carved Grooves */}
                  <div className="absolute inset-[6px] border border-black/70 shadow-[0_1px_1px_rgba(255,255,255,0.2)] rounded-sm" />
                  <div className="absolute inset-[10px] border border-black/40 rounded-sm" />
                  <div className="absolute inset-0 border-[2px] border-white/20 rounded-sm" />
                </div>
                
                {/* Frame Inner Contents (Wrapped for overflow) */}
                <div className="absolute inset-[16px] overflow-hidden rounded-[14px] bg-gradient-to-br from-zinc-50 via-zinc-200 to-zinc-400 dark:from-zinc-300 dark:via-zinc-400 dark:to-zinc-500 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-20 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-[75%] overflow-hidden">
                  {getUrl("cover-kpop") ? (
                    <img src={getUrl("cover-kpop")} alt="K-Pop" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-all duration-700 ease-out"  />
                  ) : (
                    <div className="w-full h-full bg-zinc-800"  />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[35%] flex flex-col justify-end items-center pb-5 z-10 pointer-events-none">
                  <h3 className="text-2xl lg:text-3xl font-serif text-zinc-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide">{t.kpop}</h3>
                  
                </div>
                </div>
              </Link>

              {/* CARD 3: AESTHETIC */}
              <Link 
                href="/aesthetic" 
                style={{ backgroundImage: "url('/wood-texture.png')" }}
                className="group relative w-full md:w-[20%] lg:w-[18%] aspect-[4/5] rounded-sm bg-cover bg-center shadow-[-20px_20px_30px_rgba(0,0,0,0.4)] hover:shadow-[-30px_30px_50px_rgba(0,0,0,0.6)] transition-all duration-700 ease-out cursor-pointer md:[transform:perspective(2000px)_rotateY(-55deg)_rotateX(5deg)] hover:!transform-none z-10 hover:z-50"
              >
                
                
                
                {/* Wood Frame Miter Joints & Grooves */}
                <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                  {/* 4 Diagonal Corner Seams (Miter Joints) */}
                  <div className="absolute top-0 left-0 w-[23px] h-[2px] bg-black/80 origin-top-left rotate-45" />
                  <div className="absolute top-0 right-0 w-[23px] h-[2px] bg-black/80 origin-top-right -rotate-45" />
                  <div className="absolute bottom-0 left-0 w-[23px] h-[2px] bg-black/80 origin-bottom-left -rotate-45" />
                  <div className="absolute bottom-0 right-0 w-[23px] h-[2px] bg-black/80 origin-bottom-right rotate-45" />
                  
                  {/* Decorative Carved Grooves */}
                  <div className="absolute inset-[6px] border border-black/70 shadow-[0_1px_1px_rgba(255,255,255,0.2)] rounded-sm" />
                  <div className="absolute inset-[10px] border border-black/40 rounded-sm" />
                  <div className="absolute inset-0 border-[2px] border-white/20 rounded-sm" />
                </div>
                
                {/* Frame Inner Contents (Wrapped for overflow) */}
                <div className="absolute inset-[16px] overflow-hidden rounded-[14px] bg-gradient-to-br from-zinc-50 via-zinc-200 to-zinc-400 dark:from-zinc-300 dark:via-zinc-400 dark:to-zinc-500 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-20 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-[75%] overflow-hidden">
                  {getUrl("cover-aesthetic") ? (
                    <img src={getUrl("cover-aesthetic")} alt="Aesthetic" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-all duration-700 ease-out"  />
                  ) : (
                    <div className="w-full h-full bg-zinc-800"  />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[35%] flex flex-col justify-end items-center pb-5 z-10 pointer-events-none">
                  <h3 className="text-2xl lg:text-3xl font-serif text-zinc-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide">{t.aesthetic}</h3>
                  
                </div>
                </div>
              </Link>

              {/* CARD 4: CUSTOM */}
              <Link 
                href="/custom" 
                style={{ backgroundImage: "url('/wood-texture.png')" }}
                className="group relative w-full md:w-[20%] lg:w-[18%] aspect-[4/5] rounded-sm bg-cover bg-center shadow-[-20px_20px_30px_rgba(0,0,0,0.4)] hover:shadow-[-30px_30px_50px_rgba(0,0,0,0.6)] transition-all duration-700 ease-out cursor-pointer md:[transform:perspective(2000px)_rotateY(-55deg)_rotateX(5deg)] hover:!transform-none z-10 hover:z-50"
              >
                
                
                
                {/* Wood Frame Miter Joints & Grooves */}
                <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                  {/* 4 Diagonal Corner Seams (Miter Joints) */}
                  <div className="absolute top-0 left-0 w-[23px] h-[2px] bg-black/80 origin-top-left rotate-45" />
                  <div className="absolute top-0 right-0 w-[23px] h-[2px] bg-black/80 origin-top-right -rotate-45" />
                  <div className="absolute bottom-0 left-0 w-[23px] h-[2px] bg-black/80 origin-bottom-left -rotate-45" />
                  <div className="absolute bottom-0 right-0 w-[23px] h-[2px] bg-black/80 origin-bottom-right rotate-45" />
                  
                  {/* Decorative Carved Grooves */}
                  <div className="absolute inset-[6px] border border-black/70 shadow-[0_1px_1px_rgba(255,255,255,0.2)] rounded-sm" />
                  <div className="absolute inset-[10px] border border-black/40 rounded-sm" />
                  <div className="absolute inset-0 border-[2px] border-white/20 rounded-sm" />
                </div>
                
                {/* Frame Inner Contents (Wrapped for overflow) */}
                <div className="absolute inset-[16px] overflow-hidden rounded-[14px] bg-gradient-to-br from-zinc-50 via-zinc-200 to-zinc-400 dark:from-zinc-300 dark:via-zinc-400 dark:to-zinc-500 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-20 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-[75%] overflow-hidden">
                  {getUrl("cover-custom") ? (
                    <img src={getUrl("cover-custom")} alt="Custom" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-all duration-700 ease-out"  />
                  ) : (
                    <div className="w-full h-full bg-zinc-800"  />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[35%] flex flex-col justify-end items-center pb-5 z-10 pointer-events-none">
                  <h3 className="text-2xl lg:text-3xl font-serif text-zinc-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide">{t.custom}</h3>
                  
                </div>
                </div>
              </Link>

              </div>
            </div>
          </div>
          
          {/* Brushed Platinum Elegant Bottom Divider Line */}
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-accent/30 to-transparent shadow-[0_1px_4px_rgb(var(--accent-main)/0.2)] mt-12" />
        </section>

        <div className="relative z-10">
          <ShopGallery />
          <FeaturedCarousel />
          <Footer />
        </div>
      </main>
    </>
  )
}
