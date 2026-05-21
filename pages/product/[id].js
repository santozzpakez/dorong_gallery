import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { hasSupabaseConfig, supabase } from '../../lib/supabaseClient'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import ImageModal from '../../components/ImageModal'
import { useLanguage } from '../../context/LanguageContext'
import { useSiteAssets } from '../../lib/siteAssets'
import { getPriceInfo, getDimensionInfo } from '../../lib/priceHelper'

export default function ProductDetail() {
  const router = useRouter()
  const { lang } = useLanguage()
  const { id } = router.query
  
  const [product, setProduct] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()
  const { user } = useAuth()
  const [selectedSize, setSelectedSize] = useState('F4')
  const { getText, getUrl } = useSiteAssets()
  const priceInfo = getPriceInfo(getText, selectedSize)
  const [added, setAdded] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [activeMockup, setActiveMockup] = useState('flat')
  const [posterRotation, setPosterRotation] = useState(0)
  const [displayLandscapeRotation, setDisplayLandscapeRotation] = useState(90)

  const scrollRef = useRef(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(true)

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      setCanScrollUp(scrollTop > 5)
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 5)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      handleScroll()
    }, 500)
    return () => clearTimeout(timer)
  }, [product, activeMockup])


  const getImageStyle = (mockupKey, rotation) => {
    const isRotated = rotation % 180 !== 0;
    const base = {
      transition: 'all 0.5s ease-in-out',
      objectFit: 'cover',
      userSelect: 'none',
      pointerEvents: 'none',
    };

    if (!isRotated) {
      return {
        ...base,
        width: '100%',
        height: '100%',
        transform: `rotate(${rotation}deg)`,
      };
    }

    // Swapped width & height percentages to prevent any cropping when rotated by 90/270 degrees
    let width = '100%';
    let height = '100%';

    if (mockupKey === 'flat' || mockupKey === 'metal' || mockupKey === 'display') {
      width = '133.3%';
      height = '75%';
    } else if (mockupKey === 'livingroom') {
      width = '142.5%';
      height = '70.2%';
    } else if (mockupKey === 'living_landscape') {
      width = '78.4%';
      height = '127.5%';
    } else if (mockupKey === 'display_landscape') {
      width = '75%';
      height = '133.3%';
    }

    return {
      ...base,
      position: 'absolute',
      top: '50%',
      left: '50%',
      width,
      height,
      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
    };
  };

  const scaleHeights = { F4: 15, A3: 19.1, 'A3+': 21.8 }
  const currentScaleHeight = scaleHeights[selectedSize] || 15

  const livingRoomWidths = { F4: 13, A3: 17, 'A3+': 21 }
  const livingRoomLefts = { F4: 43.5, A3: 41.5, 'A3+': 39.5 }
  const livingRoomTops = { F4: 26, A3: 23, 'A3+': 20 }
  
  const activeLivingWidth = livingRoomWidths[selectedSize] || 13
  const activeLivingLeft = livingRoomLefts[selectedSize] || 43.5
  const activeLivingTop = livingRoomTops[selectedSize] || 26

  const cafeWidths = { F4: 8.5, A3: 11.5, 'A3+': 13 }
  const cafeTops = { F4: 20, A3: 16, 'A3+': 13 }
  const cafeAspects = { F4: '21.5/33', A3: '29.7/42', 'A3+': '32.9/48.3' }

  const activeCafeWidth = cafeWidths[selectedSize] || 8.5
  const activeCafeTop = cafeTops[selectedSize] || 20
  const activeCafeAspect = cafeAspects[selectedSize] || '21.5/33'

  const gamingWidths = { F4: 9.5, A3: 12.5, 'A3+': 14 }
  const gamingTops = { F4: 15, A3: 12, 'A3+': 10 }
  const gamingAspects = { F4: '21.5/33', A3: '29.7/42', 'A3+': '32.9/48.3' }

  const activeGamingWidth = gamingWidths[selectedSize] || 9.5
  const activeGamingTop = gamingTops[selectedSize] || 15
  const activeGamingAspect = gamingAspects[selectedSize] || '21.5/33'

  const bedroomWidths = { F4: 10, A3: 13.5, 'A3+': 15 }
  const bedroomTops = { F4: 22, A3: 16, 'A3+': 11 }
  const bedroomAspects = { F4: '21.5/33', A3: '29.7/42', 'A3+': '32.9/48.3' }

  const activeBedroomWidth = bedroomWidths[selectedSize] || 10
  const activeBedroomTop = bedroomTops[selectedSize] || 22
  const activeBedroomAspect = bedroomAspects[selectedSize] || '21.5/33'

  const dimF4Val = getDimensionInfo(getText, 'F4')
  const dimA3Val = getDimensionInfo(getText, 'A3')
  const dimA3PlusVal = getDimensionInfo(getText, 'A3+')

  const displayWidths = { F4: 16, A3: 19, 'A3+': 22 }
  const displayTops = { F4: 15.6, A3: 10.3, 'A3+': 4.9 }
  const displaySideLefts = { F4: 32.3, A3: 28.3, 'A3+': 24.3 }

  const activeDisplayWidth = displayWidths[selectedSize] || 19
  const activeDisplayTop = displayTops[selectedSize] || 10.3
  const activeDisplaySideLeft = displaySideLefts[selectedSize] || 18.3

  const displayLandscapeWidths = { F4: 21.3, A3: 25.3, 'A3+': 29.3 }
  const displayLandscapeTops = { F4: 18.2, A3: 13.4, 'A3+': 8.5 }
  const displaySideLandscapeLefts = { F4: 51.3, A3: 50.3, 'A3+': 49.3 }

  const activeDisplayLandscapeWidth = displayLandscapeWidths[selectedSize] || 25.3
  const activeDisplayLandscapeTop = displayLandscapeTops[selectedSize] || 13.4
  const activeDisplaySideLandscapeLeft = displaySideLandscapeLefts[selectedSize] || 40.3

  const translations = {
    id: {
      back: 'Kembali',
      description: 'Deskripsi Produk',
      noDesc: 'Tidak ada deskripsi tambahan.',
      addToCart: 'Tambahkan ke Cart',
      added: 'Ditambahkan',
      premium: 'Kualitas Premium',
      warranty: 'Garansi 100%',
      recommendations: 'Rekomendasi Serupa',
      view: 'Lihat Produk',
      loading: 'Memuat detail produk...',
      notFound: 'Produk tidak ditemukan',
      backHome: 'Kembali ke Home',
      zoom: 'Perbesar Gambar'
    },
    en: {
      back: 'Back',
      description: 'Product Description',
      noDesc: 'No additional description.',
      addToCart: 'Add to Cart',
      added: 'Added',
      premium: 'Premium Quality',
      warranty: '100% Satisfaction',
      recommendations: 'Similar Recommendations',
      view: 'View Product',
      loading: 'Loading product details...',
      notFound: 'Product not found',
      backHome: 'Back to Home',
      zoom: 'Zoom Image'
    },
    jp: {
      back: '戻る',
      description: '商品説明',
      noDesc: '追加の説明はありません。',
      addToCart: 'カートに追加',
      added: '追加済み',
      premium: 'プレミアム品質',
      warranty: '100％満足保証',
      recommendations: '似たようなおすすめ',
      view: '製品を見る',
      loading: '製品詳細を読み込み中...',
      notFound: '製品が見つかりません',
      backHome: 'ホームに戻る',
      zoom: '画像を拡大'
    },
    kr: {
      back: '뒤로',
      description: '제품 설명',
      noDesc: '추가 설명이 없습니다.',
      addToCart: '장바구니에 담기',
      added: '추가됨',
      premium: '프리미엄 품질',
      warranty: '100% 만족 보장',
      recommendations: '유사한 추천 제품',
      view: '제품 보기',
      loading: '제품 정보를 불러오는 중...',
      notFound: '제품을 찾을 수 없습니다',
      backHome: '홈으로 돌아가기',
      zoom: '이미지 확대'
    },
    cn: {
      back: '返回',
      description: '产品描述',
      noDesc: '无额外描述。',
      addToCart: '加入购物车',
      added: '已添加',
      premium: '优质品质',
      warranty: '100% 满意保证',
      recommendations: '相似推荐',
      view: '查看产品',
      loading: '正在加载产品详情...',
      notFound: '未找到产品',
      backHome: '返回首页',
      zoom: '放大图片',
      defaultNotes: '✨ 高级墙绘 - LUMI FORGE 独家 ✨\n\n采用最先进的高压热升华技术制作，呈现超鲜艳的色彩和超清晰的细节。高品质、防褪色且耐用的材料，为您的房间角落增添优雅奢华的氛围。世界级装饰的最佳选择！'
    }
  }

  // Teks default bahasa Indonesia untuk dicocokkan
  const INDONESIAN_DEFAULT_NOTES = '✨ Premium Collectible Metal Prints - LUMI FORGE Exclusive ✨\n\nDibuat dengan teknologi Sublimation High Press tercanggih untuk hasil warna yang super vibrant dan detail ultra-tajam. Material berkualitas tinggi yang anti-luntur, tahan lama, dan memberikan kesan mewah yang elegan di setiap sudut ruanganmu. Pilihan terbaik untuk dekorasi kelas dunia!'

  // Tambahkan terjemahan notes ke dalam object terjemahan yang ada
  translations.id.defaultNotes = INDONESIAN_DEFAULT_NOTES
  translations.en.defaultNotes = '✨ Premium Collectible Metal Prints - LUMI FORGE Exclusive ✨\n\nCrafted with advanced High Press Sublimation technology for super vibrant colors and ultra-sharp details. High-quality, fade-resistant, and durable materials that provide an elegant, luxurious touch to any corner of your room. The best choice for world-class decoration!'
  translations.jp.defaultNotes = '✨ プレミアムウォールアート - LUMI FORGE 限定 ✨\n\n最先端のハイプレス昇華技術で作られ、超鮮やかな色彩と超鮮明なディテールを実現。色あせにくく耐久性に優れた高品質の素材が、お部屋の隅々にエレガントで豪華な印象を与えます。ワールドクラスの装飾に最適な選択です！'
  translations.kr.defaultNotes = '✨ 프리미엄 월 아트 - LUMI FORGE 독점 ✨\n\n초고화질의 생생한 색상과 디테일을 위한 최첨단 하이프레스 승화 기술로 제작되었습니다. 변색 방지 및 내구성이 뛰어난 고품질 소재로 공간 구석구석에 우아하고 고급스러운 느낌을 더해줍니다. 세계적인 수준의 장식을 위한 최고의 선택!'

  const t = translations[lang] || translations.id

  // Fungsi pintar untuk menerjemahkan notes dari database
  const getTranslatedNotes = (notes) => {
    if (!notes) return null
    // Hapus spasi berlebih di awal/akhir untuk pencocokan yang aman
    const cleanNotes = notes.trim()
    const cleanDefault = INDONESIAN_DEFAULT_NOTES.trim()
    
    // Jika notes dari DB sama persis (atau sangat mirip) dengan teks default admin
    if (cleanNotes.includes('Dibuat dengan teknologi Sublimation High Press') || cleanNotes === cleanDefault) {
      return t.defaultNotes
    }
    
    // Jika notes adalah teks kustom dari admin, tampilkan apa adanya (karena belum punya API Translator)
    return notes
  }

  useEffect(() => {
    // Tunggu sampai router siap dan id tersedia
    if (!router.isReady) return
    if (!id || !hasSupabaseConfig || !supabase) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadData() {
      setLoading(true)
      
      try {
        // Ambil detail produk dengan timeout 10 detik
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)

        const { data: pData, error: pErr } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single()
          .abortSignal(controller.signal)

        clearTimeout(timeout)

        if (cancelled) return

        if (pErr || !pData) {
          setLoading(false)
          return
        }

        setProduct(pData)

        // Ambil rekomendasi (kategori yang sama, kecualikan produk saat ini)
        const { data: recData, error: recErr } = await supabase
          .from('products')
          .select('*')
          .eq('category', pData.category)
          .neq('id', id)
          .limit(20)

        if (!cancelled && !recErr && recData) {
          // Acak rekomendasi
          const shuffled = [...recData].sort(() => 0.5 - Math.random()).slice(0, 4)
          setRecommendations(shuffled)
        }
      } catch (err) {
        // Tangkap error timeout atau network failure agar loading tidak stuck
        console.error('Error loading product:', err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()

    return () => { cancelled = true }
  }, [router.isReady, id])

  const handleAddToCart = () => {
    if (!product) return
    
    // Proteksi Login
    if (!user) {
      router.push('/login')
      return
    }

    addItem({
      ...product,
      price: priceInfo.discount, // the active selling price is the discount price
      size: selectedSize
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
        <Header />
        <main className="flex-grow pt-32 text-center opacity-60">{t.loading}</main>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
        <Header />
        <main className="flex-grow pt-32 text-center">
          <h1 className="text-2xl font-bold">{t.notFound}</h1>
          <Link href="/" className="text-[#d4af37] mt-4 inline-block hover:underline uppercase font-black tracking-widest text-xs">{t.backHome}</Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      <Header />
      <main className="flex-grow pt-28 max-w-6xl mx-auto px-4 pb-16 w-full">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-xs text-[#d4af37]/80 hover:text-[#d4af37] font-bold uppercase tracking-widest transition-all flex items-center gap-2">
            ← {t.back}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">
          {/* Bagian Kiri: Gambar Utama & Deskripsi */}
          <div className="lg:col-span-7 space-y-8">
            <div className="flex flex-col md:flex-row gap-4 items-start">
              {/* Vertical Side Thumbnails Bar - Clean style like animetalposter.com */}
              <div className="hidden md:flex flex-col items-center gap-1.5 w-[72px] shrink-0 relative select-none">
                {/* Scroll Up Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (scrollRef.current) {
                      scrollRef.current.scrollBy({ top: -80, behavior: 'smooth' })
                    }
                  }}
                  disabled={!canScrollUp}
                  className={`w-8 h-8 rounded-full border border-zinc-700 bg-zinc-900/90 text-[#d4af37] flex items-center justify-center transition-all duration-200 shadow-md ${
                    canScrollUp 
                      ? 'opacity-100 hover:bg-zinc-800 hover:border-[#d4af37] cursor-pointer' 
                      : 'opacity-20 cursor-not-allowed border-zinc-800'
                  }`}
                  aria-label="Scroll Up"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                  </svg>
                </button>

                {/* Scroll Container */}
                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="w-full h-[400px] overflow-y-auto scrollbar-hide flex flex-col gap-2 py-0.5 scroll-smooth"
                >
                  {[
                    { key: 'flat', img: product.image_url, alt: 'Poster' },
                    { key: 'metal', img: product.image_url, alt: 'Metal Print' },
                    { key: 'gaming', img: '/mockup_gaming.jpg', alt: 'Gaming Scene' },
                    { key: 'livingroom', img: '/mockup_livingroom.jpg', alt: 'Living Room (Portrait)', badge: 'Portrait' },
                    { key: 'living_landscape', img: '/mockup_livingroom_landscape.png', alt: 'Living Room (Landscape)', badge: 'Landscape' },
                    { key: 'display', img: '/mockup_display_clean.png', alt: 'Product Display (Portrait & Landscape)', badge: 'Prt & Lnd' },
                    { key: 'living', img: '/mockup_person.png', alt: 'Scale View' },
                    { key: 'studio', img: '/mockup_desk.png', alt: 'Studio Desk' },
                    { key: 'cafe', img: '/mockup_cafe.jpg', alt: 'Cafe' },
                    { key: 'bedroom', img: '/mockup_bedroom.jpg', alt: 'Bedroom' },
                  ].map(thumb => (
                    <button
                      key={thumb.key}
                      type="button"
                      onClick={() => setActiveMockup(thumb.key)}
                      className={`w-full aspect-square rounded-lg overflow-hidden border-2 bg-zinc-900 relative transition-all duration-200 shrink-0 ${
                        activeMockup === thumb.key 
                          ? 'border-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.4)] scale-105 opacity-100' 
                          : 'border-zinc-700/50 opacity-50 hover:opacity-90 hover:border-zinc-500'
                      }`}
                    >
                      <img src={thumb.img} alt={thumb.alt} className="w-full h-full object-cover" />
                      {thumb.badge && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/85 py-0.5 text-[8px] text-[#d4af37] font-black uppercase tracking-wider text-center border-t border-[#d4af37]/20 select-none">
                          {thumb.badge}
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Scroll Down Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (scrollRef.current) {
                      scrollRef.current.scrollBy({ top: 80, behavior: 'smooth' })
                    }
                  }}
                  disabled={!canScrollDown}
                  className={`w-8 h-8 rounded-full border border-zinc-700 bg-zinc-900/90 text-[#d4af37] flex items-center justify-center transition-all duration-200 shadow-md ${
                    canScrollDown 
                      ? 'opacity-100 hover:bg-zinc-800 hover:border-[#d4af37] cursor-pointer' 
                      : 'opacity-20 cursor-not-allowed border-zinc-800'
                  }`}
                  aria-label="Scroll Down"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Main Viewer Area */}
              <div className="flex-grow w-full">
                <div 
                  className="rounded-lg overflow-hidden relative group bg-zinc-900 w-full select-none"
                >
                  {activeMockup === 'flat' ? (
                    <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-[#fafaf9] via-[#f5f5f4] to-[#e7e5e4] dark:from-[#141416] dark:via-[#0c0c0e] dark:to-[#040405] overflow-hidden rounded-lg flex items-center justify-center p-6 shadow-inner border border-zinc-200/50 dark:border-zinc-800/30 animate-fade-in">
                      {/* Studio lights soft background glow (Premium warm gold spotlight in dark mode) */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0)_75%)] dark:bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,rgba(0,0,0,0)_80%)] pointer-events-none" />

                      {/* Centered Flat Poster */}
                      <div 
                        onClick={() => setIsPreviewOpen(true)}
                        className="relative w-[48%] aspect-[3/4] rounded-sm overflow-hidden cursor-zoom-in group/flat transition-all duration-300 hover:scale-[1.02]"
                        style={{
                          boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.2)'
                        }}
                      >
                        {product.image_url ? (
                          <>
                            <img 
                              src={product.image_url} 
                              alt={product.title} 
                              className="transition-all duration-500" 
                              style={getImageStyle('flat', posterRotation)}
                            />
                            {/* Premium gloss & glint effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/8 to-white/0 pointer-events-none mix-blend-overlay" />
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.03)_50%,rgba(0,0,0,0.08)_100%)] pointer-events-none" />
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
                            
                            {/* Hover zoom text */}
                            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/flat:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-white/10 shadow-lg">
                                🔍 {t.zoom}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">No Image</div>
                        )}
                      </div>
                    </div>
                  ) : activeMockup === 'metal' ? (
                    /* Premium 3D Glossy Metal Print Mockup matching the exact perspective, metallic thickness edge, drop shadow, and reflection sheen */
                    <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-[#fafaf9] via-[#f5f5f4] to-[#e7e5e4] dark:from-[#141416] dark:via-[#0c0c0e] dark:to-[#040405] overflow-hidden rounded-lg flex items-center justify-center p-6 shadow-inner border border-zinc-200/50 dark:border-zinc-800/30 animate-fade-in">
                      {/* Studio lights soft background glow (Premium warm gold spotlight in dark mode) */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0)_75%)] dark:bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,rgba(0,0,0,0)_80%)] pointer-events-none" />

                      {/* 3D Tilted Metal Plate Container with interactive hover effect */}
                      <div 
                        className="relative w-[48%] aspect-[3/4] transition-all duration-700 ease-out preserve-3d"
                        style={{
                          transform: `perspective(1600px) rotateX(43deg) rotateY(-22deg) rotateZ(19deg) scale(${selectedSize === 'F4' ? 0.82 : selectedSize === 'A3' ? 0.92 : 0.98})`,
                          transformStyle: 'preserve-3d',
                        }}
                      >
                        {/* 3D Drop Shadow layer cast underneath */}
                        <div 
                          className="absolute inset-0 rounded-sm pointer-events-none transition-all duration-500"
                          style={{
                            background: 'rgba(0,0,0,0.38)',
                            transform: 'translateZ(-30px) scale(0.96)',
                            filter: 'blur(16px)',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
                          }}
                        />

                        {/* Actual Metal Plate */}
                        <div 
                          className="w-full h-full rounded-[3px] overflow-hidden relative cursor-zoom-in group/plate transition-transform duration-350"
                          onClick={() => setIsPreviewOpen(true)}
                          style={{
                            /* Elegant extruded silver metal core edge */
                            borderRight: '1.5px solid rgba(255,255,255,0.65)',
                            borderBottom: '1.5px solid rgba(255,255,255,0.5)',
                            boxShadow: `
                              0.5px 0.5px 0px rgba(255,255,255,0.8),
                              1px 1px 0px #e2e8f0,
                              1.5px 1.5px 0px #cbd5e1,
                              2px 2px 0px #94a3b8,
                              2.5px 2.5px 0px #64748b,
                              3px 3px 4px rgba(0,0,0,0.4),
                              0 10px 25px rgba(0,0,0,0.25)
                            `
                          }}
                        >
                          {product.image_url ? (
                            <>
                              {/* Product Artwork */}
                              <img 
                                src={product.image_url} 
                                alt={product.title} 
                                className="transition-all duration-500" 
                                style={getImageStyle('metal', posterRotation)}
                              />

                              {/* High-Glossy Glass Reflection Sheen Streak (Diagonal light sheen) */}
                              <div 
                                className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-95 transition-transform duration-1000"
                                style={{
                                  background: 'linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0.65) 48%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.65) 52%, rgba(255,255,255,0) 62%, rgba(255,255,255,0) 100%)',
                                  transform: 'scale(1.5)',
                                }}
                              />

                              {/* Realistic subtle brushed aluminum metal texture overlay */}
                              <div 
                                className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
                                style={{
                                  backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
                                }}
                              />

                              {/* Light glint on the top edge */}
                              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-80 pointer-events-none" />

                              {/* Glass overlay hover zoom text */}
                              <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-white/10 shadow-lg">
                                  🔍 {t.zoom}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">No Image</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : activeMockup === 'living' ? (
                    /* Dynamic Comparative Side-by-Side Living Room Mockup showing F4, A3, and A3+ simultaneously */
                    <div className="relative w-full aspect-[4/3] bg-zinc-900 overflow-hidden rounded-lg shadow-inner">
                      <img 
                        src="/mockup_person.png" 
                        alt="Living Room Mockup" 
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
                      />

                      {/* Dark overlay to make the guidelines and gold highlights pop incredibly well */}
                      <div className="absolute inset-0 bg-black/15 pointer-events-none" />

                      {/* ================== POSTER 1: F4 (Small - Left) ================== */}
                      {/* Height Guide Line (y cm) on the RIGHT side of F4 */}
                      <div 
                        className="absolute transition-all duration-300 pointer-events-none flex items-center"
                        style={{
                          left: '26.5%',
                          top: '22%',
                          height: '18%',
                          borderLeft: '1.5px dashed rgba(212,175,55,0.75)',
                          display: selectedSize === 'F4' ? 'flex' : 'none'
                        }}
                      >
                        <span 
                          className="absolute bg-zinc-950/95 border border-[#d4af37]/45 text-[#d4af37] text-[7.5px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-30 tracking-wider"
                          style={{
                            transform: 'rotate(-90deg)',
                            transformOrigin: 'center',
                            left: '-26px'
                          }}
                        >
                          ↕️ {dimF4Val.split('x')[1]?.trim() || '33 cm'}
                        </span>
                      </div>
                      {/* Width Guide Line (x cm) directly below the bottom of F4 */}
                      <div 
                        className="absolute transition-all duration-300 pointer-events-none flex justify-center"
                        style={{
                          left: '12%',
                          top: '44%',
                          width: '13.5%',
                          borderBottom: '1.5px dashed rgba(212,175,55,0.75)',
                          display: selectedSize === 'F4' ? 'flex' : 'none'
                        }}
                      >
                        <span className="absolute top-2.5 bg-zinc-950/95 border border-[#d4af37]/45 text-[#d4af37] text-[7.5px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-30 tracking-wider">
                          ↔️ {dimF4Val.split('x')[0]?.trim() || '21'} cm
                        </span>
                      </div>
                      {/* Poster Element (F4) */}
                      <div 
                        onClick={() => setSelectedSize('F4')}
                        className={`absolute cursor-pointer select-none transition-all duration-500 rounded-sm overflow-hidden z-20 ${
                          selectedSize === 'F4' 
                            ? 'ring-2 ring-[#d4af37] scale-[1.05] shadow-[0_20px_45px_rgba(212,175,55,0.4)] opacity-100' 
                            : 'scale-[0.98] opacity-50 saturate-[0.6] hover:opacity-85 hover:saturate-100 hover:scale-100'
                        }`}
                        style={{
                          top: '22%',
                          left: '12%',
                          width: '13.5%',
                          aspectRatio: '3/4',
                          border: selectedSize === 'F4' ? '3px solid #d4af37' : '3px solid #1c1917',
                          boxShadow: selectedSize === 'F4' ? '0 25px 50px rgba(0,0,0,0.85)' : '0 12px 24px rgba(0,0,0,0.5)'
                        }}
                      >
                        {product.image_url ? (
                          <>
                            <img src={product.image_url} className="w-full h-full object-cover" alt="Poster F4" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                            {selectedSize === 'F4' ? (
                              <div className="absolute inset-x-0 bottom-0 bg-black/90 py-1 text-center border-t border-[#d4af37]/20">
                                <span className="text-[7.5px] text-[#d4af37] font-black tracking-widest uppercase">F4 (AKTIF)</span>
                              </div>
                            ) : (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <span className="text-[8px] bg-black/80 px-2 py-1 rounded text-white font-bold tracking-widest uppercase border border-white/10">F4</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">F4</div>
                        )}
                      </div>

                      {/* ================== POSTER 2: A3 (Medium - Center) ================== */}
                      {/* Height Guide Line (y cm) on the RIGHT side of A3 */}
                      <div 
                        className="absolute transition-all duration-300 pointer-events-none flex items-center"
                        style={{
                          left: '56.5%',
                          top: '16.5%',
                          height: '23.3%',
                          borderLeft: '1.5px dashed rgba(212,175,55,0.75)',
                          display: selectedSize === 'A3' ? 'flex' : 'none'
                        }}
                      >
                        <span 
                          className="absolute bg-zinc-950/95 border border-[#d4af37]/45 text-[#d4af37] text-[7.5px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-30 tracking-wider"
                          style={{
                            transform: 'rotate(-90deg)',
                            transformOrigin: 'center',
                            left: '-26px'
                          }}
                        >
                          ↕️ {dimA3Val.split('x')[1]?.trim() || '42 cm'}
                        </span>
                      </div>
                      {/* Width Guide Line (x cm) directly below the bottom of A3 */}
                      <div 
                        className="absolute transition-all duration-300 pointer-events-none flex justify-center"
                        style={{
                          left: '38%',
                          top: '44%',
                          width: '17.5%',
                          borderBottom: '1.5px dashed rgba(212,175,55,0.75)',
                          display: selectedSize === 'A3' ? 'flex' : 'none'
                        }}
                      >
                        <span className="absolute top-2.5 bg-zinc-950/95 border border-[#d4af37]/45 text-[#d4af37] text-[7.5px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-30 tracking-wider">
                          ↔️ {dimA3Val.split('x')[0]?.trim() || '30'} cm
                        </span>
                      </div>
                      {/* Poster Element (A3) */}
                      <div 
                        onClick={() => setSelectedSize('A3')}
                        className={`absolute cursor-pointer select-none transition-all duration-500 rounded-sm overflow-hidden z-20 ${
                          selectedSize === 'A3' 
                            ? 'ring-2 ring-[#d4af37] scale-[1.05] shadow-[0_20px_45px_rgba(212,175,55,0.4)] opacity-100' 
                            : 'scale-[0.98] opacity-50 saturate-[0.6] hover:opacity-85 hover:saturate-100 hover:scale-100'
                        }`}
                        style={{
                          top: '16.5%',
                          left: '38%',
                          width: '17.5%',
                          aspectRatio: '3/4',
                          border: selectedSize === 'A3' ? '3px solid #d4af37' : '3px solid #1c1917',
                          boxShadow: selectedSize === 'A3' ? '0 25px 50px rgba(0,0,0,0.85)' : '0 12px 24px rgba(0,0,0,0.5)'
                        }}
                      >
                        {product.image_url ? (
                          <>
                            <img src={product.image_url} className="w-full h-full object-cover" alt="Poster A3" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                            {selectedSize === 'A3' ? (
                              <div className="absolute inset-x-0 bottom-0 bg-black/90 py-1 text-center border-t border-[#d4af37]/20">
                                <span className="text-[7.5px] text-[#d4af37] font-black tracking-widest uppercase">A3 (AKTIF)</span>
                              </div>
                            ) : (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <span className="text-[8px] bg-black/80 px-2 py-1 rounded text-white font-bold tracking-widest uppercase border border-white/10">A3</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">A3</div>
                        )}
                      </div>

                      {/* ================== POSTER 3: A3+ (Large - Right) ================== */}
                      {/* Height Guide Line (y cm) on the RIGHT side of A3+ */}
                      <div 
                        className="absolute transition-all duration-300 pointer-events-none flex items-center"
                        style={{
                          left: '91%',
                          top: '10.5%',
                          height: '29.3%',
                          borderLeft: '1.5px dashed rgba(212,175,55,0.75)',
                          display: selectedSize === 'A3+' ? 'flex' : 'none'
                        }}
                      >
                        <span 
                          className="absolute bg-zinc-950/95 border border-[#d4af37]/45 text-[#d4af37] text-[7.5px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-30 tracking-wider"
                          style={{
                            transform: 'rotate(-90deg)',
                            transformOrigin: 'center',
                            left: '-26px'
                          }}
                        >
                          ↕️ {dimA3PlusVal.split('x')[1]?.trim() || '48 cm'}
                        </span>
                      </div>
                      {/* Width Guide Line (x cm) directly below the bottom of A3+ */}
                      <div 
                        className="absolute transition-all duration-300 pointer-events-none flex justify-center"
                        style={{
                          left: '68%',
                          top: '44%',
                          width: '22%',
                          borderBottom: '1.5px dashed rgba(212,175,55,0.75)',
                          display: selectedSize === 'A3+' ? 'flex' : 'none'
                        }}
                      >
                        <span className="absolute top-2.5 bg-zinc-950/95 border border-[#d4af37]/45 text-[#d4af37] text-[7.5px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-30 tracking-wider">
                          ↔️ {dimA3PlusVal.split('x')[0]?.trim() || '32'} cm
                        </span>
                      </div>
                      {/* Poster Element (A3+) */}
                      <div 
                        onClick={() => setSelectedSize('A3+')}
                        className={`absolute cursor-pointer select-none transition-all duration-500 rounded-sm overflow-hidden z-20 ${
                          selectedSize === 'A3+' 
                            ? 'ring-2 ring-[#d4af37] scale-[1.05] shadow-[0_20px_45px_rgba(212,175,55,0.4)] opacity-100' 
                            : 'scale-[0.98] opacity-50 saturate-[0.6] hover:opacity-85 hover:saturate-100 hover:scale-100'
                        }`}
                        style={{
                          top: '10.5%',
                          left: '68%',
                          width: '22%',
                          aspectRatio: '3/4',
                          border: selectedSize === 'A3+' ? '3px solid #d4af37' : '3px solid #1c1917',
                          boxShadow: selectedSize === 'A3+' ? '0 25px 50px rgba(0,0,0,0.85)' : '0 12px 24px rgba(0,0,0,0.5)'
                        }}
                      >
                        {product.image_url ? (
                          <>
                            <img src={product.image_url} className="w-full h-full object-cover" alt="Poster A3+" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                            {selectedSize === 'A3+' ? (
                              <div className="absolute inset-x-0 bottom-0 bg-black/90 py-1 text-center border-t border-[#d4af37]/20">
                                <span className="text-[7.5px] text-[#d4af37] font-black tracking-widest uppercase">A3+ (AKTIF)</span>
                              </div>
                            ) : (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <span className="text-[8px] bg-black/80 px-2 py-1 rounded text-white font-bold tracking-widest uppercase border border-white/10">A3+</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">A3+</div>
                        )}
                      </div>

                      {/* ================== ELEGANT MEASUREMENT HEIGHT RULER (FAR RIGHT) ================== */}
                      <div className="absolute right-4 top-8 bottom-32 w-8 flex flex-col justify-between items-center select-none pointer-events-none text-zinc-500 font-mono text-[7px] z-10 opacity-70">
                        {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                          <div key={num} className="w-full flex items-center justify-end relative h-0">
                            <span className="mr-1.5 font-black">{num}</span>
                            <div className="w-3 border-t border-zinc-500/60" />
                          </div>
                        ))}
                        {/* Vertical line connecting them */}
                        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-zinc-500/40" />
                      </div>
                    </div>
                  ) : activeMockup === 'studio' ? (
                    /* Dynamic mathematically correct desk setup mockup showing 3 posters side-by-side */
                    <div className="relative w-full aspect-[4/3] bg-zinc-900 overflow-hidden rounded-lg shadow-inner">
                      <img 
                        src="/mockup_desk.png" 
                        alt="Setup Desk Mockup" 
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
                      />

                      {/* Ambient overlay */}
                      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

                      {/* ================== POSTER 1: LEFT POSTER (Customizable) ================== */}
                      <div 
                        className="absolute rounded-sm overflow-hidden z-10 transition-all duration-300 animate-fade-in"
                        style={{
                          top: '8%',
                          left: '18%',
                          width: '18%',
                          aspectRatio: '3/4',
                          boxShadow: '0 12px 28px rgba(0,0,0,0.5)'
                        }}
                      >
                        <img 
                          src={getUrl('mockup-studio-left') || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop'} 
                          className="w-full h-full object-cover select-none" 
                          alt="Poster Left" 
                        />
                        {/* High-end glossy glass reflection effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none mix-blend-overlay" />
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.05)_50%,rgba(0,0,0,0.12)_100%)] pointer-events-none" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/20 pointer-events-none" />
                      </div>

                      {/* ================== POSTER 2: CENTER POSTER (Active product poster to purchase) ================== */}
                      <div 
                        onClick={() => setIsPreviewOpen(true)}
                        className="absolute cursor-zoom-in rounded-sm overflow-hidden z-20 group/center transition-all duration-500 scale-[1.05] hover:scale-[1.07]"
                        style={{
                          top: '8%',
                          left: '41%',
                          width: '18%',
                          aspectRatio: '3/4',
                          boxShadow: '0 20px 40px rgba(0,0,0,0.7)'
                        }}
                      >
                        {product.image_url ? (
                          <>
                            <img src={product.image_url} className="w-full h-full object-cover" alt="Active Product Poster" />
                            {/* High-end glossy glass reflection effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none mix-blend-overlay" />
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.05)_50%,rgba(0,0,0,0.12)_100%)] pointer-events-none" />
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/20 pointer-events-none" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">No Image</div>
                        )}
                      </div>

                      {/* ================== POSTER 3: RIGHT POSTER (Customizable) ================== */}
                      <div 
                        className="absolute rounded-sm overflow-hidden z-10 transition-all duration-300"
                        style={{
                          top: '8%',
                          left: '64%',
                          width: '18%',
                          aspectRatio: '3/4',
                          boxShadow: '0 12px 28px rgba(0,0,0,0.5)'
                        }}
                      >
                        <img 
                          src={getUrl('mockup-studio-right') || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop'} 
                          className="w-full h-full object-cover select-none" 
                          alt="Poster Right" 
                        />
                        {/* High-end glossy glass reflection effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none mix-blend-overlay" />
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.05)_50%,rgba(0,0,0,0.12)_100%)] pointer-events-none" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/20 pointer-events-none" />
                      </div>
                    </div>
                  ) : activeMockup === 'livingroom' ? (
                    /* Living Room Mockup - Clean modern room with green chair and plant */
                    <div className="relative w-full aspect-[4/3] bg-zinc-900 overflow-hidden rounded-lg animate-fade-in">
                      <img 
                        src="/mockup_livingroom.jpg" 
                        alt="Living Room Mockup" 
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
                      />
                      {/* Product poster on wall */}
                      <div 
                        onClick={() => setIsPreviewOpen(true)}
                        className="absolute cursor-zoom-in overflow-hidden z-20 transition-all duration-300 hover:scale-[1.02]"
                        style={{
                          top: '8.8%',
                          left: '37.9%',
                          width: '23.4%',
                          aspectRatio: '240/342',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)'
                        }}
                      >
                        {product.image_url ? (
                          <>
                            <img 
                              src={product.image_url} 
                              className="transition-all duration-500" 
                              style={getImageStyle('livingroom', posterRotation)}
                              alt="Poster in Living Room" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/8 to-white/0 pointer-events-none" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">No Image</div>
                        )}
                      </div>
                    </div>
                  ) : activeMockup === 'living_landscape' ? (
                    /* Living Room Mockup - Landscape Version with custom background */
                    <div className="relative w-full aspect-[4/3] bg-zinc-900 overflow-hidden rounded-lg animate-fade-in">
                      <img 
                        src="/mockup_livingroom_landscape.png" 
                        alt="Living Room Mockup Landscape" 
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
                        style={{ objectPosition: 'center 0%' }}
                      />
                      {/* Product poster on wall (Landscape aspect ratio 32.9/25.8) */}
                      <div 
                        onClick={() => setIsPreviewOpen(true)}
                        className="absolute cursor-zoom-in overflow-hidden z-20 transition-all duration-300 hover:scale-[1.02]"
                        style={{
                          top: '24.2%',
                          left: '31.3%',
                          width: '32.9%',
                          aspectRatio: '32.9/25.8',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)'
                        }}
                      >
                        {product.image_url ? (
                          <>
                            <img 
                              src={product.image_url} 
                              className="transition-all duration-500" 
                              style={getImageStyle('living_landscape', (posterRotation + 90) % 360)}
                              alt="Poster in Living Room Landscape" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/8 to-white/0 pointer-events-none" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">No Image</div>
                        )}
                      </div>
                    </div>
                  ) : activeMockup === 'display' ? (
                    /* Product Display / Packaging Mockup - Clean orthographic front view with side-by-side Portrait & Landscape combo */
                    <div className="relative w-full aspect-[4/3] bg-zinc-900 overflow-hidden rounded-lg animate-fade-in">
                      <img 
                        src="/mockup_display_clean.png" 
                        alt="Product Display Portrait & Landscape" 
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
                      />
                      
                      {/* Left: Portrait Poster */}
                      <div 
                        onClick={() => setIsPreviewOpen(true)}
                        className="absolute cursor-zoom-in overflow-hidden z-20 transition-all duration-500 hover:scale-[1.02]"
                        style={{
                          top: `${activeDisplayTop}%`,
                          left: `${activeDisplaySideLeft}%`,
                          width: `${activeDisplayWidth}%`,
                          aspectRatio: '3/4',
                          boxShadow: '0 15px 35px rgba(0,0,0,0.35), 0 5px 12px rgba(0,0,0,0.2)'
                        }}
                      >
                        {product.image_url ? (
                          <>
                            <img 
                              src={product.image_url} 
                              className="transition-all duration-500" 
                              style={getImageStyle('display', posterRotation)}
                              alt="Product Display Portrait" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0)_60%)] pointer-events-none" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">No Image</div>
                        )}
                      </div>

                      {/* Right: Landscape Poster */}
                      <div 
                        onClick={() => setIsPreviewOpen(true)}
                        className="absolute cursor-zoom-in overflow-hidden z-20 transition-all duration-500 hover:scale-[1.02]"
                        style={{
                          top: `${activeDisplayLandscapeTop}%`,
                          left: `${activeDisplaySideLandscapeLeft}%`,
                          width: `${activeDisplayLandscapeWidth}%`,
                          aspectRatio: '4/3',
                          boxShadow: '0 15px 35px rgba(0,0,0,0.35), 0 5px 12px rgba(0,0,0,0.2)'
                        }}
                      >
                        {product.image_url ? (
                          <>
                            <img 
                              src={product.image_url} 
                              className="transition-all duration-500" 
                              style={getImageStyle('display_landscape', displayLandscapeRotation)}
                              alt="Product Display Landscape" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0)_60%)] pointer-events-none" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">No Image</div>
                        )}
                      </div>
                    </div>
                  ) : activeMockup === 'cafe' ? (
                    /* Cafe Mockup with dynamic poster frames positioned precisely on the wall and responsive size scaling */
                    <div className="relative w-full aspect-[16/9] bg-zinc-900 overflow-hidden rounded-lg shadow-inner animate-fade-in">
                      <img 
                        src="/mockup_cafe.jpg" 
                        alt="Cafe Mockup" 
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
                      />
                      
                      {/* Ambient overlay */}
                      <div className="absolute inset-0 bg-black/5 pointer-events-none" />

                      {/* ================== POSTER 1: LEFT POSTER ================== */}
                      <div 
                        className="absolute rounded-sm overflow-hidden z-10 transition-all duration-300"
                        style={{
                          top: `${activeCafeTop}%`,
                          left: `${25 - activeCafeWidth / 2}%`,
                          width: `${activeCafeWidth}%`,
                          aspectRatio: activeCafeAspect,
                          border: '3px solid #1c1917',
                          boxShadow: '0 16px 36px rgba(0,0,0,0.65), 0 4px 10px rgba(0,0,0,0.4), inset 0 0 12px rgba(0,0,0,0.1)'
                        }}
                      >
                        <img 
                          src={getUrl('mockup-cafe-left') || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop'} 
                          className="w-full h-full object-cover select-none" 
                          alt="Poster Cafe Left" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none mix-blend-overlay" />
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.03)_50%,rgba(0,0,0,0.08)_100%)] pointer-events-none" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
                      </div>

                      {/* ================== POSTER 2: CENTER POSTER (Active product) ================== */}
                      <div 
                        onClick={() => setIsPreviewOpen(true)}
                        className="absolute cursor-zoom-in rounded-sm overflow-hidden z-20 group/center transition-all duration-500 scale-[1.01] hover:scale-[1.03]"
                        style={{
                          top: `${activeCafeTop}%`,
                          left: `${50 - activeCafeWidth / 2}%`,
                          width: `${activeCafeWidth}%`,
                          aspectRatio: activeCafeAspect,
                          border: '3.5px solid #1c1917',
                          boxShadow: '0 20px 48px rgba(0,0,0,0.75), 0 6px 15px rgba(0,0,0,0.45), inset 0 0 12px rgba(0,0,0,0.1)'
                        }}
                      >
                        {product.image_url ? (
                          <>
                            <img src={product.image_url} className="w-full h-full object-cover" alt="Active Product Poster" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none mix-blend-overlay" />
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.03)_50%,rgba(0,0,0,0.08)_100%)] pointer-events-none" />
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">No Image</div>
                        )}
                      </div>

                      {/* ================== POSTER 3: RIGHT POSTER ================== */}
                      <div 
                        className="absolute rounded-sm overflow-hidden z-10 transition-all duration-300"
                        style={{
                          top: `${activeCafeTop}%`,
                          left: `${75 - activeCafeWidth / 2}%`,
                          width: `${activeCafeWidth}%`,
                          aspectRatio: activeCafeAspect,
                          border: '3px solid #1c1917',
                          boxShadow: '0 16px 36px rgba(0,0,0,0.65), 0 4px 10px rgba(0,0,0,0.4), inset 0 0 12px rgba(0,0,0,0.1)'
                        }}
                      >
                        <img 
                          src={getUrl('mockup-cafe-right') || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop'} 
                          className="w-full h-full object-cover select-none" 
                          alt="Poster Cafe Right" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none mix-blend-overlay" />
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.03)_50%,rgba(0,0,0,0.08)_100%)] pointer-events-none" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
                      </div>
                    </div>
                  ) : activeMockup === 'gaming' ? (
                    /* Gaming Room Mockup with dynamic poster frames, tech aesthetic, and neon glow shadow */
                    <div className="relative w-full aspect-[16/9] bg-zinc-900 overflow-hidden rounded-lg shadow-inner animate-fade-in">
                      <img 
                        src="/mockup_gaming.jpg" 
                        alt="Gaming Room Mockup" 
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
                      />
                      
                      {/* Ambient/cyberpunk glowing overlay */}
                      <div className="absolute inset-0 bg-purple-950/10 pointer-events-none" />

                      {/* ================== POSTER 1: LEFT POSTER ================== */}
                      <div 
                        className="absolute rounded-sm overflow-hidden z-10 transition-all duration-300"
                        style={{
                          top: `${activeGamingTop}%`,
                          left: `${25 - activeGamingWidth / 2}%`,
                          width: `${activeGamingWidth}%`,
                          aspectRatio: activeGamingAspect,
                          border: '4.5px solid #111',
                          boxShadow: '0 12px 30px rgba(0,0,0,0.8), 0 0 20px rgba(168,85,247,0.35), 0 0 35px rgba(6,182,212,0.25)'
                        }}
                      >
                        <img 
                          src={getUrl('mockup-gaming-left') || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop'} 
                          className="w-full h-full object-cover select-none" 
                          alt="Poster Gaming Left" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none mix-blend-overlay" />
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.03)_50%,rgba(0,0,0,0.08)_100%)] pointer-events-none" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
                      </div>

                      {/* ================== POSTER 2: CENTER POSTER (Active product) ================== */}
                      <div 
                        onClick={() => setIsPreviewOpen(true)}
                        className="absolute cursor-zoom-in rounded-sm overflow-hidden z-20 group/center transition-all duration-500 scale-[1.01] hover:scale-[1.03]"
                        style={{
                          top: `${activeGamingTop}%`,
                          left: `${50 - activeGamingWidth / 2}%`,
                          width: `${activeGamingWidth}%`,
                          aspectRatio: activeGamingAspect,
                          border: '4.5px solid #111',
                          boxShadow: '0 20px 48px rgba(0,0,0,0.9), 0 0 30px rgba(168,85,247,0.55), 0 0 50px rgba(6,182,212,0.35)'
                        }}
                      >
                        {product.image_url ? (
                          <>
                            <img src={product.image_url} className="w-full h-full object-cover" alt="Active Product Poster" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none mix-blend-overlay" />
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.03)_50%,rgba(0,0,0,0.08)_100%)] pointer-events-none" />
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">No Image</div>
                        )}
                      </div>

                      {/* ================== POSTER 3: RIGHT POSTER ================== */}
                      <div 
                        className="absolute rounded-sm overflow-hidden z-10 transition-all duration-300"
                        style={{
                          top: `${activeGamingTop}%`,
                          left: `${75 - activeGamingWidth / 2}%`,
                          width: `${activeGamingWidth}%`,
                          aspectRatio: activeGamingAspect,
                          border: '4.5px solid #111',
                          boxShadow: '0 12px 30px rgba(0,0,0,0.8), 0 0 20px rgba(168,85,247,0.35), 0 0 35px rgba(6,182,212,0.25)'
                        }}
                      >
                        <img 
                          src={getUrl('mockup-gaming-right') || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop'} 
                          className="w-full h-full object-cover select-none" 
                          alt="Poster Gaming Right" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none mix-blend-overlay" />
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.03)_50%,rgba(0,0,0,0.08)_100%)] pointer-events-none" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
                      </div>
                    </div>
                  ) : (
                    /* Bedroom Mockup with a single cozy poster centered over the headboard and light oak wooden frame */
                    <div className="relative w-full aspect-[16/9] bg-zinc-900 overflow-hidden rounded-lg shadow-inner animate-fade-in">
                      <img 
                        src="/mockup_bedroom.jpg" 
                        alt="Bedroom Mockup" 
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
                      />
                      
                      {/* Ambient warm lighting overlay */}
                      <div className="absolute inset-0 bg-amber-900/5 pointer-events-none" />

                      {/* ================== CENTERED POSTER ABOVE THE HEADBOARD ================== */}
                      <div 
                        onClick={() => setIsPreviewOpen(true)}
                        className="absolute cursor-zoom-in rounded-sm overflow-hidden z-20 group/center transition-all duration-500 scale-[1.01] hover:scale-[1.03]"
                        style={{
                          top: `${activeBedroomTop}%`,
                          left: `${50 - activeBedroomWidth / 2}%`,
                          width: `${activeBedroomWidth}%`,
                          aspectRatio: activeBedroomAspect,
                          border: '4.5px solid #d4c5b9', // Elegant light oak wooden border
                          boxShadow: '0 12px 32px rgba(0,0,0,0.3), 0 4px 10px rgba(0,0,0,0.2), inset 0 0 12px rgba(0,0,0,0.05)'
                        }}
                      >
                        {product.image_url ? (
                          <>
                            <img src={product.image_url} className="w-full h-full object-cover" alt="Active Product Poster" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none mix-blend-overlay" />
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.03)_50%,rgba(0,0,0,0.08)_100%)] pointer-events-none" />
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">No Image</div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Floating Rotation Control Overlay */}
                  {['gaming', 'studio', 'cafe', 'bedroom'].includes(activeMockup) ? null : activeMockup === 'display' ? (
                    <div className="absolute bottom-4 right-4 z-30 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPosterRotation((prev) => (prev + 90) % 360);
                        }}
                        className="bg-black/80 hover:bg-black text-[#d4af37] border border-[#d4af37]/30 hover:border-[#d4af37] px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all active:scale-95 select-none animate-fade-in"
                      >
                        🔄 Putar Portrait (Kiri)
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDisplayLandscapeRotation((prev) => (prev + 90) % 360);
                        }}
                        className="bg-black/80 hover:bg-black text-[#d4af37] border border-[#d4af37]/30 hover:border-[#d4af37] px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all active:scale-95 select-none animate-fade-in"
                      >
                        🔄 Putar Landscape (Kanan)
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPosterRotation((prev) => (prev + 90) % 360);
                      }}
                      className="absolute bottom-4 right-4 z-30 bg-black/80 hover:bg-black text-[#d4af37] border border-[#d4af37]/30 hover:border-[#d4af37] px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all active:scale-95 select-none"
                    >
                      🔄 Putar Gambar
                    </button>
                  )}
                </div>

                {/* Mobile Thumbnail Strip (horizontal scroll) */}
                <div className="md:hidden flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1 px-1">
                  {[
                    { key: 'flat', img: product.image_url, alt: 'Poster' },
                    { key: 'metal', img: product.image_url, alt: 'Metal' },
                    { key: 'gaming', img: '/mockup_gaming.jpg', alt: 'Gaming' },
                    { key: 'livingroom', img: '/mockup_livingroom.jpg', alt: 'Living Room (PRT)', badge: 'PRT' },
                    { key: 'living_landscape', img: '/mockup_livingroom_landscape.png', alt: 'Living Room (LND)', badge: 'LND' },
                    { key: 'display', img: '/mockup_display_clean.png', alt: 'Display (Prt & Lnd)', badge: 'P&L' },
                    { key: 'living', img: '/mockup_person.png', alt: 'Scale' },
                    { key: 'studio', img: '/mockup_desk.png', alt: 'Studio' },
                    { key: 'cafe', img: '/mockup_cafe.jpg', alt: 'Cafe' },
                    { key: 'bedroom', img: '/mockup_bedroom.jpg', alt: 'Bedroom' },
                  ].map(thumb => (
                    <button
                      key={thumb.key}
                      type="button"
                      onClick={() => setActiveMockup(thumb.key)}
                      className={`w-14 h-14 rounded-md overflow-hidden border-2 bg-zinc-900 shrink-0 transition-all duration-200 relative ${
                        activeMockup === thumb.key 
                          ? 'border-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.4)] opacity-100 scale-105' 
                          : 'border-zinc-700/50 opacity-50'
                      }`}
                    >
                      <img src={thumb.img} alt={thumb.alt} className="w-full h-full object-cover" />
                      {thumb.badge && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/85 py-0.5 text-[7px] text-[#d4af37] font-black uppercase tracking-wider text-center border-t border-[#d4af37]/20 select-none">
                          {thumb.badge}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Deskripsi Produk di bawah Foto */}
            <div className="bg-zinc-900/50 p-8 rounded-lg border border-zinc-800">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#d4af37] rounded-full"></span>
                {t.description}
              </h3>
              <div className="text-[var(--text-main)] opacity-80 leading-relaxed space-y-4">
                {product.notes ? (
                  <p className="whitespace-pre-wrap text-lg font-medium leading-relaxed">{getTranslatedNotes(product.notes)}</p>
                ) : (
                  <p className="opacity-50 italic">{t.noDesc}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bagian Kanan: Info Sticky */}
          <div className="lg:col-span-5">
            <div className="glass p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-850/40 sticky top-28 shadow-2xl">
              <div className="uppercase tracking-[0.2em] text-[10px] text-[#d4af37] font-black mb-3">
                {product.category} {product.subcategory && product.subcategory !== product.category ? `• ${product.subcategory}` : ''}
              </div>
              <h1 className="text-4xl font-black mb-4 tracking-tight leading-tight">{product.title}</h1>
              
              {/* Premium Size Selector */}
              <div className="mb-6">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-2">Pilih Ukuran</span>
                <div className="flex flex-col sm:flex-row gap-3">
                  {['F4', 'A3', 'A3+'].map((size) => {
                    const active = selectedSize === size
                    const pInf = getPriceInfo(getText, size)
                    const dimStr = getDimensionInfo(getText, size)
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`flex-1 py-3 px-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 ${
                          active 
                            ? 'bg-gradient-to-r from-[#f3e5ab] to-[#d4af37] text-black border-transparent shadow-lg shadow-[#d4af37]/20 scale-[1.02]' 
                            : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span className="text-sm font-black uppercase tracking-wider">{size}</span>
                        <span className={`text-[9px] font-bold ${active ? 'text-black/60' : 'text-zinc-500'}`}>
                          {dimStr}
                        </span>
                        <span className={`text-[9px] font-black mt-0.5 ${active ? 'text-black/80' : 'text-zinc-400'}`}>
                          Rp {pInf.discount.toLocaleString('id-ID')}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Dynamic Prices */}
              <div className="mb-8 flex items-baseline gap-3 flex-wrap">
                {priceInfo.hasDiscount ? (
                  <>
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#f3e5ab] via-[#d4af37] to-[#aa7c11] font-serif">
                      Rp {priceInfo.discount.toLocaleString('id-ID')}
                    </span>
                    <span className="text-sm text-gray-500 line-through font-medium">
                      Rp {priceInfo.original.toLocaleString('id-ID')}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#f3e5ab] via-[#d4af37] to-[#aa7c11] font-serif">
                    Rp {priceInfo.original.toLocaleString('id-ID')}
                  </span>
                )}
              </div>
              
              <button 
                onClick={handleAddToCart}
                className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest transition-all transform active:scale-95 ${
                  added 
                    ? 'bg-green-600 text-white shadow-[0_0_30px_rgba(22,163,74,0.4)]'
                    : 'bg-gradient-to-r from-[#f3e5ab] via-[#d4af37] to-[#b39359] hover:brightness-110 shadow-[0_0_30px_rgba(212,175,55,0.25)] hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] text-black'
                }`}
              >
                {added ? `✓ ${t.added}` : t.addToCart}
              </button>

              <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/5 space-y-4">
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-lg">✨</span>
                  {t.premium}
                </div>
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider opacity-60">
                  <span className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-lg">🛡️</span>
                  {t.warranty}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rekomendasi di Bagian Bawah (Full Width) */}
        {recommendations.length > 0 && (
          <div className="mt-20 pt-20 border-t border-black/5 dark:border-white/5">
            <h3 className="text-2xl font-black mb-10 flex items-center gap-3 uppercase tracking-tighter">
              <span className="w-2 h-8 bg-[#d4af37] rounded-full"></span>
              {t.recommendations}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recommendations.map((rec) => (
                <Link key={rec.id} href={`/product/${rec.id}`}>
                  <div className="group cursor-pointer">
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden glass border border-zinc-200/80 dark:border-zinc-850/40 relative shadow-lg group-hover:border-[#d4af37]/50 transition-all duration-500">
                      {rec.image_url && (
                        <img 
                          src={rec.image_url} 
                          alt={rec.title} 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="w-full py-2 bg-gradient-to-r from-[#f3e5ab] via-[#d4af37] to-[#b39359] text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md text-center">
                          {t.view}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-bold text-sm mt-4 line-clamp-1 group-hover:text-[#d4af37] transition-colors uppercase tracking-tight">{rec.title}</h4>
                    {(() => {
                      const pInfoS = getPriceInfo(getText, 'F4')
                      return pInfoS.hasDiscount ? (
                        <p className="text-xs text-[#d4af37] font-black mt-1">
                          <span className="line-through text-gray-500 mr-1.5 text-[10px]">Rp {pInfoS.original.toLocaleString('id-ID')}</span>
                          <span>Rp {pInfoS.discount.toLocaleString('id-ID')}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-[#d4af37] font-black mt-1">
                          Rp {pInfoS.original.toLocaleString('id-ID')}
                        </p>
                      )
                    })()}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />

      <ImageModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        imageUrl={product.image_url} 
        title={product.title} 
      />
    </div>
  )
}
