import Head from 'next/head'
import Header from '../components/Header'
import CategoryCard from '../components/CategoryCard'
import FeaturedCarousel from '../components/FeaturedCarousel'
import ShopGallery from '../components/ShopGallery'
import Footer from '../components/Footer'
import { useSiteAssets } from '../lib/siteAssets'

export default function Home(){
  const { getUrl } = useSiteAssets()
  const homeBg = getUrl('home-bg')

  return (
    <>
      <Head>
        <title>Dorong Gallery — Premium Wall Art</title>
        <meta name="description" content="Premium anime, k-pop, decor posters & sublimation printing" />
      </Head>
      <Header />
      <main className="pt-28 bg-[var(--bg)] min-h-screen transition-colors duration-300">
        {/* <Hero /> */}

        {/* Section Koleksi dengan Background Khusus & Garis Pembatas */}
        <section id="categories" className="relative overflow-hidden border-b border-white/5">
          {/* Background Image Layer - Hanya di section ini */}
          {homeBg && (
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60 dark:opacity-30"
              style={{ backgroundImage: `url(${homeBg})` }}
            />
          )}

          <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
            <h2 className="text-5xl font-black mb-12 uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-[#ff00ff] via-[#9d4edd] to-[#ff00ff] drop-shadow-[0_0_15px_rgba(157,78,221,0.8)] neon-text-purple">
              Collections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <CategoryCard title="Anime" image={getUrl('cover-anime')} href="/anime" />
              <CategoryCard title="K-pop" image={getUrl('cover-kpop')} href="/kpop" />
              <CategoryCard title="Decor" image={getUrl('cover-decor')} href="/decor" />
              <CategoryCard title="Custom" image={getUrl('cover-custom')} href="/custom" />
            </div>
          </div>

          {/* Garis Pembatas Neon Bawah */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#ff007f]/50 to-transparent shadow-[0_0_10px_rgba(255,0,127,0.5)]" />
        </section>

        <div className="relative z-10">
          <FeaturedCarousel />
          <ShopGallery />
          <Footer />
        </div>
      </main>
    </>
  )
}
