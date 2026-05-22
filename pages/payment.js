import Header from '../components/Header'
import Footer from '../components/Footer'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabaseClient'

const PAYMENT_OPTIONS = [
  { id: 'gopay', name: 'GoPay', color: '#00AED6', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg' },
  { id: 'ovo', name: 'OVO', color: '#4C3494', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg' },
  { id: 'dana', name: 'DANA', color: '#118EEA', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg' },
  { id: 'shopeepay', name: 'ShopeePay', color: '#EE4D2D', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg' },
  { id: 'qris', name: 'QRIS', color: '#ED1C24', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg' },
  { id: 'bca_va', name: 'BCA Virtual Account', color: '#0066AE', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg' },
  { id: 'mandiri_va', name: 'Mandiri Virtual Account', color: '#F2C94C', logo: 'https://upload.wikimedia.org/wikipedia/en/f/fa/Bank_Mandiri_logo.svg' },
  { id: 'cc_dc', name: 'Debit/Credit Card', color: '#333333', logo: 'https://cdn-icons-png.flaticon.com/512/6963/6963703.png' }
]


export default function Payment() {
  const router = useRouter()
  const { items, subtotal } = useCart()
  
  const [orderData, setOrderData] = useState(null)
  const [selectedPayment, setSelectedPayment] = useState('')
  const [adminPhone, setAdminPhone] = useState('')
  const [admins, setAdmins] = useState([])
  const [showAdminModal, setShowAdminModal] = useState(false)

  const priceFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  })

  useEffect(() => {
    // Load order data from sessionStorage
    const savedData = sessionStorage.getItem('lumi_order_data')
    if (savedData) {
      setOrderData(JSON.parse(savedData))
    } else {
      // If no order data is found, redirect back to checkout
      router.push('/checkout')
    }

    async function fetchAdmins() {
      const hardcodedAdmins = [
        { name: 'Admin Utama', phone: '491633949013' },
        { name: 'Admin Kedua', phone: '6285183050120' }
      ]

      try {
        const { data, error } = await supabase.from('whatsapp_contacts').select('*').order('created_at', { ascending: true })
        if (!error && data && data.length > 0) {
          setAdmins(data)
          setAdminPhone(data[0].phone)
        } else {
          setAdmins(hardcodedAdmins)
          setAdminPhone(hardcodedAdmins[0].phone)
        }
      } catch (err) {
        setAdmins(hardcodedAdmins)
        setAdminPhone(hardcodedAdmins[0].phone)
      }
    }

    fetchAdmins()
  }, [router])

  function handlePayNow(event) {
    event.preventDefault()
    if (!orderData || !selectedPayment || items.length === 0) return

    // Tampilkan modal pilih admin untuk SEMUA metode pembayaran
    setShowAdminModal(true)
  }

  function processPayment(targetPhone) {
    const baseUrl = window.location.origin;
    let message = `Halo LUMI FORGE, saya ingin memesan:\n\n`
    
    items.forEach((item, index) => {
      const itemName = item.title || item.name || 'Produk'
      message += `${index + 1}. ${itemName} (x${item.quantity})\n`
      message += `   Harga: ${priceFormatter.format(item.price)}\n`
      if (item.image_url) {
        message += `   📥 Download: ${item.image_url}?download=\n`
      }
      message += `   🔗 Produk: ${baseUrl}/product/${item.id}\n\n`
    })

    message += `*Ukuran yang dipilih: ${orderData.selectedSize}*\n`
    message += `*Metode Pembayaran: ${selectedPayment}*\n`
    message += `*Kurir Pengiriman: ${orderData.selectedCourier.toUpperCase()} (${orderData.selectedService?.name} - ${orderData.selectedService?.description})*\n`
    message += `*Estimasi Pengiriman: ${orderData.selectedService?.etd} Hari*\n`
    message += `*Subtotal Produk: ${priceFormatter.format(subtotal)}*\n`
    message += `*Ongkos Kirim: ${priceFormatter.format(orderData.shippingCost)}*\n`
    message += `*Total Pembayaran: ${priceFormatter.format(subtotal + orderData.shippingCost)}*\n\n`
    
    message += `*Data Pengiriman:*\n`
    message += `- Nama: ${orderData.name}\n`
    message += `- No. Telp: ${orderData.phone}\n`
    message += `- Wilayah: ${orderData.province} > ${orderData.city} > ${orderData.district}\n`
    message += `- Kode Pos: ${orderData.postalCode}\n`
    message += `- Alamat: ${orderData.streetAddress}\n`
    if (orderData.extraDetail) message += `- Detail Lain: ${orderData.extraDetail}\n`

    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
    
    window.open(waUrl, '_blank')
    setShowAdminModal(false)
  }

  if (!orderData) return null // Wait until mounted and loaded

  const totalPayment = subtotal + (orderData.shippingCost || 0)

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] transition-colors duration-300">
      <Header />
      <main className="pt-32 max-w-6xl mx-auto px-4 pb-20">
        <h1 className="text-3xl font-black mb-8 tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark font-serif uppercase text-center">Pembayaran</h1>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Bagian Kiri: Ringkasan Tagihan & Tombol Bayar */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="glass p-8 rounded-[2rem] border border-zinc-200/80 dark:border-zinc-850/40 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[60px] rounded-full"></div>
              <h2 className="font-black text-lg mb-6 text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark uppercase tracking-widest font-serif text-center">Total Tagihan</h2>
              
              <div className="flex flex-col items-center justify-center space-y-4">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark font-serif tracking-widest text-center">
                  {priceFormatter.format(totalPayment)}
                </span>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">
                  Termasuk ongkos kirim {priceFormatter.format(orderData.shippingCost)}
                </p>
              </div>
            </div>

            <button
              onClick={handlePayNow}
              disabled={!selectedPayment}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-accent-light via-accent to-accent-dark bg-[length:200%_100%] hover:bg-right font-black text-base shadow-[0_15px_35px_rgb(var(--accent-main)/0.4)] hover:scale-[1.03] active:scale-[0.97] disabled:opacity-20 disabled:cursor-not-allowed transition-all uppercase tracking-[0.2em] text-black"
            >
              Bayar Sekarang
            </button>
          </div>

          {/* Bagian Kanan: Pemilihan Metode Pembayaran */}
          <div className="w-full lg:w-2/3 glass p-8 rounded-[2rem] border border-zinc-200/80 dark:border-zinc-850/40 shadow-2xl relative overflow-hidden">
             <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/5 blur-[60px] rounded-full"></div>
            <h2 className="font-black text-lg mb-6 text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark uppercase tracking-widest font-serif text-center">Pilih Metode Pembayaran</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {PAYMENT_OPTIONS.map((payment) => {
                const isSelected = selectedPayment === payment.name
                return (
                  <button
                    key={payment.id}
                    type="button"
                    onClick={() => setSelectedPayment(payment.name)}
                    style={{
                      borderColor: isSelected ? payment.color : undefined,
                      boxShadow: isSelected ? `0 4px 20px ${payment.color}30` : undefined,
                    }}
                    className={`py-4 px-3 rounded-2xl border font-black transition-all text-xs sm:text-sm text-center flex flex-col justify-center items-center gap-3 ${
                      isSelected
                        ? 'bg-zinc-100 dark:bg-white/10 scale-[1.02]'
                        : 'bg-zinc-100 dark:bg-white/5 border-zinc-250 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 text-zinc-500 hover:scale-[1.01]'
                    }`}
                  >
                    <div className="h-10 w-full flex items-center justify-center bg-white rounded-xl p-1.5 shadow-sm">
                      <img src={payment.logo} alt={payment.name} className="max-h-full max-w-[80%] object-contain" />
                    </div>
                    <span style={{ color: isSelected ? payment.color : 'inherit' }}>
                      {payment.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Pilih Admin */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b0f12] border border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowAdminModal(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
            >
              ✕
            </button>
            <h3 className="font-black text-xl mb-2 text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark uppercase tracking-widest font-serif">Pilih Admin</h3>
            <p className="text-xs text-zinc-400 mb-6">Pilih admin yang akan menerima konfirmasi transfer manualmu via WhatsApp.</p>
            
            <div className="space-y-4">
              {admins.map((adm) => (
                <button
                  key={adm.phone}
                  onClick={() => processPayment(adm.phone)}
                  className="w-full p-4 rounded-xl border border-zinc-800 hover:border-accent bg-zinc-900/50 hover:bg-accent/10 transition-all text-left flex justify-between items-center group"
                >
                  <div>
                    <div className="font-bold text-white group-hover:text-accent transition-colors">{adm.name}</div>
                    <div className="text-xs text-zinc-500">{adm.phone}</div>
                  </div>
                  <div className="text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
