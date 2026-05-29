/**
 * Central registry of all site image slots.
 * Each slot has a unique key, a human-readable label, a group, and a default fallback URL.
 */

export const ASSET_GROUPS = [
  { id: 'layout', label: '🎨 Layout — Cover BG' },
  { id: 'homepage-videos', label: '🎬 Carousel Videos (Beranda)' },
  { id: 'homepage', label: 'Homepage Covers' },
  { id: 'mockup-settings', label: '🖥️ Mockup Studio & Cafe (Adjacent Pictures)' }
]

export const DECOR_CATEGORIES = []

export const ASSET_SLOTS = [
  // ── Layout ──
  { key: 'logo', label: 'Logo Website (Top Left)', group: 'layout', defaultUrl: '' },
  { key: 'parent-logo', label: 'Logo Perusahaan Induk (Footer)', group: 'layout', defaultUrl: '' },

  // ── Homepage Videos ──
  { key: 'home-video', label: 'Video 1 (Utama)', group: 'homepage-videos', defaultUrl: '' },
  { key: 'home-video-2', label: 'Video 2', group: 'homepage-videos', defaultUrl: '' },

  // ── Homepage ──
  { key: 'cover-anime', label: 'Cover Anime (Homepage)', group: 'homepage', defaultUrl: '' },
  { key: 'cover-kpop', label: 'Cover K-pop (Homepage)', group: 'homepage', defaultUrl: '' },
  { key: 'cover-aesthetic', label: 'Cover Aesthetic (Homepage)', group: 'homepage', defaultUrl: '' },
  { key: 'cover-custom', label: 'Cover Custom (Homepage)', group: 'homepage', defaultUrl: '' },

  // ── Mockup Studio & Cafe Adjacent Pictures ──
  { key: 'mockup-studio-left', label: 'Poster Studio Kiri', group: 'mockup-settings', defaultUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop' },
  { key: 'mockup-studio-right', label: 'Poster Studio Kanan', group: 'mockup-settings', defaultUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop' },
  { key: 'mockup-cafe-left', label: 'Poster Cafe Kiri', group: 'mockup-settings', defaultUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop' },
  { key: 'mockup-cafe-right', label: 'Poster Cafe Kanan', group: 'mockup-settings', defaultUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop' },

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
