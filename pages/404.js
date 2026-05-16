import Link from 'next/link'
import Head from 'next/head'

export default function NotFoundPage() {
  return (
    <>
      <Head>
        <title>Halaman tidak ditemukan — Dorong Gallery</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-[#07090b] to-[#0b0f12] text-white flex flex-col items-center justify-center px-6">
        <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-2">404</p>
        <h1 className="text-3xl font-bold text-center mb-2">Halaman tidak ditemukan</h1>
        <p className="text-gray-400 text-center max-w-md mb-8">
          Cek lagi URL-nya. Katalog produk admin ada di <strong className="text-gray-300">/katalog</strong> (bukan /catalog).
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">
            Beranda
          </Link>
          <Link href="/katalog" className="px-4 py-2 rounded-lg bg-gradient-to-r from-glow to-gray-700 text-sm">
            Katalog
          </Link>
          <Link href="/admin" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">
            Admin
          </Link>
        </div>
      </div>
    </>
  )
}
