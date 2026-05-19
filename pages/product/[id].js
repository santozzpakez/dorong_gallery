import { useEffect, useState } from 'react'
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
  const { getText } = useSiteAssets()
  const priceInfo = getPriceInfo(getText, selectedSize)
  const [added, setAdded] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [activeMockup, setActiveMockup] = useState('flat')

  const scaleHeights = { F4: 15, A3: 19.1, 'A3+': 21.8 }
  const currentScaleHeight = scaleHeights[selectedSize] || 15

  const livingRoomWidths = { F4: 13, A3: 17, 'A3+': 21 }
  const livingRoomLefts = { F4: 43.5, A3: 41.5, 'A3+': 39.5 }
  const livingRoomTops = { F4: 26, A3: 23, 'A3+': 20 }
  
  const activeLivingWidth = livingRoomWidths[selectedSize] || 13
  const activeLivingLeft = livingRoomLefts[selectedSize] || 43.5
  const activeLivingTop = livingRoomTops[selectedSize] || 26

  const dimF4Val = getDimensionInfo(getText, 'F4')
  const dimA3Val = getDimensionInfo(getText, 'A3')
  const dimA3PlusVal = getDimensionInfo(getText, 'A3+')

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
    if (!id || !hasSupabaseConfig || !supabase) return

    async function loadData() {
      setLoading(true)
      
      // Ambil detail produk
      const { data: pData, error: pErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

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

      if (!recErr && recData) {
        // Acak rekomendasi
        const shuffled = [...recData].sort(() => 0.5 - Math.random()).slice(0, 4)
        setRecommendations(shuffled)
      }

      setLoading(false)
    }

    loadData()
  }, [id])

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
              {/* Vertical Side Thumbnails Bar (hidden on mobile) */}
              <div className="hidden md:flex flex-col gap-3 w-20 shrink-0">
                {/* Flat Poster Thumb */}
                <button
                  type="button"
                  onClick={() => setActiveMockup('flat')}
                  className={`w-full aspect-[3/4] rounded-xl overflow-hidden border-2 bg-black/40 relative group transition-all ${
                    activeMockup === 'flat' ? 'border-[#d4af37] scale-105 shadow-md shadow-[#d4af37]/20' : 'border-zinc-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={product.image_url} alt="Flat View" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[9px] text-white font-black uppercase tracking-wider">Flat</div>
                </button>

                {/* Living Room Thumb */}
                <button
                  type="button"
                  onClick={() => setActiveMockup('living')}
                  className={`w-full aspect-[3/4] rounded-xl overflow-hidden border-2 bg-black/40 relative group transition-all ${
                    activeMockup === 'living' ? 'border-[#d4af37] scale-105 shadow-md shadow-[#d4af37]/20' : 'border-zinc-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src="https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=200&auto=format&fit=crop" alt="Living Room" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[9px] text-white font-black uppercase tracking-wider">Ruang</div>
                </button>

                {/* Studio Thumb / Scale Thumb */}
                <button
                  type="button"
                  onClick={() => setActiveMockup('studio')}
                  className={`w-full aspect-[3/4] rounded-xl overflow-hidden border-2 bg-black/40 relative group transition-all ${
                    activeMockup === 'studio' ? 'border-[#d4af37] scale-105 shadow-md shadow-[#d4af37]/20' : 'border-zinc-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src="https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=200&auto=format&fit=crop" alt="Studio View" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[9px] text-white font-black uppercase tracking-wider">Studio</div>
                </button>
              </div>

              {/* Main Viewer Area */}
              <div className="flex-grow w-full">
                <div 
                  className="rounded-3xl overflow-hidden glass border border-zinc-200/80 dark:border-zinc-850/40 shadow-2xl relative group bg-black/30 w-full select-none"
                >
                  {activeMockup === 'flat' ? (
                    <div 
                      className="cursor-zoom-in relative"
                      onClick={() => setIsPreviewOpen(true)}
                    >
                      {product.image_url ? (
                        <>
                          <img src={product.image_url} alt={product.title} className="w-full h-auto object-cover max-h-[85vh] group-hover:scale-[1.01] transition-transform duration-700" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-black/40 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-full border border-white/10 shadow-xl">
                              🔍 {t.zoom}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full aspect-[3/4] bg-white/5 flex items-center justify-center">No Image</div>
                      )}
                    </div>
                  ) : activeMockup === 'living' ? (
                    /* Dynamic Comparative Side-by-Side Living Room Mockup showing F4, A3, and A3+ simultaneously */
                    <div className="relative w-full aspect-[4/3] bg-zinc-900 overflow-hidden">
                      <img 
                        src="/mockup_living.png" 
                        alt="Living Room Mockup" 
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
                      />

                      {/* Dark overlay to make the guidelines and gold highlights pop incredibly well */}
                      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

                      {/* ================== POSTER 1: A3+ (Large) ================== */}
                      {/* Height Guide Line (y cm) on the RIGHT side of A3+ */}
                      <div 
                        className="absolute transition-all duration-300 pointer-events-none flex items-center"
                        style={{
                          left: '35.5%',
                          top: '12%',
                          height: '26.6%',
                          borderLeft: '1px dashed rgba(212,175,55,0.7)',
                        }}
                      >
                        <span className="absolute left-2 bg-zinc-950/95 border border-[#d4af37]/35 text-[#d4af37] text-[7px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
                          {dimA3PlusVal.split('x')[1]?.trim() || '48 cm'}
                        </span>
                      </div>
                      {/* Width Guide Line (x cm) directly below the bottom of A3+ */}
                      <div 
                        className="absolute transition-all duration-300 pointer-events-none flex justify-center"
                        style={{
                          left: '14%',
                          top: '40%',
                          width: '20%',
                          borderBottom: '1px dashed rgba(212,175,55,0.7)',
                        }}
                      >
                        <span className="absolute top-1.5 bg-zinc-950/95 border border-[#d4af37]/35 text-[#d4af37] text-[7px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
                          {dimA3PlusVal.split('x')[0]?.trim() || '32 cm'}
                        </span>
                      </div>
                      {/* Poster Element (A3+) */}
                      <div 
                        onClick={() => setSelectedSize('A3+')}
                        className={`absolute cursor-pointer select-none transition-all duration-500 rounded-sm overflow-hidden opacity-100 ${
                          selectedSize === 'A3+' 
                            ? 'ring-2 ring-[#d4af37] scale-[1.04] z-25 shadow-[0_25px_50px_rgba(212,175,55,0.25)]' 
                            : 'scale-[0.98] z-10 hover:scale-100'
                        }`}
                        style={{
                          top: '12%',
                          left: '14%',
                          width: '20%',
                          aspectRatio: '3/4',
                          boxShadow: selectedSize === 'A3+' ? '0 25px 50px rgba(0,0,0,0.8)' : '0 12px 24px rgba(0,0,0,0.4)'
                        }}
                      >
                        {selectedSize === 'A3+' ? (
                          <>
                            <img src={product.image_url} className="w-full h-full object-cover" alt="Poster Large" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent py-1 text-center">
                              <span className="text-[7px] text-[#d4af37] font-black tracking-widest uppercase">AKTIF (A3+)</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-b from-[#f7f6f2] to-[#e6e4de] flex items-center justify-center">
                            <span className="text-zinc-400 font-serif font-black text-xs md:text-sm tracking-widest uppercase select-none opacity-40">A3+</span>
                          </div>
                        )}
                      </div>

                      {/* ================== POSTER 2: A3 (Medium) ================== */}
                      {/* Height Guide Line (y cm) on the RIGHT side of A3 */}
                      <div 
                        className="absolute transition-all duration-300 pointer-events-none flex items-center"
                        style={{
                          left: '60%',
                          top: '17%',
                          height: '22%',
                          borderLeft: '1px dashed rgba(212,175,55,0.7)',
                        }}
                      >
                        <span className="absolute left-2 bg-zinc-950/95 border border-[#d4af37]/35 text-[#d4af37] text-[7px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
                          {dimA3Val.split('x')[1]?.trim() || '42 cm'}
                        </span>
                      </div>
                      {/* Width Guide Line (x cm) directly below the bottom of A3 */}
                      <div 
                        className="absolute transition-all duration-300 pointer-events-none flex justify-center"
                        style={{
                          left: '42%',
                          top: '40.5%',
                          width: '16.5%',
                          borderBottom: '1px dashed rgba(212,175,55,0.7)',
                        }}
                      >
                        <span className="absolute top-1.5 bg-zinc-950/95 border border-[#d4af37]/35 text-[#d4af37] text-[7px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
                          {dimA3Val.split('x')[0]?.trim() || '30 cm'}
                        </span>
                      </div>
                      {/* Poster Element (A3) */}
                      <div 
                        onClick={() => setSelectedSize('A3')}
                        className={`absolute cursor-pointer select-none transition-all duration-500 rounded-sm overflow-hidden opacity-100 ${
                          selectedSize === 'A3' 
                            ? 'ring-2 ring-[#d4af37] scale-[1.04] z-25 shadow-[0_25px_50px_rgba(212,175,55,0.25)]' 
                            : 'scale-[0.98] z-10 hover:scale-100'
                        }`}
                        style={{
                          top: '17%',
                          left: '42%',
                          width: '16.5%',
                          aspectRatio: '3/4',
                          boxShadow: selectedSize === 'A3' ? '0 25px 50px rgba(0,0,0,0.8)' : '0 12px 24px rgba(0,0,0,0.4)'
                        }}
                      >
                        {selectedSize === 'A3' ? (
                          <>
                            <img src={product.image_url} className="w-full h-full object-cover" alt="Poster Medium" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent py-1 text-center">
                              <span className="text-[7px] text-[#d4af37] font-black tracking-widest uppercase">AKTIF (A3)</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-b from-[#f7f6f2] to-[#e6e4de] flex items-center justify-center">
                            <span className="text-zinc-400 font-serif font-black text-xs md:text-sm tracking-widest uppercase select-none opacity-40">A3</span>
                          </div>
                        )}
                      </div>

                      {/* ================== POSTER 3: F4 (Small) ================== */}
                      {/* Height Guide Line (y cm) on the RIGHT side of F4 */}
                      <div 
                        className="absolute transition-all duration-300 pointer-events-none flex items-center"
                        style={{
                          left: '83%',
                          top: '22.5%',
                          height: '18%',
                          borderLeft: '1px dashed rgba(212,175,55,0.7)',
                        }}
                      >
                        <span className="absolute left-2 bg-zinc-950/95 border border-[#d4af37]/35 text-[#d4af37] text-[7px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
                          {dimF4Val.split('x')[1]?.trim() || '33 cm'}
                        </span>
                      </div>
                      {/* Width Guide Line (x cm) directly below the bottom of F4 */}
                      <div 
                        className="absolute transition-all duration-300 pointer-events-none flex justify-center"
                        style={{
                          left: '68%',
                          top: '42%',
                          width: '13.5%',
                          borderBottom: '1px dashed rgba(212,175,55,0.7)',
                        }}
                      >
                        <span className="absolute top-1.5 bg-zinc-950/95 border border-[#d4af37]/35 text-[#d4af37] text-[7px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
                          {dimF4Val.split('x')[0]?.trim() || '21 cm'}
                        </span>
                      </div>
                      {/* Poster Element (F4) */}
                      <div 
                        onClick={() => setSelectedSize('F4')}
                        className={`absolute cursor-pointer select-none transition-all duration-500 rounded-sm overflow-hidden opacity-100 ${
                          selectedSize === 'F4' 
                            ? 'ring-2 ring-[#d4af37] scale-[1.04] z-25 shadow-[0_25px_50px_rgba(212,175,55,0.25)]' 
                            : 'scale-[0.98] z-10 hover:scale-100'
                        }`}
                        style={{
                          top: '22.5%',
                          left: '68%',
                          width: '13.5%',
                          aspectRatio: '3/4',
                          boxShadow: selectedSize === 'F4' ? '0 25px 50px rgba(0,0,0,0.8)' : '0 12px 24px rgba(0,0,0,0.4)'
                        }}
                      >
                        {selectedSize === 'F4' ? (
                          <>
                            <img src={product.image_url} className="w-full h-full object-cover" alt="Poster Small" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent py-1 text-center">
                              <span className="text-[7px] text-[#d4af37] font-black tracking-widest uppercase">AKTIF (F4)</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-b from-[#f7f6f2] to-[#e6e4de] flex items-center justify-center">
                            <span className="text-zinc-400 font-serif font-black text-xs md:text-sm tracking-widest uppercase select-none opacity-40">F4</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Dynamic mathematically correct architectural human scale comparison wall */
                    <div className="relative w-full aspect-[4/3] bg-zinc-950 overflow-hidden flex items-end">
                      {/* Premium textured dark gallery wall background with light focus effect */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,_#1f1f23_0%,_#09090b_100%)] opacity-95" />
                      
                      {/* Blueprint architectural grid pattern */}
                      <div className="absolute inset-0 opacity-[0.025] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:20px_20px]" />
                      
                      {/* Standing Human Silhouette */}
                      <div className="absolute bottom-0 left-[15%] h-[78%] aspect-[1/3.5] flex flex-col items-center select-none pointer-events-none z-10">
                        {/* High-quality SVG of a standing stylish model silhouette */}
                        <svg viewBox="0 0 120 400" className="h-full w-full text-zinc-700 dark:text-zinc-600 fill-current drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)] opacity-90 transition-all" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="60" cy="40" r="22" />
                          <path d="M54,62 L66,62 L64,75 L56,75 Z" />
                          <path d="M30,85 C40,80 80,80 90,85 C98,92 95,180 92,210 C88,230 82,240 78,260 L78,390 L42,390 L42,260 C38,240 32,230 28,210 C25,180 22,92 30,85 Z" />
                        </svg>
                        {/* Elegant Label */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/85 backdrop-blur-md px-3 py-1 rounded-md text-[8px] text-[#d4af37] font-black uppercase tracking-widest whitespace-nowrap border border-[#d4af37]/20 shadow-xl">
                          🚶 Tinggi Manusia (±170 cm)
                        </div>
                      </div>

                      {/* Dynamic mathematically correct scaled poster placement next to human */}
                      <div 
                        onClick={() => setIsPreviewOpen(true)}
                        className="absolute cursor-pointer group/poster select-none transition-all duration-500 hover:scale-[1.03]"
                        style={{
                          height: `${currentScaleHeight}%`,
                          aspectRatio: '3/4',
                          bottom: `${64 - (currentScaleHeight / 2)}%`,
                          left: '52%',
                          boxShadow: '0 30px 60px rgba(0,0,0,0.85), 0 10px 25px rgba(0,0,0,0.4)',
                          border: '5px solid #141414'
                        }}
                      >
                        <img src={product.image_url} className="w-full h-full object-cover" alt="Poster Scaled" />
                        {/* High-end glossy glass reflection effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
                        
                        {/* Dynamic absolute label on the poster itself */}
                        <div className="absolute inset-x-0 bottom-0 bg-black/85 backdrop-blur-sm py-1 text-center border-t border-white/5 opacity-0 group-hover/poster:opacity-100 transition-opacity">
                          <span className="text-[7px] text-[#d4af37] font-black tracking-widest uppercase">🔍 PERBESAR</span>
                        </div>
                      </div>

                      {/* Technical Blueprint Helper Lines */}
                      {/* Height Guide Line */}
                      <div 
                        className="absolute flex items-center gap-1.5 transition-all duration-500"
                        style={{
                          height: `${currentScaleHeight}%`,
                          bottom: `${64 - (currentScaleHeight / 2)}%`,
                          left: '73%',
                          borderLeft: '1px dashed rgba(212,175,55,0.45)'
                        }}
                      >
                        <span className="absolute left-3 bg-zinc-950/95 border border-[#d4af37]/35 text-[#d4af37] text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                          ↕️ {getDimensionInfo(getText, selectedSize).split('x')[1]?.trim() || '33 cm'}
                        </span>
                      </div>

                      {/* Width Guide Line */}
                      <div 
                        className="absolute flex justify-center transition-all duration-500"
                        style={{
                          left: '52%',
                          width: `${currentScaleHeight * 0.5625}%`,
                          bottom: `${64 - (currentScaleHeight / 2) - 8}%`,
                          borderBottom: '1px dashed rgba(212,175,55,0.45)',
                          display: 'flex',
                          justifyContent: 'center'
                        }}
                      >
                        <span className="absolute top-2 bg-zinc-950/95 border border-[#d4af37]/35 text-[#d4af37] text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                          ↔️ {getDimensionInfo(getText, selectedSize).split('x')[0]?.trim() || '21 cm'}
                        </span>
                      </div>

                      {/* Architectural Header Title Banner */}
                      <div className="absolute top-6 left-6 z-10">
                        <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest block mb-0.5">Skala Perbandingan Realistis</span>
                        <h4 className="text-[10px] md:text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-ping" />
                          <span>UKURAN ASLI UKURAN {selectedSize}</span>
                        </h4>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile & Tablet Interactive Tabs Selection */}
                <div className="flex gap-2 justify-center mt-4">
                  {[
                    { key: 'flat', label: '🖼️ Detail', desc: 'Detail Poster' },
                    { key: 'living', label: '🛋️ Ruang Keluarga', desc: 'Mockup Dinding' },
                    { key: 'studio', label: '🚶 Skala Manusia', desc: 'Ukuran Realistis' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveMockup(tab.key)}
                      className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        activeMockup === tab.key 
                          ? 'bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37] shadow-[0_4px_15px_rgba(212,175,55,0.15)] scale-102 font-black' 
                          : 'bg-black/20 border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
                      }`}
                    >
                      <span className="text-xs font-black uppercase tracking-wider">{tab.label}</span>
                      <span className="text-[8px] opacity-60 tracking-normal mt-0.5">{tab.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Deskripsi Produk di bawah Foto */}
            <div className="glass p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-850/40 shadow-xl">
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
