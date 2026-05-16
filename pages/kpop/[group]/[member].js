import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { hasSupabaseConfig, supabase } from '../../../lib/supabaseClient'
import ImageModal from '../../../components/ImageModal'
import { useLanguage } from '../../../context/LanguageContext'
import Image from 'next/image'

export default function MemberCollectionPage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const { group: groupSlug, member: memberSlug } = router.query

  const [products, setProducts] = useState([])
  const [memberName, setMemberName] = useState('')
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState(null)

  const translations = {
    id: {
      exclusiveCollection: 'Koleksi poster eksklusif untuk member ini.',
      searching: 'Mencari produk...',
      empty: 'Belum ada produk yang tersedia untuk member ini.',
      uploadViaAdmin: 'Upload via Admin Dashboard →',
      productsFound: 'produk ditemukan',
      viewDetail: 'Lihat Detail',
      noImage: 'No Image'
    },
    en: {
      exclusiveCollection: 'Exclusive poster collection for this member.',
      searching: 'Searching for products...',
      empty: 'No products available for this member yet.',
      uploadViaAdmin: 'Upload via Admin Dashboard →',
      productsFound: 'products found',
      viewDetail: 'View Detail',
      noImage: 'No Image'
    },
    jp: {
      exclusiveCollection: 'このメンバーの限定ポスターコレクション。',
      searching: '商品を検索中...',
      empty: 'このメンバーの商品はまだありません。',
      uploadViaAdmin: '管理ダッシュボードからアップロード →',
      productsFound: '件の商品が見つかりました',
      viewDetail: '詳細を見る',
      noImage: '画像なし'
    },
    kr: {
      exclusiveCollection: '이 멤버를 위한 독점 포스터 컬렉션.',
      searching: '상품 검색 중...',
      empty: '이 멤버에 대한 상품이 아직 없습니다.',
      uploadViaAdmin: '관리 대시보드를 통해 업로드 →',
      productsFound: '개의 상품을 찾았습니다',
      viewDetail: '상세 보기',
      noImage: '이미지 없음'
    },
    cn: {
      exclusiveCollection: '该成员的独家海报收藏。',
      searching: '正在搜索产品...',
      empty: '该成员暂无产品。',
      uploadViaAdmin: '通过管理仪表板上传 →',
      productsFound: '件产品已找到',
      viewDetail: '查看详情',
      noImage: '无图片'
    }
  }

  const t = translations[lang] || translations.id

  useEffect(() => {
    if (!groupSlug || !memberSlug || !hasSupabaseConfig || !supabase) {
      if (!groupSlug || !memberSlug) return // tunggu router
      setLoading(false)
      return
    }

    async function loadData() {
      // Ambil semua produk kpop, lalu filter di client berdasarkan slug
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'kpop')
        .order('created_at', { ascending: false })

      if (error || !data) {
        setLoading(false)
        return
      }

      let actualMemberName = ''
      let actualGroupName = ''
      const filteredProducts = []

      data.forEach(p => {
        if (p.subcategory && p.subcategory.includes(' - ')) {
          const parts = p.subcategory.split(' - ')
          const gName = parts[0].trim()
          const mName = parts[1].trim()

          // Buat slug untuk dibandingkan dengan URL
          const gSlug = gName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
          const mSlug = mName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')

          if (gSlug === groupSlug && mSlug === memberSlug) {
            actualGroupName = gName
            actualMemberName = mName
            filteredProducts.push(p)
          }
        }
      })

      if (actualMemberName) setMemberName(actualMemberName)
      else setMemberName(memberSlug.replace(/-/g, ' ').toUpperCase())

      if (actualGroupName) setGroupName(actualGroupName)
      else setGroupName(groupSlug.replace(/-/g, ' ').toUpperCase())

      setProducts(filteredProducts)
      setLoading(false)
    }

    loadData()
  }, [groupSlug, memberSlug])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      <Header />
      <main className="flex-grow pt-28 max-w-6xl mx-auto px-4 pb-16 w-full">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-mono mb-6 flex-wrap">
          <Link href="/kpop" className="text-[#00b4d8] dark:text-neon-cyan hover:text-gray-900 dark:hover:text-white transition-colors">
            ← K-pop
          </Link>
          <span className="text-gray-500">/</span>
          <Link href={`/kpop/${groupSlug}`} className="text-[#00b4d8] dark:text-neon-cyan hover:text-gray-900 dark:hover:text-white transition-colors">
            {groupName || '...'}
          </Link>
          <span className="text-gray-500">/</span>
          <span className="text-gray-400">{memberName || '...'}</span>
        </div>

        {/* Header */}
        <h1 className="text-5xl font-black mt-2 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00b4d8] to-[#9d4edd] dark:from-neon-cyan dark:to-neon-purple dark:neon-text-cyan">
          {memberName || 'Loading...'}
        </h1>
        <p className="text-[#9d4edd] dark:text-neon-purple mt-3 mb-10 text-lg font-mono tracking-wide">
          {t.exclusiveCollection}
        </p>

        {/* Produk */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            {t.searching}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-xl border border-dashed border-gray-700">
            <p className="text-gray-400 mb-4">{t.empty}</p>
            <Link href="/admin" className="text-[#00b4d8] dark:text-neon-cyan text-sm hover:underline">
              {t.uploadViaAdmin}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6 font-mono">
              {lang === 'jp' || lang === 'kr' || lang === 'cn' ? `${products.length}${t.productsFound}` : `${products.length} ${t.productsFound}`}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`}>
                  <article className="rounded-2xl overflow-hidden glass border border-white/10 hover:border-[#9d4edd]/50 dark:hover:border-neon-purple/50 transition-all cursor-pointer group flex flex-col h-full shadow-lg">
                    <div className="aspect-[3/4] bg-black/40 relative overflow-hidden">
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt={p.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-white/5 flex items-center justify-center text-xs text-gray-500">
                          {t.noImage}
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <div className="flex gap-2">
                          <span className="flex-1 bg-gradient-to-r from-[#9d4edd] to-[#00b4d8] dark:from-neon-purple dark:to-neon-cyan text-white text-[10px] font-bold px-4 py-2 rounded-full text-center shadow-[0_0_15px_rgba(157,78,221,0.5)]">
                            {t.viewDetail}
                          </span>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setPreviewImage({ url: p.image_url, title: p.title })
                            }}
                            className="w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 transition-all hover:scale-110"
                            title="Preview Gambar"
                          >
                            🔍
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-grow bg-black/20">
                      <h2 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug">
                        {p.title}
                      </h2>
                      <div className="mt-auto pt-3">
                        <p className="text-sm text-[#9d4edd] dark:text-neon-purple font-bold">
                          Rp {Number(p.price).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </>
        )}
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
