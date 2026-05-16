import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { hasSupabaseConfig, supabase } from './supabaseClient'
import { DEFAULT_URLS } from './assetSlots'

const SiteAssetsContext = createContext(null)

const LS_IMAGES = 'dorong_site_assets'
const LS_TEXTS  = 'dorong_site_texts'

function readLocalStorage() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(LS_IMAGES) || '{}') } catch { return {} }
}

function readLocalTexts() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(LS_TEXTS) || '{}') } catch { return {} }
}

export function SiteAssetsProvider({ children }) {
  const [assets, setAssets] = useState({})
  const [texts, setTexts] = useState({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // 1. Load localStorage instantly (instant, no flicker)
    const localData  = readLocalStorage()
    const localTexts = readLocalTexts()
    setAssets(localData)
    setTexts(localTexts)

    if (!hasSupabaseConfig || !supabase) { setLoaded(true); return }

    let cancelled = false

    async function loadFromSupabase() {
      // ── Step A: load images (safe — only well-known columns) ──
      const { data: imgData, error: imgErr } = await supabase
        .from('site_assets')
        .select('key, image_url')

      if (cancelled) return

      if (!imgErr && imgData && imgData.length > 0) {
        const imgMap = { ...localData }
        imgData.forEach(row => { if (row.image_url) imgMap[row.key] = row.image_url })
        if (!cancelled) setAssets(imgMap)
      }
      // If imgErr → we already have localStorage data, that's fine

      // ── Step B: try to load text_value (column may not exist yet) ──
      const { data: txtData, error: txtErr } = await supabase
        .from('site_assets')
        .select('key, text_value')

      if (cancelled) return

      if (!txtErr && txtData && txtData.length > 0) {
        const txtMap = { ...localTexts }
        txtData.forEach(row => { if (row.text_value) txtMap[row.key] = row.text_value })
        if (!cancelled) setTexts(txtMap)
      }
      // If txtErr (column not found) → silently ignore, use localStorage texts

      if (!cancelled) setLoaded(true)
    }

    loadFromSupabase()
    return () => { cancelled = true }
  }, [])

  const getUrl = useCallback(
    (key) => assets[key] || DEFAULT_URLS[key] || '',
    [assets]
  )

  const getText = useCallback(
    (key, defaultLabel = '') => texts[key] || defaultLabel,
    [texts]
  )

  const updateAsset = useCallback((key, imageUrl) => {
    setAssets(prev => {
      const next = { ...prev, [key]: imageUrl }
      try { localStorage.setItem(LS_IMAGES, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const updateText = useCallback((key, value) => {
    setTexts(prev => {
      const next = { ...prev, [key]: value }
      try { localStorage.setItem(LS_TEXTS, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ assets, texts, loaded, getUrl, getText, updateAsset, updateText }),
    [assets, texts, loaded, getUrl, getText, updateAsset, updateText]
  )

  return (
    <SiteAssetsContext.Provider value={value}>
      {children}
    </SiteAssetsContext.Provider>
  )
}

export function useSiteAssets() {
  const context = useContext(SiteAssetsContext)
  if (!context) {
    const localImages = readLocalStorage()
    const localTexts  = readLocalTexts()
    return {
      assets: localImages,
      texts: localTexts,
      getUrl:      (key)           => localImages[key] || DEFAULT_URLS[key] || '',
      getText:     (key, def = '') => localTexts[key]  || def,
      updateAsset: () => {},
      updateText:  () => {},
      loaded: true
    }
  }
  return context
}
