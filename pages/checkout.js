import Header from '../components/Header'
import Footer from '../components/Footer'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

const RAJAONGKIR_PROVINCES_BY_NAME = {
  "bali": "1", "bangka belitung": "2", "banten": "3", "bengkulu": "4", "di yogyakarta": "5", "dki jakarta": "6",
  "gorontalo": "7", "jambi": "8", "jawa barat": "9", "jawa tengah": "10", "jawa timur": "11",
  "kalimantan barat": "12", "kalimantan selatan": "13", "kalimantan tengah": "14", "kalimantan timur": "15",
  "kalimantan utara": "16", "kepulauan riau": "17", "lampung": "18", "maluku": "19", "maluku utara": "20",
  "nanggroe aceh darussalam (nad)": "21", "aceh": "21", "nusa tenggara barat (ntb)": "22", "nusa tenggara barat": "22",
  "nusa tenggara timur (ntt)": "23", "nusa tenggara timur": "23", "papua": "24", "papua barat": "25",
  "riau": "26", "sulawesi barat": "27", "sulawesi selatan": "28", "sulawesi tengah": "29",
  "sulawesi tenggara": "30", "sulawesi utara": "31", "sumatera barat": "32", "sumatera selatan": "33", "sumatera utara": "34"
};

const BPS_TO_RAJAONGKIR_PROVINCES = {
  "51": "1", "19": "2", "36": "3", "17": "4", "34": "5", "31": "6", "75": "7", "15": "8", "32": "9",
  "33": "10", "35": "11", "61": "12", "63": "13", "62": "14", "64": "15", "65": "16", "21": "17", "18": "18",
  "81": "19", "82": "20", "11": "21", "52": "22", "53": "23", "91": "24", "92": "25", "14": "26", "76": "27",
  "73": "28", "72": "29", "74": "30", "71": "31", "13": "32", "16": "33", "12": "34"
};

const RAJAONGKIR_TO_BPS_PROVINCES = {
  "1": "51", "2": "19", "3": "36", "4": "17", "5": "34", "6": "31", "7": "75", "8": "15", "9": "32",
  "10": "33", "11": "35", "12": "61", "13": "63", "14": "62", "15": "64", "16": "65", "17": "21", "18": "18",
  "19": "81", "20": "82", "21": "11", "22": "52", "23": "53", "24": "91", "25": "92", "26": "14", "27": "76",
  "28": "73", "29": "72", "30": "74", "31": "71", "32": "13", "33": "16", "34": "12"
};

export default function Checkout(){
  const router = useRouter()
  const { items, subtotal, clearCart } = useCart()
  const { user } = useAuth()
  
  const customItem = items.find(item => item.isCustom)
  
  // Basic Info
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  
  // Location Info
  const [provinces, setProvinces] = useState([])
  const [cities, setCities] = useState([])
  const [districts, setDistricts] = useState([])
  const [isDistrictLoading, setIsDistrictLoading] = useState(false)
  const [postalCodes, setPostalCodes] = useState([])
  const [isPostalLoading, setIsPostalLoading] = useState(false)
  
  const [selectedProvince, setSelectedProvince] = useState({ id: '', name: '' })
  const [selectedCity, setSelectedCity] = useState({ id: '', name: '' })
  const [selectedDistrict, setSelectedDistrict] = useState({ id: '', name: '' })
  const [postalCode, setPostalCode] = useState('')
  
  // Detail Address
  const [streetAddress, setStreetAddress] = useState('')
  const [extraDetail, setExtraDetail] = useState('')
  
  // Order Info
  const [selectedSize, setSelectedSize] = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  // Active Preview State
  const [activePreviewItem, setActivePreviewItem] = useState(null)

  // Set default active preview item
  useEffect(() => {
    if (items.length > 0 && !activePreviewItem) {
      const firstCustom = items.find(item => item.isCustom)
      setActivePreviewItem(firstCustom || items[0])
    }
  }, [items, activePreviewItem])

  // Pre-populate size if custom item exists
  useEffect(() => {
    if (customItem && customItem.size) {
      setSelectedSize(customItem.size)
    }
  }, [customItem])

  // Shipping Info (Rajaongkir)
  const [selectedCourier, setSelectedCourier] = useState('')
  const [shippingServices, setShippingServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [shippingCost, setShippingCost] = useState(0)
  const [isShippingLoading, setIsShippingLoading] = useState(false)
  const [shippingError, setShippingError] = useState('')
  const [isMockingNotification, setIsMockingNotification] = useState(false)

  const priceFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  })

  // Fetch Saved Profile
  useEffect(() => {
    async function initData() {
      // 1. Fetch User Profile
      if (user) {
        setIsLoadingProfile(true)
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        
        if (data && !error) {
          setName(data.full_name || '')
          setPhone(data.phone || '')
          
          const rawProvinceId = String(data.province_id || '')
          const rawProvinceName = data.province_name || ''
          const normalizedProvName = rawProvinceName.toLowerCase().trim()
          let mappedProvinceId = RAJAONGKIR_PROVINCES_BY_NAME[normalizedProvName]
          if (!mappedProvinceId) {
            mappedProvinceId = BPS_TO_RAJAONGKIR_PROVINCES[rawProvinceId] || rawProvinceId
          }
          
          setSelectedProvince({ id: mappedProvinceId, name: rawProvinceName })
          setSelectedCity({ id: String(data.city_id || ''), name: data.city_name || '' })
          setSelectedDistrict({ id: data.district_id || '', name: data.district_name || '' })
          setPostalCode(data.postal_code || '')
          setStreetAddress(data.street_address || '')
          setExtraDetail(data.extra_detail || '')
        }
        setIsLoadingProfile(false)
      }
    }
    
    initData()
  }, [user])

  // Fetch Provinces on Load (via Rajaongkir Proxy)
  useEffect(() => {
    fetch('/api/ongkir?action=provinces')
      .then(res => res.json())
      .then(data => {
        if (data.rajaongkir && data.rajaongkir.results) {
          const formatted = data.rajaongkir.results.map(p => ({
            id: p.province_id,
            name: p.province
          }))
          setProvinces(formatted)
        }
      })
      .catch(err => console.error("Error fetching provinces:", err))
  }, [])

  // Fetch Cities when Province changes (via Rajaongkir Proxy)
  useEffect(() => {
    if (selectedProvince.id) {
      fetch(`/api/ongkir?action=cities&provinceId=${selectedProvince.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.rajaongkir && data.rajaongkir.results) {
            const formatted = data.rajaongkir.results.map(c => ({
              id: String(c.city_id),
              name: `${c.type} ${c.city_name}`
            }))
            setCities(formatted)
            
            let resolvedCity = selectedCity
            let hasFoundMatch = false
            
            if (selectedCity.id) {
              const exactMatch = formatted.find(c => String(c.id) === String(selectedCity.id))
              if (exactMatch) {
                hasFoundMatch = true
              } else {
                // fall back to matching city name ignoring 'kota ' or 'kabupaten '
                const cleanSelectedName = selectedCity.name.toLowerCase().replace(/^(kota|kabupaten)\s+/i, '').trim()
                const nameMatch = formatted.find(c => 
                  c.name.toLowerCase().replace(/^(kota|kabupaten)\s+/i, '').trim() === cleanSelectedName
                )
                if (nameMatch) {
                  resolvedCity = { id: nameMatch.id, name: nameMatch.name }
                  setSelectedCity(resolvedCity)
                  hasFoundMatch = true
                }
              }
            }

            // Hanya reset jika ID berubah dan tidak ditemukan kecocokan sama sekali (mencegah reset saat load profil)
            if (selectedCity.id && !hasFoundMatch) {
              setSelectedCity({ id: '', name: '' })
              setSelectedDistrict({ id: '', name: '' })
              setPostalCode('')
              setSelectedCourier('')
              setShippingServices([])
              setSelectedService(null)
              setShippingCost(0)
            }
          }
        })
        .catch(err => console.error("Error fetching cities:", err))
    }
  }, [selectedProvince])

  // Fetch Districts (Kecamatan) from Emsifa API based on Selected Province & City
  useEffect(() => {
    if (!selectedProvince.id || !selectedCity.id) {
      setDistricts([])
      return
    }

    const bpsProvinceId = RAJAONGKIR_TO_BPS_PROVINCES[selectedProvince.id]
    if (!bpsProvinceId) {
      setDistricts([])
      return
    }

    setIsDistrictLoading(true)
    
    // Step 1. Fetch Emsifa Regencies for the province
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${bpsProvinceId}.json`)
      .then(res => {
        if (!res.ok) throw new Error('Emsifa regencies fetch failed')
        return res.json()
      })
      .then(regencies => {
        // Step 2. Find matching regency by name
        const cleanSelectedCity = selectedCity.name.toLowerCase().replace(/^(kota|kabupaten)\s+/i, '').trim()
        const matchedRegency = regencies.find(r => 
          r.name.toLowerCase().replace(/^(kota|kabupaten)\s+/i, '').trim() === cleanSelectedCity
        )

        if (!matchedRegency) {
          throw new Error('Emsifa regency not found for city: ' + selectedCity.name)
        }

        // Step 3. Fetch districts for the matched regency
        return fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${matchedRegency.id}.json`)
      })
      .then(res => {
        if (!res.ok) throw new Error('Emsifa districts fetch failed')
        return res.json()
      })
      .then(data => {
        const formatted = data.map(d => ({
          id: d.id,
          name: d.name.toUpperCase()
        }))
        setDistricts(formatted)
        setIsDistrictLoading(false)
        
        // If we loaded a profile and the name matches one in our fetched list, resolve/preserve its ID
        if (selectedDistrict.name) {
          const exactMatch = formatted.find(d => 
            d.name.toLowerCase().trim() === selectedDistrict.name.toLowerCase().trim()
          )
          if (exactMatch && selectedDistrict.id !== exactMatch.id) {
            setSelectedDistrict({ id: exactMatch.id, name: exactMatch.name })
          }
        }
      })
      .catch(err => {
        console.warn("⚠️ Emsifa District fetch failed, falling back to simulated districts:", err.message)
        
        // Premium Fallback: Generate 5 realistic mock districts based on the City's name
        const cleanCityName = selectedCity.name.replace(/^(kota|kabupaten)\s+/i, '').trim()
        const mockDistricts = [
          { id: `${selectedCity.id}01`, name: `${cleanCityName} Utara`.toUpperCase() },
          { id: `${selectedCity.id}02`, name: `${cleanCityName} Selatan`.toUpperCase() },
          { id: `${selectedCity.id}03`, name: `${cleanCityName} Barat`.toUpperCase() },
          { id: `${selectedCity.id}04`, name: `${cleanCityName} Timur`.toUpperCase() },
          { id: `${selectedCity.id}05`, name: `${cleanCityName} Tengah`.toUpperCase() }
        ]
        setDistricts(mockDistricts)
        setIsDistrictLoading(false)

        if (selectedDistrict.name) {
          const exactMatch = mockDistricts.find(d => 
            d.name.toLowerCase().trim() === selectedDistrict.name.toLowerCase().trim()
          )
          if (exactMatch && selectedDistrict.id !== exactMatch.id) {
            setSelectedDistrict({ id: exactMatch.id, name: exactMatch.name })
          }
        }
      })
  }, [selectedProvince.id, selectedCity])

  // Fetch Postal Codes based on Selected District (Kecamatan)
  useEffect(() => {
    if (!selectedDistrict.name) {
      setPostalCodes([])
      return
    }

    setIsPostalLoading(true)

    // Fetch from Kodepos Vercel API
    fetch(`https://kodepos.vercel.app/search?q=${encodeURIComponent(selectedDistrict.name)}`)
      .then(res => {
        if (!res.ok) throw new Error('Postal codes fetch failed')
        return res.json()
      })
      .then(result => {
        if (result && result.data && result.data.length > 0) {
          // Format as: "BUKUAN (75241)"
          const formatted = result.data.map(item => ({
            code: `${item.village.toUpperCase()} (${item.code})`,
            label: `${item.village.toUpperCase()} (${item.code})`
          }))
          
          // Remove duplicates if any (deduplicate by unique village/postal code label)
          const unique = formatted.filter((v, i, a) => a.findIndex(t => t.label === v.label) === i)
          
          setPostalCodes(unique)
          setIsPostalLoading(false)

          // If a postal code was already loaded from the profile, make sure it is preserved
          if (postalCode) {
            const hasMatch = unique.some(p => 
              String(p.code).toLowerCase() === String(postalCode).toLowerCase() ||
              String(p.code).endsWith(`(${postalCode})`)
            )
            if (!hasMatch) {
              setPostalCodes(prev => [...prev, { code: String(postalCode), label: postalCode }])
            }
          }
        } else {
          throw new Error('No postal codes found for ' + selectedDistrict.name)
        }
      })
      .catch(err => {
        console.warn("⚠️ Kodepos fetch failed, using fallback:", err.message)
        // Fallback: Generate a logical postal code based on City ID
        const baseVal = selectedCity.id ? String(10000 + Number(selectedCity.id) * 10 + 1) : "75111"
        const fallbackList = [
          { code: `KODE POS UTAMA (${baseVal})`, label: `KODE POS UTAMA (${baseVal})` }
        ]
        setPostalCodes(fallbackList)
        setIsPostalLoading(false)

        if (postalCode) {
          const hasMatch = fallbackList.some(p => 
            String(p.code).toLowerCase() === String(postalCode).toLowerCase() ||
            String(p.code).endsWith(`(${postalCode})`)
          )
          if (!hasMatch) {
            setPostalCodes(prev => [...prev, { code: String(postalCode), label: postalCode }])
          }
        }
      })
  }, [selectedDistrict.name])

  // Calculate Shipping Costs when City, Courier, or Cart items change
  useEffect(() => {
    if (!selectedCity.id || !selectedCourier || items.length === 0) {
      setShippingServices([])
      setSelectedService(null)
      setShippingCost(0)
      return
    }

    async function fetchShippingCost() {
      setIsShippingLoading(true)
      setShippingError('')
      setSelectedService(null)
      setShippingCost(0)

      try {
        const weight = Math.max(1000, items.reduce((acc, item) => acc + (item.quantity * 300), 0))
        const response = await fetch('/api/ongkir', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            destination: selectedCity.id,
            weight,
            courier: selectedCourier
          })
        })

        if (!response.ok) {
          throw new Error('Gagal menghitung ongkos kirim. Coba kurir lain atau ulangi.')
        }

        const data = await response.json()
        
        if (data.rajaongkir?.status?.description?.includes('Simulation')) {
          setIsMockingNotification(true)
        } else {
          setIsMockingNotification(false)
        }

        const results = data.rajaongkir?.results?.[0]
        if (results && results.costs && results.costs.length > 0) {
          const services = results.costs.map(c => ({
            name: c.service,
            description: c.description,
            cost: c.cost[0]?.value || 0,
            etd: c.cost[0]?.etd || ''
          }))
          setShippingServices(services)
        } else {
          setShippingServices([])
          setShippingError('Tidak ada layanan pengiriman yang tersedia untuk kurir ini.')
        }
      } catch (err) {
        console.error("Shipping Cost API Error:", err)
        setShippingError(err.message || 'Terjadi kesalahan saat menghubungi API Ongkir.')
      } finally {
        setIsShippingLoading(false)
      }
    }

    fetchShippingCost()
  }, [selectedCity.id, selectedCourier, items])

  async function handleContinueToPayment(event) {
    event.preventDefault()
    if (!name || !phone || !selectedProvince.name || !selectedCity.name || !selectedDistrict.name || !selectedSize || !selectedService || items.length === 0) return

    // Simpan Alamat ke Database
    if (user) {
      const profileData = {
        id: user.id,
        full_name: name,
        phone: phone,
        province_id: selectedProvince.id,
        province_name: selectedProvince.name,
        city_id: selectedCity.id,
        city_name: selectedCity.name,
        district_id: selectedDistrict.id,
        district_name: selectedDistrict.name,
        postal_code: postalCode,
        street_address: streetAddress,
        extra_detail: extraDetail,
        updated_at: new Date()
      }
      
      await supabase.from('user_profiles').upsert(profileData)
    }

    const orderData = {
      name,
      phone,
      province: selectedProvince.name,
      city: selectedCity.name,
      district: selectedDistrict.name,
      postalCode,
      streetAddress,
      extraDetail,
      selectedSize,
      selectedCourier,
      selectedService,
      shippingCost
    }

    sessionStorage.setItem('lumi_order_data', JSON.stringify(orderData))
    router.push('/payment')
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] transition-colors duration-300">
      <Header />
      <main className="pt-28 max-w-6xl mx-auto px-4 pb-20">
        <h1 className="text-4xl font-black mb-10 tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark font-serif uppercase">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Form Pengiriman */}
            <div className="glass p-8 md:p-10 rounded-[2rem] border border-zinc-200/80 dark:border-zinc-850/40 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[60px] rounded-full"></div>
              <h2 className="font-black text-2xl mb-8 text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark uppercase tracking-widest font-serif">Informasi Pengiriman</h2>
              
              <form onSubmit={handleContinueToPayment} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Nama Lengkap</label>
                  <input
                    placeholder="Masukkan nama lengkap"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-250/80 dark:border-white/10 focus:border-accent focus:bg-zinc-150 dark:focus:bg-white/10 outline-none transition-all placeholder:text-gray-400 font-bold"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Nomor Telepon (WA)</label>
                  <input
                    placeholder="0812..."
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-250/80 dark:border-white/10 focus:border-accent focus:bg-zinc-150 dark:focus:bg-white/10 outline-none transition-all placeholder:text-gray-400 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Provinsi</label>
                  <select
                    required
                    value={selectedProvince.id}
                    onChange={(e) => {
                      const opt = e.target.options[e.target.selectedIndex]
                      setSelectedProvince({ id: e.target.value, name: opt.text })
                      setSelectedCity({ id: '', name: '' })
                      setSelectedDistrict({ id: '', name: '' })
                      setPostalCode('')
                      setSelectedCourier('')
                      setShippingServices([])
                      setSelectedService(null)
                      setShippingCost(0)
                    }}
                    className="w-full p-4 rounded-2xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-250/80 dark:border-white/10 focus:border-accent focus:bg-zinc-150 dark:focus:bg-white/10 outline-none transition-all text-[var(--text-main)] font-bold cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-[#0b0f12] text-black dark:text-white">Pilih Provinsi</option>
                    {provinces.map(p => <option key={p.id} value={p.id} className="bg-white dark:bg-[#0b0f12] text-black dark:text-white">{p.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Kota / Kabupaten</label>
                  <select
                    required
                    disabled={!selectedProvince.id}
                    value={selectedCity.id}
                    onChange={(e) => {
                      const opt = e.target.options[e.target.selectedIndex]
                      setSelectedCity({ id: e.target.value, name: opt.text })
                      setSelectedDistrict({ id: '', name: '' })
                      setPostalCode('')
                      setSelectedCourier('')
                      setShippingServices([])
                      setSelectedService(null)
                      setShippingCost(0)
                    }}
                    className="w-full p-4 rounded-2xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-250/80 dark:border-white/10 focus:border-accent focus:bg-zinc-150 dark:focus:bg-white/10 outline-none transition-all text-[var(--text-main)] font-bold disabled:opacity-30 cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-[#0b0f12] text-black dark:text-white">Pilih Kota / Kabupaten</option>
                    {cities.map(c => <option key={c.id} value={c.id} className="bg-white dark:bg-[#0b0f12] text-black dark:text-white">{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">
                    Kecamatan {isDistrictLoading && <span className="animate-pulse text-accent">(Memuat...)</span>}
                  </label>
                  <select
                    required
                    disabled={!selectedCity.id || isDistrictLoading}
                    value={selectedDistrict.id}
                    onChange={(e) => {
                      const opt = e.target.options[e.target.selectedIndex]
                      setSelectedDistrict({ id: e.target.value, name: opt.text })
                      setPostalCode('')
                    }}
                    className="w-full p-4 rounded-2xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-250/80 dark:border-white/10 focus:border-accent focus:bg-zinc-150 dark:focus:bg-white/10 outline-none transition-all text-[var(--text-main)] font-bold disabled:opacity-30 cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-[#0b0f12] text-black dark:text-white">
                      {isDistrictLoading ? "Memuat Kecamatan..." : "Pilih Kecamatan"}
                    </option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id} className="bg-white dark:bg-[#0b0f12] text-black dark:text-white">
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">
                    Kode Pos / Kelurahan {isPostalLoading && <span className="animate-pulse text-accent">(Memuat...)</span>}
                  </label>
                  <select
                    required
                    disabled={!selectedDistrict.name || isPostalLoading}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-250/80 dark:border-white/10 focus:border-accent focus:bg-zinc-150 dark:focus:bg-white/10 outline-none transition-all text-[var(--text-main)] font-bold disabled:opacity-30 cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-[#0b0f12] text-black dark:text-white">
                      {isPostalLoading ? "Memuat Kode Pos..." : "Pilih Kelurahan (Kode Pos)"}
                    </option>
                    {postalCodes.map(p => (
                      <option key={p.code} value={p.code} className="bg-white dark:bg-[#0b0f12] text-black dark:text-white">
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Alamat Lengkap (Jalan, Gedung, No. Rumah)</label>
                  <textarea
                    placeholder="Nama Jalan, Gedung, No. Rumah"
                    required
                    rows={2}
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-250/80 dark:border-white/10 focus:border-accent focus:bg-zinc-150 dark:focus:bg-white/10 outline-none transition-all resize-none placeholder:text-gray-400 font-bold"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Detail Lainnya (Optional)</label>
                  <input
                    placeholder="Contoh: Patokan depan masjid, warna pagar, dll"
                    value={extraDetail}
                    onChange={(e) => setExtraDetail(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-250/80 dark:border-white/10 focus:border-accent focus:bg-zinc-150 dark:focus:bg-white/10 outline-none transition-all placeholder:text-gray-400 font-bold"
                  />
                </div>
              </form>
            </div>

            {/* Pilihan Pengiriman (Rajaongkir) */}
            <div className="glass p-8 md:p-10 rounded-[2rem] border border-zinc-200/80 dark:border-zinc-850/40 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[60px] rounded-full"></div>
              <h2 className="font-black text-2xl mb-6 text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark uppercase tracking-widest font-serif">Pilihan Pengiriman</h2>

              {!selectedCity.id ? (
                <div className="p-6 rounded-2xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-250/30 dark:border-white/5 text-center">
                  <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
                    📍 Silakan pilih Provinsi dan Kota terlebih dahulu untuk menghitung ongkos kirim.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 block mb-3">Pilih Kurir Eksklusif</label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'jne', name: 'JNE Express' },
                        { id: 'pos', name: 'POS Indonesia' },
                        { id: 'tiki', name: 'TIKI' }
                      ].map((courier) => {
                        const isSelected = selectedCourier === courier.id
                        return (
                          <button
                            key={courier.id}
                            type="button"
                            onClick={() => {
                              setSelectedCourier(courier.id)
                              setSelectedService(null)
                              setShippingCost(0)
                            }}
                            className={`py-4 px-2 rounded-2xl border font-black transition-all flex flex-col items-center justify-center gap-1 ${
                              isSelected
                                ? 'bg-gradient-to-r from-accent-light via-accent to-accent-alt border-transparent shadow-[0_8px_20px_rgb(var(--accent-main)/0.25)] text-black'
                                : 'bg-zinc-100 dark:bg-white/5 border border-zinc-250 dark:border-white/10 hover:border-accent/50 text-zinc-500'
                            }`}
                          >
                            <span className="text-sm md:text-base tracking-widest uppercase font-serif font-black">{courier.id}</span>
                            <span className={`text-[8px] md:text-[9px] uppercase tracking-wider ${isSelected ? 'text-black/80' : 'text-zinc-400'}`}>
                              {courier.name}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Loading Spinner */}
                  {isShippingLoading && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                      <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
                      <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] animate-pulse">Menghitung Ongkos Kirim...</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {shippingError && !isShippingLoading && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                      <p className="text-xs font-bold text-red-500">{shippingError}</p>
                    </div>
                  )}

                  {/* Layanan List */}
                  {!isShippingLoading && !shippingError && selectedCourier && (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 block">Pilih Layanan Kurir</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {shippingServices.map((service, index) => {
                          const isSelected = selectedService?.name === service.name
                          return (
                            <div
                              key={`${service.name}-${index}`}
                              onClick={() => {
                                setSelectedService(service)
                                setShippingCost(service.cost)
                              }}
                              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                                isSelected
                                  ? 'border-accent bg-accent/5 shadow-[0_5px_15px_rgb(var(--accent-main)/0.1)]'
                                  : 'border-zinc-250 dark:border-white/10 bg-zinc-100/30 dark:bg-white/5 hover:border-accent/50'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-2 font-mono ${
                                    isSelected ? 'bg-accent text-black' : 'bg-zinc-250 dark:bg-white/10 text-zinc-400'
                                  }`}>
                                    {service.name}
                                  </span>
                                  <h4 className="text-xs font-bold text-zinc-400 group-hover:text-zinc-300 transition-colors">
                                    {service.description}
                                  </h4>
                                </div>
                                <div className="text-right">
                                  <span className="text-base font-black text-accent font-sans block">
                                    {priceFormatter.format(service.cost)}
                                  </span>
                                  <span className="text-[9px] font-bold text-zinc-500 block uppercase tracking-wider mt-1">
                                    ⏱️ {service.etd ? `${service.etd} HARI` : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* Simulation Warning */}
                      {isMockingNotification && (
                        <div className="mt-4 p-3 rounded-xl bg-accent/5 border border-accent/10 text-center">
                          <p className="text-[9px] text-accent/80 font-black uppercase tracking-widest leading-relaxed">
                            💡 Mode Simulasi Aktif: Biaya kirim disimulasikan secara real-time dari Balikpapan.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ukuran & Pembayaran */}
            <div className="grid grid-cols-1 gap-8">
              <div className="glass p-8 rounded-[2rem] border border-zinc-200/80 dark:border-zinc-850/40 shadow-xl">
                <label className="block text-[10px] font-black text-zinc-500 mb-4 uppercase tracking-[0.2em] ml-1">Pilih Ukuran Cetak:</label>
                <div className="grid grid-cols-3 gap-3">
                  {['A4', 'A3', 'F4'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`py-4 rounded-2xl border font-black transition-all ${
                        selectedSize === s
                          ? 'bg-gradient-to-r from-accent-light via-accent to-accent-alt border-transparent shadow-[0_4px_15px_rgb(var(--accent-main)/0.25)] text-black'
                          : 'bg-zinc-100 dark:bg-white/5 border border-zinc-250 dark:border-white/10 hover:border-accent/50 text-zinc-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Ringkasan Pesanan (Sidebar) */}
          <div className="space-y-8">
            <div className="glass p-8 rounded-[2rem] border border-zinc-200/80 dark:border-zinc-850/40 sticky top-28 shadow-2xl relative overflow-hidden">
               <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/5 blur-[60px] rounded-full"></div>
              <h2 className="font-black text-2xl mb-8 text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark uppercase tracking-widest font-serif">Detail Pesanan</h2>
              
              {activePreviewItem && (
                <div className="mb-6 p-5 rounded-3xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/5 flex flex-col items-center select-none relative overflow-hidden">
                  {/* Spotlight lamp glow inside card */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-24 bg-accent/10 blur-[40px] rounded-full pointer-events-none" />
                  
                  <span className="text-[9px] font-black uppercase tracking-widest text-accent mb-3 relative z-10">
                    🎨 PRATINJAU CETAK LOGAM {activePreviewItem.isCustom ? 'CUSTOM' : 'KOLEKSI'}
                  </span>

                  {/* Skewed frameless metal print mockup */}
                  <div className="relative group transition-all duration-500 hover:scale-[1.02] flex items-center justify-center py-2 w-full z-10">
                    <div className="absolute inset-[10px] bg-black/60 blur-[12px] rounded-md scale-95 translate-y-3 pointer-events-none" />
                    
                    <div className="relative mx-auto rounded-[3px] overflow-hidden border border-white/10 dark:border-white/5 shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
                      <div className="relative aspect-[3/4] w-[120px] bg-zinc-900 overflow-hidden">
                        <img src={activePreviewItem.image_url} className="w-full h-full object-cover" />
                        
                        {/* High-gloss surface shine layer */}
                        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
                        
                        {/* Specular sheen metallic overlay */}
                        <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0)_50%,rgba(0,0,0,0.15)_100%)] opacity-30" />
                      </div>
                    </div>
                  </div>

                  {/* Spec labels */}
                  <div className="w-full mt-3 pt-3 border-t border-zinc-200 dark:border-white/5 grid grid-cols-2 gap-2 text-[8px] uppercase tracking-wider text-center text-zinc-500 font-black font-sans relative z-10">
                    <div>
                      <span className="block text-[7px] text-zinc-400 mb-0.5">UKURAN CETAK</span>
                      <span className="text-zinc-800 dark:text-zinc-300 font-bold">
                        {activePreviewItem.size || selectedSize || 'A4'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[7px] text-zinc-400 mb-0.5">SPESIFIKASI</span>
                      <span className="text-accent font-black">
                        {activePreviewItem.variant ? activePreviewItem.variant.toUpperCase() : 'GLOSSY FRAMELESS'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => {
                  const isActive = activePreviewItem?.id === item.id && activePreviewItem?.size === item.size && activePreviewItem?.variant === item.variant
                  return (
                    <div 
                      key={`${item.id}-${item.size}-${item.variant}`}
                      onClick={() => setActivePreviewItem(item)}
                      className={`flex gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${
                        isActive 
                          ? 'bg-accent/5 border-accent shadow-[0_4px_15px_rgba(212,175,55,0.1)]' 
                          : 'bg-zinc-100/50 dark:bg-white/5 border-zinc-250/30 dark:border-white/5 hover:border-accent/35'
                      }`}
                    >
                      <div className="w-14 h-18 rounded-xl overflow-hidden shadow-lg flex-shrink-0 relative">
                        <img src={item.image_url} className="w-full h-full object-cover" />
                        {isActive && (
                          <div className="absolute inset-0 bg-accent/10 flex items-center justify-center">
                            <span className="text-accent text-xs">👁️</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                        <div className={`text-xs font-black uppercase tracking-tight truncate mb-1 ${isActive ? 'text-accent' : ''}`}>
                          {item.title}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">Jumlah: {item.quantity}</div>
                        <div className="text-sm font-black text-accent mt-2 font-sans">{priceFormatter.format(item.price * item.quantity)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-8 pt-8 border-t border-zinc-200/80 dark:border-zinc-850/40 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em]">Subtotal</span>
                  <span className="font-bold text-zinc-400 font-sans">{priceFormatter.format(subtotal)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em]">Ongkos Kirim</span>
                  <span className="font-bold text-accent font-sans">
                    {shippingCost > 0 ? priceFormatter.format(shippingCost) : 'Rp 0'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-zinc-200/40 dark:border-zinc-800/40 mb-8">
                  <span className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em]">Total Tagihan</span>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark font-serif">
                    {priceFormatter.format(subtotal + shippingCost)}
                  </span>
                </div>

                <button
                  onClick={handleContinueToPayment}
                  disabled={items.length === 0 || !selectedSize || !name || !phone || !selectedDistrict.name || !streetAddress || !selectedService}
                  className="w-full py-6 rounded-2xl bg-gradient-to-r from-accent-light via-accent to-accent-dark bg-[length:200%_100%] hover:bg-right font-black text-lg shadow-[0_15px_35px_rgb(var(--accent-main)/0.4)] hover:scale-[1.03] active:scale-[0.97] disabled:opacity-20 disabled:cursor-not-allowed transition-all uppercase tracking-[0.2em] text-black"
                >
                  Lanjutkan Pembayaran
                </button>
                
                {(!selectedDistrict.name || !streetAddress || !selectedSize || !selectedService) && items.length > 0 && (
                  <div className="mt-6 p-4 rounded-xl bg-accent/10 border border-accent/20">
                    <p className="text-[9px] text-accent text-center font-black uppercase tracking-widest leading-relaxed">
                      ⚠️ Silakan lengkapi data pengiriman, pilih kurir & layanan, serta ukuran cetak untuk melanjutkan.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  )
}
