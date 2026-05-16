/**
 * Central registry of all site image slots.
 * Each slot has a unique key, a human-readable label, a group, and a default fallback URL.
 */

export const ASSET_GROUPS = [
  { id: 'layout', label: '🎨 Layout — Header & Footer' },
  { id: 'homepage-videos', label: '🎬 Carousel Videos (Beranda)' },
  { id: 'homepage', label: 'Homepage Covers' }
]

export const DECOR_CATEGORIES = []

export const ASSET_SLOTS = [
  // ── Layout ──
  { key: 'header-bg', label: 'Background Header (Semua Halaman)', group: 'layout', defaultUrl: '' },
  { key: 'footer-bg', label: 'Background Footer (Semua Halaman)', group: 'layout', defaultUrl: '' },
  { key: 'home-bg',   label: 'Background Homepage (Di Belakang Koleksi)', group: 'layout', defaultUrl: '' },

  // ── Homepage Videos ──
  { key: 'home-video',label: 'Video 1 (Utama)', group: 'homepage-videos', defaultUrl: '' },
  { key: 'home-video-2',label: 'Video 2', group: 'homepage-videos', defaultUrl: '' },
  { key: 'home-video-3',label: 'Video 3', group: 'homepage-videos', defaultUrl: '' },
  { key: 'home-video-4',label: 'Video 4', group: 'homepage-videos', defaultUrl: '' },
  { key: 'home-video-5',label: 'Video 5', group: 'homepage-videos', defaultUrl: '' },
  { key: 'home-video-6',label: 'Video 6', group: 'homepage-videos', defaultUrl: '' },
  { key: 'home-video-7',label: 'Video 7', group: 'homepage-videos', defaultUrl: '' },
  { key: 'home-video-8',label: 'Video 8', group: 'homepage-videos', defaultUrl: '' },
  { key: 'home-video-9',label: 'Video 9', group: 'homepage-videos', defaultUrl: '' },
  { key: 'home-video-10',label: 'Video 10', group: 'homepage-videos', defaultUrl: '' },

  // ── Homepage ──
  { key: 'cover-anime', label: 'Cover Anime (Homepage)', group: 'homepage', defaultUrl: '' },
  { key: 'cover-kpop', label: 'Cover K-pop (Homepage)', group: 'homepage', defaultUrl: '' },
  { key: 'cover-decor', label: 'Cover Decor (Homepage)', group: 'homepage', defaultUrl: '' },
  { key: 'cover-custom', label: 'Cover Custom (Homepage)', group: 'homepage', defaultUrl: '' },

  // ── K-pop ── (dynamically generated from database in admin/tema.js)
  // Slots are created based on actual kpop products in the database.

  // ── Decor ── (dynamically generated from products + manual list)
]

/** Build a map of key → defaultUrl for quick lookup */
export const DEFAULT_URLS = Object.fromEntries(
  ASSET_SLOTS.map((slot) => [slot.key, slot.defaultUrl])
)

/** Get a slot by key */
export function getSlot(key) {
  return ASSET_SLOTS.find((s) => s.key === key) || null
}

/** Get all slots for a given group */
export function getSlotsByGroup(groupId) {
  return ASSET_SLOTS.filter((s) => s.group === groupId)
}
