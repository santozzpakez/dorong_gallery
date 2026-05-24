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
      // ── 1. Baca definisi karakter dari Supabase (BUKAN localStorage) ──
      let adminChars = {}
      let adminSeries = []
      
      try {
        if (hasSupabaseConfig && supabase) {
          const { data: cacheData } = await supabase
            .from('site_assets')
            .select('key, text_value')
            .in('key', ['global-category-options', 'global-character-options'])

          if (cacheData) {
            cacheData.forEach(row => {
              if (row.key === 'global-category-options' && row.text_value) {
                try { adminSeries = JSON.parse(row.text_value)?.anime || [] } catch {}
              }
              if (row.key === 'global-character-options' && row.text_value) {
                try { adminChars = JSON.parse(row.text_value)?.anime || {} } catch {}
              }
            })
          }
        }
      } catch { /* abaikan */ }

      // Fallback ke localStorage jika Supabase gagal
      if (adminSeries.length === 0) {
        try {
          const rawTypes = typeof window !== 'undefined' ? window.localStorage.getItem('dorong_admin_type_options') : null
          if (rawTypes) adminSeries = JSON.parse(rawTypes)?.anime || []
        } catch {}
      }
      if (Object.keys(adminChars).length === 0) {
        try {
          const rawChars = typeof window !== 'undefined' ? window.localStorage.getItem('dorong_admin_characters_by_type') : null
          if (rawChars) adminChars = JSON.parse(rawChars)?.anime || {}
        } catch {}
      }

      // Cari nama asli series dari slug dengan pencocokan cerdas (mendukung singular/plural)
      const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      const cleanSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/s$/, '')
      const matchSlug = (a, b) => cleanSlug(a) === cleanSlug(b)

      const actualSeriesName = adminSeries.find(s => matchSlug(toSlug(s), seriesSlug)) || seriesSlug.replace(/-/g, ' ').toUpperCase()
      setSeriesName(actualSeriesName)

      const charMap = new Map()
      
      // Masukkan karakter dari Admin Panel dulu
      const definedChars = adminChars[actualSeriesName] || []
      definedChars.forEach(cName => {
        if (cName && cName !== '-') {
          charMap.set(cName, { count: 0, image: '' })
        }
      })

      // ── 2. Ambil dari Database ──
      if (hasSupabaseConfig && supabase) {
        let { data, error } = await supabase
          .from('products')
          .select('subcategory, image_url')
          .eq('category', 'anime')
          .ilike('subcategory', `${actualSeriesName} - %`)

        if ((!data || data.length === 0) && !error) {
          const fallbackRes = await supabase
            .from('products')
            .select('subcategory, image_url')
            .eq('category', 'anime')
          data = fallbackRes.data
        }

        if (!error && data) {
          data.forEach(item => {
            if (item.subcategory && item.subcategory.includes(' - ')) {
              const parts = item.subcategory.split(' - ')
              const sName = parts[0].trim()
              const cName = parts[1].trim()
              
              if (matchSlug(toSlug(sName), seriesSlug)) {
                if (!charMap.has(cName)) {
                  charMap.set(cName, { count: 1, image: item.image_url })
                } else {
                  const current = charMap.get(cName)
                  charMap.set(cName, { 
                    count: current.count + 1, 
                    image: current.image || item.image_url 
                  })
                }
              }
            }
          })
        }
      }

      const formatted = Array.from(charMap.keys()).map(char => {
        const cSlug = toSlug(char)
        return {
          name: char,
          slug: cSlug,
          count: charMap.get(char).count,
          image: charMap.get(char).image
        }
      })

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
        <Link href="/anime" className="text-xs text-accent/80 hover:text-accent transition-colors flex items-center gap-2 font-sans font-black uppercase tracking-widest">
          &larr; {t.back}
        </Link>
        <h1 className="text-4xl md:text-5xl font-black mt-6 uppercase tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark font-serif">{seriesName || 'Loading...'}</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 mb-10 text-xs md:text-sm font-sans tracking-widest uppercase font-bold">{t.selectChar}</p>

        {loading ? (
          <div className="text-center py-20 text-zinc-500 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4"></div>
            {t.loading}
          </div>
        ) : characterList.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-100 dark:bg-zinc-950/20">
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
                className="group rounded-[24px] overflow-hidden border border-zinc-200/60 dark:border-zinc-800/30 bg-gradient-to-b from-zinc-900 to-black hover:shadow-[0_20px_45px_rgb(var(--accent-main)/0.15)] hover:border-accent/50 transition-all duration-500 relative block h-80 flex flex-col justify-end p-6"
              >
                {/* Image Background */}
                {displayImage ? (
                  <div className="absolute inset-0 z-0">
                    <img
                      src={displayImage}
                      alt={character.name}
                      className="w-full h-full object-cover opacity-75 group-hover:opacity-85 group-hover:scale-[1.05] transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-zinc-950 z-0"></div>
                )}
                
                <div className="relative z-10 transform group-hover:-translate-y-2 transition-transform duration-300">
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider group-hover:text-accent transition-colors font-serif">{character.name}</h2>
                  <p className="text-[10px] text-accent font-black uppercase tracking-widest mt-3 inline-block bg-black/70 px-3 py-1.5 rounded-full border border-accent/35 font-sans">
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
