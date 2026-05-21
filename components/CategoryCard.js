import Link from 'next/link'
import { useLanguage } from '../context/LanguageContext'

export default function CategoryCard({ title, image, href, clipPath, textLeft }) {
  const { lang } = useLanguage()

  const translations = {
    id: {
      category: 'Kategori',
      explore: 'Jelajahi Koleksi'
    },
    en: {
      category: 'Category',
      explore: 'Explore Collection'
    },
    jp: {
      category: 'カテゴリ',
      explore: 'コレクションを探索'
    },
    kr: {
      category: '카테고리',
      explore: '컬렉션 탐색'
    },
    cn: {
      category: '分类',
      explore: '浏览收藏'
    }
  }

  const t = translations[lang] || translations.id
  return (
    <Link 
      href={href} 
      className="absolute inset-0 group overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:z-30 hover:scale-[1.015] hover:shadow-[0_0_50px_rgba(0,243,255,0.3)]"
      style={{ 
        clipPath: clipPath, 
        WebkitClipPath: clipPath 
      }}
    >
      
      {/* Background Image Container */}
      <div className="w-full h-full relative bg-black">
        {image ? (
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700" 
            loading="lazy" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20" />
        )}
        
        {/* Cyberpunk dark gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/60 opacity-95 group-hover:opacity-90 transition-opacity"></div>
      </div>
      
      {/* Typography details positioned absolutely in the exact Center Point of the Frame */}
      <div className={`absolute top-1/2 ${textLeft} -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center text-center pointer-events-none transition-all duration-500 group-hover:scale-105`}>
        <span className="text-[9px] text-[#00f3ff] font-mono uppercase tracking-[0.25em] block mb-1 drop-shadow-md">
          {t.category}
        </span>
        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-widest text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)] group-hover:text-[#00f3ff] transition-all leading-none">
          {title}
        </h3>
        <div className="h-1.5 w-10 bg-gradient-to-r from-[#00f3ff] to-[#9d4edd] mt-3 group-hover:w-24 transition-all duration-500"></div>
        <p className="text-[9px] text-slate-200 mt-4 font-mono uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">
          {t.explore}
        </p>
      </div>
      
    </Link>
  )
}
