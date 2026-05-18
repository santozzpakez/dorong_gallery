import Header from '../components/Header'
import Footer from '../components/Footer'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'

export default function Custom(){
  const router = useRouter()
  const { addItem } = useCart()
  const { lang } = useLanguage()
  const [file, setFile] = useState(null)
  const [material, setMaterial] = useState('Poster - Matte')
  const [size, setSize] = useState('24x36 cm')

  const translations = {
    id: {
      title: 'Pemesanan Sublimasi Custom',
      dragDrop: 'Seret & letakkan gambar di sini, atau klik untuk mengunggah',
      customNote: 'Catatan tambahan',
      addToCart: 'Tambahkan ke Cart',
      productName: 'Desain Sublimasi Custom'
    },
    en: {
      title: 'Custom Sublimation Order',
      dragDrop: 'Drag & drop an image here, or click to upload',
      customNote: 'Custom note',
      addToCart: 'Add to Cart',
      productName: 'Custom Sublimation Design'
    },
    jp: {
      title: 'カスタム昇華プリント注文',
      dragDrop: 'ここに画像をドラッグ＆ドロップするか、クリックしてアップロードしてください',
      customNote: 'カスタムメモ',
      addToCart: 'カートに追加',
      productName: 'カスタム昇華デザイン'
    },
    kr: {
      title: '커스텀 승화 인쇄 주문',
      dragDrop: '여기로 이미지를 드래그 앤 드롭하거나 클릭하여 업로드하세요',
      customNote: '사용자 지정 메모',
      addToCart: '장바구니에 담기',
      productName: '커스텀 승화 디자인'
    },
    cn: {
      title: '定制热升华订单',
      dragDrop: '将图像拖放到此处，或单击以进行上传',
      customNote: '定制备注',
      addToCart: '加入购物车',
      productName: '定制热升华设计'
    }
  }

  const t = translations[lang] || translations.id

  function handleDrop(e){
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if(f) setFile(URL.createObjectURL(f))
  }

  function handleAddToCart() {
    if (!file) return
    const itemKey = `custom-${material}-${size}-${Date.now()}`
    addItem({
      itemKey,
      id: 'custom-design',
      name: t.productName,
      price: 129000,
      image: file,
      variant: material,
      size
    })
    router.push('/cart')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07090b] to-[#0b0f12] text-white">
      <Header />
      <main className="pt-28 max-w-4xl mx-auto px-4">
        {/* Banner Box */}
        <div className="mb-8 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-[#6d0099] via-[#9d4edd] to-[#ff007f] dark:from-[#3a0066] dark:via-[#7b00cc] dark:to-[#cc0066] text-white shadow-xl relative overflow-hidden border border-[#ff007f]/30 dark:border-[#b026ff]/30">
          {/* Subtle cyber grid pattern background */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
          
          <div className="relative z-10">
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-widest text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]">
              {t.title}
            </h1>
          </div>
        </div>

        <div className="glass rounded-lg p-6">
          <div onDragOver={(e)=>e.preventDefault()} onDrop={handleDrop} className="border-2 border-dashed border-gray-700 p-8 rounded-md text-center">
            {!file ? (
              <>
                <p className="text-gray-300">{t.dragDrop}</p>
                <input type="file" accept="image/*" className="mt-4" onChange={(e)=>{const f=e.target.files?.[0]; if(f) setFile(URL.createObjectURL(f))}} />
              </>
            ) : (
              <div>
                <img src={file} className="mx-auto max-h-72 object-contain" />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="p-2 rounded bg-black/30"
                  >
                    <option>Poster - Matte</option>
                    <option>Poster - Glossy</option>
                    <option>Sublimation - Fabric</option>
                  </select>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="p-2 rounded bg-black/30"
                  >
                    <option>24x36 cm</option>
                    <option>30x40 cm</option>
                    <option>40x60 cm</option>
                  </select>
                </div>
                <textarea placeholder={t.customNote} className="mt-3 w-full p-3 rounded bg-black/20" />
                <div className="mt-4 text-right">
                  <button
                    onClick={handleAddToCart}
                    className="px-4 py-2 rounded bg-gradient-to-r from-glow to-gray-700"
                  >
                    {t.addToCart}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </main>
    </div>
  )
}
