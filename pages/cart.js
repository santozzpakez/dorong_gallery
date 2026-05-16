import Header from '../components/Header'
import Footer from '../components/Footer'
import Link from 'next/link'
import { useCart } from '../context/CartContext'

export default function Cart(){
  const { items, removeItem, updateQuantity, subtotal } = useCart()
  const priceFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07090b] to-[#0b0f12] text-white">
      <Header />
      <main className="pt-28 max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Cart</h1>
        <div className="glass p-6 rounded">
          {items.length === 0 ? (
            <p className="text-gray-300">Your cart is empty. Add products to continue checkout.</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.itemKey}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-white/10 pb-4"
                >
                  <div className="flex items-center gap-4">
                    {item.image_url && <img src={item.image_url} className="w-16 h-16 object-cover rounded-lg shadow-md border border-white/10" />}
                    <div>
                      <p className="font-semibold text-glow">{item.title || item.name || 'Produk'}</p>
                      <p className="text-sm text-gray-400">{item.category} {item.subcategory ? `· ${item.subcategory}` : ''}</p>
                      <p className="text-sm font-bold text-pink-400 mt-1">{priceFormatter.format(item.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.itemKey, item.quantity - 1)}
                      className="px-2 py-1 rounded bg-white/10"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.itemKey, item.quantity + 1)}
                      className="px-2 py-1 rounded bg-white/10"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.itemKey)}
                      className="ml-2 text-sm text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="text-xl font-bold">Total: <span className="text-pink-400">{priceFormatter.format(subtotal)}</span></div>
          <Link
            href="/checkout"
            className={`px-8 py-3 rounded-xl font-bold text-lg transition-all ${
              items.length === 0 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
            }`}
          >
            Lanjut ke Checkout
          </Link>
        </div>
        <Footer />
      </main>
    </div>
  )
}
