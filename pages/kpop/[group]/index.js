import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { hasSupabaseConfig, supabase } from '../../../lib/supabaseClient'
import { useSiteAssets } from '../../../lib/siteAssets'

import { useLanguage } from '../../../context/LanguageContext'

export default function KpopGroupPage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const { group: groupSlug } = router.query
  const { assets, getUrl } = useSiteAssets()

  const [memberList, setMemberList] = useState([])
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(true)

  const translations = {
    id: {
      back: 'Kembali ke K-pop',
      selectMember: 'Pilih member untuk lihat semua koleksinya.',
      available: 'Produk Tersedia',
      comingSoon: 'Segera Hadir',
      loading: 'Memuat member...',
      empty: 'Belum ada member yang terdefinisi untuk grup ini.'
    },
    en: {
      back: 'Back to K-pop',
      selectMember: 'Select member to view all collections.',
      available: 'Products Available',
      comingSoon: 'Coming Soon',
      loading: 'Loading members...',
      empty: 'No members defined for this group.'
    },
    jp: {
      back: 'K-POPに戻る',
      selectMember: 'メンバーを選択して全コレクションを表示します。',
      available: '点の商品',
      comingSoon: 'まもなく登場',
      loading: 'メンバーを読み込み中...',
      empty: 'このグループに定義されているメンバーはいません。'
    },
    kr: {
      back: 'K-팝으로 돌아가기',
      selectMember: '멤버를 선택하여 모든 컬렉션을 확인하세요.',
      available: '개의 상품',
      comingSoon: '곧 출시됨',
      loading: '멤버를 불러오는 중...',
      empty: '이 그룹에 정의된 멤버가 없습니다.'
    },
    cn: {
      back: '返回韩流',
      selectMember: '选择成员查看所有收藏。',
      available: '件商品',
      comingSoon: '即将推出',
      loading: '正在加载成员...',
      empty: '该组合暂无成员。'
    }
  }

  const t = translations[lang] || translations.id

  useEffect(() => {
    if (!groupSlug) return

    async function loadMembers() {
      // ── 1. Baca daftar member dari localStorage (definisi admin) ──
      const STORAGE_TYPES = 'dorong_admin_type_options'
      const STORAGE_CHARS = 'dorong_admin_characters_by_type'
      let resolvedGroupName = groupSlug.replace(/-/g, ' ')

      // Cari nama grup yang sebenarnya dari daftar admin
      let adminMembers = []
      try {
        const rawTypes = window.localStorage.getItem(STORAGE_TYPES)
        const rawChars = window.localStorage.getItem(STORAGE_CHARS)
        if (rawTypes) {
          const types = JSON.parse(rawTypes)
          const kpopGroups = types?.kpop || []
          // Cocokkan slug untuk menemukan nama asli grup
          const matched = kpopGroups.find(name =>
            name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') === groupSlug
          )
          if (matched) resolvedGroupName = matched
        }
        if (rawChars) {
          const chars = JSON.parse(rawChars)
          const kpopChars = chars?.kpop || {}
          // Cari member berdasarkan nama grup yang cocok
          const groupEntry = Object.entries(kpopChars).find(([gName]) =>
            gName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') === groupSlug
          )
          if (groupEntry) adminMembers = groupEntry[1] || []
        }
      } catch { /* abaikan error localStorage */ }

      setGroupName(resolvedGroupName)

      // ── 2. Buat map member dari definisi admin (tampil walaupun belum ada produk) ──
      const memberMap = new Map()
      adminMembers.forEach(name => {
        if (name && !memberMap.has(name)) {
          memberMap.set(name, { count: 0, image: null })
        }
      })

      // ── 3. Merge dengan data dari database ──
      if (hasSupabaseConfig && supabase) {
        const { data } = await supabase
          .from('products')
          .select('subcategory, image_url')
          .eq('category', 'kpop')

        if (data) {
          let actualGroupName = ''
          data.forEach(item => {
            if (item.subcategory && item.subcategory.includes(' - ')) {
              const parts = item.subcategory.split(' - ')
              const gName = parts[0].trim()
              const mName = parts[1].trim()
              const gSlug = gName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')

              if (gSlug === groupSlug) {
                actualGroupName = gName
                if (!memberMap.has(mName)) {
                  memberMap.set(mName, { count: 1, image: item.image_url })
                } else {
                  const cur = memberMap.get(mName)
                  memberMap.set(mName, { count: cur.count + 1, image: cur.image || item.image_url })
                }
              }
            }
          })
          if (actualGroupName) setGroupName(actualGroupName)
        }
      }

      // ── 4. Format & sort A–Z ──
      const formatted = Array.from(memberMap.keys()).map(member => {
        const mSlug = member.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
        return {
          name: member,
          slug: mSlug,
          count: memberMap.get(member).count,
          image: memberMap.get(member).image
        }
      })

      formatted.sort((a, b) => a.name.localeCompare(b.name))
      setMemberList(formatted)
      setLoading(false)
    }

    loadMembers()
  }, [groupSlug])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      <Header />
      <main className="flex-grow pt-28 max-w-6xl mx-auto px-4 w-full pb-16">
        <Link href="/kpop" className="text-sm text-[#00b4d8] dark:text-neon-cyan hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 font-mono">
          &larr; {t.back}
        </Link>
        <h1 className="text-5xl font-black mt-6 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00b4d8] to-[#9d4edd] dark:from-neon-cyan dark:to-neon-purple dark:neon-text-cyan">
          {groupName || 'Loading...'}
        </h1>
        <p className="text-[#9d4edd] dark:text-neon-purple mt-3 mb-10 text-lg font-mono tracking-wide">
          {t.selectMember}
        </p>

        {loading ? (
          <div className="text-center py-20 text-gray-500 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            {t.loading}
          </div>
        ) : memberList.length === 0 ? (
          <div className="text-center py-20 text-gray-500 border border-dashed border-gray-700 rounded-xl bg-white/5">
            {t.empty}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberList.map((member) => {
              const coverKey = `kpop-${groupSlug}-${member.slug}`
              const displayImage = assets[coverKey] || member.image || getUrl(coverKey) || ''

              return (
                <Link
                  key={member.slug}
                  href={`/kpop/${groupSlug}/${member.slug}`}
                  className="group rounded-2xl overflow-hidden glass-purple border border-[#00b4d8]/30 dark:border-neon-cyan/30 cinematic-glow-cyan relative block h-80 flex flex-col justify-end p-6 bg-black"
                >
                  {displayImage ? (
                    <div className="absolute inset-0 z-0">
                      <img
                        src={displayImage}
                        alt={member.name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.05] transition-all duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-white/5 z-0"></div>
                  )}

                  <div className="relative z-10 transform group-hover:-translate-y-2 transition-transform duration-300">
                    <h2 className="text-2xl font-black text-white uppercase tracking-wider group-hover:text-[#00b4d8] dark:group-hover:text-neon-cyan dark:group-hover:neon-text-cyan transition-colors">
                      {member.name}
                    </h2>
                    <p className={`text-sm mt-3 inline-block px-3 py-1.5 rounded-full border font-mono ${
                      member.count > 0
                        ? 'text-[#00b4d8] dark:text-neon-cyan bg-black/50 border-[#00b4d8]/50 dark:border-neon-cyan/50'
                        : 'text-gray-400 bg-black/30 border-gray-400/30'
                    }`}>
                      {member.count > 0 
                        ? (lang === 'jp' || lang === 'kr' || lang === 'cn' ? `${member.count}${t.available}` : `${member.count} ${t.available}`)
                        : t.comingSoon}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
