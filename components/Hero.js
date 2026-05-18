import { motion } from 'framer-motion'
import { useSiteAssets } from '../lib/siteAssets'

export default function Hero() {
  const { getUrl } = useSiteAssets()
  
  // Ambil URL video "Preview Galeri" dari slot pertama ('home-video')
  const homeVideo = getUrl('home-video') || '/sublimation-sample.mp4'

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
          <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-r from-transparent to-[var(--bg)] z-10 hidden lg:block pointer-events-none" />
          
          {/* Bottom transition fade for mobile view */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--bg)] to-transparent z-10 block lg:hidden pointer-events-none" />

          {/* Glowing gold status badge on video */}
          <div className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-[#d4af37]/30 text-[9px] text-[#d4af37] font-black uppercase tracking-widest font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
            Live Preview
          </div>
        </motion.div>

        {/* 40% RIGHT SIDE: Content Copywriting */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="lg:col-span-4 flex flex-col justify-center p-8 sm:p-10 lg:p-14 space-y-6 text-left bg-[var(--bg)] relative border-t lg:border-t-0 lg:border-l border-zinc-900/10 dark:border-zinc-900"
        >
          {/* Inner gold glow orb */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#d4af37]/5 rounded-full filter blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/35 text-[#d4af37] text-[10px] font-black uppercase tracking-widest font-sans">
              ✨ Premium Sublimation Metal Print
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[0.95] uppercase font-sans text-[var(--text-main)]">
              Your Passion,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#f3e5ab] via-[#d4af37] to-[#aa7c11] font-serif filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_2px_8px_rgba(212,175,55,0.2)]">
                In Premium Wall Art
              </span>
            </h1>
            
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-sans tracking-wide leading-relaxed font-bold">
              Upgrade dekorasi ruanganmu dengan poster logam berkualitas tinggi khas LUMI FORGE. Tahan lama, bebas paku (pemasangan magnetik), dan dilapisi keindahan logam eksklusif platinum dan emas champagne.
            </p>

            <div className="pt-3 flex flex-wrap gap-3">
              <a 
                href="#categories" 
                onClick={scrollToCategories}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#f3e5ab] via-[#d4af37] to-[#b39359] text-black font-black text-[10px] uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-md shadow-[#d4af37]/15 cursor-pointer"
              >
                Belanja Sekarang
              </a>
              <a 
                href="/custom" 
                className="px-6 py-3 rounded-xl border border-[#d4af37]/30 hover:bg-[#d4af37]/5 text-[var(--text-main)] font-black text-[10px] uppercase tracking-widest transition-all duration-300 hover:scale-105"
              >
                Custom Order
              </a>
            </div>
          </div>
        </motion.div>

      </div>
      
    </section>
  )
}
