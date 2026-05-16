/**
 * Anime catalog data.
 * Images are now managed via site_assets (admin upload).
 * Each character has assetKeys that map to site_assets keys.
 */

export const animeCatalog = [
  {
    slug: 'naruto',
    name: 'Naruto',
    coverKey: 'anime-cover-naruto',
    characters: [
      {
        slug: 'naruto-uzumaki',
        name: 'Naruto Uzumaki',
        assetKeys: [
          'anime-naruto-uzumaki-1',
          'anime-naruto-uzumaki-2',
          'anime-naruto-uzumaki-3'
        ]
      },
      {
        slug: 'sasuke-uchiha',
        name: 'Sasuke Uchiha',
        assetKeys: [
          'anime-sasuke-uchiha-1',
          'anime-sasuke-uchiha-2',
          'anime-sasuke-uchiha-3'
        ]
      }
    ]
  },
  {
    slug: 'one-piece',
    name: 'One Piece',
    coverKey: 'anime-cover-one-piece',
    characters: [
      {
        slug: 'luffy',
        name: 'Monkey D. Luffy',
        assetKeys: [
          'anime-luffy-1',
          'anime-luffy-2',
          'anime-luffy-3'
        ]
      },
      {
        slug: 'zoro',
        name: 'Roronoa Zoro',
        assetKeys: [
          'anime-zoro-1',
          'anime-zoro-2',
          'anime-zoro-3'
        ]
      }
    ]
  },
  {
    slug: 'dragon-ball',
    name: 'Dragon Ball',
    coverKey: 'anime-cover-dragon-ball',
    characters: [
      {
        slug: 'goku',
        name: 'Son Goku',
        assetKeys: [
          'anime-goku-1',
          'anime-goku-2',
          'anime-goku-3'
        ]
      },
      {
        slug: 'vegeta',
        name: 'Vegeta',
        assetKeys: [
          'anime-vegeta-1',
          'anime-vegeta-2',
          'anime-vegeta-3'
        ]
      }
    ]
  }
]

export function getSeriesBySlug(slug) {
  return animeCatalog.find((series) => series.slug === slug)
}

export function getCharacter(seriesSlug, characterSlug) {
  const series = getSeriesBySlug(seriesSlug)
  if (!series) return null
  const character = series.characters.find((item) => item.slug === characterSlug)
  if (!character) return null
  return { series, character }
}
