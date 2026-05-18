import Header from '../../components/Header'
import Link from 'next/link'
import Footer from '../../components/Footer'
import { useEffect, useMemo, useState } from 'react'
import { hasSupabaseConfig, supabase } from '../../lib/supabaseClient'
import Cropper from 'react-easy-crop'
import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'next/router'
import { useSiteAssets } from '../../lib/siteAssets'
import { motion, AnimatePresence } from 'framer-motion'

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
            // Fallback name jika file.name tidak ada
            const fileName = file?.name || 'upload.webp'
            const newFileName = fileName.includes('.') 
              ? fileName.split('.').slice(0, -1).join('.') + '.webp'
              : fileName + '.webp'
              
            const compressedFile = new File([blob], newFileName, { type: 'image/webp' })
            resolve(compressedFile)
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
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', (error) => reject(error))
    img.src = imageSrc
  })

  // Optimasi: Batasi ukuran maksimal agar upload cepat
  const MAX_WIDTH = 1200
  let targetWidth = pixelCrop.width
  let targetHeight = pixelCrop.height

  if (pixelCrop.width > MAX_WIDTH) {
    const scale = MAX_WIDTH / pixelCrop.width
    targetWidth = MAX_WIDTH
    targetHeight = pixelCrop.height * scale
  }

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = targetWidth
  canvas.height = targetHeight

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/webp', 0.8) // Kualitas 80% (Sangat cukup untuk website)
  })
}

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

// Palette warna untuk button tidak aktif — bergantian agar bervariasi
const TAG_COLORS = [
  'bg-violet-100 text-violet-800 border border-violet-300 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-700/50 dark:hover:bg-violet-800/60',
  'bg-sky-100 text-sky-800 border border-sky-300 hover:bg-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700/50 dark:hover:bg-sky-800/60',
  'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/50 dark:hover:bg-emerald-800/60',
  'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700/50 dark:hover:bg-rose-800/60',
  'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50 dark:hover:bg-amber-800/60',
  'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-300 hover:bg-fuchsia-200 dark:bg-fuchsia-900/40 dark:text-fuchsia-300 dark:border-fuchsia-700/50 dark:hover:bg-fuchsia-800/60',
  'bg-cyan-100 text-cyan-800 border border-cyan-300 hover:bg-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-700/50 dark:hover:bg-cyan-800/60',
  'bg-orange-100 text-orange-800 border border-orange-300 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700/50 dark:hover:bg-orange-800/60',
  'bg-teal-100 text-teal-800 border border-teal-300 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700/50 dark:hover:bg-teal-800/60',
  'bg-pink-100 text-pink-800 border border-pink-300 hover:bg-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-700/50 dark:hover:bg-pink-800/60',
]

// Warna kategori tetap (tiap kategori warna spesifik)
const CAT_COLORS = {
  anime: { inactive: 'bg-violet-100 text-violet-800 border border-violet-300 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-600/50 dark:hover:bg-violet-800/60' },
  kpop: { inactive: 'bg-pink-100 text-pink-800 border border-pink-300 hover:bg-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-600/50 dark:hover:bg-pink-800/60' },
  aesthetic: { inactive: 'bg-cyan-100 text-cyan-800 border border-cyan-300 hover:bg-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-600/50 dark:hover:bg-cyan-800/60' },
}

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
  const { user, loading, adminRole } = useAuth()
  const { loaded } = useSiteAssets()
  const [activeTab, setActiveTab] = useState('products') // 'products', 'content', 'admins'
  const [adminList, setAdminList] = useState([])
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminRole, setNewAdminRole] = useState('regular')
  const [imagePreview, setImagePreview] = useState('')
  const [imageFile, setImageFile] = useState(null)
  
  // Crop state
  const [cropData, setCropData] = useState(null) // { url, file }
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [cropAspect, setCropAspect] = useState(3/4)
  const [savedProducts, setSavedProducts] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')
  const [newTypeName, setNewTypeName] = useState('')
  const [newCharacterName, setNewCharacterName] = useState('')
  const [typeOptions, setTypeOptions] = useState(defaultTypes)
  const [charactersByType, setCharactersByType] = useState(defaultCharactersByType)
  const [listsReady, setListsReady] = useState(false)
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

  const handleResetLocalStorage = () => {
    if (confirm('Sapu bersih semua memori browser (pilihan anime/kpop/aesthetic)? Ini akan menghapus data contoh yang masih tersangkut.')) {
      window.localStorage.removeItem(STORAGE_TYPES)
      window.localStorage.removeItem(STORAGE_CHARS)
      window.location.reload()
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
      // 1. Start with default or local storage
      let types = mergeTypes(loadJson(STORAGE_TYPES, null), defaultTypes)
      let chars = mergeCharsByType(loadJson(STORAGE_CHARS, null), defaultCharactersByType)

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
              // B. Sync from Site Assets (Hanya jika kategori tersebut punya data valid)
          // Kita tidak lagi otomatis menambahkan kategori dari Site Assets jika produknya sudah dihapus,
          // kecuali kategori tersebut memang punya aset gambar yang terdaftar.
          const { data: aData, error: aErr } = await supabase.from('site_assets').select('key, label, image_url')
          if (!aErr && aData) {
            aData.forEach(asset => {
              if (!asset.image_url) return // Lewati jika tidak ada gambarnya

              let rawName = ''
              if (asset.key.startsWith('anime-cover-')) {
                rawName = asset.label || asset.key.replace('anime-cover-', '').replace(/-/g, ' ')
              } else if (asset.key.startsWith('kpop-group-')) {
                rawName = asset.label || asset.key.replace('kpop-group-', '').replace(/-/g, ' ')
              } else if (asset.key.startsWith('aesthetic-') && !asset.key.includes('sidebar')) {
                rawName = asset.label || asset.key.replace('aesthetic-', '').replace(/-/g, ' ')
              }

              if (rawName) {
                const cleanName = rawName.replace(/^cover\s*[—\-]?\s*/i, '').trim()
                const formattedName = cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
                const cat = asset.key.startsWith('anime') ? 'anime' : asset.key.startsWith('kpop') ? 'kpop' : asset.key.startsWith('aesthetic') ? 'aesthetic' : 'custom'
                if (!types[cat].includes(formattedName)) {
                  types[cat].push(formattedName)
                }
              }
            })
          }
          }
        } catch (err) {
          console.error('Failed to sync categories from DB:', err)
        }
      }

      // --- 3. FINAL SANITIZATION (Bersihkan & Gabungkan semua duplikat) ---
      const finalTypes = {}
      Object.keys(types).forEach(cat => {
        const uniqueNames = new Set()
        types[cat].forEach(raw => {
          // Bersihkan "Cover", "Cover - ", dsb
          const clean = raw.replace(/^cover\s*[—\-]?\s*/i, '').trim()
          // Format ke Title Case
          const formatted = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
          if (formatted) uniqueNames.add(formatted)
        })
        finalTypes[cat] = Array.from(uniqueNames).sort()
      })

      setTypeOptions(finalTypes)
      setCharactersByType(chars)

      const firstType = finalTypes.anime?.[0] || 'One Piece'
      const firstChar = chars.anime?.[firstType]?.[0] || ''
      setForm((prev) => ({
        ...prev,
        typeName: firstType,
        characterName: firstChar
      }))
      setListsReady(true)
    }

    initCategories()
  }, [loaded])

  useEffect(() => {
    if (!listsReady || typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_TYPES, JSON.stringify(typeOptions))
    
    // Sync ke Supabase agar User Biasa (Public) bisa memuat lebih cepat (Tanpa scan ribuan produk)
    if (hasSupabaseConfig && supabase && adminRole) {
      supabase.from('site_assets').upsert({
        key: 'global-category-options',
        text_value: JSON.stringify(typeOptions),
        label: 'Global Category List Cache',
        category: 'system',
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' }).then(({ error }) => {
        if (error) console.error('Failed to sync global categories:', error)
      })
    }
  }, [typeOptions, listsReady, adminRole])

  useEffect(() => {
    if (!listsReady || typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_CHARS, JSON.stringify(charactersByType))
    
    // Sync characters juga agar public tetap punya daftar karakter lengkap
    if (hasSupabaseConfig && supabase && adminRole) {
       supabase.from('site_assets').upsert({
        key: 'global-character-options',
        text_value: JSON.stringify(charactersByType),
        label: 'Global Character List Cache',
        category: 'system',
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' }).then(({ error }) => {
        if (error) console.error('Failed to sync global characters:', error)
      })
    }
  }, [charactersByType, listsReady, adminRole])

  useEffect(() => {
    // Tunggu sampai status login & role benar-benar selesai dimuat
    if (loading) return
    
    // Jika user ada tapi role belum ada, tunggu sebentar (bisa jadi sedang proses fetch role)
    if (user && adminRole === null) return 

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

  const [whatsappContacts, setWhatsappContacts] = useState([])
  const [newWaName, setNewWaName] = useState('')
  const [newWaPhone, setNewWaPhone] = useState('')

  async function resetAllDecor() {
    if (!window.confirm("PERINGATAN: Ini akan MENGHAPUS SEMUA PRODUK dan SEMUA GAMBAR di kategori DECOR secara permanen. Anda yakin ingin mulai dari nol?")) return
    
    setStatusMessage("Sedang membersihkan seluruh data Decor...")
    try {
      if (hasSupabaseConfig && supabase) {
        // 1. Hapus Produk
        await supabase.from('products').delete().eq('category', 'decor')
        // 2. Hapus Aset
        const { data: assets } = await supabase.from('site_assets').select('key')
        const decorKeys = assets?.filter(a => a.key.startsWith('decor-')).map(a => a.key) || []
        if (decorKeys.length > 0) {
          await supabase.from('site_assets').delete().in('key', decorKeys)
        }
        
        // 3. Update State & LocalStorage
        window.localStorage.removeItem('dorong_admin_type_options')
        setTypeOptions(prev => ({ ...prev, decor: [] }))
        setCharactersByType(prev => ({ ...prev, decor: {} }))
        
        setStatusMessage("BERHASIL! Seluruh data Decor telah dihapus secara total (Database & Browser).")
        fetchProducts()
      }
    } catch (err) {
      setStatusMessage("Gagal reset: " + err.message)
    }
  }

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
    if (!newAdminEmail) return
    const { error } = await supabase.from('site_admins').insert([{ email: newAdminEmail, role: newAdminRole }])
    if (error) {
      alert(error.message)
    } else {
      setNewAdminEmail('')
      fetchAdmins()
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
    setTypeOptions((prev) => {
      const current = prev[form.category] || []
      if (current.includes(typed)) return prev
      return { ...prev, [form.category]: [...current, typed] }
    })
    setCharactersByType((prev) => ({
      ...prev,
      [form.category]: { ...(prev[form.category] || {}), [typed]: prev[form.category]?.[typed] || [] }
    }))
    setForm((prev) => ({ ...prev, typeName: typed, characterName: '' }))
    setNewTypeName('')
    setStatusMessage(`"${typed}" ditambahkan. Tambahkan karakter di bawah jika belum ada.`)
  }

  function addNewCharacter() {
    const typed = newCharacterName.trim()
    if (!typed || form.category === 'custom' || form.category === 'other') return
    const cat = form.category
    const typeName = form.typeName
    setCharactersByType((prev) => {
      const catMap = { ...(prev[cat] || {}) }
      const current = catMap[typeName] || []
      if (current.includes(typed)) return prev
      catMap[typeName] = [...current, typed]
      return { ...prev, [cat]: catMap }
    })
    setForm((prev) => ({ ...prev, characterName: typed }))
    setNewCharacterName('')
    setStatusMessage(`Karakter "${typed}" ditambahkan untuk ${form.typeName}.`)
  }

  // ── Rename / Delete Type (Series / Grup) ──
  async function commitRenameType() {
    const oldName = renamingType?.name
    const newName = renameTypeVal.trim()
    if (!oldName || !newName || newName === oldName) { setRenamingType(null); return }

    const cat = form.category
    const oldSlug = oldName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const assetPrefix = cat === 'anime' ? 'anime-cover-' : cat === 'kpop' ? 'kpop-group-' : 'aesthetic-'
    
    setStatusMessage(`Sedang memigrasi data dari "${oldName}" ke "${newName}"...`)

    // 1. Update Database (Products) - Agar produk tetap muncul di series baru
    if (hasSupabaseConfig && supabase) {
      try {
        // Cari semua produk yang subcategory-nya diawali dengan oldName
        const { data: prods } = await supabase.from('products')
          .select('id, subcategory')
          .eq('category', cat)
        
        if (prods) {
          const updates = prods
            .filter(p => p.subcategory && p.subcategory.split(' - ')[0].trim() === oldName)
            .map(p => ({
              id: p.id,
              subcategory: p.subcategory.replace(oldName, newName)
            }))
          
          if (updates.length > 0) {
            await supabase.from('products').upsert(updates)
          }
        }

        // 2. Update Database (Site Assets / Cover) - Agar gambar tidak hilang
        const oldKey = `${assetPrefix}${oldSlug}`
        const newKey = `${assetPrefix}${newSlug}`
        
        const { data: assetData } = await supabase.from('site_assets').select('*').eq('key', oldKey).single()
        if (assetData) {
          // Hapus kunci lama, buat kunci baru dengan data yang sama
          await supabase.from('site_assets').delete().eq('key', oldKey)
          await supabase.from('site_assets').upsert({
            ...assetData,
            key: newKey,
            label: assetData.label.replace(oldName, newName)
          })
          // Update local assets context if possible
          if (typeof updateAsset === 'function') updateAsset(newKey, assetData.image_url)
        }
      } catch (err) {
        console.error('Migration failed:', err)
      }
    }

    // 3. Update Local State (Deduplicate)
    setTypeOptions(prev => {
      const list = prev[cat] || []
      const newList = list.map(n => n === oldName ? newName : n)
      return { ...prev, [cat]: [...new Set(newList)] }
    })
    setCharactersByType(prev => {
      const catMap = { ...(prev[cat] || {}) }
      if (catMap[oldName]) {
        // Gabungkan karakter jika nama baru sudah punya karakter
        const existingChars = catMap[newName] || []
        const oldChars = catMap[oldName] || []
        catMap[newName] = [...new Set([...existingChars, ...oldChars])]
        delete catMap[oldName]
      }
      return { ...prev, [cat]: catMap }
    })
    
    if (form.typeName === oldName) setForm(prev => ({ ...prev, typeName: newName }))
    setRenamingType(null)
    setStatusMessage(`Berhasil! "${oldName}" telah digabungkan ke "${newName}".`)
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
        const assetKey = cat === 'anime' ? `anime-cover-${slug}` : cat === 'kpop' ? `kpop-group-${slug}` : `aesthetic-${slug}`
        await supabase.from('site_assets').delete().eq('key', assetKey)

        // 3. Update State Lokal
        setTypeOptions(prev => {
          const list = (prev[cat] || []).filter(n => n !== name)
          return { ...prev, [cat]: list }
        })
        setCharactersByType(prev => {
          const catMap = { ...(prev[cat] || {}) }
          delete catMap[name]
          return { ...prev, [cat]: catMap }
        })
        
        if (form.typeName === name) {
          const remaining = (typeOptions[cat] || []).filter(n => n !== name)
          setForm(prev => ({ ...prev, typeName: remaining[0] || '', characterName: '' }))
        }
        
        setStatusMessage(`"${name}" dan seluruh datanya berhasil dihapus permanen.`)
        fetchProducts() 
      } catch (err) {
        console.error('Delete failed:', err)
        setStatusMessage(`Gagal menghapus: ${err.message}`)
      }
    }
  }

  // ── Rename / Delete Character (Karakter / Member) ──
  function commitRenameChar() {
    const oldName = renamingChar?.name
    const newName = renameCharVal.trim()
    if (!oldName || !newName || newName === oldName) { setRenamingChar(null); return }
    const cat = form.category
    const typeName = form.typeName
    setCharactersByType(prev => {
      const catMap = { ...(prev[cat] || {}) }
      const list = catMap[typeName] || []
      catMap[typeName] = list.map(n => n === oldName ? newName : n)
      return { ...prev, [cat]: catMap }
    })
    if (form.characterName === oldName) setForm(prev => ({ ...prev, characterName: newName }))
    setRenamingChar(null)
    setStatusMessage(`"${oldName}" diubah menjadi "${newName}".`)
  }

  function deleteChar(name) {
    const cat = form.category
    const typeName = form.typeName
    const hasProducts = savedProducts.some(p => {
      if (p.category !== cat) return false
      if (!p.subcategory) return false
      const parts = p.subcategory.split(' - ')
      return parts[0].trim() === typeName && parts[1]?.trim() === name
    })
    if (hasProducts) {
      setStatusMessage(`❌ Tidak bisa hapus "${name}": masih ada produk di dalamnya. Hapus produknya dulu.`)
      return
    }

    triggerSecurityCheck(async () => {
      setCharactersByType(prev => {
        const catMap = { ...(prev[cat] || {}) }
        catMap[typeName] = (catMap[typeName] || []).filter(n => n !== name)
        return { ...prev, [cat]: catMap }
      })
      if (form.characterName === name) setForm(prev => ({ ...prev, characterName: '' }))
      setStatusMessage(`"${name}" berhasil dihapus.`)
    })
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setCropData({ url, file })
    
    // Auto-fill title from file name (without extension)
    const fileName = file.name.split('.').slice(0, -1).join('.')
    setForm(prev => ({ ...prev, title: fileName }))
  }

  const handleFinishCrop = async (useCrop = true) => {
    if (!cropData) return
    let finalBlob = cropData.file
    let finalUrl = cropData.url

    if (useCrop && croppedAreaPixels) {
      finalBlob = await getCroppedImg(cropData.url, croppedAreaPixels)
      finalUrl = URL.createObjectURL(finalBlob)
    } else {
      // Jika tidak di-crop, tetap kompres
      finalBlob = await compressImage(cropData.file)
      finalUrl = URL.createObjectURL(finalBlob)
    }

    setImageFile(finalBlob)
    setImagePreview(finalUrl)
    setCropData(null)
  }

  const handleBatchFilesChange = (e) => {
    const files = Array.from(e.target.files || [])
    setBatchFiles(files)
    
    // Initialize titles from filenames
    const titles = files.map(f => f.name.split('.').slice(0, -1).join('.'))
    setBatchTitles(titles)
    
    // Generate previews
    const previews = files.map(f => URL.createObjectURL(f))
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
    
    // Clear textarea after paste for better UX (optional)
    e.target.value = ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (uploadMode === 'single' && !imageFile) {
      setStatusMessage('Pilih gambar dulu ya.')
      return
    }
    if (uploadMode === 'batch' && batchFiles.length === 0) {
      setStatusMessage('Pilih beberapa gambar dulu ya.')
      return
    }
    if (uploadMode === 'single' && !form.title) {
      setStatusMessage('Lengkapi judul produk dulu ya.')
      return
    }
    if (!form.price) {
      setStatusMessage('Lengkapi harga dulu ya.')
      return
    }
    if (!hasSupabaseConfig || !supabase) {
      setStatusMessage('Supabase belum dikonfigurasi di .env.local (URL + anon key). Restart npm run dev setelah mengubah .env.local.')
      return
    }
    const priceNum = Number(form.price)
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setStatusMessage('Harga tidak valid. Isi angka saja, contoh: 159000')
      return
    }
    const needsHierarchy = form.category === 'anime' || form.category === 'kpop'
    if (needsHierarchy && (!form.typeName || !form.characterName)) {
      setStatusMessage('Pilih judul/series dulu, lalu pilih karakter (atau tambah baru).')
      return
    }
    if (form.category === 'aesthetic' && !form.typeName) {
      setStatusMessage('Pilih jenis/tema dulu ya.')
      return
    }

    setIsSubmitting(true)
    setStatusMessage('Menyiapkan pengunggahan...')

    try {
      const seriesName = (needsHierarchy || form.category === 'aesthetic') ? form.typeName : '-'
      const characterName = needsHierarchy ? form.characterName : null
      const subcategory = needsHierarchy ? `${seriesName} - ${characterName}` : (form.category === 'aesthetic' ? seriesName : form.category)

      if (uploadMode === 'batch') {
        const imageFiles = Array.from(batchFiles).filter(file =>
          file.type.match(/^image\/(jpeg|png|webp|gif|jpg)$/i)
        )

        if (imageFiles.length === 0) {
          setStatusMessage('Tidak ada file gambar valid yang dipilih.')
          setIsSubmitting(false)
          return
        }

        setTotalBatchImages(imageFiles.length)
        setUploadProgress(0)
        setStatusMessage(`Memulai upload ${imageFiles.length} gambar secara paralel...`)

        const CONCURRENCY_LIMIT = 5 // Upload 5 gambar sekaligus
        const payloads = []
        let uploadedCount = 0

        // Fungsi helper untuk upload satu file
        const uploadOneFile = async (file, index) => {
          // KOMPRESI OTOMATIS: Kecilkan ukuran file sebelum upload
          const compressed = await compressImage(file)
          const safeName = sanitizeFileName(compressed.name)
          const filePath = `products/${Date.now()}-${index}-${safeName}`
          
          const { error: upErr } = await supabase.storage.from('product-images').upload(filePath, compressed, {
            upsert: false,
            contentType: 'image/webp'
          })

          if (upErr) throw new Error(`Gagal upload ${file.name}: ${upErr.message}`)

          const publicUrl = supabase.storage.from('product-images').getPublicUrl(filePath).data.publicUrl
          
          const finalTitle = batchTitles[index] || file.name.split('.').slice(0, -1).join('.')
          
          payloads.push({
            title: finalTitle,
            price: priceNum,
            category: form.category,
            subcategory: subcategory,
            notes: form.notes,
            image_url: publicUrl
          })

          uploadedCount++
          setUploadProgress(uploadedCount)
        }

        // Jalankan dengan pembatasan jumlah paralel (concurrency)
        for (let i = 0; i < imageFiles.length; i += CONCURRENCY_LIMIT) {
          const chunk = imageFiles.slice(i, i + CONCURRENCY_LIMIT)
          await Promise.all(chunk.map((file, idx) => uploadOneFile(file, i + idx)))
        }

        // Terakhir, simpan semua ke database sekaligus (Batch Insert)
        setStatusMessage('Menyimpan data ke database...')
        const { error: dbErr } = await supabase.from('products').insert(payloads)

        if (dbErr) {
          setStatusMessage(`Gagal simpan ke DB: ${dbErr.message}`)
          setIsSubmitting(false)
          return
        }

        setStatusMessage(`Berhasil! ${payloads.length} produk tersimpan.`)
        setShowSuccessModal(true)
        
        // Refresh list
        const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false })
        if (pData) setSavedProducts(pData)
        setBatchFiles([])
        return
      }

      // Single Upload Mode
      setTotalBatchImages(1)
      setUploadProgress(0)
      setStatusMessage('Mengunggah gambar...')
      
      const compressedImage = imageFile
      const safeName = sanitizeFileName(imageFile.name)
      const filePath = `products/${Date.now()}-${safeName}.webp`
      
      const { error: uploadErr } = await supabase.storage.from('product-images').upload(filePath, compressedImage, {
        upsert: false,
        contentType: 'image/webp'
      })

      if (uploadErr) {
        setStatusMessage(`Upload gagal: ${uploadErr.message}`)
        setIsSubmitting(false)
        return
      }
      
      setUploadProgress(1)

      const publicUrl = supabase.storage.from('product-images').getPublicUrl(filePath).data.publicUrl
      const payload = {
        title: form.title,
        price: priceNum,
        category: form.category,
        subcategory: subcategory,
        notes: form.notes,
        image_url: publicUrl
      }

      const { data, error } = await supabase.from('products').insert(payload).select('*').single()
      if (error) {
        setStatusMessage(`Simpan ke database gagal: ${error.message}`)
        return
      }

      setSavedProducts((prev) => [data, ...prev])
      setForm((prev) => ({
        ...prev,
        title: '',
        price: '',
        typeName: typeOptions[form.category]?.[0] || '',
        characterName: pickFirstCharacter(form.category, typeOptions[form.category]?.[0] || ''),
        notes: '✨ Premium Collectible Metal Prints - LUMI FORGE Exclusive ✨\n\nDibuat dengan teknologi Sublimation High Press tercanggih untuk hasil warna yang super vibrant dan detail ultra-tajam. Material berkualitas tinggi yang anti-luntur, tahan lama, dan memberikan kesan mewah yang elegan di setiap sudut ruanganmu. Pilihan terbaik untuk dekorasi kelas dunia!'
      }))
      setImageFile(null)
      setImagePreview('')
      setStatusMessage('Product berhasil disimpan ke Supabase.')
      setShowSuccessModal(true)
    } catch (err) {
      console.error(err)
      setStatusMessage(`Terjadi kesalahan: ${err.message || 'Gagal terhubung ke server'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteSelected() {
    if (selectedProducts.length === 0) return
    
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
    if (currentFolder.length !== 2) return
    const cat = currentFolder[0]
    const subcat = currentFolder[1]
    const visibleProducts = savedProducts.filter(p => p.category === cat && (p.subcategory === subcat || (!p.subcategory && subcat === 'Uncategorized')))
    const ids = visibleProducts.filter(p => p.id).map(p => p.id)

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
    viewType = 'subcategories'
    const cat = currentFolder[0]
    currentView = [...new Set(savedProducts.filter(p => p.category === cat).map(p => p.subcategory || 'Uncategorized'))]
  } else if (currentFolder.length === 2) {
    viewType = 'products'
    const cat = currentFolder[0]
    const subcat = currentFolder[1]
    currentView = savedProducts.filter(p => p.category === cat && (p.subcategory === subcat || (!p.subcategory && subcat === 'Uncategorized')))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07090b] to-[#0b0f12] text-white">
      <Header />
      <main className="pt-28 max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <div className="flex gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-gray-500 hover:text-white'}`}
          >
            📦 Products & Gallery
          </button>
          
          <Link href="/admin/tema" className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-gray-500 hover:text-white flex items-center gap-2`}>
            🎨 Site Assets
          </Link>

          {adminRole === 'superior' && (
            <button 
              onClick={() => setActiveTab('admins')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'admins' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/40 scale-105' : 'text-gray-500 hover:text-white border border-white/5'}`}
            >
              👥 Admin Management
            </button>
          )}

          <button 
            onClick={handleResetLocalStorage}
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all ml-auto"
            title="Hapus sisa data hantu dari memori browser"
          >
            🧹 Reset Memori
          </button>
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
                className={`flex-1 py-2 rounded font-medium text-sm transition-colors ${uploadMode === 'single' ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
              >
                Upload 1 Gambar
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('batch')}
                className={`flex-1 py-2 rounded font-medium text-sm transition-colors ${uploadMode === 'batch' ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
              >
                Pilih Banyak Gambar (Batch)
              </button>
            </div>

            {/* Upload Input */}
            <div>
              {uploadMode === 'single' ? (
                <>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Upload Gambar</p>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="p-2 rounded bg-black/20 w-full" />
                  {imagePreview && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Preview:</p>
                      <img src={imagePreview} alt="Preview" className="w-full max-h-80 object-contain rounded bg-white/5 border border-white/10" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Upload Banyak Gambar Sekaligus</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBatchFilesChange}
                    className="p-2 rounded bg-black/20 w-full"
                  />
                  {batchFiles.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {/* Bulk Paste Area */}
                      <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-[10px] uppercase tracking-widest text-purple-400 font-black">⚡ Quick Paste Titles</p>
                          <span className="text-[9px] text-gray-500 italic">Paste list from Notepad/Excel (one per line)</span>
                        </div>
                        <textarea
                          placeholder="Paste daftar nama di sini..."
                          className="w-full h-20 p-3 rounded-lg bg-black/40 border border-white/5 text-xs focus:border-purple-500/50 outline-none transition-all placeholder:text-gray-700"
                          onChange={handleBulkPaste}
                        ></textarea>
                      </div>

                      {/* Individual File List */}
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-3">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-black mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          Review {batchFiles.length} File & Judul:
                        </p>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                          {batchFiles.map((f, i) => (
                            <div key={i} className="flex gap-3 items-center bg-white/5 p-2 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                              {/* Thumbnail */}
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-white/10">
                                <img src={batchPreviews[i]} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                              
                              {/* Title Input */}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between mb-1">
                                  <span className="text-[9px] text-gray-600 font-mono truncate">{f.name}</span>
                                  <span className="text-[9px] text-purple-400 font-bold">Prod #{i+1}</span>
                                </div>
                                <input 
                                  type="text" 
                                  value={batchTitles[i] || ''} 
                                  onChange={(e) => updateBatchTitle(i, e.target.value)}
                                  placeholder="Masukkan judul produk..."
                                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-purple-500/50 outline-none transition-all"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {isSubmitting && totalBatchImages > 0 && (
                    <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)] animate-in fade-in zoom-in duration-300">
                      <div className="flex justify-between items-end mb-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Status Upload</span>
                          <span className="text-xs font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            {uploadProgress === totalBatchImages ? 'Hampir Selesai...' : `Mengunggah ${uploadProgress} dari ${totalBatchImages}`}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-purple-400 italic">
                            {Math.round((uploadProgress / totalBatchImages) * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[2px]">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(168,85,247,0.5)]"
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
                </>
              )}
            </div>

            {/* Langkah 1 — Pilih Kategori */}
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Langkah 1 — Kategori</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {['anime', 'kpop', 'aesthetic'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${form.category === cat
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 border border-transparent'
                        : CAT_COLORS[cat]?.inactive || 'bg-white/10 text-gray-300'
                      }`}
                  >
                    {cat === 'anime' ? '🎌 Anime' : cat === 'kpop' ? '🎵 K-pop' : '✨ Aesthetic'}
                  </button>
                ))}
              </div>
            </div>

            {/* Langkah 2 — Pilih Jenis / Series (hanya untuk anime, kpop, aesthetic) */}
            {showHierarchy && (
              <div className="rounded-lg border border-white/10 bg-black/20 p-4 space-y-4">
                {/* Langkah 2 — Pilih Jenis */}
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Langkah 2 — {labels.step1}</p>
                  {/* Search Bar for Types */}
                  <div className="relative mb-3">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">🔍</span>
                    <input 
                      type="text"
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value)}
                      onBlur={() => setTimeout(() => setSearchType(''), 200)}
                      placeholder={`Cari ${labels.step1}...`}
                      className="w-full bg-black/40 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs focus:border-blue-500/50 outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-2 mb-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {activeTypeOptions.filter(name => name.toLowerCase().includes(searchType.toLowerCase())).map((name) => (
                      renamingType?.name === name ? (
                        <div key={name} className="flex items-center gap-2 bg-blue-500/10 p-2 rounded-xl border border-blue-500/30">
                          <input
                            autoFocus
                            value={renameTypeVal}
                            onChange={e => setRenameTypeVal(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') commitRenameType(); if (e.key === 'Escape') setRenamingType(null) }}
                            className="flex-1 px-3 py-2 rounded-lg text-sm bg-black/40 border border-blue-400/50 text-white outline-none"
                          />
                          <button type="button" onClick={commitRenameType} className="px-4 py-2 rounded-lg bg-green-500/30 text-green-300 text-xs font-bold hover:bg-green-500/50 transition-colors">SIMPAN</button>
                          <button type="button" onClick={() => setRenamingType(null)} className="px-3 py-2 rounded-lg bg-white/10 text-gray-400 text-xs hover:bg-white/20 transition-colors">BATAL</button>
                        </div>
                      ) : (
                        <div key={name} className={`flex items-center justify-between group/tag p-1 rounded-xl transition-all border ${form.typeName === name ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/10' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                          <button
                            type="button"
                            onClick={() => handleTypeNameChange(name)}
                            className="flex-1 text-left px-4 py-2.5 text-sm font-bold tracking-wide"
                          >
                            {form.typeName === name && <span className="mr-2">🔷</span>}
                            {name}
                          </button>
                          <div className="flex items-center gap-1 pr-2 opacity-0 group-hover/tag:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => { setRenamingType({ name }); setRenameTypeVal(name) }}
                              className="p-2 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
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
                  {/* Tambah Jenis Baru */}
                  <div className="flex gap-2">
                    <input
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNewType())}
                      placeholder={labels.addType}
                      className="flex-1 p-2 rounded bg-black/30 text-sm"
                    />
                    <button type="button" onClick={addNewType} className="px-3 py-2 rounded bg-green-500/20 text-green-300 text-sm hover:bg-green-500/30">
                      + Tambah
                    </button>
                  </div>
                </div>

                {/* Langkah 3 — Pilih Karakter (Sembunyikan jika Decor) */}
                {labels.step2 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Langkah 3 — {labels.step2}</p>
                  <p className="text-sm text-gray-400 mb-2">
                    Kategori: <strong>{form.typeName}</strong>
                  </p>
                  {/* Search Bar for Characters */}
                  <div className="relative mb-3">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">🔍</span>
                    <input 
                      type="text"
                      value={searchChar}
                      onChange={(e) => setSearchChar(e.target.value)}
                      onBlur={() => setTimeout(() => setSearchChar(''), 200)}
                      placeholder={`Cari ${labels.step2}...`}
                      className="w-full bg-black/40 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs focus:border-orange-500/50 outline-none transition-all"
                    />
                  </div>

                  {activeCharacterOptions.length === 0 ? (
                    <p className="text-sm text-amber-300/80 mb-2">Belum ada karakter. Ketik nama baru lalu klik Tambah.</p>
                  ) : (
                    <div className="flex flex-col gap-2 mb-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {activeCharacterOptions
                        .filter(name => name.toLowerCase().includes(searchChar.toLowerCase()))
                        .map((name) => (
                          renamingChar?.name === name ? (
                            <div key={name} className="flex items-center gap-2 bg-orange-500/10 p-2 rounded-xl border border-orange-500/30">
                              <input
                                autoFocus
                                value={renameCharVal}
                                onChange={e => setRenameCharVal(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') commitRenameChar(); if (e.key === 'Escape') setRenamingChar(null) }}
                                className="flex-1 px-3 py-2 rounded-lg text-sm bg-black/40 border border-orange-400/50 text-white outline-none"
                              />
                              <button type="button" onClick={commitRenameChar} className="px-4 py-2 rounded-lg bg-green-500/30 text-green-300 text-xs font-bold hover:bg-green-500/50 transition-colors">SIMPAN</button>
                              <button type="button" onClick={() => setRenamingChar(null)} className="px-3 py-2 rounded-lg bg-white/10 text-gray-400 text-xs hover:bg-white/20 transition-colors">BATAL</button>
                            </div>
                          ) : (
                            <div key={name} className={`flex items-center justify-between group/tag p-1 rounded-xl transition-all border ${form.characterName === name ? 'bg-orange-500/20 border-orange-500/50 shadow-lg shadow-orange-500/10' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                              <button
                                type="button"
                                onClick={() => updateField('characterName', name)}
                                className="flex-1 text-left px-4 py-2.5 text-sm font-bold tracking-wide"
                              >
                                {form.characterName === name && <span className="mr-2">🔶</span>}
                                {name}
                              </button>
                              <div className="flex items-center gap-1 pr-2 opacity-0 group-hover/tag:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => { setRenamingChar({ name }); setRenameCharVal(name) }}
                                  className="p-2 hover:bg-orange-500/30 text-orange-300 rounded-lg transition-colors"
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
                  {/* Tambah Karakter Baru */}
                  <div className="flex gap-2">
                    <input
                      value={newCharacterName}
                      onChange={(e) => setNewCharacterName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNewCharacter())}
                      placeholder={labels.addChar}
                      className="flex-1 p-2 rounded bg-black/30 text-sm"
                    />
                    <button type="button" onClick={addNewCharacter} className="px-3 py-2 rounded bg-green-500/20 text-green-300 text-sm hover:bg-green-500/30">
                      + Tambah
                    </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Harga (Rp)</p>
                <input value={form.price} onChange={(e) => updateField('price', e.target.value)} placeholder="Contoh: 159000" className="p-3 rounded bg-black/20 w-full" />
              </div>
            </div>
            
            <textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} placeholder="Catatan tambahan" className="w-full min-h-[90px] p-3 rounded bg-black/20" />

            {/* Tombol Simpan Produk */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl font-black text-lg tracking-widest uppercase transition-all shadow-xl flex items-center justify-center gap-3 ${isSubmitting
                  ? 'bg-gray-600 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-500/20 active:scale-[0.98]'
                }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Saving...
                </>
              ) : '✨ Save Product'}
            </button>

            {/* DANGER ZONE (Hanya untuk Reset Decor) */}
            <div className="mt-12 p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-red-500 font-black mb-4">Danger Zone / Area Bahaya</p>
              <button
                type="button"
                onClick={resetAllDecor}
                className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-bold tracking-widest"
              >
                🔥 RESET TOTAL SEMUA DATA DECOR
              </button>
              <p className="text-[9px] text-gray-500 mt-2 text-center italic">Gunakan ini untuk menghapus semua produk & gambar Decor agar bisa mulai dari nol.</p>
            </div>
          </form>

          <aside className="glass p-5 rounded">
            <h3 className="font-semibold mb-3">Image Preview</h3>
            {imagePreview ? (
              <img src={imagePreview} alt="Product preview" className="w-full h-64 object-cover rounded-md" />
            ) : (
              <div className="w-full h-64 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 text-sm">
                Belum ada gambar dipilih
              </div>
            )}
          </aside>
        </div>

        <div className="mt-8 glass rounded p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-xl font-semibold">Manajemen Produk</h2>
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
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 bg-black/20 p-2 rounded">
            <button onClick={() => setCurrentFolder([])} className="hover:text-white flex items-center gap-1">
              🏠 Root
            </button>
            {currentFolder.map((folder, index) => (
              <div key={index} className="flex items-center gap-2">
                <span>/</span>
                <button
                  onClick={() => setCurrentFolder(currentFolder.slice(0, index + 1))}
                  className="hover:text-white capitalize truncate max-w-[150px]"
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
          ) : viewType === 'categories' || viewType === 'subcategories' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {currentView.map((folderName) => (
                <button
                  key={folderName}
                  onClick={() => setCurrentFolder([...currentFolder, folderName])}
                  className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-purple-500/30 transition-all group"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📁</div>
                  <span className="text-sm font-medium capitalize text-center truncate w-full">{folderName}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white/5 p-3 rounded mb-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-white/20 bg-black/30 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900 cursor-pointer"
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
                  className={`p-3 rounded border flex gap-3 transition-colors ${selectedProducts.includes(p.id) ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/5 border-white/10'}`}
                >
                  <div className="flex items-center justify-center pl-2 pr-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-white/20 bg-black/30 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900 cursor-pointer disabled:opacity-50"
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

        {activeTab === 'admins' && adminRole === 'superior' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="glass p-8 rounded-3xl border border-white/10">
              <h2 className="text-xl font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="text-2xl">➕</span> Tambah Admin Baru
              </h2>
              <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
                  <input 
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Role / Jabatan</label>
                  <select 
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all appearance-none"
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

            <div className="glass p-8 rounded-3xl border border-white/10">
              <h2 className="text-xl font-black uppercase tracking-widest mb-6 flex items-center gap-3">
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
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${adm.role === 'superior' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
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

      {/* CROP MODAL */}
      {cropData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="bg-[#121212] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl border border-white/10">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900">
              <div className="flex items-center gap-4">
                <h3 className="font-black uppercase tracking-widest text-white text-xs">Crop Product Image</h3>
                <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                  <button type="button" onClick={() => setCropAspect(3/4)} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${cropAspect === 3/4 ? 'bg-purple-500 text-white' : 'text-gray-500 hover:text-white'}`}>3:4</button>
                  <button type="button" onClick={() => setCropAspect(1)} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${cropAspect === 1 ? 'bg-purple-500 text-white' : 'text-gray-500 hover:text-white'}`}>1:1</button>
                  <button type="button" onClick={() => setCropAspect(16/9)} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${cropAspect === 16/9 ? 'bg-purple-500 text-white' : 'text-gray-500 hover:text-white'}`}>16:9</button>
                  <button type="button" onClick={() => setCropAspect(null)} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${cropAspect === null ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:text-white'}`}>✨ Manual / Bebas</button>
                </div>
              </div>
              <button type="button" onClick={() => setCropData(null)} className="text-gray-500 hover:text-white p-2">✕</button>
            </div>
            <div className="relative h-[400px] bg-black">
              <Cropper
                image={cropData.url}
                crop={crop}
                zoom={zoom}
                aspect={cropAspect}
                onCropChange={setCrop}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-6 bg-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <span className="text-[10px] font-bold uppercase text-gray-500">Zoom</span>
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 md:w-64 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" />
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button type="button" onClick={() => handleFinishCrop(false)} className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Tanpa Crop</button>
                <button type="button" onClick={() => handleFinishCrop(true)} className="flex-1 md:flex-none px-10 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all">Terapkan Crop</button>
              </div>
            </div>
          </div>
        </div>
      )}
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
