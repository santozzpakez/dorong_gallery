import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { hasSupabaseConfig, supabase } from '../../../lib/supabaseClient'
import ImageModal from '../../../components/ImageModal'
import { useLanguage } from '../../../context/LanguageContext'
import Image from 'next/image'
import { useSiteAssets } from '../../../lib/siteAssets'
import { getPriceInfo } from '../../../lib/priceHelper'

export default function MemberCollectionPage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const { getText } = useSiteAssets()
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
      // 1. Dapatkan nama asli grup dan member dari Supabase (BUKAN localStorage)
      let adminMembers = {}
      let adminGroups = []
      
      try {
        if (hasSupabaseConfig && supabase) {
          const { data: cacheData } = await supabase
            .from('site_assets')
            .select('key, text_value')
            .in('key', ['global-category-options', 'global-character-options'])

          if (cacheData) {
            cacheData.forEach(row => {
              if (row.key === 'global-category-options' && row.text_value) {
                try { adminGroups = JSON.parse(row.text_value)?.kpop || [] } catch {}
              }
              if (row.key === 'global-character-options' && row.text_value) {
                try { adminMembers = JSON.parse(row.text_value)?.kpop || {} } catch {}
              }
            })
          }
        }
      } catch { /* abaikan */ }

      // Fallback ke localStorage jika Supabase gagal
      if (adminGroups.length === 0) {
        try {
          const rawTypes = typeof window !== 'undefined' ? window.localStorage.getItem('dorong_admin_type_options') : null
          if (rawTypes) adminGroups = JSON.parse(rawTypes)?.kpop || []
        } catch {}
      }
      if (Object.keys(adminMembers).length === 0) {
        try {
          const rawMembers = typeof window !== 'undefined' ? window.localStorage.getItem('dorong_admin_characters_by_type') : null
          if (rawMembers) adminMembers = JSON.parse(rawMembers)?.kpop || {}
        } catch {}
      }

      const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      const cleanSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/s$/, '')
      const matchSlug = (a, b) => cleanSlug(a) === cleanSlug(b)

      const actualGroupName = adminGroups.find(g => matchSlug(toSlug(g), groupSlug)) || groupSlug.replace(/-/g, ' ').toUpperCase()
      
      const definedMembers = adminMembers[actualGroupName] || []
      const actualMemberName = definedMembers.find(m => toSlug(m) === memberSlug) || memberSlug.replace(/-/g, ' ').toUpperCase()

      const subcategoryQuery = `${actualGroupName} - ${actualMemberName}`

      // 2. Ambil dari database dengan filter subcategory spesifik (10x lebih cepat!)
      let { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'kpop')
        .eq('subcategory', subcategoryQuery)
        .order('created_at', { ascending: false })

      // Fallback: jika kosong karena perbedaan spasi/case, coba ilike
      if ((!data || data.length === 0) && !error) {
        const fallbackRes = await supabase
          .from('products')
          .select('*')
          .eq('category', 'kpop')
          .ilike('subcategory', `%${actualMemberName}%`)
          .order('created_at', { ascending: false })
        if (fallbackRes.data && fallbackRes.data.length > 0) {
          data = fallbackRes.data
        }
      }

      if (error || !data) {
        setLoading(false)
        return
      }

      const filteredProducts = []
      let finalGroupName = actualGroupName
      let finalMemberName = actualMemberName

      data.forEach(p => {
        if (p.subcategory && p.subcategory.includes(' - ')) {
          const parts = p.subcategory.split(' - ')
          const gName = parts[0].trim()
          const mName = parts[1].trim()
          
          const gSlug = gName.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
          const mSlug = mName.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
          
          if (matchSlug(gSlug, groupSlug) && mSlug === memberSlug) {
            finalGroupName = gName
            finalMemberName = mName
            filteredProducts.push(p)
          }
        }
      })

      const displayProducts = filteredProducts.length > 0 ? filteredProducts : data

      setMemberName(finalMemberName)
      setGroupName(finalGroupName)
      setProducts(displayProducts)
      setLoading(false)
    }

    loadData()
  }, [groupSlug, memberSlug])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      <Header />
      <main className="flex-grow pt-28 max-w-6xl mx-auto px-4 pb-16 w-full">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-sans mb-6 flex-wrap font-bold uppercase tracking-wider">
          <Link href="/kpop" className="text-accent/80 hover:text-accent transition-colors">
            &larr; K-pop
          </Link>
          <span className="text-zinc-600">/</span>
          <Link href={`/kpop/${groupSlug}`} className="text-accent/80 hover:text-accent transition-colors">
            {groupName || '...'}
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-500">{memberName || '...'}</span>
        </div>

        {/* Header */}
        <h1 className="text-3xl md:text-4xl font-black mt-2 uppercase tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark font-serif">
          {memberName || 'Loading...'}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 mb-10 text-xs md:text-sm font-sans tracking-widest uppercase font-bold">
          {t.exclusiveCollection}
        </p>

        {/* Produk */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4"></div>
            {t.searching}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl bg-zinc-100 dark:bg-zinc-950/20">
            <p className="text-zinc-400 mb-4 font-bold">{t.empty}</p>
            <Link href="/admin" className="text-accent text-xs hover:underline uppercase font-black tracking-widest">
              {t.uploadViaAdmin}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-500 mb-6 font-sans uppercase font-bold tracking-wider">
              {lang === 'jp' || lang === 'kr' || lang === 'cn' ? `${products.length}${t.productsFound}` : `${products.length} ${t.productsFound}`}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`}>
                  <article className="rounded-2xl overflow-hidden glass border border-zinc-200/80 dark:border-zinc-850/40 hover:border-accent/60 hover:shadow-[0_15px_30px_rgb(var(--accent-main)/0.15)] transition-all cursor-pointer group flex flex-col h-full shadow-lg">
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <div className="flex gap-2">
                          <span className="flex-1 bg-gradient-to-r from-accent-light via-accent to-accent-alt text-black text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full text-center shadow-[0_4px_15px_rgb(var(--accent-main)/0.2)]">
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
                      <h2 className="font-bold text-sm text-[var(--text-main)] group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                        {p.title}
                      </h2>
                      <div className="mt-auto pt-3">
                        {(() => {
                          const pInfoS = getPriceInfo(getText, 'F4')
                          return pInfoS.hasDiscount ? (
                            <p className="text-sm text-accent font-black font-sans uppercase tracking-widest flex items-center gap-1.5 flex-wrap">
                              <span className="line-through text-gray-500 text-xs normal-case">Rp {pInfoS.original.toLocaleString('id-ID')}</span>
                              <span>Rp {pInfoS.discount.toLocaleString('id-ID')}</span>
                            </p>
                          ) : (
                            <p className="text-sm text-accent font-black font-sans uppercase tracking-widest">
                              Rp {pInfoS.original.toLocaleString('id-ID')}
                            </p>
                          )
                        })()}
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
