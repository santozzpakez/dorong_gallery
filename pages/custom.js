import Header from '../components/Header'
import Footer from '../components/Footer'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import Head from 'next/head'
import { supabase } from '../lib/supabaseClient'

export default function Custom() {
  const router = useRouter()
  const { addItem } = useCart()
  const { lang } = useLanguage()

  // Mode Pengunggahan: 'single' atau 'multi'
  const [uploadMode, setUploadMode] = useState('single')

  // State Konfigurasi (Single Mode)
  const [file, setFile] = useState(null)
  const [rawFile, setRawFile] = useState(null)
  const [size, setSize] = useState('A4')
  const [customNote, setCustomNote] = useState('')

  // State Konfigurasi (Multi Mode)
  const [multiFiles, setMultiFiles] = useState([])
  const [activeMultiIndex, setActiveMultiIndex] = useState(0)

  // Loading state
  const [isUploading, setIsUploading] = useState(false)

  const translations = {
    id: {
      title: 'Studio Sublimasi Custom',
      subtitle: 'Cetak foto, ilustrasi, atau karya seni kustom Anda sendiri pada panel logam sublimasi berdaya tahan tinggi tanpa bingkai (frameless).',
      dragDrop: 'Seret & letakkan desain kustom Anda di sini, atau klik untuk menjelajahi berkas',
      customNote: 'Instruksi Khusus (Contoh: "Minta tolong dicrop kotak/kecerahan dinaikkan")',
      checkoutBtn: 'Lanjutkan ke Checkout ✧',
      addToCart: 'Tambahkan ke Cart',
      productName: 'Custom Metal Print Sublimation',
      chooseFile: 'Pilih Berkas Gambar',
      configuration: 'Panel Konfigurasi',
      previewTitle: 'Studio Pratinjau Dinding',
      sizeOption: 'Ukuran Cetak',
      noteOption: 'Catatan Kustomisasi',
      totalCost: 'Total Biaya',
      changeDesign: 'Ganti Desain',
      customMockup: 'Kustom Mockup',
      singleMode: 'Cetak 1 Gambar',
      multiMode: 'Cetak Banyak Gambar',
      activeImage: 'Pengaturan Gambar Terpilih',
      addImage: 'Tambah Gambar Lain',
      uploadLimit: 'Format: JPG, PNG. Maksimal 10 gambar sekaligus.'
    },
    en: {
      title: 'Custom Sublimation Studio',
      subtitle: 'Print your own custom photos, illustrations, or artwork on sleek, frameless high-durability sublimation metal panels.',
      dragDrop: 'Drag & drop your custom design here, or click to browse files',
      customNote: 'Special Instructions (e.g. "Please crop square/increase brightness")',
      checkoutBtn: 'Proceed to Checkout ✧',
      addToCart: 'Add to Cart',
      productName: 'Custom Metal Print Sublimation',
      chooseFile: 'Choose Image File',
      configuration: 'Configuration Panel',
      previewTitle: 'Wall Studio Preview',
      sizeOption: 'Print Size',
      noteOption: 'Custom Note',
      totalCost: 'Total Cost',
      changeDesign: 'Change Design',
      customMockup: 'Custom Mockup',
      singleMode: 'Print 1 Image',
      multiMode: 'Print Multiple Images',
      activeImage: 'Configure Selected Image',
      addImage: 'Add Another Image',
      uploadLimit: 'Format: JPG, PNG. Max 10 images at once.'
    },
    jp: {
      title: 'カスタム昇華スタジオ',
      subtitle: 'お気に入りの写真やイラスト、アートワークをスタイリッシュなフレームレスのメタルプリントとして再現。',
      dragDrop: 'ここにカスタムデザインをドラッグ＆ドロップするか、クリックしてファイルを選択してください',
      customNote: '特別な指示（例：「正方形にトリミングして明るさを上げてください」など）',
      checkoutBtn: 'レジに進む ✧',
      addToCart: 'カートに追加',
      productName: 'カスタムメタルプリント昇華',
      chooseFile: '画像ファイルを選択',
      configuration: '構成パネル',
      previewTitle: 'ウォールスタジオプレビュー',
      sizeOption: 'プリントサイズ',
      noteOption: 'カスタムメモ',
      totalCost: '総費用',
      changeDesign: 'デザインを変更',
      customMockup: 'カスタムモックアップ',
      singleMode: '1枚の画像を印刷',
      multiMode: '複数枚の画像を印刷',
      activeImage: '選択した画像の設定',
      addImage: '別の画像を追加',
      uploadLimit: 'フォーマット：JPG、PNG。一度に最大10枚。'
    },
    kr: {
      title: '커스텀 승화 메탈 프린트 스튜디오',
      subtitle: '원하는 사진, 일러스트 또는 작품을 테두리가 없는(frameless) 세련된 승화 메탈 패널에 인쇄해 보세요.',
      dragDrop: '여기에 커스텀 디자인을 드래그 앤 드롭하거나 클릭하여 파일을 선택하세요',
      customNote: '특별 지시사항 (예: "정사각형으로 자르고 밝기를 높여주세요")',
      checkoutBtn: '결제 진행하기 ✧',
      addToCart: '장바구니 담기',
      productName: '커스텀 승화 메탈 프린팅',
      chooseFile: '이미지 파일 선택',
      configuration: '설정 패널',
      previewTitle: '벽면 스튜디오 미리보기',
      sizeOption: '인쇄 크기',
      noteOption: '사용자 지정 메모',
      totalCost: '총 결제 금액',
      changeDesign: '디자인 변경',
      customMockup: '커스텀 모크업',
      singleMode: '이미지 1장 인쇄',
      multiMode: '여러 이미지 인쇄',
      activeImage: '선택한 이미지 설정',
      addImage: '다른 이미지 추가',
      uploadLimit: '형식: JPG, PNG. 한 번에 최대 10장.'
    },
    cn: {
      title: '定制热升华工艺工作室',
      subtitle: '将您自己的定制照片、插画 or 艺术作品，制作成极具现代感的无边框（frameless）金属升华板画。',
      dragDrop: '将您的定制设计拖放到此处，或单击以浏览文件',
      customNote: '特别要求说明（例如：“请帮忙剪裁为正方形/调高亮度”）',
      checkoutBtn: '立即前往结账 ✧',
      addToCart: '立即结账 ✧',
      productName: '定制金属升华板画',
      chooseFile: '选择图片文件',
      configuration: '配置面板',
      previewTitle: '墙壁工作室预览',
      sizeOption: '印刷尺寸',
      noteOption: '定制说明',
      totalCost: '总计费用',
      changeDesign: '更改设计',
      customMockup: '定制模型预览',
      singleMode: '打印单张图片',
      multiMode: '批量打印多张图片',
      activeImage: '配置当前选中的图片',
      addImage: '添加其他图片',
      uploadLimit: '格式：JPG、PNG。一次最多10张。'
    }
  }

  const t = translations[lang] || translations.id

  // Hitung harga dinamis berdasarkan ukuran
  const getPriceForSize = (s) => {
    if (s === 'A3') return 199000
    if (s === 'F4') return 149000
    return 129000 // default A4
  }

  // Hitung total harga
  const getTotalCost = () => {
    if (uploadMode === 'single') {
      return getPriceForSize(size)
    } else {
      return multiFiles.reduce((sum, item) => sum + getPriceForSize(item.size), 0)
    }
  }

  const priceFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  })

  // Multi-upload helper
  const addFilesToMulti = (filesList) => {
    const newItems = []
    
    for (let i = 0; i < filesList.length; i++) {
      const f = filesList[i]
      if (f.type.startsWith('image/')) {
        const itemKey = `multi-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`
        const newItem = {
          itemKey,
          rawFile: f,
          file: '', // Preview data URL
          size: 'A4',
          customNote: ''
        }
        newItems.push(newItem)
        
        const reader = new FileReader()
        reader.onload = (e) => {
          setMultiFiles(prev => prev.map(item => 
            item.itemKey === itemKey ? { ...item, file: e.target.result } : item
          ))
        }
        reader.readAsDataURL(f)
      }
    }
    
    setMultiFiles(prev => {
      const updated = [...prev, ...newItems]
      // Set active preview to the first newly added image
      setActiveMultiIndex(prev.length)
      return updated
    })
  }

  function handleDrop(e) {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (!files || files.length === 0) return
    
    if (uploadMode === 'single') {
      const f = files[0]
      if (f && f.type.startsWith('image/')) {
        setRawFile(f)
        const reader = new FileReader()
        reader.onload = (uploadEvent) => {
          setFile(uploadEvent.target.result)
        }
        reader.readAsDataURL(f)
      }
    } else {
      addFilesToMulti(files)
    }
  }

  function handleFileChange(e) {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    if (uploadMode === 'single') {
      const f = files[0]
      if (f) {
        setRawFile(f)
        const reader = new FileReader()
        reader.onload = (uploadEvent) => {
          setFile(uploadEvent.target.result)
        }
        reader.readAsDataURL(f)
      }
    } else {
      addFilesToMulti(files)
    }
    e.target.value = '' // Reset input
  }

  // Update spesifikasi untuk file kustom aktif di multi-mode
  const updateActiveMultiFile = (key, value) => {
    setMultiFiles(prev => prev.map((item, idx) => 
      idx === activeMultiIndex ? { ...item, [key]: value } : item
    ))
  }

  // Hapus salah satu berkas dari multi-mode
  const removeMultiFile = (idxToRemove) => {
    setMultiFiles(prev => {
      const filtered = prev.filter((_, idx) => idx !== idxToRemove)
      // Sesuaikan index aktif
      if (activeMultiIndex >= filtered.length) {
        setActiveMultiIndex(Math.max(0, filtered.length - 1))
      }
      return filtered
    })
  }

  async function handleProceedToCheckout() {
    if (uploadMode === 'single') {
      if (!file) return
      
      let imageUrl = file
      
      if (rawFile && supabase) {
        setIsUploading(true)
        try {
          const cleanName = rawFile.name.replace(/[^a-zA-Z0-9.]/g, '_')
          const filePath = `products/custom-${Date.now()}-${cleanName}`
          
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, rawFile, {
              upsert: true,
              contentType: rawFile.type || 'image/jpeg',
              cacheControl: '31536000'
            })
            
          if (uploadError) {
            console.error("Upload error details:", uploadError)
            throw new Error(uploadError.message)
          }
          
          const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath)
            
          if (data && data.publicUrl) {
            imageUrl = data.publicUrl
          }
        } catch (err) {
          console.error("Gagal mengunggah gambar kustom:", err)
          alert("Gagal mengunggah berkas gambar Anda ke server. Silakan coba berkas lain atau coba lagi.")
          setIsUploading(false)
          return
        }
      }

      const itemKey = `custom-glossy-frameless-${size}-${Date.now()}`
      
      // Simpan ke keranjang belanja
      addItem({
        itemKey,
        id: 'custom-design',
        title: `${t.productName} (${size})`,
        price: getPriceForSize(size),
        image_url: imageUrl,
        image: imageUrl,
        variant: 'Glossy Frameless',
        size: size,
        quantity: 1,
        isCustom: true,
        customFrame: 'None (Frameless)',
        customFinish: 'Glossy Premium',
        customNote: customNote
      })

      setIsUploading(false)
      router.push('/checkout')
    } else {
      // Multi Mode Checkout
      if (multiFiles.length === 0) return
      
      setIsUploading(true)
      try {
        // Upload all files in parallel to Supabase Storage
        const uploadPromises = multiFiles.map(async (item, idx) => {
          let imageUrl = item.file // Fallback preview dataurl jika storage terganggu
          
          if (item.rawFile && supabase) {
            const cleanName = item.rawFile.name.replace(/[^a-zA-Z0-9.]/g, '_')
            const filePath = `products/custom-${Date.now()}-${idx}-${cleanName}`
            
            const { error: uploadError } = await supabase.storage
              .from('product-images')
              .upload(filePath, item.rawFile, {
                upsert: true,
                contentType: item.rawFile.type || 'image/jpeg',
                cacheControl: '31536000'
              })
              
            if (uploadError) throw new Error(uploadError.message)
            
            const { data } = supabase.storage
              .from('product-images')
              .getPublicUrl(filePath)
              
            if (data && data.publicUrl) {
              imageUrl = data.publicUrl
            }
          }
          
          return {
            ...item,
            imageUrl
          }
        })
        
        const uploadedItems = await Promise.all(uploadPromises)
        
        // Tambahkan masing-masing file sebagai produk kustom tersendiri ke cart
        uploadedItems.forEach((item, index) => {
          const itemKey = `custom-glossy-frameless-${item.size}-${Date.now()}-${index}`
          addItem({
            itemKey,
            id: `custom-design-${Date.now()}-${index}`, // ID unik agar terdaftar sebagai item terpisah
            title: `${t.productName} #${index + 1} (${item.size})`,
            price: getPriceForSize(item.size),
            image_url: item.imageUrl,
            image: item.imageUrl,
            variant: 'Glossy Frameless',
            size: item.size,
            quantity: 1,
            isCustom: true,
            customFrame: 'None (Frameless)',
            customFinish: 'Glossy Premium',
            customNote: item.customNote
          })
        })
      } catch (err) {
        console.error("Gagal mengunggah gambar kustom:", err)
        alert("Gagal mengunggah beberapa berkas gambar Anda ke server. Silakan coba kembali.")
        setIsUploading(false)
        return
      }
      
      setIsUploading(false)
      router.push('/checkout')
    }
  }

  // Variabel pratinjau yang sedang aktif/dipilih
  const activePreviewUrl = uploadMode === 'single' ? file : multiFiles[activeMultiIndex]?.file
  const activePreviewSize = uploadMode === 'single' ? size : multiFiles[activeMultiIndex]?.size

  return (
    <>
      <Head>
        <title>{t.title} — LUMI FORGE</title>
        <meta name="description" content={t.subtitle} />
      </Head>

      <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] transition-colors duration-300">
        <Header />
        
        <main className="pt-36 max-w-6xl mx-auto px-4 pb-24">
          {/* Banner Judul Bertema Emas Mewah */}
          <div className="text-center mb-16 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 bg-accent/5 blur-3xl pointer-events-none rounded-full" />
            <span className="px-6 py-2 rounded-full border border-yellow-250/30 bg-gradient-to-r from-accent/20 to-accent-alt/20 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-accent mb-4 inline-flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.1)] relative z-10">
              ✧ BESPOKE CONFIGURATOR ✧
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-widest text-zinc-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-b dark:from-white dark:via-zinc-200 dark:to-zinc-500 font-serif uppercase mt-4 relative z-10">
              {t.title}
            </h1>
            <p className="mt-4 text-xs md:text-sm text-zinc-555 dark:text-zinc-400 max-w-2xl mx-auto font-sans leading-relaxed relative z-10">
              {t.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative z-10">
            {/* KOLOM KIRI: LIVE WALL MOCKUP STUDIO (5/12 cols) */}
            <div className="lg:col-span-6 xl:col-span-5 space-y-4">
              <h2 className="text-xs font-black tracking-[0.2em] uppercase text-zinc-400 ml-1 flex items-center gap-2">
                <span>🖼️</span> {t.previewTitle}
              </h2>
              
              {/* Studio Backdrop Frame */}
              <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#181a20] via-[#0d0d10] to-[#070709] border border-white/5 shadow-2xl p-8 flex flex-col justify-between aspect-square items-center select-none">
                
                {/* Spotlight Lamp Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[240px] h-[180px] bg-accent/15 blur-[70px] rounded-full pointer-events-none" />
                
                {/* Ambient Grid Lines on Wall */}
                <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

                {/* Sizing Indicator Overlay - Top Left */}
                {activePreviewUrl && (
                  <span className="absolute top-4 left-4 z-20 text-[9px] font-black uppercase tracking-widest bg-zinc-950/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 text-accent shadow-lg animate-fade-in">
                    📐 {activePreviewSize} CONFIG
                  </span>
                )}

                {/* Interactive Mockup Container */}
                <div className="flex-1 flex items-center justify-center w-full relative">
                  {!activePreviewUrl ? (
                    <div className="text-center space-y-4 p-6 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-950/20 max-w-xs relative z-10 animate-pulse">
                      <span className="text-4xl block">📁</span>
                      <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">{t.dragDrop.split(',')[0]}</p>
                    </div>
                  ) : (
                    // Sleek frameless metal plate mockup with realistic shadow
                    <div className="relative group transition-all duration-700 hover:-translate-y-3 hover:scale-[1.03]">
                      
                      {/* Realistic 3D floating shadow */}
                      <div className="absolute inset-[8px] bg-black/70 blur-[18px] rounded scale-95 translate-y-6 group-hover:translate-y-8 group-hover:blur-[22px] transition-all duration-700 pointer-events-none" />
                      
                      {/* Frameless Metal Plate Frame Container */}
                      <div className="relative mx-auto rounded-[3px] overflow-hidden transition-all duration-500 border border-white/10 dark:border-white/5 shadow-inner">
                        
                        {/* Image inside frameless container */}
                        <div className="relative aspect-[3/4] w-[200px] sm:w-[240px] bg-zinc-900 overflow-hidden">
                          <img 
                            src={activePreviewUrl} 
                            alt="Custom Preview" 
                            className="w-full h-full object-cover relative z-0" 
                          />

                          {/* Glossy sheen glass reflection layer */}
                          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-tr from-transparent via-white/18 to-transparent" />

                          {/* Metallic specular sheen overlay */}
                          <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0)_50%,rgba(0,0,0,0.15)_100%)] opacity-40" />
                          <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulated Wood Studio Tabletop Base */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-[#3a281a] via-[#24170d] to-[#120a05] border-t border-amber-800/25 flex items-center justify-center">
                  <div className="w-[85%] h-[1px] bg-white/5 blur-sm" />
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: CONFIGURATION PANEL (7/12 cols) */}
            <div className="lg:col-span-6 xl:col-span-7 space-y-6">
              <div className="glass p-8 md:p-10 rounded-[2rem] border border-zinc-200/80 dark:border-zinc-850/40 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[50px] rounded-full pointer-events-none" />
                
                <h2 className="font-black text-2xl mb-6 text-zinc-900 dark:text-transparent dark:bg-clip-text bg-gradient-to-b dark:from-accent-light dark:via-accent dark:to-accent-dark uppercase tracking-widest font-serif flex items-center gap-3">
                  <span className="w-1.5 h-6 rounded bg-accent"></span>
                  {t.configuration}
                </h2>

                {/* Mode Selector Toggle */}
                <div className="grid grid-cols-2 gap-4 bg-zinc-100/50 dark:bg-black/40 p-1.5 rounded-2xl border border-zinc-250/30 dark:border-white/5 mb-8">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isUploading) setUploadMode('single')
                    }}
                    className={`py-3 px-2 rounded-xl text-center font-black uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-1.5 ${
                      uploadMode === 'single'
                        ? 'bg-gradient-to-r from-accent-light via-accent to-accent-alt text-black shadow-lg shadow-accent/15'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    📸 {t.singleMode}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isUploading) setUploadMode('multi')
                    }}
                    className={`py-3 px-2 rounded-xl text-center font-black uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-1.5 ${
                      uploadMode === 'multi'
                        ? 'bg-gradient-to-r from-accent-light via-accent to-accent-alt text-black shadow-lg shadow-accent/15'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    🎞️ {t.multiMode}
                  </button>
                </div>

                {/* ======================================================== */}
                {/* SINGLE MODE UPLOAD CONTROL PANEL */}
                {/* ======================================================== */}
                {uploadMode === 'single' && (
                  <div className="space-y-6">
                    {/* DROPZONE FILE UPLOAD */}
                    <div 
                      onDragOver={(e) => e.preventDefault()} 
                      onDrop={handleDrop} 
                      className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
                        file 
                          ? 'border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-950/20' 
                          : 'border-accent/40 dark:border-accent/20 hover:border-accent bg-zinc-50/30 dark:bg-black/20 hover:bg-zinc-50/50 dark:hover:bg-black/35 cursor-pointer'
                      }`}
                    >
                      {!file ? (
                        <label className="cursor-pointer block space-y-4">
                          <div className="text-4xl">📤</div>
                          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-300">
                            {t.dragDrop.split('di sini')[0]}
                          </h3>
                          <p className="text-[10px] uppercase tracking-widest text-zinc-555">
                            {t.dragDrop.split('di sini')[1] || t.dragDrop}
                          </p>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileChange} 
                          />
                          <span className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-accent text-black font-black uppercase tracking-widest text-[9px] hover:scale-105 active:scale-95 transition-all shadow-md">
                            {t.chooseFile} ✧
                          </span>
                        </label>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-white/10 shadow-lg flex-shrink-0">
                              <img src={file} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-tight text-zinc-800 dark:text-white">Desain Berhasil Dimuat</h4>
                              <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">Status: Siap Cetak Sublimasi</p>
                            </div>
                          </div>
                          <button
                            onClick={() => { setFile(null); setRawFile(null); }}
                            className="px-4 py-2 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 font-black uppercase tracking-widest text-[9px] transition-all"
                          >
                            ✕ {t.changeDesign}
                          </button>
                        </div>
                      )}
                    </div>

                    {file && (
                      <div className="space-y-6 animate-slide-up">
                        {/* OPSI UKURAN */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                            <span>📐</span> {t.sizeOption}
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { id: 'A4', name: 'A4 Size', sub: '21 x 30 cm' },
                              { id: 'F4', name: 'F4 Size', sub: '21 x 33 cm' },
                              { id: 'A3', name: 'A3 Size', sub: '30 x 42 cm' }
                            ].map(s => {
                              const isSelected = size === s.id
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => setSize(s.id)}
                                  className={`p-4 rounded-2xl border font-black transition-all flex flex-col items-center justify-center text-center gap-0.5 ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-accent-light via-accent to-accent-alt border-transparent shadow-[0_5px_15px_rgba(212,175,55,0.2)] text-black'
                                      : 'bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:border-accent/40 text-zinc-500'
                                  }`}
                                >
                                  <span className="text-xs tracking-wider uppercase font-black">{s.name}</span>
                                  <span className={`text-[8px] uppercase tracking-wider ${isSelected ? 'text-black/75' : 'text-zinc-500'}`}>
                                    {s.sub}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* SPESIFIKASI DEFAULT INFO */}
                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-black/35 border border-zinc-200 dark:border-white/5 text-xs text-zinc-500 font-bold uppercase tracking-wider space-y-1">
                          <div className="flex justify-between">
                            <span>Finishing Permukaan:</span>
                            <span className="text-accent font-black">Glossy Premium (Bawaan)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gaya Tampilan:</span>
                            <span className="text-accent font-black">Frameless (Tanpa Bingkai)</span>
                          </div>
                        </div>

                        {/* CATATAN KHUSUS */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 block">{t.noteOption}</label>
                          <textarea 
                            placeholder={t.customNote} 
                            value={customNote}
                            onChange={(e) => setCustomNote(e.target.value)}
                            rows={2}
                            className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 focus:border-accent outline-none text-sm placeholder:text-zinc-500 font-bold transition-all resize-none" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ======================================================== */}
                {/* MULTI MODE UPLOAD CONTROL PANEL */}
                {/* ======================================================== */}
                {uploadMode === 'multi' && (
                  <div className="space-y-6">
                    {/* GALLERY MULTI THUMBNAILS LIST */}
                    {multiFiles.length > 0 && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 block">Daftar Foto Unggahan Anda:</label>
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar select-none">
                          {multiFiles.map((item, idx) => {
                            const isActive = idx === activeMultiIndex
                            return (
                              <div
                                key={item.itemKey}
                                onClick={() => setActiveMultiIndex(idx)}
                                className={`w-16 h-20 rounded-xl overflow-hidden cursor-pointer relative border-2 shrink-0 transition-all ${
                                  isActive ? 'border-accent shadow-[0_0_12px_rgba(212,175,55,0.4)] scale-105' : 'border-zinc-700/40 opacity-60 hover:opacity-100'
                                }`}
                              >
                                <img src={item.file} className="w-full h-full object-cover" />
                                <div className="absolute top-1 right-1 bg-black/80 w-4 h-4 rounded-full flex items-center justify-center border border-white/10 text-[8px] text-white">
                                  {idx + 1}
                                </div>
                              </div>
                            )
                          })}

                          {/* "Add More" Thumbnail Button */}
                          <label className="w-16 h-20 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950/20 hover:border-accent shrink-0 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-black/20">
                            <span className="text-xl text-zinc-555 hover:text-accent">+</span>
                            <span className="text-[6.5px] uppercase tracking-wider font-black text-zinc-600 mt-1">TAMBAH</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* DROPZONE MULTI (Jika file masih kosong) */}
                    {multiFiles.length === 0 && (
                      <div 
                        onDragOver={(e) => e.preventDefault()} 
                        onDrop={handleDrop} 
                        className="border-2 border-dashed rounded-3xl p-8 text-center border-accent/40 dark:border-accent/20 hover:border-accent bg-zinc-50/30 dark:bg-black/20 hover:bg-zinc-50/50 dark:hover:bg-black/35 cursor-pointer"
                      >
                        <label className="cursor-pointer block space-y-4">
                          <div className="text-4xl">🎞️</div>
                          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-300">
                            {t.dragDrop.split('di sini')[0]}
                          </h3>
                          <p className="text-[9px] uppercase tracking-widest text-zinc-555">
                            {t.uploadLimit}
                          </p>
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple
                            className="hidden" 
                            onChange={handleFileChange} 
                          />
                          <span className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-accent text-black font-black uppercase tracking-widest text-[9px] hover:scale-105 active:scale-95 transition-all shadow-md">
                            Pilih Beberapa Gambar ✧
                          </span>
                        </label>
                      </div>
                    )}

                    {/* CONFIGURATION AREA FOR SELECTED ACTIVE MULTI IMAGE */}
                    {multiFiles.length > 0 && multiFiles[activeMultiIndex] && (
                      <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-black/20 border border-zinc-250/50 dark:border-white/5 space-y-5 animate-fade-in">
                        
                        {/* Title of Active Image */}
                        <div className="flex justify-between items-center border-b border-zinc-200 dark:border-white/5 pb-3">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-accent">
                            ⚙️ {t.activeImage} #{activeMultiIndex + 1}
                          </h3>
                          <button
                            type="button"
                            onClick={() => removeMultiFile(activeMultiIndex)}
                            className="text-[8px] font-black text-red-500 uppercase tracking-widest hover:underline"
                          >
                            ✕ Hapus Gambar Ini
                          </button>
                        </div>

                        {/* OPSI UKURAN UNTUK GAMBAR TERPILIH */}
                        <div className="space-y-3">
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-1">
                            <span>📐</span> {t.sizeOption} (Gambar #{activeMultiIndex + 1})
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { id: 'A4', name: 'A4 Size', sub: '21 x 30 cm' },
                              { id: 'F4', name: 'F4 Size', sub: '21 x 33 cm' },
                              { id: 'A3', name: 'A3 Size', sub: '30 x 42 cm' }
                            ].map(s => {
                              const isSelected = multiFiles[activeMultiIndex].size === s.id
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => updateActiveMultiFile('size', s.id)}
                                  className={`p-3.5 rounded-2xl border font-black transition-all flex flex-col items-center justify-center text-center gap-0.5 ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-accent-light via-accent to-accent-alt border-transparent shadow-[0_4px_12px_rgba(212,175,55,0.2)] text-black'
                                      : 'bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:border-accent/40 text-zinc-500'
                                  }`}
                                >
                                  <span className="text-[10px] tracking-wider uppercase font-black">{s.name}</span>
                                  <span className={`text-[7.5px] uppercase tracking-wider ${isSelected ? 'text-black/75' : 'text-zinc-500'}`}>
                                    {s.sub}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* CATATAN KHUSUS UNTUK GAMBAR TERPILIH */}
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 block">{t.noteOption} (Gambar #{activeMultiIndex + 1})</label>
                          <textarea 
                            placeholder={t.customNote} 
                            value={multiFiles[activeMultiIndex].customNote}
                            onChange={(e) => updateActiveMultiFile('customNote', e.target.value)}
                            rows={2}
                            className="w-full p-4 rounded-2xl bg-zinc-100 dark:bg-black/30 border border-zinc-200 dark:border-white/10 focus:border-accent outline-none text-xs placeholder:text-zinc-500 font-bold transition-all resize-none" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ======================================================== */}
                {/* COST SUMMARY & CHECKOUT BUTTON (Shared for both modes) */}
                {/* ======================================================== */}
                {((uploadMode === 'single' && file) || (uploadMode === 'multi' && multiFiles.length > 0)) && (
                  <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="text-left w-full sm:w-auto">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">
                        {t.totalCost}
                      </span>
                      <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#dfb342] via-[#bf953f] to-[#8a5d19] dark:from-accent-light dark:via-accent dark:to-accent-dark font-serif block">
                        {priceFormatter.format(getTotalCost())}
                      </span>
                    </div>

                    <button
                      onClick={handleProceedToCheckout}
                      disabled={isUploading}
                      className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-gradient-to-r from-accent-light via-accent to-accent-dark hover:bg-right font-black shadow-[0_12px_25px_rgb(212,175,55,0.25)] hover:scale-[1.03] active:scale-[0.97] transition-all uppercase tracking-[0.15em] text-xs text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                          <span>Mengunggah {uploadMode === 'multi' ? `${multiFiles.length} Gambar` : 'Gambar'}...</span>
                        </>
                      ) : (
                        t.checkoutBtn
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
