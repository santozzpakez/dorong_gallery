import Header from '../../components/Header'
import Link from 'next/link'
import Footer from '../../components/Footer'
import { useEffect, useMemo, useRef, useState } from 'react'
import { hasSupabaseConfig, supabase } from '../../lib/supabaseClient'

import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'next/router'
import { useSiteAssets } from '../../lib/siteAssets'
import { motion, AnimatePresence } from 'framer-motion'



const STORAGE_TYPES = 'dorong_admin_type_options'
const STORAGE_CHARS = 'dorong_admin_characters_by_type'

const defaultTypes = {
  anime: [],
  kpop: [],
  aesthetic: []
}

/** Karakter / member / item tergantung pilihan "jenis" di atas (mis. One Piece → Zoro) */
const defaultCharactersByType = {
  anime: {},
  kpop: {},
  aesthetic: {}
}

// Palette warna dan kategori telah disederhanakan ke Gold Premium & Silver Premium


function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
}

function sanitizeFileName(name) {
  if (!name) return 'product-image'
  const base = name.split(/[/\\]/).pop() || 'image'
  return base.replace(/[^\w\.-]+/g, '_').replace(/_+/g, '_').slice(0, 120) || 'image'
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
    const merged = [...new Set([...(fallback[cat] || []), ...(saved[cat] || [])])]
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
      const def = fallback[cat]?.[typeName] || []
      const extra = saved[cat]?.[typeName] || []
      out[cat][typeName] = [...new Set([...def, ...extra])]
    }
  }
  return out
}

export default function Admin() {
  const router = useRouter()
  const { user, loading, adminRole, token } = useAuth()
  const { loaded, getText, updateText } = useSiteAssets()
  const [priceF4Original, setPriceF4Original] = useState('')
  const [priceF4Discount, setPriceF4Discount] = useState('')
  const [dimF4, setDimF4] = useState('')
  const [priceA3Original, setPriceA3Original] = useState('')
  const [priceA3Discount, setPriceA3Discount] = useState('')
  const [dimA3, setDimA3] = useState('')
  const [priceA3PlusOriginal, setPriceA3PlusOriginal] = useState('')
  const [priceA3PlusDiscount, setPriceA3PlusDiscount] = useState('')
  const [dimA3Plus, setDimA3Plus] = useState('')
  const [isSavingPricing, setIsSavingPricing] = useState(false)

  useEffect(() => {
    if (loaded) {
      setPriceF4Original(getText('size_price_f4_original', '125000'))
      setPriceF4Discount(getText('size_price_f4_discount', '99000'))
      setDimF4(getText('size_dimension_f4', '21 x 33 cm'))
      
      setPriceA3Original(getText('size_price_a3_original', '165000'))
      setPriceA3Discount(getText('size_price_a3_discount', '139000'))
      setDimA3(getText('size_dimension_a3', '30 x 42 cm'))
      
      setPriceA3PlusOriginal(getText('size_price_a3plus_original', '225000'))
      setPriceA3PlusDiscount(getText('size_price_a3plus_discount', '189000'))
      setDimA3Plus(getText('size_dimension_a3plus', '32 x 48 cm'))
    }
  }, [loaded])

  // Auto-cleanup custom images older than 3 days
  useEffect(() => {
    async function cleanupOldCustomImages() {
      if (!hasSupabaseConfig || !supabase) return
      try {
        const { data, error } = await supabase.storage
          .from('product-images')
          .list('products', {
            limit: 100,
            sortBy: { column: 'created_at', order: 'asc' }
          })
          
        if (error) throw error
        if (!data || data.length === 0) return

        const now = Date.now()
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000 // 3 days
        
        const filesToDelete = data
          .filter(file => {
            if (!file.name.startsWith('custom-')) return false
            const createdAt = file.created_at ? new Date(file.created_at).getTime() : now
            return (now - createdAt) > THREE_DAYS_MS
          })
          .map(file => `products/${file.name}`)
          
        if (filesToDelete.length > 0) {
          console.log("Cleaning up old custom images:", filesToDelete)
          const { error: removeError } = await supabase.storage
            .from('product-images')
            .remove(filesToDelete)
            
          if (removeError) {
            console.error("Error removing old custom files:", removeError)
          } else {
            console.log("Successfully removed old custom files:", filesToDelete.length)
          }
        }
      } catch (err) {
        console.error("Failed to clean up old custom images:", err)
      }
    }
    
    const timer = setTimeout(cleanupOldCustomImages, 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleSavePricing = async (e) => {
    e?.preventDefault()
    if (!hasSupabaseConfig || !supabase) {
      alert('Supabase belum terkonfigurasi.')
      return
    }

    setIsSavingPricing(true)
    setStatusMessage('Menyimpan konfigurasi harga & dimensi...')

    try {
      const updates = [
        { key: 'size_price_f4_original', text_value: priceF4Original.toString().trim(), label: 'Harga Original F4', category: 'pricing', updated_at: new Date().toISOString() },
        { key: 'size_price_f4_discount', text_value: priceF4Discount.toString().trim(), label: 'Harga Diskon F4', category: 'pricing', updated_at: new Date().toISOString() },
        { key: 'size_dimension_f4', text_value: dimF4.toString().trim(), label: 'Dimensi F4', category: 'pricing', updated_at: new Date().toISOString() },
        
        { key: 'size_price_a3_original', text_value: priceA3Original.toString().trim(), label: 'Harga Original A3', category: 'pricing', updated_at: new Date().toISOString() },
        { key: 'size_price_a3_discount', text_value: priceA3Discount.toString().trim(), label: 'Harga Diskon A3', category: 'pricing', updated_at: new Date().toISOString() },
        { key: 'size_dimension_a3', text_value: dimA3.toString().trim(), label: 'Dimensi A3', category: 'pricing', updated_at: new Date().toISOString() },
        
        { key: 'size_price_a3plus_original', text_value: priceA3PlusOriginal.toString().trim(), label: 'Harga Original A3+', category: 'pricing', updated_at: new Date().toISOString() },
        { key: 'size_price_a3plus_discount', text_value: priceA3PlusDiscount.toString().trim(), label: 'Harga Diskon A3+', category: 'pricing', updated_at: new Date().toISOString() },
        { key: 'size_dimension_a3plus', text_value: dimA3Plus.toString().trim(), label: 'Dimensi A3+', category: 'pricing', updated_at: new Date().toISOString() }
      ]

      const { error } = await supabase.from('site_assets').upsert(updates, { onConflict: 'key' }).select()
      if (error) throw error

      updates.forEach(up => updateText(up.key, up.text_value))

      setStatusMessage('Berhasil menyimpan konfigurasi harga & dimensi! ✓')
      alert('Konfigurasi harga dan dimensi berhasil disimpan!')
    } catch (err) {
      console.error(err)
      setStatusMessage(`Gagal menyimpan harga: ${err.message}`)
      alert(`Gagal menyimpan harga: ${err.message}`)
    } finally {
      setIsSavingPricing(false)
    }
  }

  const [activeTab, setActiveTab] = useState('products') // 'products', 'content', 'admins', 'pricing'
  const [adminList, setAdminList] = useState([])
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [newAdminRole, setNewAdminRole] = useState('regular')
  const [imagePreview, setImagePreview] = useState('')
  
  // UI Toggles for step 2 & 3
  const [showSearchType, setShowSearchType] = useState(false)
  const [showAddType, setShowAddType] = useState(false)
  const [showSearchChar, setShowSearchChar] = useState(false)
  const [showAddChar, setShowAddChar] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  
  // Crop state
  const [cropData, setCropData] = useState(null) // { url, file }
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [cropAspect, setCropAspect] = useState(3/4)
  const [savedProducts, setSavedProducts] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingCategories, setIsSavingCategories] = useState(false)
  const [isSavingLists, setIsSavingLists] = useState(false)
  const [saveListProgress, setSaveListProgress] = useState(0)
  const [saveListTotal, setSaveListTotal] = useState(0)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')
  const [newTypeName, setNewTypeName] = useState('')
  const [newCharacterName, setNewCharacterName] = useState('')
  const [typeOptions, setTypeOptions] = useState(defaultTypes)
  const [charactersByType, setCharactersByType] = useState(defaultCharactersByType)
  const [listsReady, setListsReady] = useState(false)
  const hasLoadedFromDb = useRef(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentFolder, setCurrentFolder] = useState([])

  // Security Verification Modal State
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [securityEmail, setSecurityEmail] = useState('')
  const [securityPassword, setSecurityPassword] = useState('')
  const [securityError, setSecurityError] = useState('')
  const [securityCallback, setSecurityCallback] = useState(null)
  const [isVerifyingSuperior, setIsVerifyingSuperior] = useState(false)

  // Promo Popup State
  const [promoActive, setPromoActive] = useState(false)
  const [promoImageUrl, setPromoImageUrl] = useState('')
  const [promoRedirectUrl, setPromoRedirectUrl] = useState('')
  const [promoImageFile, setPromoImageFile] = useState(null)
  const [promoImagePreview, setPromoImagePreview] = useState('')
  const [isSavingPromo, setIsSavingPromo] = useState(false)
  const [promoMode, setPromoMode] = useState('always') // 'always' | 'scheduled'
  const [promoStartDate, setPromoStartDate] = useState('')
  const [promoEndDate, setPromoEndDate] = useState('')

  const verifySuperior = async (e) => {
    e?.preventDefault()
    if (isVerifyingSuperior) return
    
    const email = securityEmail.trim().toLowerCase()
    const password = securityPassword
    
    setSecurityError('')
    setIsVerifyingSuperior(true)
    
    try {
      // 1. Cek cepat: Apakah email ini terdaftar sebagai superior?
      const { data: adminData, error: adminErr } = await supabase
        .from('site_admins')
        .select('role')
        .eq('email', email)
        .maybeSingle()
        
      if (adminErr || !adminData || adminData.role !== 'superior') {
        setSecurityError('Email tersebut bukan Superior Admin!')
        setSecurityPassword('')
        return
      }

      // 2. Cek password via Supabase Auth (Jalur Cepat)
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (authErr) {
        if (authErr.status === 400) {
          setSecurityError('Password yang kamu masukkan salah.')
        } else {
          setSecurityError(authErr.message)
        }
        setSecurityPassword('')
        return
      }

      // 3. Jika berhasil, jalankan aksi yang tertunda
      if (securityCallback) {
        await securityCallback()
      }
      
      // Reset & Close
      setShowSecurityModal(false)
      setSecurityEmail('')
      setSecurityPassword('')
      setSecurityError('')
      setSecurityCallback(null)
    } catch (err) {
      setSecurityError('Terjadi gangguan koneksi. Coba lagi.')
    } finally {
      setIsVerifyingSuperior(false)
    }
  }



  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  // Close success modal on any key press
  useEffect(() => {
    if (!showSuccessModal) return
    const handleKey = () => setShowSuccessModal(false)
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showSuccessModal])

  const triggerSecurityCheck = (callback) => {
    setSecurityCallback(() => callback)
    setShowSecurityModal(true)
  }

  const [searchType, setSearchType] = useState('')
  const [searchChar, setSearchChar] = useState('')
  const [uploadMode, setUploadMode] = useState('single')
  const [batchFiles, setBatchFiles] = useState([])
  const [batchTitles, setBatchTitles] = useState([])
  const [batchPreviews, setBatchPreviews] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [totalBatchImages, setTotalBatchImages] = useState(0)
  // Rename & delete state for tags
  const [renamingType, setRenamingType] = useState(null)   // { name: string } | null
  const [renameTypeVal, setRenameTypeVal] = useState('')
  const [renamingChar, setRenamingChar] = useState(null)   // { name: string } | null
  const [renameCharVal, setRenameCharVal] = useState('')

  const [form, setForm] = useState({
    title: '',
    price: '',
    category: 'anime',
    typeName: defaultTypes.anime?.[0] || '',
    characterName: defaultCharactersByType.anime?.[defaultTypes.anime?.[0]]?.[0] || '',
    notes: '✨ Premium Collectible Metal Prints - LUMI FORGE Exclusive ✨\n\nDibuat dengan teknologi Sublimation High Press tercanggih untuk hasil warna yang super vibrant dan detail ultra-tajam. Material berkualitas tinggi yang anti-luntur, tahan lama, dan memberikan kesan mewah yang elegan di setiap sudut ruanganmu. Pilihan terbaik untuk dekorasi kelas dunia!'
  })

  const labels = useMemo(() => {
    if (form.category === 'anime') {
      return { step1: 'Judul anime / series', step2: 'Karakter', addType: 'Tambah judul anime baru', addChar: 'Tambah nama karakter baru' }
    }
    if (form.category === 'kpop') {
      return { step1: 'Grup K-pop', step2: 'Member', addType: 'Tambah grup baru', addChar: 'Tambah member baru' }
    }
    if (form.category === 'aesthetic') {
      return { step1: 'Tema Aesthetic', step2: null, addType: 'Tambah tema baru', addChar: null }
    }
    return { step1: 'Jenis Produk', step2: 'Varian / Nama', addType: 'Tambah jenis', addChar: 'Tambah varian' }
  }, [form.category])

  const activeTypeOptions = useMemo(() => typeOptions[form.category] || [], [typeOptions, form.category])

  const activeCharacterOptions = useMemo(() => {
    if (form.category === 'custom' || form.category === 'other') return []
    const byCat = charactersByType[form.category] || {}
    return byCat[form.typeName] || []
  }, [charactersByType, form.category, form.typeName])

  useEffect(() => {
    async function initCategories() {
      try {
        // 1. Langsung fetch dari Supabase (BUKAN dari cache getText)
        //    agar selalu dapat data terbaru baik saat F5 maupun client-side navigation
        let globalTypes = {}
        let globalChars = {}

        if (hasSupabaseConfig && supabase) {
          try {
            const { data: cacheData } = await supabase
              .from('site_assets')
              .select('key, text_value')
              .in('key', ['global-category-options', 'global-character-options'])

            if (cacheData) {
              cacheData.forEach(row => {
                if (row.key === 'global-category-options' && row.text_value) {
                  try { globalTypes = JSON.parse(row.text_value) } catch {}
                }
                if (row.key === 'global-character-options' && row.text_value) {
                  try { globalChars = JSON.parse(row.text_value) } catch {}
                }
              })
            }
          } catch (e) {
            console.error('Failed to fetch global cache from Supabase:', e)
          }
        }

        // Fallback ke getText jika Supabase gagal
        if (Object.keys(globalTypes).length === 0) {
          try {
            const rawTypes = getText('global-category-options')
            if (rawTypes) globalTypes = JSON.parse(rawTypes)
          } catch {}
        }
        if (Object.keys(globalChars).length === 0) {
          try {
            const rawChars = getText('global-character-options')
            if (rawChars) globalChars = JSON.parse(rawChars)
          } catch {}
        }

        // Abaikan localStorage yang sering nyangkut (ghost data), jadikan Supabase (globalTypes) sebagai SATU-SATUNYA base source
        let types = mergeTypes(Object.keys(globalTypes).length > 0 ? globalTypes : defaultTypes, defaultTypes)
        let chars = mergeCharsByType(Object.keys(globalChars).length > 0 ? globalChars : defaultCharactersByType, defaultCharactersByType)

        // 2. Fetch all products to find existing categories/subcategories
        if (hasSupabaseConfig && supabase) {
          try {

            const { data, error } = await supabase.from('products').select('category, subcategory')
            if (!error && data) {
              data.forEach(p => {
                const cat = p.category
                const sub = p.subcategory || ''
                if (!cat || !sub) return

                // Add to typeOptions (Series/Group/Theme)
                let typeName = ''
                let charName = ''

                if (cat === 'anime' || cat === 'kpop') {
                  const parts = sub.split(' - ')
                  typeName = parts[0].trim()
                  charName = parts[1]?.trim() || ''
                } else if (cat === 'aesthetic') {
                  typeName = sub.trim()
                }

                if (typeName && typeName !== '-') {
                  if (!types[cat]) types[cat] = []
                  if (!types[cat].includes(typeName)) {
                    types[cat].push(typeName)
                  }

                  // Add to charactersByType
                  if (charName && charName !== '-') {
                    if (!chars[cat]) chars[cat] = {}
                    if (!chars[cat][typeName]) chars[cat][typeName] = []
                    if (!chars[cat][typeName].includes(charName)) {
                      chars[cat][typeName].push(charName)
                    }
                  }
                }
              })
            }
          } catch (err) {
            console.error('Failed to sync categories from DB:', err)
          }

          // 2b. Scan Site Assets untuk cover yang sudah diupload (kpop-group-*, aesthetic-*, anime-cover-*)
          try {
            const { data: assetData } = await supabase.from('site_assets').select('key, label').or('key.like.kpop-group-%,key.like.kpop-%,key.like.aesthetic-%,key.like.anime-cover-%')
            if (assetData) {
              const normalize = (name) => {
                if (!name) return ''
                const clean = name.replace(/^cover\s*[—\-]?\s*/i, '').trim()
                return clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
              }
              assetData.forEach(asset => {
                const key = asset.key
                if (key.includes('sidebar') || key.includes('slot')) return
                let cat = null, typeName = ''
                if (key.startsWith('kpop-group-') || (key.startsWith('kpop-') && !key.includes('sidebar') && !key.includes('slot'))) {
                  cat = 'kpop'
                  const rawName = asset.label || key.replace('kpop-group-', '').replace('kpop-', '').replace(/-/g, ' ')
                  typeName = normalize(rawName)
                } else if (key.startsWith('aesthetic-')) {
                  cat = 'aesthetic'
                  const rawName = asset.label || key.replace('aesthetic-', '').replace(/-/g, ' ')
                  typeName = normalize(rawName)
                } else if (key.startsWith('anime-cover-')) {
                  cat = 'anime'
                  const rawName = asset.label || key.replace('anime-cover-', '').replace(/-/g, ' ')
                  typeName = normalize(rawName)
                }
                if (cat && typeName) {
                  if (!types[cat]) types[cat] = []
                  if (!types[cat].includes(typeName)) {
                    types[cat].push(typeName)
                  }
                }
              })
            }
          } catch (err) {
            console.error('Failed to scan site_assets for categories:', err)
          }
        }

        // --- 3. FINAL SANITIZATION (Bersihkan & Gabungkan semua duplikat) ---
        const finalTypes = {}
        Object.keys(types).forEach(cat => {
          const uniqueNames = new Set()
          if (Array.isArray(types[cat])) {
            types[cat].forEach(raw => {
              if (!raw || typeof raw !== 'string') return
              try {
                const clean = raw.replace(/^cover\s*[—\-]?\s*/i, '').trim()
                const formatted = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
                if (formatted) uniqueNames.add(formatted)
              } catch (err) {
                console.warn('Gagal membersihkan kategori:', raw, err)
              }
            })
          }
          finalTypes[cat] = Array.from(uniqueNames).sort()
        })

        const finalChars = {}
        Object.keys(chars).forEach(cat => {
          finalChars[cat] = {}
          const catObj = chars[cat] || {}
          Object.keys(catObj).forEach(rawKey => {
            const clean = rawKey.replace(/^cover\s*[—\-]?\s*/i, '').trim()
            const formattedKey = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
            
            const list = catObj[rawKey] || []
            const cleanList = list.map(item => {
              if (!item || typeof item !== 'string') return ''
              return item.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ').trim()
            }).filter(Boolean)
            
            if (formattedKey) {
              const existing = finalChars[cat][formattedKey] || []
              finalChars[cat][formattedKey] = [...new Set([...existing, ...cleanList])].sort()
            }
          })
        })

        setTypeOptions(finalTypes)
        setCharactersByType(finalChars)

        const firstType = finalTypes.anime?.[0] || 'One Piece'
        const firstChar = chars.anime?.[firstType]?.[0] || ''
        setForm((prev) => ({
          ...prev,
          typeName: firstType,
          characterName: firstChar
        }))
      } catch (globalErr) {
        console.error('Fatal error in initCategories:', globalErr)
      } finally {
        hasLoadedFromDb.current = true
        setListsReady(true)
      }
    }

    initCategories()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!listsReady || !hasLoadedFromDb.current || typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_TYPES, JSON.stringify(typeOptions))
    window.localStorage.setItem(STORAGE_CHARS, JSON.stringify(charactersByType))
  }, [typeOptions, charactersByType, listsReady])

  async function handleManualSaveLists() {
    if (!hasSupabaseConfig || !supabase || !adminRole) {
      alert('Gagal: Supabase tidak terhubung atau Anda bukan admin.')
      return
    }

    setIsSavingLists(true)
    setSaveListTotal(100)
    setSaveListProgress(10)
    setStatusMessage('Menyimpan ke Database...')

    try {
      const typeStr = JSON.stringify(typeOptions)
      const charStr = JSON.stringify(charactersByType)

      setSaveListProgress(30)

      // Gunakan token level komponen secara langsung demi menghindari supabase.auth.getSession() gantung
      setSaveListProgress(50)

      // 2. Kirim data ke API server-side demi keandalan 100% (bebas dari isu CORS/RLS di client)
      const res = await fetch('/api/sync-theme-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          dbUpdates: [
            {
              key: 'global-category-options',
              text_value: typeStr,
              label: 'Global Category List Cache',
              category: 'system',
              updated_at: new Date().toISOString()
            },
            {
              key: 'global-character-options',
              text_value: charStr,
              label: 'Global Character List Cache',
              category: 'system',
              updated_at: new Date().toISOString()
            }
          ]
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Server DB sync failed')
      }

      setSaveListProgress(80)

      // 3. Sinkronisasi local state
      updateText('global-category-options', typeStr)
      updateText('global-character-options', charStr)

      setSaveListProgress(100)
      setStatusMessage('✅ Daftar tipe dan karakter berhasil disimpan ke database!')
      
      alert('✅ Daftar tipe dan karakter berhasil disimpan ke database! Halaman akan dimuat ulang.')
      
      // Auto-reload/refresh page agar data segar termuat sempurna
      window.location.reload()
    } catch (err) {
      console.error('Manual save error:', err)
      alert(`Gagal menyimpan daftar: ${err.message || 'Unknown error'}`)
      setStatusMessage(`❌ Gagal menyimpan: ${err.message || 'Unknown error'}`)
    } finally {
      setIsSavingLists(false)
      setSaveListTotal(0)
      setSaveListProgress(0)
    }
  }

  useEffect(() => {
    // Tunggu sampai status login & role benar-benar selesai dimuat
    if (loading) return
    
    // Proteksi Admin: Jika loading selesai dan tetap tidak ada role, berarti bukan admin
    if (!adminRole) {
      router.push('/')
      return
    }

    // Jika Superior, ambil daftar admin
    if (adminRole === 'superior') {
      fetchAdmins()
    }
  }, [user, adminRole, loading])

  // Load Promo Popup Settings
  useEffect(() => {
    async function loadPromoSettings() {
      if (!hasSupabaseConfig || !supabase) return
      const { data } = await supabase.from('site_assets').select('text_value').eq('key', 'promo-popup-settings').single()
      if (data?.text_value) {
        try {
          const settings = JSON.parse(data.text_value)
          setPromoActive(!!settings.isActive)
          setPromoImageUrl(settings.imageUrl || '')
          setPromoRedirectUrl(settings.redirectUrl || '')
          setPromoImagePreview(settings.imageUrl || '')
          setPromoMode(settings.mode || 'always')
          setPromoStartDate(settings.startDate || '')
          setPromoEndDate(settings.endDate || '')
        } catch {}
      }
    }
    loadPromoSettings()
  }, [])

  async function handleSavePromo(e) {
    e?.preventDefault()
    if (isSavingPromo) return
    setIsSavingPromo(true)
    try {
      let finalImageUrl = promoImageUrl
      
      // If there's a new file to upload
      if (promoImageFile) {
        const safeName = sanitizeFileName(promoImageFile.name)
        const ext = promoImageFile.name.split('.').pop() || 'jpg'
        const filePath = `promos/${Date.now()}-${safeName}.${ext}`
        
        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(filePath, promoImageFile, {
            upsert: true,
            contentType: promoImageFile.type || 'image/jpeg',
            cacheControl: '31536000'
          })
        
        if (uploadErr) throw new Error(uploadErr.message)
        finalImageUrl = supabase.storage.from('product-images').getPublicUrl(filePath).data.publicUrl
      }
      
      const settings = JSON.stringify({
        isActive: promoActive,
        imageUrl: finalImageUrl,
        redirectUrl: promoRedirectUrl,
        mode: promoMode,
        startDate: promoMode === 'scheduled' ? promoStartDate : '',
        endDate: promoMode === 'scheduled' ? promoEndDate : ''
      })
      
      const { error } = await supabase.from('site_assets').upsert({
        key: 'promo-popup-settings',
        label: 'Promo Popup Settings',
        category: 'settings',
        image_url: finalImageUrl || '',
        text_value: settings
      }, { onConflict: 'key' })
      
      if (error) throw error
      
      setPromoImageUrl(finalImageUrl)
      setPromoImagePreview(finalImageUrl)
      setPromoImageFile(null)
      alert('✅ Pengaturan Promo Popup berhasil disimpan!')
    } catch (err) {
      alert(`❌ Gagal menyimpan: ${err.message}`)
    } finally {
      setIsSavingPromo(false)
    }
  }

  const [whatsappContacts, setWhatsappContacts] = useState([])
  const [newWaName, setNewWaName] = useState('')
  const [newWaPhone, setNewWaPhone] = useState('')



  const fetchAdmins = async () => {
    const { data } = await supabase.from('site_admins').select('*').order('created_at', { ascending: false })
    setAdminList(data || [])
    
    // Juga fetch nomor whatsapp
    try {
      const { data: waData, error: waErr } = await supabase.from('whatsapp_contacts').select('*').order('created_at', { ascending: true })
      if (!waErr && waData && waData.length > 0) {
        setWhatsappContacts(waData)
      } else {
        // Fallback agar admin bisa melihat nomor default yang aktif saat ini
        setWhatsappContacts([
          { id: 'default-1', name: 'Admin Utama', phone: '491633949013', isDefault: true },
          { id: 'default-2', name: 'Admin Kedua', phone: '6285183050120', isDefault: true }
        ])
      }
    } catch (err) {
      setWhatsappContacts([
        { id: 'default-1', name: 'Admin Utama', phone: '491633949013', isDefault: true },
        { id: 'default-2', name: 'Admin Kedua', phone: '6285183050120', isDefault: true }
      ])
    }
  }

  const handleAddAdmin = async (e) => {
    e.preventDefault()
    if (!newAdminEmail || !newAdminPassword) {
      alert("Email dan Password wajib diisi!")
      return
    }

    try {
      const res = await fetch('/api/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newAdminEmail,
          password: newAdminPassword,
          role: newAdminRole
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat menambahkan admin')
      }

      setNewAdminEmail('')
      setNewAdminPassword('')
      fetchAdmins()
      alert("Admin berhasil ditambahkan!")
    } catch (error) {
      alert(error.message)
    }
  }

  const handleAddWhatsapp = async (e) => {
    e.preventDefault()
    if (!newWaName || !newWaPhone) return
    const { error } = await supabase.from('whatsapp_contacts').insert([{ name: newWaName, phone: newWaPhone.replace(/\D/g, '') }])
    if (error) {
      alert(error.message)
    } else {
      setNewWaName('')
      setNewWaPhone('')
      fetchAdmins()
    }
  }

  const handleDeleteWhatsapp = async (id) => {
    triggerSecurityCheck(async () => {
      const { error } = await supabase.from('whatsapp_contacts').delete().eq('id', id)
      if (error) alert(error.message)
      else fetchAdmins()
    })
  }

  const handleDeleteAdmin = async (adm) => {
    if (adm.email === user.email) return alert('Tidak bisa menghapus diri sendiri!')
    
    // Cek jika ini superior terakhir
    if (adm.role === 'superior') {
      const superiorCount = adminList.filter(a => a.role === 'superior').length
      if (superiorCount <= 1) {
        alert('❌ Error: Harus ada minimal 1 Superior Admin yang tersisa!')
        return
      }
    }

    triggerSecurityCheck(async () => {
      const { error } = await supabase.from('site_admins').delete().eq('email', adm.email)
      if (error) alert(error.message)
      else fetchAdmins()
    })
  }

  useEffect(() => {
    let ignore = false
    async function loadProducts() {
      if (!hasSupabaseConfig) {
        setStatusMessage('Supabase belum dikonfigurasi. Isi .env.local untuk mulai simpan product.')
        setIsLoadingProducts(false)
        return
      }
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (ignore) return
      if (error) {
        setStatusMessage(`Gagal ambil data product: ${error.message}. Pastikan table "products" sudah dibuat (jalankan SQL di supabase/setup-products.sql).`)
      } else {
        setSavedProducts(data || [])
      }
      setIsLoadingProducts(false)
    }
    loadProducts()
    return () => {
      ignore = true
    }
  }, [])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function pickFirstCharacter(cat, typeName) {
    const list = charactersByType[cat]?.[typeName] || []
    return list[0] || ''
  }

  function handleCategoryChange(value) {
    const nextType = typeOptions[value]?.[0] || ''
    const nextChar =
      value === 'custom' || value === 'other' ? '' : pickFirstCharacter(value, nextType)
    setForm((prev) => ({
      ...prev,
      category: value,
      typeName: nextType,
      characterName: nextChar
    }))
  }

  function handleTypeNameChange(value) {
    const nextChar = pickFirstCharacter(form.category, value)
    setForm((prev) => ({ ...prev, typeName: value, characterName: nextChar }))
  }

  function addNewType() {
    const typed = newTypeName.trim()
    if (!typed || form.category === 'custom' || form.category === 'other') return
    const clean = typed.replace(/^cover\s*[—\-]?\s*/i, '').trim()
    const formatted = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    if (!formatted) return

    setTypeOptions((prev) => {
      const current = prev[form.category] || []
      if (current.includes(formatted)) return prev
      return { ...prev, [form.category]: [...current, formatted].sort() }
    })
    setCharactersByType((prev) => ({
      ...prev,
      [form.category]: { ...(prev[form.category] || {}), [formatted]: prev[form.category]?.[formatted] || [] }
    }))
    setForm((prev) => ({ ...prev, typeName: formatted, characterName: '' }))
    setNewTypeName('')
    setStatusMessage(`"${formatted}" ditambahkan. Tambahkan karakter di bawah jika belum ada.`)
  }

  function addNewCharacter() {
    const typed = newCharacterName.trim()
    if (!typed || form.category === 'custom' || form.category === 'other') return
    const cat = form.category
    const typeName = form.typeName

    // Deteksi pemisah koma (,) atau baris baru (\n) untuk mendukung penambahan sekali banyak (bulk)
    const separator = typed.includes('\n') ? '\n' : (typed.includes(',') ? ',' : null);
    let rawNames = [];
    if (separator) {
      rawNames = typed.split(separator).map(n => n.trim()).filter(Boolean);
    } else {
      rawNames = [typed];
    }

    const formattedNames = rawNames.map(name => {
      return name.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    });

    if (formattedNames.length === 0) return;

    setCharactersByType((prev) => {
      const catMap = { ...(prev[cat] || {}) }
      const current = catMap[typeName] || []
      const merged = [...new Set([...current, ...formattedNames])].sort();
      catMap[typeName] = merged
      return { ...prev, [cat]: catMap }
    })

    const lastChar = formattedNames[formattedNames.length - 1];
    setForm((prev) => ({ ...prev, characterName: lastChar }))
    setNewCharacterName('')

    if (formattedNames.length > 1) {
      setStatusMessage(`${formattedNames.length} karakter berhasil ditambahkan untuk ${form.typeName}.`)
    } else {
      setStatusMessage(`Karakter "${lastChar}" ditambahkan untuk ${form.typeName}.`)
    }
  }

  // ── Rename / Delete Type (Series / Grup) ──
  async function commitRenameType() {
    alert('Fungsi SIMPAN terpanggil!');
    try {
      const oldName = renamingType?.name
      const newName = renameTypeVal.trim()
      alert(`Nama Lama: "${oldName}", Nama Baru: "${newName}"`);
      
      if (!oldName || !newName || newName === oldName) {
        alert('Batal karena nama kosong atau sama dengan yang lama.');
        setRenamingType(null);
        return;
      }

      const cat = form.category
      const oldSlug = oldName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      const newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      const assetPrefix = cat === 'anime' ? 'anime-cover-' : cat === 'kpop' ? 'kpop-' : 'aesthetic-'
      
      setStatusMessage(`Sedang memigrasi data dari "${oldName}" ke "${newName}"...`)

      // 1. Update Database (Products) - Agar produk tetap muncul di series baru
      if (hasSupabaseConfig && supabase) {
        alert('Menyambungkan ke database Supabase...');
        try {
          // Cari semua produk yang subcategory-nya diawali dengan oldName
          const { data: prods, error: selectErr } = await supabase.from('products')
            .select('id, subcategory')
            .eq('category', cat)
          
          if (selectErr) {
            alert(`Supabase Select Error: ${selectErr.message}`);
          }
          
          if (prods) {
            const updates = prods
              .filter(p => p.subcategory && p.subcategory.split(' - ')[0].trim() === oldName)
              .map(p => ({
                id: p.id,
                subcategory: p.subcategory.replace(oldName, newName)
              }))
            
            if (updates.length > 0) {
              alert(`Mengupdate ${updates.length} produk di database...`);
              const { error: upsertErr } = await supabase.from('products').upsert(updates).select()
              if (upsertErr) {
                alert(`Supabase Upsert Error: ${upsertErr.message}`);
              }
            }
          }

          // 2. Update Database (Site Assets / Cover) - Agar gambar tidak hilang
          const oldKey = `${assetPrefix}${oldSlug}`
          const newKey = `${assetPrefix}${newSlug}`
          
          alert(`Memeriksa cover asset: "${oldKey}"`);
          const { data: assetData, error: assetErr } = await supabase.from('site_assets').select('*').eq('key', oldKey).single()
          
          if (assetData) {
            alert(`Ditemukan cover asset. Sedang memigrasikan...`);
            const { error: delErr } = await supabase.from('site_assets').delete().eq('key', oldKey)
            if (delErr) {
              alert(`Supabase Delete Asset Error: ${delErr.message}`);
            }
            const { error: insErr } = await supabase.from('site_assets').upsert({
              ...assetData,
              key: newKey,
              label: (assetData.label || '').replace(oldName, newName)
            }).select()
            if (insErr) {
              alert(`Supabase Insert Asset Error: ${insErr.message}`);
            }
          }
        } catch (dbErr) {
          alert(`Error internal koneksi database: ${dbErr.message}`);
        }
      }

      alert('Mengupdate state lokal di browser...');
      // 3. Update Local State (Deduplicate)
      const list = typeOptions[cat] || []
      const newList = list.map(n => n === oldName ? newName : n)
      const updatedTypes = { ...typeOptions, [cat]: [...new Set(newList)] }

      const catMap = { ...(charactersByType[cat] || {}) }
      if (catMap[oldName]) {
        const existingChars = catMap[newName] || []
        const oldChars = catMap[oldName] || []
        catMap[newName] = [...new Set([...existingChars, ...oldChars])]
        delete catMap[oldName]
      }
      const updatedChars = { ...charactersByType, [cat]: catMap }

      setTypeOptions(updatedTypes)
      setCharactersByType(updatedChars)
      
      if (form.typeName === oldName) setForm(prev => ({ ...prev, typeName: newName }))
      setRenamingType(null)

      // 4. Simpan ke database secara otomatis demi keandalan 100%
      if (hasSupabaseConfig && supabase) {
        const typeStr = JSON.stringify(updatedTypes)
        const charStr = JSON.stringify(updatedChars)

        const res = await fetch('/api/sync-theme-assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({
            dbUpdates: [
              {
                key: 'global-category-options',
                text_value: typeStr,
                label: 'Global Category List Cache',
                category: 'system',
                updated_at: new Date().toISOString()
              },
              {
                key: 'global-character-options',
                text_value: charStr,
                label: 'Global Character List Cache',
                category: 'system',
                updated_at: new Date().toISOString()
              }
            ]
          })
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Server DB sync failed')
        }

        updateText('global-category-options', typeStr)
        updateText('global-character-options', charStr)
      }

      setStatusMessage(`Berhasil! "${oldName}" telah digabungkan ke "${newName}".`)
      alert(`Berhasil! "${oldName}" telah digabungkan ke "${newName}". Halaman akan dimuat ulang.`)
      window.location.reload()
    } catch (e) {
      alert(`Terjadi error di commitRenameType: ${e.message}`);
    }
  }

  async function deleteType(name) {
    const cat = form.category
    
    // Cek apakah ada produk
    const hasProducts = savedProducts.some(p => {
      if (p.category !== cat) return false
      if (!p.subcategory) return false
      const typePart = p.subcategory.split(' - ')[0].trim()
      return typePart === name
    })
    
    let deleteProds = false
    if (hasProducts) {
      if (adminRole !== 'superior') {
        alert('❌ Akses Ditolak: Kategori ini masih memiliki produk. Hanya akun Superior Admin yang boleh menghapus kategori yang memiliki produk!')
        return
      }
      const confirmDelete = window.confirm(`"${name}" masih memiliki produk. Apakah Anda ingin MENGHAPUS SEMUA PRODUK di dalam kategori ini secara permanen?`)
      if (!confirmDelete) return
      deleteProds = true
    } else {
      if (!window.confirm(`Hapus kategori "${name}"?`)) return
    }

    setStatusMessage(`Sedang menghapus "${name}" secara permanen...`)

    if (hasSupabaseConfig && supabase) {
      try {
        // 1. Hapus Produk (jika disetujui)
        if (deleteProds) {
          const { data: prodsToDelete } = await supabase.from('products').select('id, subcategory').eq('category', cat)
          const targetIds = prodsToDelete?.filter(p => p.subcategory?.split(' - ')[0].trim() === name).map(p => p.id) || []
          
          if (targetIds.length > 0) {
            await supabase.from('products').delete().in('id', targetIds)
          }
        }

        // 2. Hapus Aset (Cover) dari site_assets
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        const assetKeysToDelete = cat === 'anime' ? [`anime-cover-${slug}`] : cat === 'kpop' ? [`kpop-${slug}`, `kpop-group-${slug}`] : [`aesthetic-${slug}`]
        await supabase.from('site_assets').delete().in('key', assetKeysToDelete)

        // 3. Update State Lokal & DB
        const updatedList = (typeOptions[cat] || []).filter(n => n !== name)
        const updatedTypes = { ...typeOptions, [cat]: updatedList }
        
        const catMap = { ...(charactersByType[cat] || {}) }
        delete catMap[name]
        const updatedChars = { ...charactersByType, [cat]: catMap }

        setTypeOptions(updatedTypes)
        setCharactersByType(updatedChars)

        if (form.typeName === name) {
          setForm(prev => ({ ...prev, typeName: updatedList[0] || '', characterName: '' }))
        }

        // Simpan perubahan ke database secara otomatis demi keandalan 100%
        if (hasSupabaseConfig && supabase) {
          const typeStr = JSON.stringify(updatedTypes)
          const charStr = JSON.stringify(updatedChars)

          const res = await fetch('/api/sync-theme-assets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({
              dbUpdates: [
                {
                  key: 'global-category-options',
                  text_value: typeStr,
                  label: 'Global Category List Cache',
                  category: 'system',
                  updated_at: new Date().toISOString()
                },
                {
                  key: 'global-character-options',
                  text_value: charStr,
                  label: 'Global Character List Cache',
                  category: 'system',
                  updated_at: new Date().toISOString()
                }
              ]
            })
          })

          const data = await res.json()
          if (!res.ok) {
            throw new Error(data.error || 'Server DB sync failed')
          }

          updateText('global-category-options', typeStr)
          updateText('global-character-options', charStr)
        }

        setStatusMessage(`"${name}" dan seluruh datanya berhasil dihapus permanen.`)
        alert(`"${name}" dan seluruh datanya berhasil dihapus permanen! Halaman akan dimuat ulang.`)
        window.location.reload()
      } catch (err) {
        console.error('Delete failed:', err)
        setStatusMessage(`Gagal menghapus: ${err.message}`)
        alert(`Gagal menghapus: ${err.message}`)
      }
    }
  }

  // ── Rename / Delete Character (Karakter / Member) ──
  async function commitRenameChar() {
    const oldName = renamingChar?.name
    const newName = renameCharVal.trim()
    if (!oldName || !newName || newName === oldName) { setRenamingChar(null); return }
    const cat = form.category
    const typeName = form.typeName

    setStatusMessage(`Sedang mengubah nama karakter dari "${oldName}" menjadi "${newName}"...`)

    try {
      // 1. Update Database (Products) - Agar produk menggunakan nama karakter baru
      if (hasSupabaseConfig && supabase) {
        // Cari semua produk dengan subcategory "TypeName - OldCharName"
        const targetSubcat = `${typeName} - ${oldName}`
        const newSubcat = `${typeName} - ${newName}`

        const { data: prods, error: selectErr } = await supabase.from('products')
          .select('id, subcategory')
          .eq('category', cat)
          .eq('subcategory', targetSubcat)
        
        if (selectErr) {
          console.error(`Supabase Select Error: ${selectErr.message}`);
        }
        
        if (prods && prods.length > 0) {
          const updates = prods.map(p => ({
            id: p.id,
            subcategory: newSubcat
          }))
          
          alert(`Mengupdate ${updates.length} produk ke nama karakter baru...`);
          const { error: upsertErr } = await supabase.from('products').upsert(updates).select()
          if (upsertErr) {
            alert(`Supabase Upsert Error: ${upsertErr.message}`);
          }
        }
      }

      // 2. Update Local State (Deduplicate & Sort)
      const catMap = { ...(charactersByType[cat] || {}) }
      const list = catMap[typeName] || []
      catMap[typeName] = [...new Set(list.map(n => n === oldName ? newName : n))].sort()
      const updatedChars = { ...charactersByType, [cat]: catMap }

      setCharactersByType(updatedChars)

      if (form.characterName === oldName) setForm(prev => ({ ...prev, characterName: newName }))
      setRenamingChar(null)

      // 3. Simpan perubahan ke database secara otomatis demi keandalan 100%
      if (hasSupabaseConfig && supabase) {
        const typeStr = JSON.stringify(typeOptions)
        const charStr = JSON.stringify(updatedChars)

        const res = await fetch('/api/sync-theme-assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({
            dbUpdates: [
              {
                key: 'global-category-options',
                text_value: typeStr,
                label: 'Global Category List Cache',
                category: 'system',
                updated_at: new Date().toISOString()
              },
              {
                key: 'global-character-options',
                text_value: charStr,
                label: 'Global Character List Cache',
                category: 'system',
                updated_at: new Date().toISOString()
              }
            ]
          })
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Server DB sync failed')
        }

        updateText('global-category-options', typeStr)
        updateText('global-character-options', charStr)
      }

      setStatusMessage(`"${oldName}" diubah menjadi "${newName}".`)
      alert(`Berhasil mengubah nama karakter menjadi "${newName}"! Halaman akan dimuat ulang.`)
      window.location.reload()
    } catch (e) {
      console.error('Rename character error:', e)
      alert(`Terjadi error di commitRenameChar: ${e.message}`);
      setStatusMessage(`❌ Gagal mengubah nama: ${e.message}`);
    }
  }

  async function deleteChar(name) {
    const cat = form.category
    const typeName = form.typeName

    // Cari produk yang cocok dengan karakter ini
    const matchingProds = savedProducts.filter(p => {
      if (p.category !== cat) return false
      if (!p.subcategory) return false
      const parts = p.subcategory.split(' - ')
      return parts[0].trim() === typeName && parts[1]?.trim() === name
    })

    const hasProducts = matchingProds.length > 0
    let deleteProds = false

    if (hasProducts) {
      if (adminRole !== 'superior') {
        alert('❌ Akses Ditolak: Karakter ini masih memiliki produk. Hanya akun Superior Admin yang boleh menghapus karakter yang memiliki produk!')
        return
      }
      const confirmDelete = window.confirm(
        `"${name}" masih memiliki ${matchingProds.length} produk di database.\n\nApakah Anda ingin MENGHAPUS SEMUA PRODUK tersebut dan menghapus karakter ini secara permanen dari database & local?`
      )
      if (!confirmDelete) return
      deleteProds = true
    } else {
      if (!window.confirm(`Hapus karakter "${name}"?`)) return
    }

    setStatusMessage(`Sedang menghapus "${name}"...`)

    try {
      // 1. Hapus produk dari database jika disetujui
      if (deleteProds && hasSupabaseConfig && supabase) {
        const prodIds = matchingProds.map(p => p.id)
        if (prodIds.length > 0) {
          const { error: delProdErr } = await supabase.from('products').delete().in('id', prodIds)
          if (delProdErr) throw new Error(`Gagal menghapus produk: ${delProdErr.message}`)
        }
      }

      // 2. Update local state
      const catMap = { ...(charactersByType[cat] || {}) }
      catMap[typeName] = (catMap[typeName] || []).filter(n => n !== name)
      const updatedChars = { ...charactersByType, [cat]: catMap }

      setCharactersByType(updatedChars)

      if (form.characterName === name) {
        setForm(prev => ({ ...prev, characterName: '' }))
      }

      // 3. Simpan perubahan karakter ke database secara otomatis demi keandalan 100%
      if (hasSupabaseConfig && supabase) {
        const typeStr = JSON.stringify(typeOptions)
        const charStr = JSON.stringify(updatedChars)

        const res = await fetch('/api/sync-theme-assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({
            dbUpdates: [
              {
                key: 'global-category-options',
                text_value: typeStr,
                label: 'Global Category List Cache',
                category: 'system',
                updated_at: new Date().toISOString()
              },
              {
                key: 'global-character-options',
                text_value: charStr,
                label: 'Global Character List Cache',
                category: 'system',
                updated_at: new Date().toISOString()
              }
            ]
          })
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Server DB sync failed')
        }

        updateText('global-category-options', typeStr)
        updateText('global-character-options', charStr)
      }

      setStatusMessage(`"${name}" berhasil dihapus secara bersih dari database & browser.`)
      alert(`"${name}" berhasil dihapus secara bersih dari database & browser! Halaman akan dimuat ulang.`)
      window.location.reload()
    } catch (err) {
      console.error('Delete character error:', err)
      alert(`Gagal menghapus karakter: ${err.message || 'Unknown error'}`)
      setStatusMessage(`❌ Gagal menghapus: ${err.message || 'Unknown error'}`)
    }
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    
    // Auto-fill title from file name (without extension)
    const fileName = file.name.split('.').slice(0, -1).join('.')
    setForm(prev => ({ ...prev, title: fileName }))
  }

  const handleBatchFilesChange = (e) => {
    const files = Array.from(e.target.files || [])
    setBatchFiles(files)
    
    // Initialize titles from filenames
    const titles = files.map(f => f.name.split('.').slice(0, -1).join('.'))
    setBatchTitles(titles)
    
    // Generate previews (max 20 to avoid memory issues)
    const previews = files.slice(0, 20).map(f => URL.createObjectURL(f))
    setBatchPreviews(previews)
  }

  const updateBatchTitle = (index, value) => {
    setBatchTitles(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleBulkPaste = (e) => {
    const text = e.target.value
    if (!text) return
    
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
    setBatchTitles(prev => {
      const next = [...prev]
      lines.forEach((line, i) => {
        if (i < next.length) {
          next[i] = line.trim()
        }
      })
      return next
    })
    
    e.target.value = ''
  }

  // Upload satu file ke Supabase Storage dan return public URL (dengan timeout 30 detik)
  async function uploadFileToSupabase(file, index) {
    const safeName = sanitizeFileName(file.name)
    const ext = file.name.split('.').pop() || 'jpg'
    const filePath = `products/${Date.now()}-${index}-${safeName}.${ext}`

    // Bungkus upload dengan timeout 30 detik agar tidak hang selamanya
    let timeoutId
    try {
      const result = await Promise.race([
        supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            upsert: false,
            contentType: file.type || 'image/jpeg',
            cacheControl: '31536000'
          }),
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Upload timeout setelah 30 detik. Coba lagi.')), 30000)
        })
      ])

      clearTimeout(timeoutId)

      if (result.error) throw new Error(result.error.message)

      return supabase.storage.from('product-images').getPublicUrl(filePath).data.publicUrl
    } catch (err) {
      clearTimeout(timeoutId)
      throw err
    }
  }

  async function handleSubmit(event) {
    event?.preventDefault?.()
    
    // Cegah double-submit
    if (isSubmitting) return
    
    if (!hasSupabaseConfig || !supabase) {
      alert('Supabase belum dikonfigurasi!')
      return
    }

    // Validasi umum
    const needsHierarchy = form.category === 'anime' || form.category === 'kpop'
    if (needsHierarchy && !form.typeName) {
      alert('Pilih judul/series atau grup terlebih dahulu.')
      return
    }
    if (form.category === 'aesthetic' && !form.typeName) {
      alert('Pilih tema aesthetic terlebih dahulu.')
      return
    }

    const priceNum = 99000
    const seriesName = (needsHierarchy || form.category === 'aesthetic') ? form.typeName : '-'
    const characterName = needsHierarchy ? (form.characterName || '') : null
    const subcategory = needsHierarchy
      ? (characterName ? `${seriesName} - ${characterName}` : seriesName)
      : (form.category === 'aesthetic' ? seriesName : form.category)

    setIsSubmitting(true)

    try {
      // ==================== SINGLE UPLOAD ====================
      if (uploadMode === 'single') {
        if (!imageFile) {
          alert('Pilih gambar dulu!')
          setIsSubmitting(false)
          return
        }
        if (!form.title || form.title.trim() === '') {
          alert('Judul produk tidak boleh kosong!')
          setIsSubmitting(false)
          return
        }

        setStatusMessage('Mengunggah gambar...')
        
        let publicUrl
        try {
          publicUrl = await uploadFileToSupabase(imageFile, 0)
        } catch (uploadErr) {
          alert(`Upload gambar gagal: ${uploadErr.message}`)
          setIsSubmitting(false)
          return
        }

        setStatusMessage('Menyimpan ke database...')
        
        const { data, error } = await supabase.from('products').insert({
          title: form.title.trim(),
          price: priceNum,
          category: form.category,
          subcategory: subcategory,
          notes: form.notes,
          image_url: publicUrl
        }).select('*').single()

        if (error) {
          alert(`Gagal simpan ke database: ${error.message}`)
          setIsSubmitting(false)
          return
        }

        // Berhasil!
        setSavedProducts(prev => [data, ...prev])
        setForm(prev => ({ ...prev, title: '' }))
        setImageFile(null)
        setImagePreview('')
        const singleInput = document.getElementById('single-file-upload')
        if (singleInput) singleInput.value = ''
        setStatusMessage('Produk berhasil disimpan!')
        setShowSuccessModal(true)
        return
      }

      // ==================== BATCH UPLOAD ====================
      if (batchFiles.length === 0) {
        alert('Pilih gambar dulu!')
        setIsSubmitting(false)
        return
      }

      const totalFiles = batchFiles.length
      setTotalBatchImages(totalFiles)
      setUploadProgress(0)
      setStatusMessage(`Memulai upload ${totalFiles} gambar...`)

      const successPayloads = []
      
      // Upload SATU PER SATU agar browser tidak freeze
      for (let i = 0; i < totalFiles; i++) {
        const file = batchFiles[i]
        const title = (batchTitles[i] || '').trim() || file.name.split('.').slice(0, -1).join('.')
        
        setUploadProgress(i)
        setStatusMessage(`Mengunggah ${i + 1} dari ${totalFiles}: "${title}"`)

        try {
          // 1. Upload ke Storage
          const publicUrl = await uploadFileToSupabase(file, i)
          
          const payload = {
            title: title,
            price: priceNum,
            category: form.category,
            subcategory: subcategory,
            notes: form.notes,
            image_url: publicUrl
          }

          // 2. Insert ke Database langsung satu per satu
          const { data: insertedData, error: dbErr } = await supabase.from('products').insert([payload]).select('*')
          
          if (dbErr) {
            throw new Error(`Gagal simpan DB: ${dbErr.message}`)
          }

          // 3. Tambahkan ke daftar sukses & update tampilan tabel admin secara realtime
          const newProduct = insertedData[0]
          successPayloads.push(newProduct)
          setSavedProducts(prev => [newProduct, ...prev])

        } catch (err) {
          console.error(`File ${i + 1} gagal:`, err.message)
          setStatusMessage(`⚠️ File ${i + 1} gagal: ${err.message}. Lanjut ke berikutnya...`)
          // Lanjut ke file berikutnya
        }
      }
      
      setUploadProgress(totalFiles)
      setTotalBatchImages(0) // Sembunyikan progress bar

      // Berhasil!
      setBatchFiles([])
      setBatchTitles([])
      setBatchPreviews([])
      const batchInput = document.getElementById('batch-file-upload')
      if (batchInput) batchInput.value = ''
      setStatusMessage(`${successPayloads.length} dari ${totalFiles} produk berhasil disimpan!`)
      setShowSuccessModal(true)

    } catch (err) {
      console.error('Upload error:', err)
      alert(`Terjadi kesalahan: ${err.message}`)
      setUploadProgress(0)
      setTotalBatchImages(0)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteSelected() {
    if (selectedProducts.length === 0) return
    
    if (adminRole !== 'superior') {
      alert('❌ Akses Ditolak: Hanya akun Superior Admin yang boleh menghapus produk!')
      return
    }
    
    triggerSecurityCheck(async () => {
      setIsDeleting(true)
      setStatusMessage('Menghapus produk...')

      const { error } = await supabase.from('products').delete().in('id', selectedProducts)

      if (error) {
        setStatusMessage(`Gagal menghapus produk: ${error.message}`)
        setIsDeleting(false)
        return
      }

      setSavedProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)))
      setSelectedProducts([])
      setStatusMessage(`${selectedProducts.length} produk berhasil dihapus.`)
      setIsDeleting(false)
    })
  }

  function toggleSelectProduct(id) {
    if (!id) return // Tidak bisa memilih produk tanpa ID
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id])
  }

  function toggleSelectAll() {
    // Only select all currently visible products
    if (viewType !== 'products') return
    const ids = currentView.filter(p => p.id).map(p => p.id)

    const allSelected = ids.length > 0 && ids.every(id => selectedProducts.includes(id))
    if (allSelected) {
      setSelectedProducts(prev => prev.filter(id => !ids.includes(id)))
    } else {
      setSelectedProducts(prev => [...new Set([...prev, ...ids])])
    }
  }

  const showHierarchy = form.category === 'anime' || form.category === 'kpop' || form.category === 'aesthetic'

  // Logika Folder View
  const categories = [...new Set(savedProducts.map(p => p.category))]
  let currentView = []
  let viewType = 'categories'

  if (currentFolder.length === 0) {
    viewType = 'categories'
    currentView = categories
  } else if (currentFolder.length === 1) {
    viewType = 'groups'
    const cat = currentFolder[0]
    
    // Ambil subcategory unik, dan jika ada tanda " - ", kita ambil bagian kirinya (Group/Anime)
    const rawSubcats = savedProducts
      .filter(p => p.category === cat)
      .map(p => p.subcategory || 'Uncategorized')
    
    const groups = rawSubcats.map(sub => {
      if (sub.includes(' - ')) {
        return sub.split(' - ')[0].trim()
      }
      return sub
    })
    
    currentView = [...new Set(groups)]
  } else if (currentFolder.length === 2) {
    const cat = currentFolder[0]
    const group = currentFolder[1]
    
    // Apakah ada produk di kategori 'cat' yang subcategory-nya diawali dengan "group - "?
    const hasMembers = savedProducts.some(p => 
      p.category === cat && 
      p.subcategory && 
      p.subcategory.includes(' - ') && 
      p.subcategory.split(' - ')[0].trim() === group
    )
    
    if (hasMembers) {
      viewType = 'members'
      const members = savedProducts
        .filter(p => 
          p.category === cat && 
          p.subcategory && 
          p.subcategory.includes(' - ') && 
          p.subcategory.split(' - ')[0].trim() === group
        )
        .map(p => p.subcategory.split(' - ')[1].trim())
      
      currentView = [...new Set(members)]
    } else {
      viewType = 'products'
      currentView = savedProducts.filter(p => 
        p.category === cat && 
        (p.subcategory === group || (!p.subcategory && group === 'Uncategorized'))
      )
    }
  } else if (currentFolder.length === 3) {
    viewType = 'products'
    const cat = currentFolder[0]
    const group = currentFolder[1]
    const member = currentFolder[2]
    const expectedSubcat = `${group} - ${member}`
    currentView = savedProducts.filter(p => p.category === cat && p.subcategory === expectedSubcat)
  }

  if (loading || !adminRole) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#070709] flex flex-col items-center justify-center text-gray-900 dark:text-white font-sans transition-colors duration-300">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-zinc-500">Memverifikasi Otorisasi Admin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#070709] text-gray-900 dark:text-white transition-colors duration-300">
      <Header />
      <main className="pt-28 max-w-6xl mx-auto px-4 pb-20">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Admin Dashboard</h1>
        <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-white/10 pb-4 overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${activeTab === 'products' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 border-transparent' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white border-zinc-200 dark:border-white/5'}`}
          >
            📦 Products & Gallery
          </button>
          
          <button 
            onClick={() => setActiveTab('pricing')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${activeTab === 'pricing' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 border-transparent' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white border-zinc-200 dark:border-white/5'}`}
          >
            💰 Pricing Control
          </button>

          <Link href="/admin/tema" className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center gap-2 border-zinc-200 dark:border-white/5`}>
            🎨 Site Assets
          </Link>

          <button 
            onClick={() => setActiveTab('promo')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${activeTab === 'promo' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 border-transparent' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white border-zinc-200 dark:border-white/5'}`}
          >
            📢 Promo Popup
          </button>

          {adminRole === 'superior' && (
            <button 
              onClick={() => setActiveTab('admins')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${activeTab === 'admins' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 scale-105 border-transparent' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white border-zinc-200 dark:border-white/5'}`}
            >
              👥 Admin Management
            </button>
          )}


        </div>

        {activeTab === 'products' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleSubmit} className="lg:col-span-2 glass p-5 rounded space-y-5">
              <h2 className="text-xl font-semibold">Upload Product</h2>

            {/* Upload Mode Toggle */}
            <div className="flex gap-4 mb-2">
              <button
                type="button"
                onClick={() => setUploadMode('single')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                  uploadMode === 'single' 
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 border-transparent' 
                    : 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-white/10'
                }`}
              >
                Upload 1 Gambar
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('batch')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                  uploadMode === 'batch' 
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 border-transparent' 
                    : 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-white/10'
                }`}
              >
                Pilih Banyak Gambar (Batch)
              </button>
            </div>

            {/* Upload Input */}
            <div>
              {uploadMode === 'single' ? (
                <>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Upload Gambar</p>
                  <input id="single-file-upload" type="file" accept="image/*" onChange={handleImageChange} className="p-2 rounded bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-transparent w-full text-sm text-gray-700 dark:text-gray-300" />
                  {imagePreview && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Preview:</p>
                      <img src={imagePreview} alt="Preview" className="w-full max-h-80 object-contain rounded bg-white/5 border border-white/10 mb-4" />
                      
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Judul Produk</p>
                      <input 
                        type="text" 
                        value={form.title}
                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Masukkan judul produk..."
                        className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-amber-500/50 dark:focus:border-zinc-500/50 outline-none transition-all"
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Upload Banyak Gambar Sekaligus</p>
                  <input
                    id="batch-file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBatchFilesChange}
                    className="p-2 rounded bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-transparent w-full text-sm text-gray-700 dark:text-gray-300"
                  />
                  {batchFiles.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {/* Bulk Paste Area */}
                      <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-zinc-800/10 border border-amber-500/20 dark:border-zinc-700/30">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-[10px] uppercase tracking-widest text-amber-600 dark:text-zinc-400 font-black">⚡ Quick Paste Titles</p>
                          <span className="text-[9px] text-gray-500 italic">Paste list from Notepad/Excel (one per line)</span>
                        </div>
                        <textarea
                          placeholder="Paste daftar nama di sini..."
                          className="w-full h-20 p-3 rounded-lg bg-white dark:bg-black/40 border border-gray-200 dark:border-white/5 text-xs focus:border-amber-500/50 dark:focus:border-zinc-500/50 outline-none transition-all placeholder:text-gray-400 text-gray-900 dark:text-white"
                          onChange={handleBulkPaste}
                        ></textarea>
                      </div>

                      {/* Individual File List */}
                      <div className="p-3 bg-gray-50 dark:bg-black/40 rounded-xl border border-gray-200 dark:border-white/5 space-y-3">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-black mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-amber-500 dark:bg-zinc-400 rounded-full"></span>
                          Review {batchFiles.length} File & Judul:
                        </p>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                          {batchFiles.map((f, i) => (
                            <div key={i} className="flex gap-3 items-center bg-white dark:bg-white/5 p-2 rounded-xl border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-all shadow-sm dark:shadow-none">
                              {/* Thumbnail */}
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-white/10">
                                <img src={batchPreviews[i]} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                              
                              {/* Title Input */}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between mb-1">
                                  <span className="text-[9px] text-gray-600 font-mono truncate">{f.name}</span>
                                  <span className="text-[9px] text-amber-600 dark:text-zinc-400 font-bold">Prod #{i+1}</span>
                                </div>
                                <input 
                                  type="text" 
                                  value={batchTitles[i] || ''} 
                                  onChange={(e) => updateBatchTitle(i, e.target.value)}
                                  placeholder="Masukkan judul produk..."
                                  className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:border-amber-500/50 dark:focus:border-zinc-500/50 outline-none transition-all"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Langkah 1 — Pilih Kategori */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Langkah 1 — Kategori</p>
                <button
                  type="button"
                  onClick={handleManualSaveLists}
                  disabled={isSavingLists}
                  className={`px-4 py-1.5 text-white text-xs font-black uppercase tracking-widest rounded-lg border transition-all shadow-md active:scale-95 flex items-center gap-2 ${
                    isSavingLists ? 'bg-zinc-700 cursor-not-allowed opacity-70 border-transparent' : 'bg-zinc-800 hover:bg-zinc-950 dark:bg-white/10 dark:hover:bg-white/20 border-zinc-700 dark:border-white/10 text-white dark:text-zinc-200'
                  }`}
                >
                  {isSavingLists ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <><span>💾</span> Simpan Daftar Karakter</>
                  )}
                </button>
              </div>

              {/* Progress Bar Sinkronisasi */}
              {isSavingLists && saveListTotal > 0 && (
                <div className="mb-4 p-4 rounded-2xl bg-white dark:bg-black/40 border border-green-500/30 shadow-sm dark:shadow-[0_0_20px_rgba(34,197,94,0.15)] animate-in fade-in duration-300">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Status Sinkronisasi</span>
                      <span className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        {saveListProgress >= saveListTotal ? 'Menyimpan ke Database...' : `Memproses data ${saveListProgress} dari ${saveListTotal} member`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-green-600 dark:text-green-400 italic">
                        {Math.round((saveListProgress / saveListTotal) * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[2px]">
                    <div 
                      className="h-full bg-gradient-to-r from-green-600 via-emerald-500 to-green-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                      style={{ width: `${(saveListProgress / saveListTotal) * 100}%` }}
                    >
                      <div className="w-full h-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]"></div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-3">
                {['anime', 'kpop', 'aesthetic'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${form.category === cat
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 border-transparent'
                        : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/5 hover:bg-zinc-200/70 dark:hover:bg-white/10'
                      }`}
                  >
                    {cat === 'anime' ? '🎌 Anime' : cat === 'kpop' ? '🎵 K-pop' : '✨ Aesthetic'}
                  </button>
                ))}
              </div>
            </div>

            {/* Langkah 2 — Pilih Jenis / Series (hanya untuk anime, kpop, aesthetic) */}
            {showHierarchy && (
              <div className={`rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 p-4 shadow-sm grid grid-cols-1 gap-4 ${labels.step2 ? 'lg:grid-cols-2' : ''}`}>
                {/* Langkah 2 — Pilih Jenis */}
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Langkah 2 — {labels.step1}</p>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => setShowSearchType(!showSearchType)} 
                        className={`p-1.5 rounded-lg transition-all border ${
                          showSearchType 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400' 
                            : 'bg-zinc-200 dark:bg-white/10 border-transparent text-gray-500 hover:bg-zinc-300 dark:hover:bg-white/20'
                        }`}
                        title="Cari"
                      >
                        🔍
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowAddType(!showAddType)} 
                        className={`p-1.5 rounded-lg transition-all border ${
                          showAddType 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400' 
                            : 'bg-zinc-200 dark:bg-white/10 border-transparent text-gray-500 hover:bg-zinc-300 dark:hover:bg-white/20'
                        }`}
                        title="Tambah Baru"
                      >
                        ➕
                      </button>
                    </div>
                  </div>

                  {/* Search Bar for Types */}
                  {showSearchType && (
                    <div className="relative mb-3 animate-fade-in">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">🔍</span>
                      <input 
                        type="text"
                        autoFocus
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        placeholder={`Cari ${labels.step1}...`}
                        className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs focus:border-amber-500/50 dark:focus:border-zinc-500/50 outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                      />
                    </div>
                  )}

                  {/* Tambah Jenis Baru */}
                  {showAddType && (
                    <div className="flex gap-2 mb-3 animate-fade-in">
                      <input
                        autoFocus
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addNewType()
                          }
                        }}
                        placeholder={labels.addType}
                        className="flex-1 p-2 rounded-xl bg-gray-50 dark:bg-black/30 text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-transparent placeholder:text-gray-400 focus:border-amber-500/50 dark:focus:border-zinc-500/50 outline-none transition-all"
                      />
                      <button type="button" onClick={() => { addNewType(); }} className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors">
                        Simpan
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 mb-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {activeTypeOptions.filter(name => name.toLowerCase().includes(searchType.toLowerCase())).map((name) => (
                      renamingType?.name === name ? (
                        <div key={name} className="flex items-center gap-2 bg-amber-500/10 dark:bg-amber-500/10 p-2 rounded-xl border border-amber-500/30 dark:border-amber-500/30">
                          <input
                            autoFocus
                            value={renameTypeVal}
                            onChange={e => setRenameTypeVal(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') commitRenameType(); if (e.key === 'Escape') setRenamingType(null) }}
                            className="flex-1 px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-black/40 border border-amber-500/30 text-gray-900 dark:text-white outline-none"
                          />
                          <button type="button" onClick={commitRenameType} className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-600 text-xs font-bold hover:bg-amber-500/30 transition-colors">SIMPAN</button>
                          <button type="button" onClick={() => setRenamingType(null)} className="px-3 py-2 rounded-lg bg-white/10 text-gray-400 text-xs hover:bg-white/20 transition-colors">BATAL</button>
                        </div>
                      ) : (
                        <div key={name} className={`flex items-center justify-between group/tag p-1 rounded-xl transition-all border ${form.typeName === name ? 'bg-amber-500 border-transparent shadow-md shadow-amber-500/20 text-white font-bold' : 'bg-white dark:bg-white/5 border-zinc-300 dark:border-white/5 hover:bg-zinc-200 dark:hover:bg-white/10'}`}>
                          <button
                            type="button"
                            onClick={() => handleTypeNameChange(name)}
                            className={`flex-1 text-left px-4 py-2.5 text-sm font-bold tracking-wide transition-colors ${form.typeName === name ? 'text-white' : 'text-zinc-800 dark:text-zinc-200'}`}
                          >
                            {form.typeName === name && <span className="mr-2">✨</span>}
                            {name}
                          </button>
                          <div className="flex items-center gap-1 pr-2 opacity-0 group-hover/tag:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => { setRenamingType({ name }); setRenameTypeVal(name) }}
                              className={`p-2 rounded-lg transition-colors ${form.typeName === name ? 'hover:bg-white/20 text-white/80 hover:text-white' : 'hover:bg-amber-500/10 dark:hover:bg-white/10 text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-white'}`}
                              title="Ubah Nama"
                            >✏️</button>
                            <button
                              type="button"
                              onClick={() => deleteType(name)}
                              className="p-2 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                              title="Hapus"
                            >🗑</button>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                {/* Langkah 3 — Pilih Karakter (Sembunyikan jika Decor) */}
                {labels.step2 && (
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Langkah 3 — {labels.step2}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Kategori: <strong className="text-gray-600 dark:text-gray-300">{form.typeName}</strong></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button" 
                          onClick={() => setShowSearchChar(!showSearchChar)} 
                          className={`p-1.5 rounded-lg transition-all border ${
                            showSearchChar 
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400' 
                              : 'bg-zinc-200 dark:bg-white/10 border-transparent text-gray-500 hover:bg-zinc-300 dark:hover:bg-white/20'
                          }`}
                          title="Cari"
                        >
                          🔍
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setShowAddChar(!showAddChar)} 
                          className={`p-1.5 rounded-lg transition-all border ${
                            showAddChar 
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400' 
                              : 'bg-zinc-200 dark:bg-white/10 border-transparent text-gray-500 hover:bg-zinc-300 dark:hover:bg-white/20'
                          }`}
                          title="Tambah Baru"
                        >
                          ➕
                        </button>
                      </div>
                    </div>

                    {/* Search Bar for Characters */}
                    {showSearchChar && (
                      <div className="relative mb-3 animate-fade-in">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">🔍</span>
                        <input 
                          type="text"
                          autoFocus
                          value={searchChar}
                          onChange={(e) => setSearchChar(e.target.value)}
                          placeholder={`Cari ${labels.step2}...`}
                          className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs focus:border-amber-500/50 dark:focus:border-zinc-500/50 outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                        />
                      </div>
                    )}

                    {/* Tambah Karakter Baru */}
                    {showAddChar && (
                      <div className="flex gap-2 mb-3 animate-fade-in">
                        <input
                          autoFocus
                          value={newCharacterName}
                          onChange={(e) => setNewCharacterName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addNewCharacter()
                            }
                          }}
                          placeholder={labels.addChar}
                          className="flex-1 p-2 rounded-xl bg-gray-50 dark:bg-black/30 text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-transparent placeholder:text-gray-400 focus:border-amber-500/50 dark:focus:border-zinc-500/50 outline-none transition-all"
                        />
                        <button type="button" onClick={() => { addNewCharacter(); }} className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors">
                          Simpan
                        </button>
                      </div>
                    )}

                  {activeCharacterOptions.length === 0 ? (
                    <p className="text-sm text-amber-300/80 mb-2">Belum ada karakter. Ketik nama baru lalu klik Tambah.</p>
                  ) : (
                    <div className="flex flex-col gap-2 mb-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {activeCharacterOptions
                        .filter(name => name.toLowerCase().includes(searchChar.toLowerCase()))
                        .map((name) => (
                          renamingChar?.name === name ? (
                            <div key={name} className="flex items-center gap-2 bg-amber-500/10 dark:bg-amber-500/10 p-2 rounded-xl border border-amber-500/30 dark:border-amber-500/30">
                              <input
                                autoFocus
                                value={renameCharVal}
                                onChange={e => setRenameCharVal(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') commitRenameChar(); if (e.key === 'Escape') setRenamingChar(null) }}
                                className="flex-1 px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-black/40 border border-amber-500/30 text-gray-900 dark:text-white outline-none"
                              />
                              <button type="button" onClick={commitRenameChar} className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-600 text-xs font-bold hover:bg-amber-500/30 transition-colors">SIMPAN</button>
                              <button type="button" onClick={() => setRenamingChar(null)} className="px-3 py-2 rounded-lg bg-white/10 text-gray-400 text-xs hover:bg-white/20 transition-colors">BATAL</button>
                            </div>
                          ) : (
                            <div key={name} className={`flex items-center justify-between group/tag p-1 rounded-xl transition-all border ${form.characterName === name ? 'bg-amber-500 border-transparent shadow-md shadow-amber-500/20 text-white font-bold' : 'bg-white dark:bg-white/5 border-zinc-300 dark:border-white/5 hover:bg-zinc-200 dark:hover:bg-white/10'}`}>
                              <button
                                type="button"
                                onClick={() => updateField('characterName', name)}
                                className={`flex-1 text-left px-4 py-2.5 text-sm font-bold tracking-wide transition-colors ${form.characterName === name ? 'text-white' : 'text-zinc-800 dark:text-zinc-200'}`}
                              >
                                {form.characterName === name && <span className="mr-2">✨</span>}
                                {name}
                              </button>
                              <div className="flex items-center gap-1 pr-2 opacity-0 group-hover/tag:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => { setRenamingChar({ name }); setRenameCharVal(name) }}
                                  className={`p-2 rounded-lg transition-colors ${form.characterName === name ? 'hover:bg-white/20 text-white/80 hover:text-white' : 'hover:bg-amber-500/10 dark:hover:bg-white/10 text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-white'}`}
                                  title="Ubah Nama"
                                >✏️</button>
                                <button
                                  type="button"
                                  onClick={() => deleteChar(name)}
                                  className="p-2 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                                  title="Hapus"
                                >🗑</button>
                              </div>
                            </div>
                          )
                        ))}
                    </div>
                  )}
                </div>
              )}
              </div>
            )}

            {/* Tombol Simpan Produk */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl font-black text-lg tracking-widest uppercase transition-all shadow-xl flex items-center justify-center gap-3 ${isSubmitting
                  ? 'bg-gray-600 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-zinc-700 dark:to-zinc-800 hover:from-amber-400 hover:to-yellow-500 dark:hover:from-zinc-600 dark:hover:to-zinc-700 text-white dark:text-zinc-100 shadow-xl shadow-amber-500/10 dark:shadow-zinc-900/30 active:scale-[0.98]'
                }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Saving...
                </>
              ) : '✨ Save Product'}
            </button>

            {isSubmitting && totalBatchImages > 0 && (
              <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-black/40 border border-amber-500/30 dark:border-zinc-700/30 shadow-sm dark:shadow-[0_0_20px_rgba(245,158,11,0.08)] animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Status Upload</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      {uploadProgress >= totalBatchImages ? 'Hampir Selesai...' : `Mengunggah file ${uploadProgress + 1} dari ${totalBatchImages}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-600 dark:text-zinc-400 italic">
                      {Math.round((uploadProgress / totalBatchImages) * 100)}%
                    </span>
                  </div>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[2px]">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 dark:from-zinc-700 dark:via-zinc-500 dark:to-zinc-600 rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    style={{ width: `${(uploadProgress / totalBatchImages) * 100}%` }}
                  >
                    <div className="w-full h-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]"></div>
                  </div>
                </div>
                
                <p className="text-[9px] text-gray-500 mt-3 text-center font-mono uppercase tracking-widest animate-pulse">
                  Mohon jangan tutup halaman ini sampai proses selesai
                </p>
              </div>
            )}

          </form>

          <aside className="glass p-5 rounded space-y-5">
            <div>
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Image Preview</h3>
              {imagePreview ? (
                <img src={imagePreview} alt="Product preview" className="w-full h-64 object-cover rounded-md" />
              ) : (
                <div className="w-full h-64 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 text-sm">
                  Belum ada gambar dipilih
                </div>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2 font-bold">Deskripsi Produk (Notes)</p>
              <textarea 
                value={form.notes} 
                onChange={(e) => updateField('notes', e.target.value)} 
                placeholder="Catatan tambahan / Deskripsi" 
                className="w-full min-h-[150px] p-3 rounded-xl bg-gray-50 dark:bg-black/40 text-gray-900 dark:text-white border border-gray-200 dark:border-white/5 placeholder:text-gray-400 focus:border-amber-500/50 dark:focus:border-zinc-500/50 outline-none transition-all text-xs" 
              />
            </div>
          </aside>
        </div>

        <div className="mt-8 glass rounded p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Manajemen Produk</h2>
            {selectedProducts.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 text-sm rounded transition-colors disabled:opacity-50"
              >
                🗑️ {isDeleting ? 'Menghapus...' : `Hapus (${selectedProducts.length})`}
              </button>
            )}
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 bg-gray-100 dark:bg-black/20 p-2 rounded-xl">
            <button onClick={() => setCurrentFolder([])} className="hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
              🏠 Root
            </button>
            {currentFolder.map((folder, index) => (
              <div key={index} className="flex items-center gap-2">
                <span>/</span>
                <button
                  onClick={() => setCurrentFolder(currentFolder.slice(0, index + 1))}
                  className="hover:text-gray-900 dark:hover:text-white capitalize truncate max-w-[150px]"
                >
                  {folder}
                </button>
              </div>
            ))}
          </div>

          {statusMessage && <p className="text-sm text-gray-400 mb-4">{statusMessage}</p>}
          {isLoadingProducts ? (
            <p className="text-gray-400">Loading products...</p>
          ) : savedProducts.length === 0 ? (
            <p className="text-gray-400">Belum ada product tersimpan.</p>
          ) : viewType !== 'products' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {currentView.map((folderName) => (
                <button
                  key={folderName}
                  onClick={() => setCurrentFolder([...currentFolder, folderName])}
                  className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 hover:border-amber-500/30 dark:hover:border-zinc-700/30 transition-all group"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📁</div>
                  <span className="text-sm font-medium capitalize text-center truncate w-full text-gray-700 dark:text-gray-200">{folderName}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-gray-100 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-transparent mb-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-gray-900 dark:hover:text-white text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-white/20 bg-black/30 text-amber-500 focus:ring-amber-500 dark:text-zinc-400 dark:focus:ring-zinc-400 focus:ring-offset-gray-900 cursor-pointer"
                    checked={currentView.length > 0 && currentView.every(p => selectedProducts.includes(p.id))}
                    onChange={toggleSelectAll}
                  />
                  Pilih Semua di Folder Ini
                </label>
                <span className="text-xs text-gray-400">{currentView.length} produk</span>
              </div>

              {currentView.length === 0 && <p className="text-gray-400 text-center py-4">Folder ini kosong.</p>}

              {currentView.map((p) => (
                <div
                  key={p.id || `${p.title}-${p.image_url}`}
                  className={`p-3 rounded border flex gap-3 transition-colors ${selectedProducts.includes(p.id) ? 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/10 dark:border-amber-500/30' : 'bg-white/5 border-white/10'}`}
                >
                  <div className="flex items-center justify-center pl-2 pr-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-white/20 bg-black/30 text-amber-500 focus:ring-amber-500 focus:ring-offset-gray-900 cursor-pointer disabled:opacity-50"
                      checked={selectedProducts.includes(p.id)}
                      onChange={() => toggleSelectProduct(p.id)}
                      disabled={!p.id}
                      title={!p.id ? "Tidak dapat memilih produk tanpa ID" : ""}
                    />
                  </div>
                  {p.image_url ? (
                    <a href={p.image_url} target="_blank" rel="noreferrer" className="shrink-0">
                      <img src={p.image_url} alt={p.title} className="w-20 h-20 object-cover rounded border border-white/10" />
                    </a>
                  ) : null}
                  <div className="min-w-0">
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-sm text-gray-400">
                      Price: Rp {p.price}
                    </div>
                    {p.image_url && (
                      <a href={p.image_url} target="_blank" rel="noreferrer" className="text-xs text-blue-300 mt-1 inline-block">
                        Buka gambar penuh
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    )}

    {activeTab === 'pricing' && (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
        <form onSubmit={handleSavePricing} className="glass p-8 rounded-3xl border border-white/10 space-y-8">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <span className="w-2.5 h-8 rounded-full bg-gradient-to-b from-amber-400 to-amber-600"></span>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-white">Konfigurasi Harga & Ukuran Global</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
                Atur harga original, harga diskon, dan dimensi fisik (x, y) cm untuk masing-masing ukuran metal print
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* UKURAN F4 */}
            <div className="bg-black/20 border border-white/5 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-lg font-black text-amber-500 uppercase">Ukuran F4</span>
                <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-black">21x33 CM</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Dimensi Fisik (cm)</label>
                  <input 
                    type="text"
                    value={dimF4}
                    onChange={e => setDimF4(e.target.value)}
                    placeholder="21 x 33 cm"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Harga Original (Rp)</label>
                  <input 
                    type="number"
                    value={priceF4Original}
                    onChange={e => setPriceF4Original(e.target.value)}
                    placeholder="125000"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Harga Diskon (Rp)</label>
                  <input 
                    type="number"
                    value={priceF4Discount}
                    onChange={e => setPriceF4Discount(e.target.value)}
                    placeholder="99000"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* UKURAN A3 */}
            <div className="bg-black/20 border border-white/5 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-lg font-black text-amber-500 uppercase">Ukuran A3</span>
                <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-black">30x42 CM</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Dimensi Fisik (cm)</label>
                  <input 
                    type="text"
                    value={dimA3}
                    onChange={e => setDimA3(e.target.value)}
                    placeholder="30 x 42 cm"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Harga Original (Rp)</label>
                  <input 
                    type="number"
                    value={priceA3Original}
                    onChange={e => setPriceA3Original(e.target.value)}
                    placeholder="165000"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Harga Diskon (Rp)</label>
                  <input 
                    type="number"
                    value={priceA3Discount}
                    onChange={e => setPriceA3Discount(e.target.value)}
                    placeholder="139000"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* UKURAN A3+ */}
            <div className="bg-black/20 border border-white/5 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-lg font-black text-amber-500 uppercase">Ukuran A3+</span>
                <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-black">32x48 CM</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Dimensi Fisik (cm)</label>
                  <input 
                    type="text"
                    value={dimA3Plus}
                    onChange={e => setDimA3Plus(e.target.value)}
                    placeholder="32 x 48 cm"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Harga Original (Rp)</label>
                  <input 
                    type="number"
                    value={priceA3PlusOriginal}
                    onChange={e => setPriceA3PlusOriginal(e.target.value)}
                    placeholder="225000"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Harga Diskon (Rp)</label>
                  <input 
                    type="number"
                    value={priceA3PlusDiscount}
                    onChange={e => setPriceA3PlusDiscount(e.target.value)}
                    placeholder="189000"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <button
            type="submit"
            disabled={isSavingPricing}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-xl shadow-amber-500/10"
          >
            {isSavingPricing ? 'Menyimpan...' : 'Simpan Konfigurasi Harga & Ukuran ✓'}
          </button>
        </form>
      </div>
    )}

        {activeTab === 'admins' && adminRole === 'superior' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="glass p-8 rounded-3xl border border-gray-200 dark:border-white/10">
              <h2 className="text-xl font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-gray-900 dark:text-white">
                <span className="text-2xl">➕</span> Tambah Admin Baru
              </h2>
              <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
                  <input 
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-4 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Password</label>
                  <input 
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-4 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Role / Jabatan</label>
                  <select 
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-4 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="regular">Regular Admin (Staff)</option>
                    <option value="superior">Superior Admin (Owner)</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                  Daftarkan Admin
                </button>
              </form>
            </div>

            <div className="glass p-8 rounded-3xl border border-gray-200 dark:border-white/10">
              <h2 className="text-xl font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-gray-900 dark:text-white">
                <span className="text-2xl">📋</span> Daftar Team Admin
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Email</th>
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Jabatan</th>
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminList.map((adm) => (
                      <tr key={adm.email} className="border-b border-white/5 group hover:bg-white/5 transition-colors">
                        <td className="py-4 font-bold flex items-center gap-3">{adm.email}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${adm.role === 'superior' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                            {adm.role}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {adm.email !== user.email && (
                            <button onClick={() => handleDeleteAdmin(adm)} className="text-red-500/40 hover:text-red-500 transition-colors text-xs font-black uppercase tracking-widest">Hapus 🗑️</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MANAJEMEN WHATSAPP */}
            <div className="glass p-8 rounded-3xl border border-white/10 border-t-green-500/30">
              <h2 className="text-xl font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="text-2xl">📲</span> Manajemen WhatsApp Admin
              </h2>
              <form onSubmit={handleAddWhatsapp} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nama Admin WA</label>
                  <input value={newWaName} onChange={e => setNewWaName(e.target.value)} placeholder="Contoh: Admin Order" className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-green-500 outline-none transition-all" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nomor WA (Gunakan Kode Negara)</label>
                  <input value={newWaPhone} onChange={e => setNewWaPhone(e.target.value)} placeholder="Contoh: 62812345678" className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-green-500 outline-none transition-all" required />
                </div>
                <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-green-500/20 transition-all active:scale-95">Tambah Nomor</button>
              </form>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nomor yang Aktif Saat Ini:</p>
                {whatsappContacts.length === 0 ? (
                  <div className="p-10 border-2 border-dashed border-white/5 rounded-3xl text-center text-gray-500">
                    <span className="text-3xl block mb-2">📥</span>
                    <p className="mb-4">Belum ada nomor admin terdaftar.</p>
                    <button 
                      onClick={async () => {
                        const defaults = [
                          { name: 'Admin Utama', phone: '491633949013' },
                          { name: 'Admin Kedua', phone: '6285183050120' }
                        ]
                        await supabase.from('whatsapp_contacts').insert(defaults)
                        fetchAdmins()
                      }}
                      className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all"
                    >
                      ✨ Pulihkan Nomor Default
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {whatsappContacts.map((wa) => (
                      <div key={wa.id} className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-green-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 font-bold shadow-lg shadow-green-500/5">
                            WA
                          </div>
                          <div>
                            <div className="font-black text-sm uppercase tracking-wider text-white group-hover:text-green-400 transition-colors">{wa.name}</div>
                            <div className="text-xs text-gray-500 font-bold">+{wa.phone}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteWhatsapp(wa.id)} 
                          className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all shadow-lg hover:shadow-red-500/20"
                          title="Hapus Nomor"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'promo' && (
          <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
            <form onSubmit={handleSavePromo} className="glass p-8 rounded-3xl border border-white/10 space-y-8">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <span className="w-2.5 h-8 rounded-full bg-gradient-to-b from-amber-400 to-amber-600"></span>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-widest text-white">Pengaturan Promo Popup</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
                    Atur iklan popup promosi yang akan tampil di halaman beranda saat pembeli pertama kali berkunjung
                  </p>
                </div>
              </div>

              {/* Toggle Aktif */}
              <div className="flex items-center justify-between bg-black/20 border border-white/5 p-5 rounded-2xl">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Status Popup</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Aktifkan atau nonaktifkan popup iklan promosi di beranda</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPromoActive(!promoActive)}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${promoActive ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/20' : 'bg-zinc-700'}`}
                >
                  <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${promoActive ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Mode Durasi / Jadwal */}
              <div className="bg-black/20 border border-white/5 p-5 rounded-2xl space-y-5">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Mode Durasi</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Pilih apakah promo ditampilkan terus-menerus atau dijadwalkan otomatis</p>
                </div>

                {/* Mode selector pills */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPromoMode('always')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                      promoMode === 'always'
                        ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/10'
                        : 'bg-black/30 border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>♾️</span>
                      <span>Selalu Aktif</span>
                    </div>
                    <p className="text-[9px] font-medium normal-case tracking-normal mt-1.5 opacity-60">Tampil terus sampai dimatikan manual</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromoMode('scheduled')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                      promoMode === 'scheduled'
                        ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/10'
                        : 'bg-black/30 border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>📅</span>
                      <span>Terjadwal</span>
                    </div>
                    <p className="text-[9px] font-medium normal-case tracking-normal mt-1.5 opacity-60">Otomatis aktif/nonaktif sesuai jadwal</p>
                  </button>
                </div>

                {/* Date pickers - only shown in scheduled mode */}
                {promoMode === 'scheduled' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-green-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                          Tanggal Mulai
                        </label>
                        <input
                          type="datetime-local"
                          value={promoStartDate}
                          onChange={(e) => setPromoStartDate(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500 transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                          Tanggal Selesai
                        </label>
                        <input
                          type="datetime-local"
                          value={promoEndDate}
                          onChange={(e) => setPromoEndDate(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    {/* Schedule Status Indicator */}
                    {promoStartDate && promoEndDate && (() => {
                      const now = new Date()
                      const start = new Date(promoStartDate)
                      const end = new Date(promoEndDate)
                      const isNowActive = now >= start && now <= end
                      const isFuture = now < start
                      const isPast = now > end
                      const formatDate = (d) => d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

                      return (
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                          isNowActive ? 'bg-green-500/10 border-green-500/20' :
                          isFuture ? 'bg-blue-500/10 border-blue-500/20' :
                          'bg-red-500/10 border-red-500/20'
                        }`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            isNowActive ? 'bg-green-400 animate-pulse' :
                            isFuture ? 'bg-blue-400' :
                            'bg-red-400'
                          }`} />
                          <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${
                              isNowActive ? 'text-green-400' :
                              isFuture ? 'text-blue-400' :
                              'text-red-400'
                            }`}>
                              {isNowActive ? '🟢 SEDANG AKTIF' : isFuture ? '🔵 TERJADWAL' : '🔴 SUDAH BERAKHIR'}
                            </p>
                            <p className="text-[9px] text-gray-500 mt-0.5">
                              {isNowActive ? `Aktif sampai ${formatDate(end)}` :
                               isFuture ? `Mulai ${formatDate(start)} — Selesai ${formatDate(end)}` :
                               `Promo berakhir pada ${formatDate(end)}`}
                            </p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>

              {/* Upload Gambar Banner */}
              <div className="bg-black/20 border border-white/5 p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Banner Promosi</h3>
                <p className="text-[10px] text-gray-500">Unggah gambar desain banner promo yang sudah kamu buat (format: JPG, PNG, WebP)</p>
                
                {/* Preview */}
                {(promoImagePreview || promoImageUrl) && (
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 max-w-lg">
                    <img src={promoImagePreview || promoImageUrl} alt="Promo Preview" className="w-full h-auto object-contain" />
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setPromoImageFile(file)
                      setPromoImagePreview(URL.createObjectURL(file))
                    }
                  }}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-amber-500/10 file:text-amber-400 hover:file:bg-amber-500/20 file:cursor-pointer file:transition-all cursor-pointer"
                />
                
                <p className="text-[9px] text-gray-600">Atau masukkan URL gambar secara langsung:</p>
                <input
                  type="url"
                  value={promoImageUrl}
                  onChange={(e) => { setPromoImageUrl(e.target.value); setPromoImagePreview(e.target.value); }}
                  placeholder="https://example.com/banner-promo.jpg"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>

              {/* Target Redirect URL */}
              <div className="bg-black/20 border border-white/5 p-5 rounded-2xl space-y-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Target URL (Opsional)</h3>
                <p className="text-[10px] text-gray-500">Tautan halaman tujuan saat banner diklik pembeli (contoh: /whats-new atau /anime)</p>
                <input
                  type="text"
                  value={promoRedirectUrl}
                  onChange={(e) => setPromoRedirectUrl(e.target.value)}
                  placeholder="/whats-new"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={isSavingPromo}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-zinc-700 dark:to-zinc-800 hover:from-amber-400 hover:to-yellow-500 dark:hover:from-zinc-600 dark:hover:to-zinc-700 text-white dark:text-zinc-100 font-black uppercase tracking-widest text-sm shadow-xl shadow-amber-500/10 dark:shadow-zinc-900/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isSavingPromo ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Menyimpan...
                  </>
                ) : (
                  '💾 Simpan Pengaturan Promo ✧'
                )}
              </button>
            </form>
          </div>
        )}

        <Footer />
      </main>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSuccessModal(false)}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 100 }}
              className="bg-white/10 backdrop-blur-2xl border border-white/20 p-10 rounded-[40px] shadow-2xl text-center max-w-sm w-full relative overflow-hidden group"
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 opacity-50 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-bounce">
                  <span className="text-5xl">✅</span>
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Berhasil!</h2>
                <p className="text-white/60 text-sm font-medium uppercase tracking-widest leading-relaxed">
                  Product telah aman tersimpan di database Supabase.
                </p>
                <div className="mt-8 pt-8 border-t border-white/10">
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] animate-pulse">
                    Klik di mana saja atau tekan sembarang tombol untuk menutup
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* SECURITY MODAL */}
      <AnimatePresence>
        {showSecurityModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a0033] border border-red-500/30 w-full max-w-md rounded-3xl p-8 shadow-2xl shadow-red-500/10"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <span className="text-3xl">🔐</span>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Superior Approval</h2>
                <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest font-medium">Otorisasi diperlukan untuk menghapus konten</p>
              </div>

              <form onSubmit={verifySuperior} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Email Superior Admin</label>
                  <input 
                    type="email"
                    value={securityEmail}
                    onChange={(e) => setSecurityEmail(e.target.value)}
                    autoComplete="off"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-red-500 outline-none transition-all text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Password Superior</label>
                  <input 
                    type="password"
                    value={securityPassword}
                    onChange={(e) => setSecurityPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-red-500 outline-none transition-all text-sm"
                    required
                  />
                </div>

                {securityError && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-xs font-bold text-center animate-pulse">
                    ⚠️ {securityError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button 
                    type="button"
                    onClick={() => { setShowSecurityModal(false); setSecurityError(''); }}
                    className="px-6 py-4 rounded-2xl border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={isVerifyingSuperior}
                    className="px-6 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    {isVerifyingSuperior ? 'Mengecek...' : 'Konfirmasi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
