import { useState, useRef, useEffect } from 'react'
import { useSiteAssets } from '../lib/siteAssets'
import { motion, AnimatePresence } from 'framer-motion'

import { useLanguage } from '../context/LanguageContext'

export default function FeaturedCarousel() {
  const { getUrl } = useSiteAssets()
  const { lang } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(0)
  // Menyimpan referensi (ref) untuk setiap elemen video
  const videoRefs = useRef([])

  const translations = {
    id: {
      title: 'Preview Galeri',
      playing: 'SEDANG DIPUTAR',
      preview: 'PREVIEW'
    },
    en: {
      title: 'Gallery Preview',
      playing: 'NOW PLAYING',
      preview: 'PREVIEW'
    },
    jp: {
      title: 'ギャラリープレビュー',
      playing: '再生中',
      preview: 'プレビュー'
    },
    kr: {
      title: '갤러리 미리보기',
      playing: '현재 재생 중',
      preview: '미리보기'
    },
    cn: {
      title: '画廊预览',
      playing: '正在播放',
      preview: '预览'
    }
  }

  const t = translations[lang] || translations.id

  // Ambil URL video yang valid (mendukung hingga 10 slot)
  const rawVideos = [
    getUrl('home-video'),
    ...Array.from({ length: 9 }).map((_, i) => getUrl(`home-video-${i + 2}`))
  ].filter(url => !!url)

  // Trik agar Carousel berbentuk "lingkaran penuh" meskipun hanya ada 2 video:
  // Kita gandakan array-nya menjadi 4, sehingga sisi kiri dan kanan selalu terisi.
  const videos = rawVideos.length === 2 ? [...rawVideos, ...rawVideos] : rawVideos

  useEffect(() => {
    // Jalankan video yang ada di tengah (currentIndex)
    videos.forEach((_, idx) => {
      const vid = videoRefs.current[idx]
      if (vid) {
        if (idx === currentIndex) {
          vid.currentTime = 0
          vid.play().catch(e => console.log('Autoplay dicegah browser:', e))
        } else {
          vid.pause()
        }
      }
    })
  }, [currentIndex, videos.length])

  if (videos.length === 0) return null

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length)
  }

  const handleVideoEnded = (idx) => {
    // Hanya pindah jika video yang sedang aktif yang selesai
    if (idx === currentIndex) {
      handleNext()
    }
  }

  const getPosition = (index) => {
    if (videos.length === 1) return 'center'
    // Karena jika 2 video sudah digandakan menjadi 4, logika di bawah ini akan menangani semuanya.
    if (index === currentIndex) return 'center'
    if (index === (currentIndex + 1) % videos.length) return 'right'
    if (index === (currentIndex - 1 + videos.length) % videos.length) return 'left'
    return 'hidden'
  }

  const variants = {
    center: { x: "0%", scale: 1, zIndex: 20, opacity: 1, filter: "blur(0px)", transition: { duration: 0.5, ease: "easeOut" } },
    right: { x: "50%", scale: 0.85, zIndex: 10, opacity: 0.5, filter: "blur(3px)", transition: { duration: 0.5, ease: "easeOut" } },
    left: { x: "-50%", scale: 0.85, zIndex: 10, opacity: 0.5, filter: "blur(3px)", transition: { duration: 0.5, ease: "easeOut" } },
    hidden: { x: "0%", scale: 0.5, zIndex: 0, opacity: 0, filter: "blur(8px)", transition: { duration: 0.5 } }
  }

  return (
    <section className="py-24 px-6 overflow-hidden relative bg-[#0a0514]">
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Neon Glows - Refined to match deep purple theme */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[700px] bg-purple-600/20 blur-[150px] rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full"></div>
        
        {/* Subtle Grid Pattern - Adjusted opacity */}
        <div 
          className="absolute inset-0 opacity-[0.02]" 
          style={{ 
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px' 
          }}
        ></div>
        
        {/* Top Fade - Seamless transition from hero image */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black to-transparent opacity-40"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-5xl font-black uppercase tracking-[0.2em] text-white drop-shadow-[0_0_15px_rgba(0,243,255,0.5)]"
          >
            {t.title}
          </motion.h2>
          <div className="h-1 w-32 bg-gradient-to-r from-neon-purple to-neon-cyan mt-6 rounded-full shadow-[0_0_20px_rgba(157,78,221,0.6)]"></div>
        </div>

        {/* Carousel Wrapper - Full width relative container */}
        <div className="relative w-full max-w-5xl mx-auto h-[300px] sm:h-[400px] md:h-[500px] flex items-center justify-center">
          
          {videos.map((url, idx) => {
            const pos = getPosition(idx)
            return (
              <motion.div
                key={`${url}-${idx}`}
                variants={variants}
                initial={false}
                animate={pos}
                className={`absolute w-[80%] max-w-[600px] aspect-[4/3] rounded-3xl overflow-hidden border ${
                  pos === 'center' 
                    ? 'border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)]' 
                    : 'border-white/5 shadow-xl'
                } bg-black`}
                onClick={() => {
                  if (pos === 'right') handleNext()
                  if (pos === 'left') handlePrev()
                }}
                style={{ cursor: pos !== 'center' ? 'pointer' : 'default' }}
              >
                <video
                  ref={el => videoRefs.current[idx] = el}
                  src={url}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  onEnded={() => handleVideoEnded(idx)}
                  // Hanya video tengah yang bisa di-klik untuk play/pause browser native jika diperlukan
                  // Tapi karena kita autoPlay, kita biarkan saja.
                />

                {/* Info Overlay (Hanya muncul di video yang aktif / tengah) */}
                {pos === 'center' && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: 0.3 }}
                    className="absolute bottom-6 left-8 right-8 flex items-end justify-between pointer-events-none"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-white/90 drop-shadow-md">
                          {t.playing} — {t.preview} {currentIndex + 1}/{videos.length}
                        </span>
                      </div>
                      <h3 className="text-white font-black text-xl sm:text-2xl uppercase tracking-widest opacity-40">DORONG GALLERY</h3>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}

          {/* Navigation Arrows */}
          {videos.length > 1 && (
            <>
              <button 
                onClick={handlePrev}
                className="absolute left-0 sm:left-4 z-30 w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-neon-purple/80 hover:border-neon-purple transition-all group/nav shadow-[0_0_20px_rgba(0,0,0,0.5)]"
              >
                <svg className="w-6 h-6 transition-transform group-hover/nav:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button 
                onClick={handleNext}
                className="absolute right-0 sm:right-4 z-30 w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-neon-cyan/80 hover:border-neon-cyan transition-all group/nav shadow-[0_0_20px_rgba(0,0,0,0.5)]"
              >
                <svg className="w-6 h-6 transition-transform group-hover/nav:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}
        </div>

        {/* Pagination Dots */}
        {videos.length > 1 && (
          <div className="flex justify-center gap-3 mt-12 relative z-30">
            {videos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === currentIndex 
                    ? 'w-12 bg-gradient-to-r from-neon-purple to-neon-cyan shadow-[0_0_10px_rgba(157,78,221,0.5)]' 
                    : 'w-3 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
