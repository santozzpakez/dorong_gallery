import Header from '../components/Header'
import Footer from '../components/Footer'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function Checkout(){
  const router = useRouter()
  const { items, subtotal, clearCart } = useCart()
  const { user } = useAuth()
  
  // Basic Info
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  
  // Location Info
  const [provinces, setProvinces] = useState([])
  const [cities, setCities] = useState([])
  const [districts, setDistricts] = useState([])
  
  const [selectedProvince, setSelectedProvince] = useState({ id: '', name: '' })
  const [selectedCity, setSelectedCity] = useState({ id: '', name: '' })
  const [selectedDistrict, setSelectedDistrict] = useState({ id: '', name: '' })
  const [postalCodes, setPostalCodes] = useState([])
  const [postalCode, setPostalCode] = useState('')
  
  // Detail Address
  const [streetAddress, setStreetAddress] = useState('')
  const [extraDetail, setExtraDetail] = useState('')
  
  // Order Info
  const [selectedSize, setSelectedSize] = useState('')
  const [adminPhone, setAdminPhone] = useState('')
  const [admins, setAdmins] = useState([])
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  const priceFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  })

  // Fetch Admins & Saved Profile
  useEffect(() => {
    async function initData() {
      const hardcodedAdmins = [
        { name: 'Admin Utama', phone: '491633949013' },
        { name: 'Admin Kedua', phone: '6285183050120' }
      ]

      // 1. Fetch WA Admins
      try {
        const { data: waData, error: waErr } = await supabase.from('whatsapp_contacts').select('*').order('created_at', { ascending: true })
        if (!waErr && waData && waData.length > 0) {
          setAdmins(waData)
          setAdminPhone(waData[0].phone)
        } else {
          setAdmins(hardcodedAdmins)
          setAdminPhone(hardcodedAdmins[0].phone)
        }
      } catch (err) {
        setAdmins(hardcodedAdmins)
        setAdminPhone(hardcodedAdmins[0].phone)
      }

      // 2. Fetch User Profile
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
          setSelectedProvince({ id: data.province_id || '', name: data.province_name || '' })
          setSelectedCity({ id: data.city_id || '', name: data.city_name || '' })
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

  // Fetch Provinces on Load
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error("Error fetching provinces:", err))
  }, [])

  // Fetch Cities when Province changes
  useEffect(() => {
    if (selectedProvince.id) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvince.id}.json`)
        .then(res => res.json())
        .then(data => {
          setCities(data)
          setDistricts([])
          setPostalCodes([])
          // Hanya reset jika ID berubah (mencegah reset saat load profil)
          if (selectedCity.id && !data.some(c => c.id === selectedCity.id)) {
            setSelectedCity({ id: '', name: '' })
            setSelectedDistrict({ id: '', name: '' })
            setPostalCode('')
          }
        })
        .catch(err => console.error("Error fetching cities:", err))
    }
  }, [selectedProvince])

  // Fetch Districts when City changes
  useEffect(() => {
    if (selectedCity.id) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedCity.id}.json`)
        .then(res => res.json())
        .then(data => {
          setDistricts(data)
          setPostalCodes([])
          // Hanya reset jika ID berubah
          if (selectedDistrict.id && !data.some(d => d.id === selectedDistrict.id)) {
            setSelectedDistrict({ id: '', name: '' })
            setPostalCode('')
          }
        })
        .catch(err => console.error("Error fetching districts:", err))
    }
  }, [selectedCity])

  // Fetch Postal Codes when District changes
  useEffect(() => {
    if (selectedDistrict.name) {
      fetch(`https://kodepos.vercel.app/search/?q=${selectedDistrict.name}`)
        .then(res => res.json())
        .then(data => {
          if (data.status && data.data) {
            const filtered = data.data.filter(item => 
              item.city.toLowerCase().includes(selectedCity.name.toLowerCase().replace('KOTA ', '').replace('KABUPATEN ', ''))
            )
            setPostalCodes(filtered.length > 0 ? filtered : data.data)
            // Hanya auto-set jika belum ada kode pos (mencegah override saat load profil)
            if (!postalCode && filtered.length === 1) setPostalCode(filtered[0].postalcode)
          }
        })
        .catch(err => console.error("Error fetching postal codes:", err))
    }
  }, [selectedDistrict, selectedCity.name])

  async function handlePlaceOrder(event) {
    event.preventDefault()
    if (!name || !phone || !selectedProvince.name || !selectedCity.name || !selectedDistrict.name || !selectedSize || items.length === 0) return

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

    const baseUrl = window.location.origin;
    let message = `Halo Dorong Gallery, saya ingin memesan:\n\n`
    
    items.forEach((item, index) => {
      const itemName = item.title || item.name || 'Produk'
      message += `${index + 1}. ${itemName} (x${item.quantity})\n`
      message += `   Harga: ${priceFormatter.format(item.price)}\n`
      if (item.image_url) {
        message += `   📥 Download: ${item.image_url}?download=\n`
      }
      message += `   🔗 Produk: ${baseUrl}/product/${item.id}\n\n`
    })

    message += `*Ukuran yang dipilih: ${selectedSize}*\n`
    message += `*Total: ${priceFormatter.format(subtotal)}*\n\n`
    
    message += `*Data Pengiriman:*\n`
    message += `- Nama: ${name}\n`
    message += `- No. Telp: ${phone}\n`
    message += `- Wilayah: ${selectedProvince.name} > ${selectedCity.name} > ${selectedDistrict.name}\n`
    message += `- Kode Pos: ${postalCode}\n`
    message += `- Alamat: ${streetAddress}\n`
    if (extraDetail) message += `- Detail Lain: ${extraDetail}\n`

    const waUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`
    window.open(waUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07090b] to-[#0b0f12] text-white">
      <Header />
      <main className="pt-28 max-w-6xl mx-auto px-4 pb-20">
        <h1 className="text-4xl font-black mb-10 text-glow tracking-tighter uppercase">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Form Pengiriman */}
            <div className="glass p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-[60px] rounded-full"></div>
              <h2 className="font-black text-2xl mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase tracking-widest">Informasi Pengiriman</h2>
              
              <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Nama Lengkap</label>
                  <input
                    placeholder="Masukkan nama lengkap"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all placeholder:text-gray-600 font-bold"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Nomor Telepon (WA)</label>
                  <input
                    placeholder="0812..."
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all placeholder:text-gray-600 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Provinsi</label>
                  <select
                    required
                    value={selectedProvince.id}
                    onChange={(e) => {
                      const opt = e.target.options[e.target.selectedIndex]
                      setSelectedProvince({ id: e.target.value, name: opt.text })
                    }}
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all text-white font-bold cursor-pointer"
                  >
                    <option value="" className="bg-[#0b0f12]">Pilih Provinsi</option>
                    {provinces.map(p => <option key={p.id} value={p.id} className="bg-[#0b0f12]">{p.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Kota / Kabupaten</label>
                  <select
                    required
                    disabled={!selectedProvince.id}
                    value={selectedCity.id}
                    onChange={(e) => {
                      const opt = e.target.options[e.target.selectedIndex]
                      setSelectedCity({ id: e.target.value, name: opt.text })
                    }}
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all text-white font-bold disabled:opacity-30 cursor-pointer"
                  >
                    <option value="" className="bg-[#0b0f12]">Pilih Kota</option>
                    {cities.map(c => <option key={c.id} value={c.id} className="bg-[#0b0f12]">{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Kecamatan</label>
                  <select
                    required
                    disabled={!selectedCity.id}
                    value={selectedDistrict.id}
                    onChange={(e) => {
                      const opt = e.target.options[e.target.selectedIndex]
                      setSelectedDistrict({ id: e.target.value, name: opt.text })
                    }}
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all text-white font-bold disabled:opacity-30 cursor-pointer"
                  >
                    <option value="" className="bg-[#0b0f12]">Pilih Kecamatan</option>
                    {districts.map(d => <option key={d.id} value={d.id} className="bg-[#0b0f12]">{d.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                    Kode Pos {selectedDistrict.name && postalCodes.length === 0 ? '(Mencari...)' : ''}
                  </label>
                  {postalCodes.length > 0 ? (
                    <select
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all text-white font-bold cursor-pointer"
                    >
                      <option value="" className="bg-[#0b0f12]">Pilih Kode Pos</option>
                      {postalCodes.map((pc, idx) => (
                        <option key={`${pc.postalcode}-${idx}`} value={pc.postalcode} className="bg-[#0b0f12]">
                          {pc.postalcode} ({pc.urban})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      placeholder="Masukkan Kode Pos"
                      required
                      disabled={!selectedDistrict.name}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all placeholder:text-gray-600 font-bold disabled:opacity-30"
                    />
                  )}
                  {selectedDistrict.name && postalCodes.length === 0 && (
                    <p className="text-[9px] text-gray-500 mt-1 italic">*Jika tidak muncul, silakan ketik manual</p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Alamat Lengkap (Jalan, Gedung, No. Rumah)</label>
                  <textarea
                    placeholder="Nama Jalan, Gedung, No. Rumah"
                    required
                    rows={2}
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all resize-none placeholder:text-gray-600 font-bold"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Detail Lainnya (Optional)</label>
                  <input
                    placeholder="Contoh: Patokan depan masjid, warna pagar, dll"
                    value={extraDetail}
                    onChange={(e) => setExtraDetail(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all placeholder:text-gray-600 font-bold"
                  />
                </div>
              </form>
            </div>

            {/* Pilihan Admin & Ukuran */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass p-8 rounded-[2.5rem] border border-white/10">
                <label className="block text-[10px] font-black text-gray-500 mb-4 uppercase tracking-[0.2em] ml-1">Kirim Order ke:</label>
                <select
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-500 outline-none transition-all text-white font-bold cursor-pointer"
                >
                  {admins.map((adm) => (
                    <option key={adm.phone} value={adm.phone} className="bg-[#0b0f12]">
                      {adm.name} ({adm.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="glass p-8 rounded-[2.5rem] border border-white/10">
                <label className="block text-[10px] font-black text-gray-500 mb-4 uppercase tracking-[0.2em] ml-1">Pilih Ukuran Cetak:</label>
                <div className="grid grid-cols-3 gap-3">
                  {['A4', 'A3', 'F4'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`py-4 rounded-2xl border font-black transition-all ${
                        selectedSize === s
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-transparent shadow-[0_0_20px_rgba(168,85,247,0.4)] text-white'
                          : 'bg-white/5 border-white/10 hover:border-white/30 text-gray-500'
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
            <div className="glass p-8 rounded-[2.5rem] border border-white/10 sticky top-28 shadow-2xl relative overflow-hidden">
               <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-600/10 blur-[60px] rounded-full"></div>
              <h2 className="font-black text-2xl mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 uppercase tracking-widest">Detail Pesanan</h2>
              
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                    <div className="w-14 h-18 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                      <img src={item.image_url} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="text-xs font-black uppercase tracking-tight truncate mb-1">{item.title}</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase">Jumlah: {item.quantity}</div>
                      <div className="text-sm font-black text-purple-400 mt-2">{priceFormatter.format(item.price * item.quantity)}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-gray-500 font-black uppercase text-[10px] tracking-[0.2em]">Total Tagihan</span>
                  <span className="text-3xl font-black text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">{priceFormatter.format(subtotal)}</span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={items.length === 0 || !selectedSize || !name || !phone || !selectedDistrict.name || !streetAddress}
                  className="w-full py-6 rounded-2xl bg-gradient-to-r from-[#25D366] via-[#128C7E] to-[#25D366] bg-[length:200%_100%] hover:bg-right font-black text-lg shadow-[0_15px_35px_rgba(37,211,102,0.4)] hover:scale-[1.03] active:scale-[0.97] disabled:opacity-20 disabled:cursor-not-allowed transition-all uppercase tracking-[0.2em] text-white"
                >
                  Order via WhatsApp
                </button>
                
                {(!selectedDistrict.name || !streetAddress || !selectedSize) && items.length > 0 && (
                  <div className="mt-6 p-4 rounded-xl bg-pink-500/10 border border-pink-500/20">
                    <p className="text-[9px] text-pink-400 text-center font-black uppercase tracking-widest leading-relaxed">
                      ⚠️ Silakan lengkapi data pengiriman & pilih ukuran cetak untuk melanjutkan.
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
