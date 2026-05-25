import { useRef, useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useSiteAssets } from '../lib/siteAssets'
import Link from 'next/link'
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient'

export default function FeaturedCarousel() {
  const { lang } = useLanguage()
  const { getUrl } = useSiteAssets()
  const scrollRef = useRef(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Ambil URL video "Katalog/Preview Galeri" dari slot kedua ('home-video-2')
  const videoUrl = getUrl('home-video-2') || '/sublimation-intro.mp4'

  const translations = {
    id: {
      title: 'Galeri Karakter & Artis',
      playing: 'Sedang Diputar',
      preview: 'Preview Produk',
      exploreTitle: 'Jelajahi Berdasarkan Karakter / Artis K-Pop',
      exploreDesc: 'Temukan ratusan opsi visual premium berdasarkan karakter anime favorit dan artis K-pop paling hits. Cetakan sublimasi logam murni berkualitas tinggi.',
      exploreAll: 'Jelajahi Semua',
      anime: 'Anime',
      kpop: 'K-Pop',
      aesthetic: 'Aesthetic'
    },
    en: {
      title: 'Character & Artist Gallery',
      playing: 'Now Playing',
      preview: 'Product Preview',
      exploreTitle: 'Explore By Character / K-Pop Artist',
      exploreDesc: 'Discover hundreds of premium visual options based on your favorite anime characters and the hottest K-pop artists. High-quality pure metal sublimation prints.',
      exploreAll: 'Explore All',
      anime: 'Anime',
      kpop: 'K-Pop',
      aesthetic: 'Aesthetic'
    },
    jp: {
      title: 'キャラクター＆アーティストギャラリー',
      playing: '再生中',
      preview: '製品プレビュー',
      exploreTitle: 'キャラクター/K-POPアーティストで探す',
      exploreDesc: 'お気に入りのアニメキャラクターや最も人気のあるK-POPアーティストに基づいた、何百ものプレミアムなビジュアルオプションをご覧ください。高品質な純金属昇華プリント。',
      exploreAll: 'すべてを見る',
      anime: 'アニメ',
      kpop: 'K-POP',
      aesthetic: 'エステティック'
    },
    kr: {
      title: '캐릭터 & 아티스트 갤러리',
      playing: '현재 재생 중',
      preview: '제품 미리보기',
      exploreTitle: '캐릭터 / K-Pop 아티스트별 탐색',
      exploreDesc: '좋아하는 애니메이션 캐릭터와 가장 핫한 K-pop 아티스트를 기반으로 한 수백 가지 프리미엄 비주얼 옵션을 찾아보세요. 고품질 순수 금속 승화 인쇄.',
      exploreAll: '모두 탐색',
      anime: '애니메이션',
      kpop: 'K-팝',
      aesthetic: '에스테틱'
    },
    cn: {
      title: '角色与艺人画廊',
      playing: '正在播放',
      preview: '产品预览',
      exploreTitle: '按角色/韩流艺人探索',
      exploreDesc: '根据您喜爱的动漫角色和最炙手可热的韩流艺人，探索数百种优质视觉选择。高品质纯金属升华印刷。',
      exploreAll: '探索全部',
      anime: '动漫',
      kpop: '韩流组合',
      aesthetic: '美学风格'
    }
  }

  const t = translations[lang] || translations.id

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    supabase
      .from('products')
      .select('category, subcategory, image_url')
      .then(({ data, error: qError }) => {
        if (cancelled) return
        if (qError) {
          console.error('Failed to load featured carousel items:', qError)
          setLoading(false)
        } else {
          const processed = []
          const seenSubcategories = new Set()

          const slugify = (text) => {
            if (!text) return ''
            return text.toString().toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
          }

          const normalize = (name) => {
            if (!name) return ''
            return name.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
          }

          (data || []).forEach(p => {
            if (!p.subcategory || !p.image_url) return

            const subNorm = p.subcategory.trim()
            if (seenSubcategories.has(subNorm)) return

            let name = subNorm
            let categoryLabel = p.category
            let href = '/'

            if (p.category === 'anime' || p.category === 'kpop') {
              if (p.subcategory.includes(' - ')) {
                const parts = p.subcategory.split(' - ')
                const parent = normalize(parts[0].trim())
                const child = normalize(parts[1].trim())
                name = child
                href = `/${p.category}/${slugify(parent)}/${slugify(child)}`
              } else {
                const parent = normalize(p.subcategory.trim())
                name = parent
                href = `/${p.category}/${slugify(parent)}`
              }
              categoryLabel = p.category === 'anime' ? (t.anime || 'Anime') : (t.kpop || 'K-Pop')
            } else if (p.category === 'aesthetic') {
              const theme = normalize(p.subcategory.trim())
              name = theme
              href = `/aesthetic/${slugify(theme)}`
              categoryLabel = t.aesthetic || 'Aesthetic'
            } else {
              name = normalize(p.subcategory.trim())
              href = `/katalog`
              categoryLabel = p.category ? normalize(p.category) : 'Product'
            }

            seenSubcategories.add(subNorm)
            processed.push({
              name,
              category: categoryLabel,
              image: p.image_url,
              href
            })
          })

          // Fisher-Yates Shuffle the processed items
          for (let i = processed.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [processed[i], processed[j]] = [processed[j], processed[i]];
          }

          if (processed.length > 0) {
            setItems(processed.slice(0, 15)) // Show up to 15 items in carousel
          } else {
            // Fallback list
            const fallbackCurated = [
              {
                name: 'Sasuke Uchiha',
                category: t.anime,
                image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
                href: '/anime/naruto'
              },
              {
                name: 'Mikasa Ackerman',
                category: t.anime,
                image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
                href: '/anime/attack-on-titan'
              },
              {
                name: 'Lisa (Blackpink)',
                category: t.kpop,
                image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
                href: '/kpop/blackpink'
              },
              {
                name: 'Roronoa Zoro',
                category: t.anime,
                image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
                href: '/anime/one-piece'
              },
              {
                name: 'Jungkook (BTS)',
                category: t.kpop,
                image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
                href: '/kpop/bts'
              },
              {
                name: 'Gojo Satoru',
                category: t.anime,
                image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
                href: '/anime/jujutsu-kaisen'
              },
              {
                name: 'Karina (aespa)',
                category: t.kpop,
                image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
                href: '/kpop/aespa'
              }
            ]
            // Shuffle fallback too
            for (let i = fallbackCurated.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [fallbackCurated[i], fallbackCurated[j]] = [fallbackCurated[j], fallbackCurated[i]];
            }
            setItems(fallbackCurated)
          }
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [lang])

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current
      const offset = clientWidth * 0.65
      const scrollTo = direction === 'left' ? scrollLeft - offset : scrollLeft + offset
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' })
    }
  }

  return (
    <section className="py-20 px-4 md:px-6 relative bg-[var(--bg)] overflow-hidden border-t border-zinc-900/10 dark:border-zinc-900">
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-accent/3 blur-[130px] rounded-full"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="w-full mb-12 py-12 flex flex-col justify-center items-center relative overflow-hidden z-10 px-4">
          {/* Horizontal Vignette Background - Smooth Edges */}
          <div className="absolute inset-y-0 left-0 w-[25%] md:w-[35%] bg-gradient-to-r from-zinc-700/15 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-[25%] md:w-[35%] bg-gradient-to-l from-zinc-700/15 to-transparent pointer-events-none" />
          
          {/* Background Glow Behind Title */}
          <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-gradient-to-r from-transparent via-accent/5 dark:via-accent/10 to-transparent blur-3xl pointer-events-none" />
          
          <div className="relative flex flex-col items-center text-center">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark dark:from-zinc-200 dark:via-zinc-400 dark:to-zinc-600 font-serif filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.25)] dark:drop-shadow-[0_2px_15px_rgba(255,255,255,0.25)]">
              {t.title}
            </h2>
            <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-accent to-transparent mt-4 shadow-[0_0_5px_rgba(212,175,55,0.3)]" />
          </div>
        </div>

        {/* Premium Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* KOLOM KIRI: Big Video Box */}
          <div className="lg:col-span-5 h-[320px] sm:h-[400px] lg:h-auto rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-black relative flex items-center justify-center shadow-[0_10px_35px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.85)]">
            {videoUrl ? (
              <video
                src={videoUrl}
                className="w-full h-full object-cover opacity-75"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-200 to-zinc-300 dark:from-zinc-850 dark:to-zinc-950" />
            )}
            
            {/* Dark glass overlay with gold text info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent flex flex-col justify-end p-6 pointer-events-none">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgb(var(--accent-main)/0.8)]"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent">
                  {t.playing} — {t.preview}
                </span>
              </div>
              <h3 className="text-white font-black text-2xl uppercase tracking-[0.1em] font-serif">LUMI FORGE</h3>
              <p className="text-zinc-500 text-[9px] font-sans uppercase tracking-[0.25em] mt-2 font-bold">PREMIUM COLLECTIBLE METAL PRINTS</p>
            </div>
          </div>

          {/* KOLOM KANAN: Exploration & Horizontal Card Carousel */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl bg-zinc-950/5 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-900 p-6 sm:p-8 backdrop-blur-md relative overflow-hidden h-full">
            
            {/* Header Column Detail */}
            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark font-serif leading-tight">
                {t.exploreTitle}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-2.5 leading-relaxed font-sans font-bold">
                {t.exploreDesc}
              </p>
            </div>

            {/* Bronze Gold Button */}
            <div className="flex justify-between items-center mb-6">
              <Link href="/anime" className="bg-gradient-to-r from-accent-light via-accent to-accent-alt text-black font-black uppercase tracking-[0.15em] py-3 px-8 rounded-lg text-xs md:text-sm shadow-md shadow-accent/15 transition-all hover:scale-105 inline-block">
                {t.exploreAll}
              </Link>

              {/* Navigation Arrows for desktop scroll */}
              <div className="flex gap-2">
                <button 
                  onClick={() => handleScroll('left')}
                  className="w-10 h-10 rounded-full border border-zinc-350 dark:border-zinc-800 bg-white/40 dark:bg-black/40 text-zinc-700 dark:text-zinc-400 flex items-center justify-center hover:bg-accent/10 hover:border-accent hover:text-accent transition-all"
                >
                  &larr;
                </button>
                <button 
                  onClick={() => handleScroll('right')}
                  className="w-10 h-10 rounded-full border border-zinc-350 dark:border-zinc-800 bg-white/40 dark:bg-black/40 text-zinc-700 dark:text-zinc-400 flex items-center justify-center hover:bg-accent/10 hover:border-accent hover:text-accent transition-all"
                >
                  &rarr;
                </button>
              </div>
            </div>

            {/* Horizontal Slider of Characters & Artists */}
            <div 
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-3 scrollbar-none scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {loading ? (
                // Show dynamic skeleton loading cards
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex-none w-[130px] sm:w-[155px] animate-pulse">
                    <div className="aspect-[3/4] rounded-2xl bg-zinc-200/50 dark:bg-zinc-900/40 border border-zinc-250 dark:border-zinc-800" />
                    <div className="mt-3 space-y-1">
                      <div className="h-2 bg-zinc-300 dark:bg-zinc-800 rounded w-1/3" />
                      <div className="h-3 bg-zinc-300 dark:bg-zinc-800 rounded w-3/4" />
                    </div>
                  </div>
                ))
              ) : (
                items.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    className="group snap-start flex-none w-[130px] sm:w-[155px] cursor-pointer"
                  >
                    {/* Portrait Card */}
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-800 bg-black relative shadow-lg transition-all duration-300 group-hover:border-accent/50 group-hover:shadow-[0_10px_20px_rgb(var(--accent-main)/0.15)]">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                        loading="lazy"
                      />
                      {/* Shadow overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                      
                      {/* Tiny gold arrow that pops up on hover */}
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/75 dark:bg-black/75 border border-zinc-800 flex items-center justify-center text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        &rarr;
                      </div>
                    </div>

                    {/* Character/Artist Labels Underneath Card */}
                    <div className="mt-3 text-left">
                      <span className="text-[8px] text-accent font-sans uppercase tracking-[0.1em] font-black block">
                        {item.category}
                      </span>
                      <h4 className="text-[var(--text-main)] font-bold text-[11px] sm:text-xs uppercase tracking-wider mt-0.5 truncate group-hover:text-accent transition-colors leading-tight font-sans">
                        {item.name}
                      </h4>
                    </div>
                  </Link>
                ))
              )}
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}
