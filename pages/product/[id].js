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

export default function ProductDetail() {
  const router = useRouter()
  const { lang } = useLanguage()
  const { id } = router.query
  
  const [product, setProduct] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()
  const { user } = useAuth()
  const [added, setAdded] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

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

    addItem(product)
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
            <div 
              className="rounded-2xl overflow-hidden glass border border-zinc-200/80 dark:border-zinc-850/40 shadow-2xl relative cursor-zoom-in group"
              onClick={() => setIsPreviewOpen(true)}
            >
              {product.image_url ? (
                <>
                  <img src={product.image_url} alt={product.title} className="w-full h-auto object-cover max-h-[85vh] group-hover:scale-[1.02] transition-transform duration-700" />
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
              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#f3e5ab] via-[#d4af37] to-[#aa7c11] mb-8 font-serif">
                Rp {Number(product.price).toLocaleString('id-ID')}
              </p>
              
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
                    <p className="text-xs text-[#d4af37] font-black mt-1">Rp {Number(rec.price).toLocaleString('id-ID')}</p>
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
