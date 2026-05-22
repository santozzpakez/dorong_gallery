import Header from '../../components/Header'
import Footer from '../../components/Footer'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { hasSupabaseConfig, supabase } from '../../lib/supabaseClient'
import { useSiteAssets } from '../../lib/siteAssets'
import { ASSET_GROUPS, ASSET_SLOTS, DECOR_CATEGORIES as CATS } from '../../lib/assetSlots'
import Cropper from 'react-easy-crop'
import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'next/router'

// Helper to sanitize filenames
function sanitizeFileName(name) {
  const base = name.split(/[/\\]/).pop() || 'image'
  return base.replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_').slice(0, 120) || 'image'
}

const defaultTypes = {
  anime: [],
  kpop: [],
  aesthetic: []
}

const defaultCharactersByType = {
  anime: {},
  kpop: {},
  aesthetic: {}
}

function loadJson(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch {
    return fallback
  }
}

function mergeTypes(saved, fallback) {
  const out = { ...fallback }
  if (!saved || typeof saved !== 'object') return out
  for (const cat of Object.keys(fallback)) {
    const fallbackList = Array.isArray(fallback[cat]) ? fallback[cat] : []
    const savedList = Array.isArray(saved[cat]) ? saved[cat] : []
    const merged = [...new Set([...fallbackList, ...savedList])]
    out[cat] = merged
  }
  return out
}

function mergeCharsByType(saved, fallback) {
  const out = JSON.parse(JSON.stringify(fallback))
  if (!saved || typeof saved !== 'object') return out
  for (const cat of Object.keys(fallback)) {
    out[cat] = { ...(fallback[cat] || {}), ...(saved[cat] || {}) }
    for (const typeName of Object.keys(out[cat])) {
      const def = Array.isArray(fallback[cat]?.[typeName]) ? fallback[cat][typeName] : []
      const extra = Array.isArray(saved[cat]?.[typeName]) ? saved[cat][typeName] : []
      out[cat][typeName] = [...new Set([...def, ...extra])]
    }
  }
  return out
}

// --- COMPRESSION HELPER ---
async function compressImage(file, maxWidth = 1200) {
  if (!file) return null
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height *= maxWidth / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Gagal membuat blob gambar'))
              return
            }
            resolve(blob)
          }, 'image/webp', 0.8)
        } catch (err) {
          reject(err)
        }
      }
      img.onerror = (err) => reject(new Error('Gagal memuat gambar ke canvas'))
    }
    reader.onerror = (err) => reject(new Error('Gagal membaca file gambar'))
  })
}

// --- CROPPING HELPER ---
async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', (error) => reject(error))
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // Standard optimization: 1000px is plenty for site assets and keeps file size small
  const MAX_WIDTH = 1000
  let targetWidth = image.width
  let targetHeight = image.height
  if (image.width > MAX_WIDTH) {
    targetWidth = MAX_WIDTH
    targetHeight = (image.height / image.width) * MAX_WIDTH
  }

  const rotRad = (rotation * Math.PI) / 180
  const bWidth = Math.abs(Math.cos(rotRad) * targetWidth) + Math.abs(Math.sin(rotRad) * targetHeight)
  const bHeight = Math.abs(Math.sin(rotRad) * targetWidth) + Math.abs(Math.cos(rotRad) * targetHeight)

  canvas.width = bWidth
  canvas.height = bHeight

  ctx.translate(bWidth / 2, bHeight / 2)
  ctx.rotate(rotRad)
  ctx.drawImage(image, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight)

  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')

  // Scale the pixel crop to match our resized image
  const scale = targetWidth / image.width
  croppedCanvas.width = pixelCrop.width * scale
  croppedCanvas.height = pixelCrop.height * scale

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x * scale,
    pixelCrop.y * scale,
    pixelCrop.width * scale,
    pixelCrop.height * scale,
    0,
    0,
    croppedCanvas.width,
    croppedCanvas.height
  )

  return new Promise((resolve) => {
    croppedCanvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/webp', 0.75) // Balanced quality (75%)
  })
}

// --- CARD COMPONENT ---
function AssetSlotCard({ slot, staged, onStage, stagedAssets, onReset, onCancelStaged, seriesList }) {
  const { assets, getUrl, getText } = useSiteAssets()
  const isVideo = slot.key.includes('video')

  // For Layout Slots: resolve the actual series/group data
  let layoutSeriesSlug = ''
  if (slot.isLayoutSlot) {
    layoutSeriesSlug = staged?.text !== undefined ? staged.text : (getText(slot.key) || '')
  }

  const [editingText, setEditingText] = useState(false)
  const [textVal, setTextVal] = useState(staged?.text !== undefined ? staged.text : (getText(slot.key) || ''))

  const getAspectClass = () => {
    if (slot.key.includes('home-video')) {
      return 'aspect-[4/3]'
    }
    if (slot.key.startsWith('anime-cover-') || slot.key === 'cover-anime' || slot.key === 'cover-kpop' || slot.key === 'cover-aesthetic' || slot.key === 'cover-custom') {
      return 'aspect-[16/9]'
    }
    if (slot.key.startsWith('kpop-group-') || slot.key.startsWith('aesthetic-')) {
      return 'aspect-[16/9]'
    }
    if (slot.key.startsWith('featured-') || slot.key.includes('-1') || slot.key.includes('-2') || slot.key.includes('-3') || slot.key.startsWith('mockup-studio-') || slot.key.startsWith('mockup-cafe-')) {
      return 'aspect-[3/4]'
    }
    return 'aspect-[16/9]'
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validation: Size limits
      const isVideoSlot = slot.key.includes('video')
      const limitMB = isVideoSlot ? 20 : 5
      const limitBytes = limitMB * 1024 * 1024

      if (file.size > limitBytes) {
        alert(`❌ FILE TERLALU BESAR!\n\nUkuran file Anda: ${(file.size / (1024 * 1024)).toFixed(2)} MB.\nMaksimal yang diperbolehkan: ${limitMB} MB.\n\nSaran: Gunakan aplikasi kompresi video (seperti CapCut atau Video Compressor) agar loading website tetap cepat.`)
        e.target.value = '' // Reset input
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const aspect = getAspectClass() === 'aspect-[3/4]' ? 3 / 4 :
          getAspectClass() === 'aspect-[4/3]' ? 4 / 3 : 16 / 9
        // Resolve target key: if layout slot, map to the actual asset key
        let targetKey = slot.key
        if (slot.isLayoutSlot && layoutSeriesSlug) {
          if (slot.isKpop) targetKey = `kpop-${layoutSeriesSlug}`
          else if (slot.isAesthetic) targetKey = `aesthetic-${layoutSeriesSlug}`
          else targetKey = `anime-cover-${layoutSeriesSlug}`
        }
        onStage(targetKey, { file, url: reader.result, aspect })
      }
      reader.readAsDataURL(file)
    }
  }

  // Resolve what to show in the preview
  let activeKey = slot.key
  if (slot.isLayoutSlot && layoutSeriesSlug) {
    if (slot.isKpop) activeKey = `kpop-${layoutSeriesSlug}`
    else if (slot.isAesthetic) activeKey = `aesthetic-${layoutSeriesSlug}`
    else activeKey = `anime-cover-${layoutSeriesSlug}`
  }
  const activeUrl = staged?.url || (slot.isLayoutSlot && stagedAssets?.[activeKey]?.url) || getUrl(activeKey) || slot.defaultUrl

  const hasTextEdit = !slot.isLayoutSlot && (slot.key.startsWith('anime-cover-') || slot.key.startsWith('kpop-') || slot.key.startsWith('aesthetic-'))

  return (
    <div className={`rounded-xl border transition-all overflow-hidden flex flex-col group ${staged || (slot.isLayoutSlot && stagedAssets[activeKey]) ? 'border-amber-500 shadow-lg shadow-amber-500/10 bg-amber-500/5' : 'border-white/10 bg-white/5 dark:bg-black/20'
      }`}>
      <div className={`${getAspectClass()} bg-gray-200 dark:bg-black/40 relative overflow-hidden`}>
        {activeUrl ? (
          isVideo ? (
            <video src={activeUrl} className="absolute inset-0 w-full h-full object-cover" muted loop autoPlay playsInline />
          ) : (
            <img src={activeUrl} alt={slot.label} className="absolute inset-0 w-full h-full object-cover" />
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 text-[10px] p-4 text-center font-bold">
            {slot.isLayoutSlot && !layoutSeriesSlug ? 'Pilih Series Dulu...' : 'Belum Ada Gambar'}
          </div>
        )}

        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
          {slot.label}
        </div>

        {(staged || (slot.isLayoutSlot && stagedAssets[activeKey])) && (
          <div className="absolute top-2 right-2 bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
            Belum Disimpan
          </div>
        )}

        {/* DELETE BUTTON */}
        {!slot.isLayoutSlot && activeUrl && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onReset(activeKey); }}
            className="absolute bottom-2 right-2 bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-lg backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
            title="Hapus Gambar Permanen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-3 space-y-2">
        {slot.isLayoutSlot ? (
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Pilih Series:</label>
            <select
              value={layoutSeriesSlug}
              onChange={(e) => onStage(slot.key, { text: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-accent/60 transition-all"
            >
              <option value="">-- Kosongkan Slot --</option>
              {seriesList?.map(s => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
          </div>
        ) : hasTextEdit && (
          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Label / Nama:</label>
            {editingText ? (
              <div className="flex gap-1">
                <input
                  autoFocus
                  type="text"
                  value={textVal}
                  onChange={e => setTextVal(e.target.value)}
                  onBlur={() => setEditingText(false)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { onStage(slot.key, { text: textVal.trim() }); setEditingText(false) }
                    if (e.key === 'Escape') setEditingText(false)
                  }}
                  className="flex-1 text-xs px-2 py-1 rounded bg-black/40 border border-accent/45 text-white outline-none"
                />
              </div>
            ) : (
              <button onClick={() => setEditingText(true)} className="w-full text-left text-xs px-2 py-1 rounded bg-black/30 text-gray-300 hover:bg-white/10 transition-all truncate">
                {textVal || <span className="italic opacity-50">Klik untuk edit...</span>}
              </button>
            )}
          </div>
        )}

        <label className={`block text-center text-[10px] px-3 py-2 rounded-lg cursor-pointer font-black uppercase tracking-widest transition-all border ${slot.isLayoutSlot && !layoutSeriesSlug ? 'opacity-30 pointer-events-none bg-gray-500/10 border-white/5 text-gray-500' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
          }`}>
          📁 {isVideo ? 'Ganti Video' : 'Ganti Gambar'}
          <input
            type="file"
            accept={isVideo ? 'video/*' : 'image/*'}
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
        <p className="text-[8px] text-center text-gray-500 font-bold uppercase tracking-tighter">
          Max: {isVideo ? '20MB' : '5MB'}
        </p>

        {(staged || (slot.isLayoutSlot && stagedAssets[activeKey])) ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (onCancelStaged) onCancelStaged(activeKey)
            }}
            className="w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-amber-500 border border-amber-500/20 hover:bg-amber-500/10 transition-all"
            title="Batalkan perubahan yang belum disimpan"
          >
            ✕ Batalkan
          </button>
        ) : (
          activeUrl && (
            <button
              type="button"
              onClick={() => onReset(activeKey)}
              className="w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-red-500 border border-red-500/10 hover:bg-red-500/10 transition-all"
              title="Kembalikan ke gambar asli (hapus kustom)"
            >
              🗑 Hapus / Reset
            </button>
          )
        )}
      </div>
    </div>
  )
}

// --- MAIN PAGE ---
export default function TemaAdmin() {
  const router = useRouter()
  const { user, loading, adminRole } = useAuth()
  const { getUrl, getText, updateAsset, updateText, loaded } = useSiteAssets()

  useEffect(() => {
    if (loading) return
    if (!adminRole) {
      router.push('/')
    }
  }, [user, adminRole, loading])

  const [openGroup, setOpenGroup] = useState('layout')
  const [dynamicGroups, setDynamicGroups] = useState(ASSET_GROUPS)
  const [dynamicSlots, setDynamicSlots] = useState(ASSET_SLOTS)
  const [seriesList, setSeriesList] = useState([])
  const [kpopGroupsList, setKpopGroupsList] = useState([])
  const [aestheticThemesList, setAestheticThemesList] = useState([])
  const [decorCategoriesList, setDecorCategoriesList] = useState([])

  // Stage state: unsaved changes
  const [stagedAssets, setStagedAssets] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [saveProgress, setSaveProgress] = useState(0)
  const [totalSaveItems, setTotalSaveItems] = useState(0)

  const handleResetAsset = async (key) => {
    if (!confirm('Hapus gambar kustom ini dan kembalikan ke default?')) return

    try {
      setIsSaving(true)
      setTotalSaveItems(0) // Prevent NaN% calculation in overlay
      
      if (hasSupabaseConfig && supabase) {
        // Safe, bulletproof reset using upsert (avoids DELETE Row-Level Security policies that could block or hang)
        const { error } = await supabase
          .from('site_assets')
          .upsert({ key, image_url: '', updated_at: new Date().toISOString() }, { onConflict: 'key' })
        if (error) throw error
      }

      setStagedAssets(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })

      alert('Berhasil dihapus! Halaman akan memuat ulang.')
      window.location.reload()
    } catch (e) {
      alert('Gagal hapus: ' + e.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Crop state
  const [cropData, setCropData] = useState(null) // { slotKey, file, url, aspect }
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [cropAspect, setCropAspect] = useState(16 / 9)

  useEffect(() => {
    async function loadDynamicSlots() {
      try {
        // --- 1. Get from LocalStorage (Admin Definitions) ---
        const STORAGE_TYPES = 'dorong_admin_type_options'
        const STORAGE_CHARS = 'dorong_admin_characters_by_type'
        let types = mergeTypes(loadJson(STORAGE_TYPES, null), defaultTypes)
        let chars = mergeCharsByType(loadJson(STORAGE_CHARS, null), defaultCharactersByType)
        
        // Sanitize types object to guarantee arrays are assigned
        if (types && typeof types === 'object') {
          Object.keys(types).forEach(k => {
            if (!Array.isArray(types[k])) {
              types[k] = []
            }
          })
        } else {
          types = { anime: [], kpop: [], aesthetic: [], decor: [] }
        }

        // --- 2. Sync from Database Products & Assets ---
        if (hasSupabaseConfig && supabase) {
          try {
            // A. Sync from Products
            const { data: pData, error: pErr } = await supabase.from('products').select('category, subcategory')
            if (!pErr && pData) {
              pData.forEach(p => {
                const cat = p.category
                const sub = p.subcategory || ''
                if (!cat || !sub) return

                let typeName = ''
                let charName = ''

                if (cat === 'anime' || cat === 'kpop') {
                  const parts = sub.split(' - ')
                  typeName = parts[0].trim()
                  charName = parts[1]?.trim() || ''
                } else if (cat === 'aesthetic' || cat === 'decor') {
                  typeName = sub.trim()
                }

                if (typeName && typeName !== '-') {
                  if (!types[cat]) types[cat] = []
                  if (Array.isArray(types[cat]) && !types[cat].includes(typeName)) {
                    types[cat].push(typeName)
                  }
                  
                  if (charName && charName !== '-') {
                    if (!chars[cat]) chars[cat] = {}
                    if (!chars[cat][typeName]) chars[cat][typeName] = []
                    if (Array.isArray(chars[cat][typeName]) && !chars[cat][typeName].includes(charName)) {
                      chars[cat][typeName].push(charName)
                    }
                  }
                }
              })
            }

            // B. Sync from Site Assets
            const { data: aData, error: aErr } = await supabase.from('site_assets').select('key, label, text_value')
            if (!aErr && aData) {
              aData.forEach(asset => {
                // Parse global options if present
                if (asset.key === 'global-category-options' && asset.text_value) {
                  try {
                    const parsed = JSON.parse(asset.text_value)
                    Object.keys(parsed).forEach(cat => {
                      if (Array.isArray(parsed[cat])) {
                        if (!types[cat]) types[cat] = []
                        parsed[cat].forEach(item => {
                          if (typeof item !== 'string') return
                          const clean = item.replace(/^cover\s*[—\-]?\s*/i, '').trim()
                          const formatted = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
                          if (formatted && Array.isArray(types[cat]) && !types[cat].includes(formatted)) {
                            types[cat].push(formatted)
                          }
                        })
                      }
                    })
                  } catch (e) { console.error('Error parsing global-category-options:', e) }
                }

                // Parse individual covers
                let rawName = ''
                const isSlot = asset.key.includes('sidebar') || asset.key.includes('slot')
                if (isSlot) return

                if (asset.key.startsWith('anime-cover-')) {
                  rawName = asset.label || asset.key.replace('anime-cover-', '').replace(/-/g, ' ')
                } else if (asset.key.startsWith('kpop-')) {
                  rawName = asset.label || asset.key.replace('kpop-', '').replace(/-/g, ' ')
                } else if (asset.key.startsWith('aesthetic-')) {
                  rawName = asset.label || asset.key.replace('aesthetic-', '').replace(/-/g, ' ')
                } else if (asset.key.startsWith('decor-')) {
                  rawName = asset.label || asset.key.replace('decor-', '').replace(/-/g, ' ')
                }

                if (rawName) {
                  const cleanName = rawName.replace(/^cover\s*[—\-]?\s*/i, '').trim()
                  const formattedName = cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
                  
                  let cat = ''
                  if (asset.key.includes('anime')) cat = 'anime'
                  else if (asset.key.includes('kpop')) cat = 'kpop'
                  else if (asset.key.includes('aesthetic')) cat = 'aesthetic'
                  else if (asset.key.includes('decor')) cat = 'decor'
                  else cat = 'custom'

                  if (cat && types[cat] && Array.isArray(types[cat])) {
                    if (!types[cat].includes(formattedName)) {
                      types[cat].push(formattedName)
                    }
                  }
                }
              })
            }
          } catch (err) { console.error('DB Sync Error:', err) }
        }

        // --- 3. FINAL SANITIZATION (Bersihkan & Gabungkan semua duplikat) ---
        const finalTypes = {}
        Object.keys(types).forEach(cat => {
          const uniqueNames = new Set()
          const rawList = Array.isArray(types[cat]) ? types[cat] : []
          rawList.forEach(raw => {
            if (typeof raw !== 'string') return
            const clean = raw.replace(/^cover\s*[—\-]?\s*/i, '').trim()
            const formatted = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
            if (formatted) uniqueNames.add(formatted)
          })
          finalTypes[cat] = Array.from(uniqueNames).sort()
        })

        const seriesSet = new Set(finalTypes.anime || [])
        const kpopGroups = new Set(finalTypes.kpop || [])
        const decorThemes = new Set(finalTypes.decor || [])
        const aestheticThemes = new Set(finalTypes.aesthetic || [])

        // 1. Filter out ANY existing dynamic groups/slots to start fresh
        const filteredGroups = ASSET_GROUPS.filter(g =>
          !g.id.startsWith('anime') &&
          !g.id.startsWith('kpop') &&
          !g.id.startsWith('decor') &&
          !g.id.startsWith('aesthetic')
        )
        const filteredSlots = ASSET_SLOTS.filter(s =>
          !s.group.startsWith('anime') &&
          !s.group.startsWith('kpop') &&
          !s.group.startsWith('decor') &&
          !s.group.startsWith('aesthetic')
        )

        const toSlug = (str) => typeof str === 'string' ? str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : ''

        // ─── ANIME SECTION ───
        filteredGroups.push({ id: 'anime-sidebar-layout', label: '🎌 Anime — Sidebar Layout (10 Panels)' })
        for (let i = 1; i <= 10; i++) {
          const side = i <= 5 ? 'Kiri' : 'Kanan'
          const pos = i <= 5 ? i : i - 5
          filteredSlots.push({ key: `anime-sidebar-slot-${i}`, label: `Slot ${side} #${pos}`, group: 'anime-sidebar-layout', isLayoutSlot: true })
        }
        filteredGroups.push({ id: 'anime-all-covers', label: '🎌 Anime — All Series Covers' })
        const sortedSeries = Array.from(seriesSet).sort((a, b) => a.localeCompare(b))
        sortedSeries.forEach(series => {
          const slug = toSlug(series)
          if (slug) filteredSlots.push({ key: `anime-cover-${slug}`, label: `Cover — ${series}`, group: 'anime-all-covers', defaultUrl: '' })
        })

        // ─── K-POP SECTION ───
        filteredGroups.push({ id: 'kpop-sidebar-layout', label: '🎵 K-pop — Sidebar Layout (10 Panels)' })
        for (let i = 1; i <= 10; i++) {
          const side = i <= 5 ? 'Kiri' : 'Kanan'
          const pos = i <= 5 ? i : i - 5
          filteredSlots.push({ key: `kpop-sidebar-slot-${i}`, label: `Slot ${side} #${pos}`, group: 'kpop-sidebar-layout', isLayoutSlot: true, isKpop: true })
        }
        filteredGroups.push({ id: 'kpop-all-covers', label: '🎵 K-pop — All Group Covers' })
        const sortedKpop = Array.from(kpopGroups).sort((a, b) => a.localeCompare(b))
        sortedKpop.forEach(groupName => {
          const slug = toSlug(groupName)
          if (slug) filteredSlots.push({ key: `kpop-${slug}`, label: `Cover — ${groupName}`, group: 'kpop-all-covers', defaultUrl: '' })
        })

        // ─── DECOR SECTION ───
        filteredGroups.push({ id: 'decor-sidebar-layout', label: '🖼 Decor — Sidebar Layout (10 Panels)' })
        for (let i = 1; i <= 10; i++) {
          const side = i <= 5 ? 'Kiri' : 'Kanan'
          const pos = i <= 5 ? i : i - 5
          filteredSlots.push({ key: `decor-sidebar-slot-${i}`, label: `Slot ${side} #${pos}`, group: 'decor-sidebar-layout', isLayoutSlot: true, isDecor: true })
        }
        filteredGroups.push({ id: 'decor-all-covers', label: '🖼 Decor — All Theme Covers' })
        const sortedThemes = Array.from(decorThemes).sort((a, b) => a.localeCompare(b))
        sortedThemes.forEach(name => {
          const slug = toSlug(name)
          if (slug) filteredSlots.push({ key: `decor-${slug}`, label: `Cover — ${name}`, group: 'decor-all-covers', defaultUrl: '' })
        })

        // ─── AESTHETIC SECTION ───
        filteredGroups.push({ id: 'aesthetic-sidebar-layout', label: '✨ Aesthetic — Sidebar Layout (10 Panels)' })
        for (let i = 1; i <= 10; i++) {
          const side = i <= 5 ? 'Kiri' : 'Kanan'
          const pos = i <= 5 ? i : i - 5
          filteredSlots.push({ key: `aesthetic-sidebar-slot-${i}`, label: `Slot ${side} #${pos}`, group: 'aesthetic-sidebar-layout', isLayoutSlot: true, isAesthetic: true })
        }
        filteredGroups.push({ id: 'aesthetic-all-covers', label: '✨ Aesthetic — All Theme Covers' })
        const sortedAesthetic = Array.from(aestheticThemes).sort((a, b) => a.localeCompare(b))
        sortedAesthetic.forEach(name => {
          const slug = toSlug(name)
          if (slug) filteredSlots.push({ key: `aesthetic-${slug}`, label: `Cover — ${name}`, group: 'aesthetic-all-covers', defaultUrl: '' })
        })

        setDynamicGroups(filteredGroups)
        setDynamicSlots(filteredSlots)
        setSeriesList(sortedSeries.map(s => ({ name: s, slug: toSlug(s) })))
        setKpopGroupsList(sortedKpop.map(s => ({ name: s, slug: toSlug(s) })))
        setDecorCategoriesList(sortedThemes.map(s => ({ name: s, slug: toSlug(s) })))
        setAestheticThemesList(sortedAesthetic.map(s => ({ name: s, slug: toSlug(s) })))
      } catch (globalErr) {
        console.error('Global loadDynamicSlots error:', globalErr)
      }
    }
    loadDynamicSlots()
  }, [loaded])

  const handleCancelStaged = (key) => {
    setStagedAssets(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const onStage = (key, data) => {
    if (data.file) {
      const isVideo = key.includes('video')
      const url = URL.createObjectURL(data.file)

      if (isVideo) {
        setStagedAssets(prev => ({ ...prev, [key]: { ...prev[key], file: data.file, url, type: 'video' } }))
      } else {
        // Trigger Cropping Modal with the correct aspect ratio
        let aspect = 16 / 9
        // Detect 3:4 aspect for characters and featured items
        if (key.startsWith('featured-') || key.includes('-1') || key.includes('-2') || key.includes('-3') || key.startsWith('mockup-studio-') || key.startsWith('mockup-cafe-')) {
          aspect = 3 / 4
        }

        setCropAspect(aspect) // Set the actual cropper state
        setCropData({ slotKey: key, file: data.file, url, aspect })
      }
    } else if (data.text !== undefined) {
      setStagedAssets(prev => ({ ...prev, [key]: { ...prev[key], text: data.text } }))
    }
  }

  const handleFinishCrop = async (useCrop = true) => {
    if (!cropData) return
    let finalBlob = cropData.file
    let finalUrl = cropData.url

    if (useCrop && croppedAreaPixels) {
      finalBlob = await getCroppedImg(cropData.url, croppedAreaPixels, rotation)
      finalUrl = URL.createObjectURL(finalBlob)
    } else {
      // Jika memilih "Tanpa Crop", gunakan file asli langsung tanpa kompresi
      // Ini menjaga transparansi PNG logo tetap tajam dan mencegah macet (stuck)
      finalBlob = cropData.file
      finalUrl = cropData.url
    }

    setStagedAssets(prev => ({
      ...prev,
      [cropData.slotKey]: { ...prev[cropData.slotKey], file: finalBlob, url: finalUrl, type: 'image' }
    }))
    setCropData(null)
    setRotation(0)
    setZoom(1)
  }

  const handleSaveAll = async () => {
    const keys = Object.keys(stagedAssets)
    if (keys.length === 0) return

    setIsSaving(true)
    setTotalSaveItems(keys.length)
    setSaveProgress(0)
    setSaveStatus(`Menyiapkan ${keys.length} perubahan...`)

    try {
      const dbUpdates = []
      const CONCURRENCY_LIMIT = 1 // Process 1 by 1 to prevent Next.js from choking on large Base64 concurrent JSON parsing
      let count = 0

      // Helper to convert file/blob to base64
      const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = error => reject(error)
      })

      // Helper for uploading one asset
      const uploadOneAsset = async (key) => {
        const item = stagedAssets[key]
        let finalUrl = item.url
        const isVideo = item.type === 'video'

        if (item.file) {
          setSaveStatus(`Menyiapkan "${key}"...`)
          const fileToUpload = item.file
          
          setSaveStatus(`Mengupload "${key}" ke Storage...`)
          const originalName = item.file.name || 'upload'
          const safeName = sanitizeFileName(originalName)
          const folder = isVideo ? 'videos' : 'tema'
          const ext = isVideo ? '.mp4' : '' // compressImage returns webp
          const filePath = `${folder}/${key}-${Date.now()}-${safeName}${ext}`

          const base64Data = await toBase64(fileToUpload)

          const doUpload = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            const res = await fetch('/api/upload-theme-asset', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
              },
              body: JSON.stringify({
                filePath,
                base64Data,
                contentType: fileToUpload.type || 'application/octet-stream'
              })
            })
            
            if (!res.ok) {
               let errorMsg = 'Server upload failed'
               try {
                  const data = await res.json()
                  errorMsg = data.error || errorMsg
               } catch(e) {
                  errorMsg = await res.text() || errorMsg
               }
               throw new Error(errorMsg)
            }
            return await res.json()
          }

          let timeoutId;
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Koneksi Timeout (60 detik). File terlalu besar, coba kompres foto.')), 60000)
          })

          const uploadResult = await Promise.race([doUpload(), timeoutPromise])
          clearTimeout(timeoutId)
          finalUrl = uploadResult.publicUrl
        }

        setSaveStatus(`Menyimpan metadata "${key}" ke database...`)
        const slot = dynamicSlots.find(s => s.key === key)
        const upsertData = {
          key: key,
          image_url: finalUrl,
          label: slot?.label || key,
          category: slot?.group || 'tema',
          updated_at: new Date().toISOString()
        }
        if (item.text !== undefined) upsertData.text_value = item.text

        dbUpdates.push(upsertData)
        
        // Local update
        if (item.file) updateAsset(key, finalUrl)
        if (item.text !== undefined) updateText(key, item.text)
        
        count++
        setSaveProgress(count)
        setSaveStatus(`Selesai ${count} dari ${keys.length}...`)
      }

      // Process in chunks (Parallel)
      for (let i = 0; i < keys.length; i += CONCURRENCY_LIMIT) {
        const chunk = keys.slice(i, i + CONCURRENCY_LIMIT)
        await Promise.all(chunk.map(key => uploadOneAsset(key)))
      }

      // Simple Batch Upsert (Menggunakan API Server-Side untuk kestabilan penuh tanpa hambatan RLS/CORS)
      if (dbUpdates.length > 0) {
        setSaveStatus('Menyinkronkan dengan database...')
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        const res = await fetch('/api/sync-theme-assets', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({ dbUpdates })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Server DB sync failed')
      }

      setStagedAssets({})
      setSaveStatus('Berhasil disimpan! ✓')
      setTimeout(() => setSaveStatus(''), 3000)
    } catch (e) {
      console.error('Save error:', e)
      setSaveStatus(`Gagal: ${e.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAsset = async (key) => {
    if (!window.confirm(`⚠️ Hapus gambar untuk "${key}" secara permanen?`)) return

    setIsSaving(true)
    setTotalSaveItems(0) // Prevent NaN% calculation in overlay
    setSaveStatus('Menghapus...')
    try {
      // Menggunakan API Server-Side untuk reset asset demi keamanan dan keandalan penuh
      const upsertData = [{ key, image_url: '', updated_at: new Date().toISOString() }]
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch('/api/sync-theme-assets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ dbUpdates: upsertData })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Server DB reset failed')
      
      // Update local state
      updateAsset(key, '')
      setStagedAssets(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      setSaveStatus('Berhasil dihapus! ✓')
      setTimeout(() => setSaveStatus(''), 3000)
    } catch (e) {
      console.error('Delete error:', e)
      setSaveStatus(`Gagal hapus: ${e.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const [searchQuery, setSearchQuery] = useState('')

  if (loading || !adminRole) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-white font-sans">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Memverifikasi Otorisasi Admin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070709] text-gray-100 font-sans selection:bg-amber-500/30 selection:text-white">
      <Header />
      
      <main className="pt-28 max-w-7xl mx-auto px-4 pb-24">
        
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full"></span>
              <h1 className="text-3xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 font-serif">
                Tema & Aset Website
              </h1>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
              Kelola Gambar Latar, Video Slideshow, dan Susunan Panel Sidebar Utama
            </p>
          </div>

          {/* Quick Stats & Action */}
          <div className="flex items-center gap-4">
            {Object.keys(stagedAssets).length > 0 && (
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-2xl animate-pulse">
                <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider">
                  ⚠️ {Object.keys(stagedAssets).length} Perubahan Belum Disimpan
                </span>
              </div>
            )}
          </div>
        </div>

        {/* WORKSPACE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMN 1: SIDEBAR NAVIGATION */}
          <aside className="lg:col-span-3 lg:sticky lg:top-28 space-y-6">
            
            {/* Unified Glass Container */}
            <div className="bg-[#0b0b0e]/90 border border-white/5 rounded-3xl p-5 shadow-2xl backdrop-blur-md space-y-6">
              
              {/* Search Bar */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">
                  Cari Kategori / Aset:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ketik nama series/id..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 pl-10 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all font-medium"
                  />
                  <svg className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-3.5 text-gray-500 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Navigation List */}
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                
                {/* 1. KATEGORI UMUM */}
                <div className="space-y-2">
                  <h4 
                    onClick={() => setOpenGroup('layout')}
                    className="text-[10px] font-black text-amber-500/80 uppercase tracking-[0.15em] border-b border-amber-500/10 pb-1 flex items-center justify-between cursor-pointer hover:text-amber-400 transition-colors"
                  >
                    <span>🌐 Umum & Homepage</span>
                    <span className="text-[8px] font-bold text-amber-500/40">KLIK</span>
                  </h4>
                  <div className="space-y-1">
                    {dynamicGroups.filter(g => ['layout', 'homepage-videos', 'homepage', 'mockup-settings'].includes(g.id)).map(g => {
                      const count = dynamicSlots.filter(s => s.group === g.id).length
                      const isActive = openGroup === g.id
                      const label = g.id === 'layout' ? 'General Layout' : g.id === 'homepage-videos' ? 'Carousel Videos' : g.id === 'homepage' ? 'Homepage Covers' : 'Mockup Studio (Kiri/Kanan)'
                      return (
                        <button
                          key={g.id}
                          onClick={() => setOpenGroup(g.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                            isActive 
                              ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 border border-amber-500/30 text-amber-400' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <span className="truncate">{label}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-500'}`}>{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2. ANIME */}
                <div className="space-y-2">
                  <h4 
                    onClick={() => setOpenGroup('anime-sidebar-layout')}
                    className="text-[10px] font-black text-rose-500/80 uppercase tracking-[0.15em] border-b border-rose-500/10 pb-1 flex items-center justify-between cursor-pointer hover:text-rose-400 transition-colors"
                  >
                    <span>🎌 Anime Series</span>
                    <span className="text-[8px] font-bold text-rose-500/40">KLIK</span>
                  </h4>
                  <div className="space-y-1">
                    {dynamicGroups.filter(g => g.id.startsWith('anime') && (g.id === 'anime-sidebar-layout' || g.id === 'anime-all-covers')).map(g => {
                      const count = dynamicSlots.filter(s => s.group === g.id).length
                      const isActive = openGroup === g.id
                      const label = g.id === 'anime-sidebar-layout' ? 'Sidebar (10 Panels)' : 'Series Covers'
                      return (
                        <button
                          key={g.id}
                          onClick={() => setOpenGroup(g.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                            isActive 
                              ? 'bg-gradient-to-r from-rose-500/20 to-rose-500/5 border border-rose-500/30 text-rose-400' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <span className="truncate">{label}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-gray-500'}`}>{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3. K-POP */}
                <div className="space-y-2">
                  <h4 
                    onClick={() => setOpenGroup('kpop-sidebar-layout')}
                    className="text-[10px] font-black text-cyan-500/80 uppercase tracking-[0.15em] border-b border-cyan-500/10 pb-1 flex items-center justify-between cursor-pointer hover:text-cyan-400 transition-colors"
                  >
                    <span>🎵 K-pop Groups</span>
                    <span className="text-[8px] font-bold text-cyan-500/40">KLIK</span>
                  </h4>
                  <div className="space-y-1">
                    {dynamicGroups.filter(g => g.id.startsWith('kpop') && (g.id === 'kpop-sidebar-layout' || g.id === 'kpop-all-covers')).map(g => {
                      const count = dynamicSlots.filter(s => s.group === g.id).length
                      const isActive = openGroup === g.id
                      const label = g.id === 'kpop-sidebar-layout' ? 'Sidebar (10 Panels)' : 'Group Covers'
                      return (
                        <button
                          key={g.id}
                          onClick={() => setOpenGroup(g.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                            isActive 
                              ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30 text-cyan-400' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <span className="truncate">{label}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-500'}`}>{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 4. DECOR */}
                <div className="space-y-2">
                  <h4 
                    onClick={() => setOpenGroup('decor-sidebar-layout')}
                    className="text-[10px] font-black text-emerald-500/80 uppercase tracking-[0.15em] border-b border-emerald-500/10 pb-1 flex items-center justify-between cursor-pointer hover:text-emerald-400 transition-colors"
                  >
                    <span>🖼 Decor Categories</span>
                    <span className="text-[8px] font-bold text-emerald-500/40">KLIK</span>
                  </h4>
                  <div className="space-y-1">
                    {dynamicGroups.filter(g => g.id.startsWith('decor') && (g.id === 'decor-sidebar-layout' || g.id === 'decor-all-covers')).map(g => {
                      const count = dynamicSlots.filter(s => s.group === g.id).length
                      const isActive = openGroup === g.id
                      const label = g.id === 'decor-sidebar-layout' ? 'Sidebar (10 Panels)' : 'Theme Covers'
                      return (
                        <button
                          key={g.id}
                          onClick={() => setOpenGroup(g.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                            isActive 
                              ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 text-emerald-400' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <span className="truncate">{label}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 5. AESTHETIC */}
                <div className="space-y-2">
                  <h4 
                    onClick={() => setOpenGroup('aesthetic-sidebar-layout')}
                    className="text-[10px] font-black text-fuchsia-500/80 uppercase tracking-[0.15em] border-b border-fuchsia-500/10 pb-1 flex items-center justify-between cursor-pointer hover:text-fuchsia-400 transition-colors"
                  >
                    <span>✨ Aesthetic Themes</span>
                    <span className="text-[8px] font-bold text-fuchsia-500/40">KLIK</span>
                  </h4>
                  <div className="space-y-1">
                    {dynamicGroups.filter(g => g.id.startsWith('aesthetic') && (g.id === 'aesthetic-sidebar-layout' || g.id === 'aesthetic-all-covers')).map(g => {
                      const count = dynamicSlots.filter(s => s.group === g.id).length
                      const isActive = openGroup === g.id
                      const label = g.id === 'aesthetic-sidebar-layout' ? 'Sidebar (10 Panels)' : 'Theme Covers'
                      return (
                        <button
                          key={g.id}
                          onClick={() => setOpenGroup(g.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                            isActive 
                              ? 'bg-gradient-to-r from-fuchsia-500/20 to-fuchsia-500/5 border border-fuchsia-500/30 text-fuchsia-400' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <span className="truncate">{label}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-white/5 text-gray-500'}`}>{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

              </div>
            </div>
          </aside>

          {/* COLUMN 2: WORKSPACE AREA */}
          <section className="lg:col-span-9 space-y-6">
            
            {/* Header of Active Workspace */}
            {dynamicGroups.map(group => openGroup === group.id && (
              <div key={group.id} className="bg-[#0b0b0e]/90 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md space-y-8">
                
                {/* Header Title with Subtheme Accent */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-8 rounded-full ${
                      group.id.startsWith('anime') ? 'bg-gradient-to-b from-rose-400 to-rose-600' :
                      group.id.startsWith('kpop') ? 'bg-gradient-to-b from-cyan-400 to-cyan-600' :
                      group.id.startsWith('decor') ? 'bg-gradient-to-b from-emerald-400 to-emerald-600' :
                      group.id.startsWith('aesthetic') ? 'bg-gradient-to-b from-fuchsia-400 to-fuchsia-600' :
                      'bg-gradient-to-b from-amber-400 to-amber-600'
                    }`}></span>
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-wider text-white">
                        {group.label}
                      </h2>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-0.5 font-mono">
                        Workspace ID: {group.id}
                      </p>
                    </div>
                  </div>
                  
                  {/* Search Query Indicator */}
                  {searchQuery && (
                    <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      🔍 Filter: "{searchQuery}"
                    </span>
                  )}
                </div>

                {/* --- MOCKUP INTERAKTIF (WIREFRAME SIDEBAR PREVIEW) --- */}
                {group.id.includes('sidebar-layout') && (
                  <div className="bg-black/60 border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="text-center space-y-1">
                      <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                        🖥️ Visualisasi Interaktif Sidebar Layout
                      </h4>
                      <p className="text-[9px] text-gray-500 uppercase font-semibold">
                        Gunakan wireframe di bawah ini untuk mengatur posisi panel pada halaman galeri secara akurat
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-[#070709] p-4 rounded-xl border border-white/5">
                      
                      {/* Sidebar Kiri (1 - 5) */}
                      <div className="md:col-span-3 bg-[#0a0a0c] border border-white/5 rounded-xl p-3 space-y-3">
                        <div className="text-center text-[9px] font-black text-rose-500 uppercase tracking-widest border-b border-rose-500/10 pb-1.5 mb-2">
                          ⬅️ Sidebar Kiri
                        </div>
                        <div className="space-y-3">
                          {dynamicSlots.filter(s => s.group === group.id).slice(0, 5).map(slot => {
                            const selectedSlug = stagedAssets[slot.key]?.text !== undefined ? stagedAssets[slot.key].text : (getText(slot.key) || '')
                            const coverKey = group.id.startsWith('kpop') ? `kpop-${selectedSlug}` : group.id.startsWith('aesthetic') ? `aesthetic-${selectedSlug}` : group.id.startsWith('decor') ? `decor-${selectedSlug}` : `anime-cover-${selectedSlug}`
                            const coverUrl = getUrl(coverKey)

                            const getCorrectOptionsList = () => {
                              if (group.id.startsWith('kpop')) return kpopGroupsList
                              if (group.id.startsWith('aesthetic')) return aestheticThemesList
                              if (group.id.startsWith('decor')) return decorCategoriesList
                              return seriesList
                            }
                            const optionsList = getCorrectOptionsList()

                            return (
                              <div key={slot.key} className="relative rounded-lg overflow-hidden border border-white/10 p-2.5 bg-black/40 min-h-[55px] flex flex-col justify-center shadow-inner">
                                {coverUrl && (
                                  <div className="absolute inset-0 bg-cover bg-center opacity-30 z-0 scale-105 blur-[1px] transition-all" style={{ backgroundImage: `url(${coverUrl})` }}></div>
                                )}
                                <div className="relative z-10 space-y-1">
                                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">
                                    Slot Kiri #{dynamicSlots.filter(s => s.group === group.id).indexOf(slot) + 1}
                                  </span>
                                  <select
                                    value={selectedSlug}
                                    onChange={(e) => onStage(slot.key, { text: e.target.value })}
                                    className="w-full bg-zinc-950 border border-white/10 rounded px-1.5 py-1 text-[9px] text-white focus:outline-none focus:border-amber-500 font-bold"
                                  >
                                    <option value="">-- Kosong --</option>
                                    {optionsList?.map(s => (
                                      <option key={s.slug} value={s.slug}>{s.name}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Main Gallery Placeholder */}
                      <div className="md:col-span-6 border-2 border-dashed border-white/5 rounded-xl h-72 flex flex-col items-center justify-center text-center p-6 space-y-2 bg-zinc-950/20">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-gray-400 shadow-inner">
                          🖼️
                        </div>
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Halaman Galeri Utama
                        </h5>
                        <p className="text-[9px] text-gray-600 max-w-[200px] font-bold uppercase tracking-tight">
                          Daftar produk metal print akan dimuat secara dinamis di bagian tengah ini.
                        </p>
                      </div>

                      {/* Sidebar Kanan (6 - 10) */}
                      <div className="md:col-span-3 bg-[#0a0a0c] border border-white/5 rounded-xl p-3 space-y-3">
                        <div className="text-center text-[9px] font-black text-cyan-500 uppercase tracking-widest border-b border-cyan-500/10 pb-1.5 mb-2">
                          ➡️ Sidebar Kanan
                        </div>
                        <div className="space-y-3">
                          {dynamicSlots.filter(s => s.group === group.id).slice(5, 10).map(slot => {
                            const selectedSlug = stagedAssets[slot.key]?.text !== undefined ? stagedAssets[slot.key].text : (getText(slot.key) || '')
                            const coverKey = group.id.startsWith('kpop') ? `kpop-${selectedSlug}` : group.id.startsWith('aesthetic') ? `aesthetic-${selectedSlug}` : group.id.startsWith('decor') ? `decor-${selectedSlug}` : `anime-cover-${selectedSlug}`
                            const coverUrl = getUrl(coverKey)

                            const getCorrectOptionsList = () => {
                              if (group.id.startsWith('kpop')) return kpopGroupsList
                              if (group.id.startsWith('aesthetic')) return aestheticThemesList
                              if (group.id.startsWith('decor')) return decorCategoriesList
                              return seriesList
                            }
                            const optionsList = getCorrectOptionsList()

                            return (
                              <div key={slot.key} className="relative rounded-lg overflow-hidden border border-white/10 p-2.5 bg-black/40 min-h-[55px] flex flex-col justify-center shadow-inner">
                                {coverUrl && (
                                  <div className="absolute inset-0 bg-cover bg-center opacity-30 z-0 scale-105 blur-[1px] transition-all" style={{ backgroundImage: `url(${coverUrl})` }}></div>
                                )}
                                <div className="relative z-10 space-y-1">
                                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">
                                    Slot Kanan #{dynamicSlots.filter(s => s.group === group.id).indexOf(slot) - 4}
                                  </span>
                                  <select
                                    value={selectedSlug}
                                    onChange={(e) => onStage(slot.key, { text: e.target.value })}
                                    className="w-full bg-zinc-950 border border-white/10 rounded px-1.5 py-1 text-[9px] text-white focus:outline-none focus:border-cyan-500 font-bold"
                                  >
                                    <option value="">-- Kosong --</option>
                                    {optionsList?.map(s => (
                                      <option key={s.slug} value={s.slug}>{s.name}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* Main Slot Grid with Live Filtering */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {dynamicSlots
                    .filter(s => s.group === group.id)
                    .filter(s => {
                      if (!searchQuery) return true
                      const label = s.label || ''
                      const key = s.key || ''
                      const textVal = stagedAssets[s.key]?.text !== undefined ? stagedAssets[s.key].text : (getText(s.key) || '')
                      return label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             textVal.toLowerCase().includes(searchQuery.toLowerCase())
                    })
                    .map(slot => {
                      const getCorrectList = () => {
                        if (slot.isKpop) return kpopGroupsList
                        if (slot.isAesthetic) return aestheticThemesList
                        if (slot.isDecor) return decorCategoriesList
                        return seriesList
                      }

                      return (
                        <AssetSlotCard
                          key={slot.key}
                          slot={slot}
                          staged={stagedAssets[slot.key]}
                          onStage={onStage}
                          stagedAssets={stagedAssets}
                          onReset={handleResetAsset}
                          onCancelStaged={handleCancelStaged}
                          seriesList={getCorrectList()}
                        />
                      )
                    })
                  }
                </div>

                {/* Empty State */}
                {dynamicSlots.filter(s => s.group === group.id).length === 0 && (
                  <div className="text-center py-20 text-gray-600 italic uppercase tracking-wider text-[10px] font-black">
                    Belum ada slot aset terdaftar untuk kategori ini.
                  </div>
                )}

                {dynamicSlots.filter(s => s.group === group.id).length > 0 && 
                 dynamicSlots
                   .filter(s => s.group === group.id)
                   .filter(s => {
                     if (!searchQuery) return true
                     const label = s.label || ''
                     const key = s.key || ''
                     const textVal = stagedAssets[s.key]?.text !== undefined ? stagedAssets[s.key].text : (getText(s.key) || '')
                     return label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            textVal.toLowerCase().includes(searchQuery.toLowerCase())
                   }).length === 0 && (
                     <div className="text-center py-20 text-zinc-600 italic uppercase tracking-wider text-[10px] font-black border-2 border-dashed border-white/5 rounded-2xl">
                       ❌ Tidak ada hasil pencarian yang cocok dengan "{searchQuery}"
                     </div>
                   )
                }

              </div>
            ))}
          </section>

        </div>

      </main>

      {/* CROP MODAL */}
      {cropData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="bg-[#0b0b0e] rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-white/10">
            <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:justify-between md:items-center bg-[#0d0d12] gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-black uppercase tracking-widest text-white text-xs">Crop Asset</h3>
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-tight">
                  💡 Rekomendasi: {cropData.aspect === 16 / 9 ? 'Wide (16:9) untuk Banner' : 'Portrait (3:4) untuk Karakter'}
                </p>
              </div>
              <div className="flex bg-black/40 p-1 rounded-lg border border-white/5 self-start md:self-auto">
                <button type="button" onClick={() => setCropAspect(16 / 9)} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${cropAspect === 16 / 9 ? 'bg-purple-500 text-white' : 'text-gray-500 hover:text-white'}`}>16:9</button>
                <button type="button" onClick={() => setCropAspect(3 / 4)} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${cropAspect === 3 / 4 ? 'bg-purple-500 text-white' : 'text-gray-500 hover:text-white'}`}>3:4</button>
                <button type="button" onClick={() => setCropAspect(1)} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${cropAspect === 1 ? 'bg-purple-500 text-white' : 'text-gray-500 hover:text-white'}`}>1:1</button>
                <button type="button" onClick={() => setCropAspect(null)} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${cropAspect === null ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:text-white'}`}>✨ Bebas</button>
              </div>
            </div>
            <div className="relative h-96 bg-black">
              <Cropper
                image={cropData.url}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={cropAspect}
                onCropChange={setCrop}
                onRotationChange={setRotation}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-6 bg-[#0d0d12] border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Zoom</span>
                  <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full md:w-32" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Rotasi</span>
                  <input type="range" value={rotation} min={0} max={360} step={90} onChange={(e) => setRotation(Number(e.target.value))} className="w-full md:w-32" />
                  <span className="text-[10px] text-white font-mono">{rotation}°</span>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  type="button" 
                  onClick={() => setCropData(null)} 
                  className="flex-1 md:flex-none px-6 py-2 rounded-full border border-red-500/20 text-red-500 text-[10px] font-bold uppercase hover:bg-red-500/10"
                >
                  Batal
                </button>
                <button type="button" onClick={() => handleFinishCrop(false)} className="flex-1 md:flex-none px-6 py-2 rounded-full border border-white/20 text-white text-[10px] font-bold uppercase hover:bg-white/10">Tanpa Crop</button>
                <button type="button" onClick={() => handleFinishCrop(true)} className="flex-1 md:flex-none px-8 py-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-bold uppercase shadow-lg shadow-purple-500/20">Terapkan Crop</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STICKY FLOATING BOTTOM SAVE BAR */}
      {Object.keys(stagedAssets).length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-6 px-6 py-3.5 bg-black/90 backdrop-blur-md rounded-full border border-amber-500/30 shadow-[0_10px_30px_rgba(245,158,11,0.2)] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
            ⚠️ Ada {Object.keys(stagedAssets).length} perubahan yang belum disimpan!
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm("Batalkan semua perubahan yang belum disimpan?")) {
                  setStagedAssets({})
                }
              }}
              className="px-4 py-1.5 rounded-full border border-red-500/20 hover:border-red-500/60 text-red-500 font-bold text-[9px] uppercase tracking-widest transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-[9px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Sekarang ✓'}
            </button>
          </div>
        </div>
      )}

      {/* FUTURISTIC ROTATING PROGRESS SCREEN */}
      {isSaving && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative flex items-center justify-center mb-10">
            <div className="absolute w-28 h-28 border-4 border-t-amber-500 border-r-amber-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <div className="w-20 h-20 border-4 border-b-amber-500 border-l-amber-500 border-t-transparent border-r-transparent rounded-full animate-spin direction-reverse"></div>
            <div className="absolute text-white font-black text-xl font-mono">
              {totalSaveItems > 0 ? `${Math.round((saveProgress / totalSaveItems) * 100)}%` : '...'}
            </div>
          </div>
          
          <div className="w-full max-w-sm px-6">
            <h3 className="text-amber-500 text-xl font-black uppercase tracking-[0.2em] mb-4 text-center animate-pulse font-serif">
              MEMPROSES...
            </h3>
            
            {/* Progress Bar Container */}
            <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 mb-4 p-[2px]">
              <div 
                className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                style={{ width: `${totalSaveItems > 0 ? (saveProgress / totalSaveItems) * 100 : 100}%` }}
              />
            </div>

            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest text-center">
              {saveStatus || 'Mengunggah file ke server...'}
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
