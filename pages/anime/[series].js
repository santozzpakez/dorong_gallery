import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useLanguage } from '../../context/LanguageContext'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { hasSupabaseConfig, supabase } from '../../lib/supabaseClient'
import { useSiteAssets } from '../../lib/siteAssets'

export default function AnimeSeriesPage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const { series: seriesSlug } = router.query
  const { assets, getUrl } = useSiteAssets()

  const [characterList, setCharacterList] = useState([])
  const [seriesName, setSeriesName] = useState('')
  const [loading, setLoading] = useState(true)

  const translations = {
    id: {
      back: 'Kembali ke Anime',
      selectChar: 'Pilih character untuk lihat semua koleksinya.',
      available: 'Produk Tersedia',
      notAvailable: 'Karakter belum tersedia untuk series ini.',
      loading: 'Memuat karakter...'
    },
    en: {
      back: 'Back to Anime',
      selectChar: 'Select character to view all collections.',
      available: 'Products Available',
      notAvailable: 'Characters not available for this series.',
      loading: 'Loading characters...'
    },
    jp: {
      back: 'アニメに戻る',
      selectChar: 'キャラクターを選択して全コレクションを表示します。',
      available: '点の商品',
      notAvailable: 'このシリーズのキャラクターはまだ利用できません。',
      loading: 'キャラクターを読み込み中...'
    },
    kr: {
      back: '애니메이션으로 돌아가기',
      selectChar: '캐릭터를 선택하여 모든 컬렉션을 확인하세요.',
      available: '개의 상품',
      notAvailable: '이 시리즈의 캐릭터를 찾을 수 없습니다.',
      loading: '캐릭터를 불러오는 중...'
    },
    cn: {
      back: '返回动漫',
      selectChar: '选择角色查看所有收藏。',
      available: '件商品',
      notAvailable: '该系列暂无角色。',
      loading: '正在加载角色...'
    }
  }

  const t = translations[lang] || translations.id

  useEffect(() => {
    if (!seriesSlug || !hasSupabaseConfig || !supabase) {
      if (!seriesSlug) return // wait for router
      setLoading(false)
      return
    }

    async function loadCharacters() {
      // Fetch semua produk anime untuk mengekstrak nama karakter di series ini
      const { data, error } = await supabase
        .from('products')
        .select('subcategory, image_url')
        .eq('category', 'anime')

      if (error || !data) {
        setLoading(false)
        return
      }

      const charMap = new Map() // Untuk menyimpan karakter unik dan data tambahannya
      let actualSeriesName = ''

      data.forEach(item => {
        if (item.subcategory && item.subcategory.includes(' - ')) {
          const parts = item.subcategory.split(' - ')
          const sName = parts[0].trim()
          const cName = parts[1].trim()
          
          // Re-create slug untuk membandingkan dengan URL
          const sSlug = sName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
          
          if (sSlug === seriesSlug) {
            actualSeriesName = sName
            if (!charMap.has(cName)) {
              charMap.set(cName, { count: 1, image: item.image_url })
            } else {
              const current = charMap.get(cName)
              // Kalau sebelumnya blm punya image, pakai image ini
              charMap.set(cName, { count: current.count + 1, image: current.image || item.image_url })
            }
          }
        }
      })

      if (actualSeriesName) {
        setSeriesName(actualSeriesName)
      } else {
        // Fallback jika anehnya kosong
        setSeriesName(seriesSlug.replace(/-/g, ' ').toUpperCase())
      }

      const formatted = Array.from(charMap.keys()).map(char => {
        const cSlug = char.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        return {
          name: char,
          slug: cSlug,
          count: charMap.get(char).count,
          image: charMap.get(char).image
        }
      })

      // Urutkan alfabet
      formatted.sort((a, b) => a.name.localeCompare(b.name))

      setCharacterList(formatted)
      setLoading(false)
    }

    loadCharacters()
  }, [seriesSlug])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      <Header />
      <main className="flex-grow pt-28 max-w-6xl mx-auto px-4 w-full pb-16">
        <Link href="/anime" className="text-sm text-[#00b4d8] dark:text-neon-cyan hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 font-mono">
          ← {t.back}
        </Link>
        <h1 className="text-5xl font-black mt-6 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00b4d8] to-[#9d4edd] dark:from-neon-cyan dark:to-neon-purple dark:neon-text-cyan">{seriesName || 'Loading...'}</h1>
        <p className="text-[#9d4edd] dark:text-neon-purple mt-3 mb-10 text-lg font-mono tracking-wide">{t.selectChar}</p>

        {loading ? (
          <div className="text-center py-20 text-gray-500 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            {t.loading}
          </div>
        ) : characterList.length === 0 ? (
          <div className="text-center py-20 text-gray-500 border border-dashed border-gray-700 rounded-xl bg-white/5">
            {t.notAvailable}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characterList.map((character) => {
              const coverKey = `anime-${character.slug}-1`
              const displayImage = assets[coverKey] || character.image || getUrl(coverKey) || ''
              
              return (
              <Link
                key={character.slug}
                href={`/anime/${seriesSlug}/${character.slug}`}
                className="group rounded-2xl overflow-hidden glass-purple border border-[#00b4d8]/30 dark:border-neon-cyan/30 cinematic-glow-cyan relative block h-80 flex flex-col justify-end p-6 bg-black"
              >
                {/* Image Background */}
                {displayImage ? (
                  <div className="absolute inset-0 z-0">
                    <img
                      src={displayImage}
                      alt={character.name}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.05] transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-white/5 z-0"></div>
                )}
                
                <div className="relative z-10 transform group-hover:-translate-y-2 transition-transform duration-300">
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider group-hover:text-[#00b4d8] dark:group-hover:text-neon-cyan dark:group-hover:neon-text-cyan transition-colors">{character.name}</h2>
                  <p className="text-sm text-[#00b4d8] dark:text-neon-cyan mt-3 inline-block bg-black/50 px-3 py-1.5 rounded-full border border-[#00b4d8]/50 dark:border-neon-cyan/50 font-mono">
                    {lang === 'jp' || lang === 'kr' || lang === 'cn' ? `${character.count}${t.available}` : `${character.count} ${t.available}`}
                  </p>
                </div>
              </Link>
            )})}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
