import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { hasSupabaseConfig, supabase } from '../../lib/supabaseClient'
import { useSiteAssets } from '../../lib/siteAssets'
import ImageModal from '../../components/ImageModal'
import { useLanguage } from '../../context/LanguageContext'
import Image from 'next/image'

const CATS = [
  { name: 'Japanese Street', key: 'decor-japanese-street' },
  { name: 'Café Aesthetic', key: 'decor-cafe-aesthetic' },
  { name: 'Gaming Room', key: 'decor-gaming-room' },
  { name: 'Minimalist', key: 'decor-minimalist' },
  { name: 'Dark Luxury', key: 'decor-dark-luxury' },
  { name: 'Nature', key: 'decor-nature' },
  { name: 'Retro Vintage', key: 'decor-retro-vintage' },
  { name: 'Lofi & Music', key: 'decor-lofi-music' }
]

export default function DecorTypePage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const { type: typeSlug } = router.query
  const { assets, getUrl, getText } = useSiteAssets()

  const [products, setProducts] = useState([])
  const [typeName, setTypeName] = useState('')
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState(null)

  const translations = {
    id: {
      back: 'Kembali ke Decor',
      noCover: 'No Cover',
      description: 'Transformasikan ruangan Anda dengan koleksi {name} kami yang telah dikurasi secara khusus. Dapatkan produk-produk estetis berkualitas premium untuk meningkatkan kenyamanan dan gaya visual area favorit Anda.',
      products: 'Produk',
      productsHeading: 'Produk',
      empty: 'Belum ada produk untuk kategori ini.'
    },
    en: {
      back: 'Back to Decor',
      noCover: 'No Cover',
      description: 'Transform your space with our specially curated {name} collection. Get premium quality aesthetic products to enhance the comfort and visual style of your favorite areas.',
      products: 'Products',
      productsHeading: 'Products',
      empty: 'No products for this category yet.'
    },
    jp: {
      back: 'デコに戻る',
      noCover: 'カバーなし',
      description: '特別に厳選された {name} コレクションで、あなたの空間を変えましょう。お気に入りのエリアの快適さと視覚的なスタイルを高める、高品質の美的製品を手に入れましょう。',
      products: '商品',
      productsHeading: '商品',
      empty: 'このカテゴリーの商品はまだありません。'
    },
    kr: {
      back: '데코로 돌아가기',
      noCover: '커버 없음',
      description: '특별히 엄선된 {name} 컬렉션으로 공간을 변화시키세요. 좋아하는 영역의 편안함과 시각적 스타일을 향상시키는 프리미엄 품질의 미적 제품을 만나보세요.',
      products: '상품',
      productsHeading: '상품',
      empty: '이 카테고리에 대한 상품이 아직 없습니다.'
    },
    cn: {
      back: '返回装饰',
      noCover: '无封面',
      description: '用我们特别策划的 {name} 收藏来改变您的空间。获取优质美学产品，以提高您最喜欢区域的舒适度和视觉风格。',
      products: '产品',
      productsHeading: '产品',
      empty: '该类别暂无产品。'
    }
  }

  const t = translations[lang] || translations.id

  useEffect(() => {
    if (!typeSlug || !hasSupabaseConfig || !supabase) {
      if (!typeSlug) return 
      setLoading(false)
      return
    }

    async function loadProducts() {
      // Find the actual name from the slug
      const found = CATS.find(c => c.key.replace('decor-', '') === typeSlug)
      const actualName = found ? found.name : typeSlug.replace(/-/g, ' ').toUpperCase()
      setTypeName(actualName)

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'decor')
        .eq('subcategory', actualName)

      if (error) {
        console.error('Error fetching products:', error)
      } else {
        setProducts(data || [])
      }
      setLoading(false)
    }

    loadProducts()
  }, [typeSlug])

  const coverKey = `decor-${typeSlug}`
  const displayCover = assets[coverKey] || getUrl(coverKey)

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      <Header />
      <main className="flex-grow pt-28 max-w-6xl mx-auto px-4 w-full pb-16">
        <Link href="/decor" className="text-sm text-[#00b4d8] dark:text-neon-cyan hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 font-mono">
          ← {t.back}
        </Link>
        
        <div className="flex flex-col md:flex-row gap-8 mt-8 mb-12">
          {/* Cover Section */}
          <div className="w-full md:w-1/3">
            <div className="rounded-2xl overflow-hidden glass border border-[#00b4d8]/20 dark:border-neon-cyan/20 cinematic-glow-cyan h-[400px] relative">
              {displayCover ? (
                <Image src={displayCover} alt={typeName} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-white/5 flex items-center justify-center relative z-10">
                  <span className="text-gray-400">{t.noCover}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6 z-10">
                 <h1 className="text-3xl font-black text-white uppercase tracking-wider">{getText(coverKey) || typeName}</h1>
                 <p className="text-neon-cyan font-mono text-sm mt-2">Premium Decor Series</p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00b4d8] to-[#9d4edd] dark:from-neon-cyan dark:to-neon-purple mb-6">
              {typeName} Collection
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed max-w-2xl">
              {t.description.replace('{name}', typeName)}
            </p>
            <div className="flex gap-4 mt-8">
               <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center min-w-[100px]">
                  <span className="text-2xl font-black text-neon-purple">{products.length}</span>
                  <span className="text-[10px] uppercase tracking-widest text-gray-500">{t.products}</span>
               </div>
               <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center min-w-[100px]">
                  <span className="text-2xl font-black text-neon-cyan">HD</span>
                  <span className="text-[10px] uppercase tracking-widest text-gray-500">Quality</span>
               </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="border-t border-white/5 pt-12">
          <h3 className="text-xl font-bold mb-8 uppercase tracking-[0.3em] flex items-center gap-4">
             <span className="w-8 h-[1px] bg-neon-cyan"></span>
             {t.productsHeading} {typeName}
          </h3>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white/5 border border-dashed border-gray-700 rounded-2xl text-gray-500">
              {t.empty}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {products.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`} className="group block">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden glass border border-white/10 relative mb-3">
                    <Image src={p.image_url} alt={p.title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                    
                    {/* Quick Preview Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setPreviewImage({ url: p.image_url, title: p.title })
                      }}
                      className="absolute bottom-3 right-3 w-8 h-8 bg-black/60 hover:bg-neon-cyan backdrop-blur-md rounded-lg flex items-center justify-center text-white dark:text-neon-cyan dark:hover:text-black border border-white/10 hover:border-neon-cyan transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                      title="Quick Preview"
                    >
                      🔍
                    </button>

                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-neon-cyan border border-neon-cyan/30">
                       PRO
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-neon-cyan transition-colors">{p.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">Rp {p.price?.toLocaleString() || '0'}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <ImageModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url}
        title={previewImage?.title}
      />
    </div>
  )
}
