import Header from '../../components/Header'
import Footer from '../../components/Footer'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { hasSupabaseConfig, supabase } from '../../lib/supabaseClient'
import { useSiteAssets } from '../../lib/siteAssets'
import { ASSET_GROUPS, ASSET_SLOTS, DECOR_CATEGORIES as CATS } from '../../lib/assetSlots'
import Cropper from 'react-easy-crop'

// Helper to sanitize filenames
function sanitizeFileName(name) {
  const base = name.split(/[/\\]/).pop() || 'image'
  return base.replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_').slice(0, 120) || 'image'
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
function AssetSlotCard({ slot, staged, onStage, stagedAssets, onReset, seriesList }) {
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
    if (slot.key.startsWith('anime-cover-') || slot.key === 'cover-anime' || slot.key === 'cover-kpop' || slot.key === 'cover-decor' || slot.key === 'cover-custom') {
      return 'aspect-[16/9]'
    }
    if (slot.key.startsWith('kpop-group-') || slot.key.startsWith('decor-')) {
      return 'aspect-[16/9]'
    }
    if (slot.key.startsWith('featured-') || slot.key.includes('-1') || slot.key.includes('-2') || slot.key.includes('-3')) {
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
          else if (slot.isDecor) targetKey = `decor-${layoutSeriesSlug}`
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
    else if (slot.isDecor) activeKey = `decor-${layoutSeriesSlug}`
    else activeKey = `anime-cover-${layoutSeriesSlug}`
  }
  const activeUrl = staged?.url || (slot.isLayoutSlot && stagedAssets?.[activeKey]?.url) || getUrl(activeKey) || slot.defaultUrl

  const hasTextEdit = !slot.isLayoutSlot && (slot.key.startsWith('anime-cover-') || slot.key.startsWith('kpop-') || slot.key.startsWith('decor-'))

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
      </div>

      <div className="p-3 space-y-2">
        {slot.isLayoutSlot ? (
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Pilih Series:</label>
            <select
              value={layoutSeriesSlug}
              onChange={(e) => onStage(slot.key, { text: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-neon-cyan transition-all"
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
                  className="flex-1 text-xs px-2 py-1 rounded bg-black/40 border border-[#9d4edd]/40 text-white outline-none"
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

        <button
          onClick={() => onReset(activeKey)}
          className="w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-red-500 border border-red-500/10 hover:bg-red-500/10 transition-all"
          title="Kembalikan ke gambar asli (hapus kustom)"
        >
          🗑 Hapus / Reset
        </button>
      </div>
    </div>
  )
}

// --- MAIN PAGE ---
export default function TemaAdmin() {
  const { getUrl, getText, updateAsset, updateText } = useSiteAssets()
  const [openGroup, setOpenGroup] = useState('layout')
  const [dynamicGroups, setDynamicGroups] = useState(ASSET_GROUPS)
  const [dynamicSlots, setDynamicSlots] = useState(ASSET_SLOTS)
  const [seriesList, setSeriesList] = useState([])

  // Stage state: unsaved changes
  const [stagedAssets, setStagedAssets] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  const handleResetAsset = async (key) => {
    if (!confirm('Hapus gambar kustom ini dan kembalikan ke default?')) return

    try {
      setIsSaving(true)
      const { error } = await supabase.from('site_assets').delete().eq('key', key)
      if (error) throw error

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
      if (!hasSupabaseConfig || !supabase) return

      // --- 1. Get from LocalStorage (Admin Definitions) ---
      const STORAGE_TYPES = 'dorong_admin_type_options'
      let adminAnimeSeries = []
      let adminKpopGroups = []
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_TYPES) : null
        if (raw) {
          const parsed = JSON.parse(raw)
          adminAnimeSeries = Array.isArray(parsed?.anime) ? parsed.anime : []
          adminKpopGroups = Array.isArray(parsed?.kpop) ? parsed.kpop : []
        }
      } catch { /* ignore */ }

      // --- 2. Get from Database (Actual Products) ---
      let dbData = []
      try {
        const { data, error } = await supabase.from('products').select('category, subcategory')
        if (!error && data) dbData = data
      } catch (err) { console.error(err) }

      const seriesNames = new Set()
      const seriesSet = new Set()
      const charMap = new Map()
      const kpopNames = new Set()
      const kpopGroups = new Set()

      // Add admin definitions first
      adminAnimeSeries.forEach(s => {
        if (s && !seriesNames.has(s.toUpperCase())) {
          seriesNames.add(s.toUpperCase())
          seriesSet.add(s)
        }
      })
      adminKpopGroups.forEach(g => {
        if (g && !kpopNames.has(g.toUpperCase())) {
          kpopNames.add(g.toUpperCase())
          kpopGroups.add(g)
        }
      })

      dbData.forEach(p => {
        if (p.category === 'anime' && p.subcategory) {
          const parts = p.subcategory.split(' - ')
          const series = parts[0].trim(); const char = parts[1]?.trim() || ''
          if (series && series !== '-' && !seriesNames.has(series.toUpperCase())) {
            seriesNames.add(series.toUpperCase())
            seriesSet.add(series)
            if (!charMap.has(series)) charMap.set(series, new Set())
            if (char && char !== '-') charMap.get(series).add(char)
          }
        }
        if (p.category === 'kpop' && p.subcategory) {
          const groupName = p.subcategory.split(' - ')[0].trim()
          if (groupName && !kpopNames.has(groupName.toUpperCase())) {
            kpopNames.add(groupName.toUpperCase())
            kpopGroups.add(groupName)
          }
        }
      })

      // 1. Filter out ANY existing dynamic groups/slots to start fresh
      const filteredGroups = ASSET_GROUPS.filter(g =>
        !g.id.startsWith('anime') &&
        !g.id.startsWith('kpop') &&
        !g.id.startsWith('decor')
      )
      const filteredSlots = ASSET_SLOTS.filter(s =>
        !s.group.startsWith('anime') &&
        !s.group.startsWith('kpop') &&
        !s.group.startsWith('decor')
      )

      const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

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
        filteredSlots.push({ key: `anime-cover-${slug}`, label: `Cover — ${series}`, group: 'anime-all-covers', defaultUrl: '' })
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
        filteredSlots.push({ key: `kpop-${slug}`, label: `Cover — ${groupName}`, group: 'kpop-all-covers', defaultUrl: '' })
      })

      // ─── DECOR SECTION ───
      filteredGroups.push({ id: 'decor-sidebar-layout', label: '🖼 Decor — Sidebar Layout (10 Panels)' })
      for (let i = 1; i <= 10; i++) {
        const side = i <= 5 ? 'Kiri' : 'Kanan'
        const pos = i <= 5 ? i : i - 5
        filteredSlots.push({ key: `decor-sidebar-slot-${i}`, label: `Slot ${side} #${pos}`, group: 'decor-sidebar-layout', isLayoutSlot: true, isDecor: true })
      }
      filteredGroups.push({ id: 'decor-all-covers', label: '🖼 Decor — All Theme Covers' })

      const themeMap = new Map() // lowercase -> originalName
      dbData.forEach(p => {
        if (p.category === 'decor' && p.subcategory) {
          const name = p.subcategory.trim()
          if (name) themeMap.set(name.toLowerCase(), name)
        }
      })
      if (typeof window !== 'undefined') {
        try {
          const saved = JSON.parse(window.localStorage.getItem('dorong_admin_type_options') || '{}')
          if (saved.decor && Array.isArray(saved.decor)) {
            saved.decor.forEach(t => {
              const name = t.trim()
              if (name && !themeMap.has(name.toLowerCase())) themeMap.set(name.toLowerCase(), name)
            })
          }
        } catch { }
      }

      const sortedThemes = Array.from(themeMap.values()).sort((a, b) => a.localeCompare(b))
      sortedThemes.forEach(name => {
        const slug = toSlug(name)
        filteredSlots.push({ key: `decor-${slug}`, label: `Cover — ${name}`, group: 'decor-all-covers', defaultUrl: '' })
      })


      setDynamicGroups(filteredGroups)
      setDynamicSlots(filteredSlots)
      setSeriesList(sortedSeries.map(s => ({ name: s, slug: toSlug(s) })))
    }
    loadDynamicSlots()
  }, [])

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
        if (key.startsWith('featured-') || key.includes('-1') || key.includes('-2') || key.includes('-3')) {
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
    setSaveStatus(`Menyiapkan ${keys.length} perubahan...`)

    try {
      const dbUpdates = []
      let count = 0

      for (const key of keys) {
        count++
        const item = stagedAssets[key]
        let finalUrl = item.url
        const isVideo = item.type === 'video'

        if (item.file && hasSupabaseConfig && supabase) {
          setSaveStatus(`Mengunggah ${isVideo ? 'video' : 'gambar'} ${count} dari ${keys.length}... Mohon tunggu.`)

          const safeName = sanitizeFileName(item.file.name || 'upload')
          const folder = isVideo ? 'videos' : 'tema'
          const ext = isVideo ? '.mp4' : '.webp'
          const filePath = `${folder}/${key}-${Date.now()}-${safeName}${ext}`

          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          const uploadUrl = `${supabaseUrl}/storage/v1/object/product-images/${filePath}`

          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open('POST', uploadUrl, true)
            xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`)
            xhr.setRequestHeader('apikey', supabaseAnonKey)
            // Penting: Jangan gunakan upsert false di header jika bucket tidak strict, atau bisa tambahkan header jika perlu
            // xhr.setRequestHeader('x-upsert', 'false')
            xhr.setRequestHeader('Content-Type', item.file.type || 'application/octet-stream')

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100)
                setSaveStatus(`Mengunggah ${isVideo ? 'video' : 'gambar'} ${count} dari ${keys.length}... ${percent}%`)
              }
            }

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.responseText)
              } else {
                try {
                  const errResponse = JSON.parse(xhr.responseText)
                  reject(new Error(`Upload gagal: ${errResponse.message || xhr.statusText}`))
                } catch {
                  reject(new Error(`Upload gagal: ${xhr.statusText}`))
                }
              }
            }

            xhr.onerror = () => reject(new Error('Koneksi terputus saat mengunggah.'))
            xhr.send(item.file)
          })

          finalUrl = supabase.storage.from('product-images').getPublicUrl(filePath).data.publicUrl
        }

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
      }

      // Simple Batch Upsert (Identical to K-pop/Anime Product creation)
      if (dbUpdates.length > 0 && hasSupabaseConfig && supabase) {
        const { error } = await supabase.from('site_assets').upsert(dbUpdates, { onConflict: 'key' })
        if (error) throw new Error(error.message)
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

  const [animeSearch, setAnimeSearch] = useState('')
  const [kpopSearch, setKpopSearch] = useState('')

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)]">
      <Header />
      <main className="pt-28 max-w-6xl mx-auto px-4 pb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#9d4edd] to-[#00b4d8]">Tema & Aset</h1>
            <p className="text-xs text-gray-500 mt-1">Kelola gambar, video, dan teks dekoratif website.</p>
          </div>

          {/* Floating Save Button */}
          <div className="flex items-center gap-3">
            {Object.keys(stagedAssets).length > 0 && (
              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-full bg-amber-500 text-black font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : `Simpan ${Object.keys(stagedAssets).length} Perubahan`}
              </button>
            )}
            {saveStatus && <span className="text-xs text-green-400 font-bold">{saveStatus}</span>}
          </div>
        </div>

        {/* NAVIGATION TABS / GROUPED */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          {/* 1. UMUM */}
          <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
            {['layout', 'homepage-videos', 'homepage'].map(id => {
              const g = dynamicGroups.find(x => x.id === id)
              if (!g) return null
              const count = dynamicSlots.filter(s => s.group === g.id).length
              return (
                <button
                  key={g.id}
                  onClick={() => setOpenGroup(g.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${openGroup === g.id ? 'bg-gradient-to-r from-[#9d4edd] to-[#00b4d8] text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  {g.id === 'layout' ? '🎨 General' : g.id === 'homepage-videos' ? '🎬 Videos' : '🏠 Covers'} ({count})
                </button>
              )
            })}
          </div>

          {/* 2. ANIME DROPDOWN */}
          <div className="relative group/anime">
            <button className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${openGroup.startsWith('anime') ? 'bg-[#9d4edd] border-[#9d4edd] text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 border-white/10 text-gray-400 hover:border-[#9d4edd]/50'
              }`}>
              🎌 Anime Series
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/anime:opacity-100 group-hover/anime:visible transition-all z-50 p-2 space-y-1">
              <div className="p-2 border-b border-white/5 mb-2">
                <input
                  type="text"
                  placeholder="Cari Series..."
                  value={animeSearch}
                  onChange={(e) => setAnimeSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white placeholder-gray-600 focus:outline-none focus:border-[#9d4edd]/50 transition-all"
                />
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {/* Fixed Layout Menu at Top */}
                {dynamicGroups.filter(g => g.id === 'anime-sidebar-layout' || g.id === 'anime-all-covers').map(g => (
                  <button
                    key={g.id}
                    onClick={() => setOpenGroup(g.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex justify-between items-center mb-1 border ${openGroup === g.id ? 'bg-[#9d4edd]/20 border-[#9d4edd]/50 text-[#9d4edd]' : 'text-amber-500 border-amber-500/20 hover:bg-white/5'
                      }`}
                  >
                    <span>✨ {g.label.replace('🎌 Anime — ', '')}</span>
                  </button>
                ))}

                {dynamicGroups.filter(g => g.id.startsWith('anime') && g.id !== 'anime-sidebar-layout' && g.id !== 'anime-all-covers' && g.label.toLowerCase().includes(animeSearch.toLowerCase())).map(g => {
                  const count = dynamicSlots.filter(s => s.group === g.id).length
                  if (count === 0) return null // Hide empty groups
                  const isActive = openGroup === g.id
                  return (
                    <button
                      key={g.id}
                      onClick={() => setOpenGroup(g.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex justify-between items-center ${isActive ? 'bg-[#9d4edd]/20 text-[#9d4edd]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      <span className="truncate mr-2">{g.label.replace('Karakter — ', '')}</span>
                      <span className="opacity-40 flex-shrink-0">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 3. K-POP DROPDOWN */}
          <div className="relative group/kpop">
            <button className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${openGroup.startsWith('kpop') ? 'bg-[#00b4d8] border-[#00b4d8] text-white shadow-lg shadow-cyan-500/20' : 'bg-white/5 border-white/10 text-gray-400 hover:border-[#00b4d8]/50'
              }`}>
              🎵 K-pop Groups
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/kpop:opacity-100 group-hover/kpop:visible transition-all z-50 p-2 space-y-1">
              <div className="p-2 border-b border-white/5 mb-2">
                <input
                  type="text"
                  placeholder="Cari Idol Group..."
                  value={kpopSearch}
                  onChange={(e) => setKpopSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white placeholder-gray-600 focus:outline-none focus:border-[#00b4d8]/50 transition-all"
                />
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {/* Fixed Layout Menus at Top */}
                {dynamicGroups.filter(g => g.id === 'kpop-sidebar-layout' || g.id === 'kpop-all-covers').map(g => (
                  <button
                    key={g.id}
                    onClick={() => setOpenGroup(g.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex justify-between items-center mb-1 border ${openGroup === g.id ? 'bg-[#00b4d8]/20 border-[#00b4d8]/50 text-[#00b4d8]' : 'text-amber-500 border-amber-500/20 hover:bg-white/5'
                      }`}
                  >
                    <span>✨ {g.label.replace('🎵 K-pop — ', '')}</span>
                  </button>
                ))}

                {dynamicGroups.filter(g => g.id.startsWith('kpop') && g.id !== 'kpop-sidebar-layout' && g.id !== 'kpop-all-covers' && g.label.toLowerCase().includes(kpopSearch.toLowerCase())).map(g => {
                  const count = dynamicSlots.filter(s => s.group === g.id).length
                  if (count === 0) return null // Hide empty groups
                  const isActive = openGroup === g.id
                  return (
                    <button
                      key={g.id}
                      onClick={() => setOpenGroup(g.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex justify-between items-center ${isActive ? 'bg-[#00b4d8]/20 text-[#00b4d8]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      <span className="truncate mr-2">{g.label.replace('K-pop — ', '').replace('K-POP', '')}</span>
                      <span className="opacity-40 flex-shrink-0">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 4. DECOR DROPDOWN */}
          <div className="relative group/decor">
            <button className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${openGroup.startsWith('decor') ? 'bg-[#ff006e] border-[#ff006e] text-white shadow-lg shadow-pink-500/20' : 'bg-white/5 border-white/10 text-gray-400 hover:border-[#ff006e]/50'
              }`}>
              🖼 Decor Categories
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/decor:opacity-100 group-hover/decor:visible transition-all z-50 p-2 space-y-1">
              {/* Fixed Layout Menus at Top */}
              {dynamicGroups.filter(g => g.id === 'decor-sidebar-layout' || g.id === 'decor-all-covers').map(g => (
                <button
                  key={g.id}
                  onClick={() => setOpenGroup(g.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex justify-between items-center mb-1 border ${openGroup === g.id ? 'bg-[#ff006e]/20 border-[#ff006e]/50 text-[#ff006e]' : 'text-amber-500 border-amber-500/20 hover:bg-white/5'
                    }`}
                >
                  <span>✨ {g.label.replace('🖼 Decor — ', '')}</span>
                </button>
              ))}

              {dynamicGroups.filter(g => g.id === 'decor').map(g => {
                const isActive = openGroup === g.id
                return (
                  <button
                    key={g.id}
                    onClick={() => setOpenGroup(g.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex justify-between items-center ${isActive ? 'bg-[#ff006e]/20 text-[#ff006e]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <span className="truncate mr-2">Default Categories</span>
                    <span className="opacity-40 flex-shrink-0">{dynamicSlots.filter(s => s.group === 'decor').length}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="bg-white/5 rounded-3xl p-8 border border-white/5 min-h-[400px]">
          {dynamicGroups.map(group => openGroup === group.id && (
            <div key={group.id} className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-3">
                  <span className="w-2 h-8 bg-gradient-to-b from-[#9d4edd] to-[#00b4d8] rounded-full"></span>
                  {group.label}
                </h2>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">ID: {group.id}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {dynamicSlots.filter(s => s.group === group.id).map(slot => (
                  <AssetSlotCard
                    key={slot.key}
                    slot={slot}
                    staged={stagedAssets[slot.key]}
                    onStage={onStage}
                    stagedAssets={stagedAssets}
                    onReset={handleResetAsset}
                    seriesList={seriesList}
                  />
                ))}
              </div>

              {dynamicSlots.filter(s => s.group === group.id).length === 0 && (
                <div className="text-center py-20 text-gray-600 italic">
                  Belum ada slot aset untuk kategori ini.
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* CROP MODAL */}
      {cropData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl border border-white/10">
            <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:justify-between md:items-center bg-zinc-900 gap-4">
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
            <div className="p-6 bg-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6">
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
                <button type="button" onClick={() => handleFinishCrop(false)} className="flex-1 md:flex-none px-6 py-2 rounded-full border border-white/20 text-white text-[10px] font-bold uppercase hover:bg-white/10">Tanpa Crop</button>
                <button type="button" onClick={() => handleFinishCrop(true)} className="flex-1 md:flex-none px-8 py-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-bold uppercase shadow-lg shadow-purple-500/20">Terapkan Crop</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOADING OVERLAY */}
      {isSaving && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute w-24 h-24 border-4 border-t-neon-purple border-r-neon-cyan border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <div className="w-16 h-16 border-4 border-b-neon-purple border-l-neon-cyan border-t-transparent border-r-transparent rounded-full animate-spin direction-reverse"></div>
          </div>
          <h3 className="text-white text-xl font-black uppercase tracking-[0.2em] mb-2 neon-text-purple">
            Memproses...
          </h3>
          <p className="text-gray-400 text-sm font-mono text-center max-w-md px-6">
            {saveStatus || 'Harap tunggu, proses ini mungkin memakan waktu beberapa saat tergantung ukuran file.'}
          </p>
        </div>
      )}

      <Footer />
    </div>
  )
}
