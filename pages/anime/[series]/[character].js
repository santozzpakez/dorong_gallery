import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { hasSupabaseConfig, supabase } from '../../../lib/supabaseClient'
import ImageModal from '../../../components/ImageModal'
import { useLanguage } from '../../../context/LanguageContext'
import Image from 'next/image'

export default function CharacterCollectionPage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const { series: seriesSlug, character: characterSlug } = router.query

  const [products, setProducts] = useState([])
  const [characterName, setCharacterName] = useState('')
  const [seriesName, setSeriesName] = useState('')
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState(null)

  const translations = {
    id: {
      backTo: 'Kembali ke',
      exclusiveCollection: 'Koleksi poster eksklusif untuk karakter ini.',
      searching: 'Mencari produk...',
      empty: 'Belum ada produk yang tersedia untuk karakter ini.',
      uploadViaAdmin: 'Upload via Admin Dashboard',
      viewDetail: 'Lihat Detail',
      noImage: 'No Image'
    },
    en: {
      backTo: 'Back to',
      exclusiveCollection: 'Exclusive poster collection for this character.',
      searching: 'Searching for products...',
      empty: 'No products available for this character yet.',
      uploadViaAdmin: 'Upload via Admin Dashboard',
      viewDetail: 'View Detail',
      noImage: 'No Image'
    },
    jp: {
      backTo: '戻る: ',
      exclusiveCollection: 'このキャラクターの限定ポスターコレクション。',
      searching: '商品を検索中...',
      empty: 'このキャラクターの商品はまだありません。',
      uploadViaAdmin: '管理ダッシュボードからアップロード',
      viewDetail: '詳細を見る',
      noImage: '画像なし'
    },
    kr: {
      backTo: '돌아가기: ',
      exclusiveCollection: '이 캐릭터를 위한 독점 포스터 컬렉션.',
      searching: '상품 검색 중...',
      empty: '이 캐릭터에 대한 상품이 아직 없습니다.',
      uploadViaAdmin: '관리 대시보드를 통해 업로드',
      viewDetail: '상세 보기',
      noImage: '이미지 없음'
    },
    cn: {
      backTo: '返回 ',
      exclusiveCollection: '该角色的独家海报收藏。',
      searching: '正在搜索产品...',
      empty: '该角色暂无产品。',
      uploadViaAdmin: '通过管理仪表板上传',
      viewDetail: '查看详情',
      noImage: '无图片'
    }
  }

  const t = translations[lang] || translations.id

  useEffect(() => {
    if (!seriesSlug || !characterSlug || !hasSupabaseConfig || !supabase) {
      if (!seriesSlug || !characterSlug) return // wait for router
      setLoading(false)
      return
    }

    async function loadData() {
      // Ambil semua anime, lalu filter berdasarkan subcategory secara manual di client
      // untuk mencocokkan slug dengan aman.
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'anime')
        .order('created_at', { ascending: false })

      if (error || !data) {
        setLoading(false)
        return
      }

      let actualCharName = ''
      let actualSeriesName = ''
      const filteredProducts = []

      data.forEach(p => {
        if (p.subcategory && p.subcategory.includes(' - ')) {
          const parts = p.subcategory.split(' - ')
          const sName = parts[0].trim()
          const cName = parts[1].trim()
          
          const sSlug = sName.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
          const cSlug = cName.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
          
          if (sSlug === seriesSlug && cSlug === characterSlug) {
            actualSeriesName = sName
            actualCharName = cName
            filteredProducts.push(p)
          }
        }
      })

      if (actualCharName) setCharacterName(actualCharName)
      else setCharacterName(characterSlug.replace(/-/g, ' ').toUpperCase())

      if (actualSeriesName) setSeriesName(actualSeriesName)
      else setSeriesName(seriesSlug.replace(/-/g, ' ').toUpperCase())

      setProducts(filteredProducts)
      setLoading(false)
    }

    loadData()
  }, [seriesSlug, characterSlug])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      <Header />
      <main className="flex-grow pt-28 max-w-6xl mx-auto px-4 pb-16 w-full">
        <Link href={`/anime/${seriesSlug}`} className="text-xs text-[#d4af37]/80 hover:text-[#d4af37] transition-colors flex items-center gap-2 font-sans font-black uppercase tracking-widest">
          &larr; {t.backTo} {seriesName || 'Series'}
        </Link>
        <h1 className="text-3xl md:text-4xl font-black mt-6 uppercase tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-[#f3e5ab] via-[#d4af37] to-[#aa7c11] font-serif">{characterName || 'Loading...'}</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 mb-10 text-xs md:text-sm font-sans tracking-widest uppercase font-bold">{t.exclusiveCollection}</p>

        {loading ? (
          <div className="text-center py-20 text-zinc-500 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin mb-4"></div>
            {t.searching}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl bg-zinc-100 dark:bg-zinc-950/20">
            <p className="font-bold">{t.empty}</p>
            <Link href="/admin" className="text-[#d4af37] text-xs hover:underline mt-4 inline-block uppercase font-black tracking-widest">{t.uploadViaAdmin}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`}>
                <article className="rounded-2xl overflow-hidden glass border border-zinc-200/80 dark:border-zinc-850/40 hover:border-[#d4af37]/60 hover:shadow-[0_15px_30px_rgba(212,175,55,0.15)] transition-all cursor-pointer group flex flex-col h-full shadow-lg">
                  <div className="aspect-[3/4] bg-black/40 relative overflow-hidden">
                    {p.image_url ? (
                      <Image src={p.image_url} alt={p.title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="absolute inset-0 bg-white/5 flex items-center justify-center text-xs text-gray-500">{t.noImage}</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <div className="flex gap-2">
                        <span className="flex-1 bg-gradient-to-r from-[#f3e5ab] via-[#d4af37] to-[#b39359] text-black text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full text-center shadow-[0_4px_15px_rgba(212,175,55,0.2)]">
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
                  <div className="p-5 flex flex-col flex-grow bg-black/20">
                    <h2 className="font-bold text-sm text-[var(--text-main)] group-hover:text-[#d4af37] transition-colors line-clamp-2 leading-snug">{p.title}</h2>
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <p className="text-sm text-[#d4af37] font-black font-sans uppercase tracking-widest">Rp {Number(p.price).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
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
