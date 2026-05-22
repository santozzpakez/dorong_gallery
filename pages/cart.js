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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] transition-colors duration-300">
      <Header />
      <main className="pt-28 max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-black mb-6 uppercase tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark font-serif">Cart</h1>
        <div className="glass p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-850/40 shadow-xl">
          {items.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400 font-bold">Your cart is empty. Add products to continue checkout.</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.itemKey}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-zinc-200/60 dark:border-zinc-850/30 pb-4"
                >
                  <div className="flex items-center gap-4">
                    {item.image_url && <img src={item.image_url} className="w-16 h-16 object-cover rounded-lg shadow-md border border-zinc-200/50 dark:border-zinc-800/30" />}
                    <div>
                      <p className="font-bold text-[var(--text-main)] font-sans">{item.title || item.name || 'Produk'}</p>
                      <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">{item.category} {item.subcategory ? `· ${item.subcategory}` : ''}</p>
                      <p className="text-sm font-black text-accent mt-1 font-sans">{priceFormatter.format(item.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.itemKey, item.quantity - 1)}
                      className="px-2 py-1 rounded bg-zinc-200/60 dark:bg-zinc-800/40 text-[var(--text-main)] hover:bg-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.itemKey, item.quantity + 1)}
                      className="px-2 py-1 rounded bg-zinc-200/60 dark:bg-zinc-800/40 text-[var(--text-main)] hover:bg-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.itemKey)}
                      className="ml-2 text-xs font-black uppercase text-red-500 dark:text-red-400 tracking-wider hover:underline"
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
          <div className="text-xl font-bold">Total: <span className="text-accent font-black">{priceFormatter.format(subtotal)}</span></div>
          <Link
            href="/checkout"
            className={`px-8 py-3 rounded-xl font-black text-lg transition-all ${
              items.length === 0 
                ? 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-650 cursor-not-allowed opacity-50' 
                : 'bg-gradient-to-r from-accent-light via-accent to-accent-alt hover:brightness-110 shadow-[0_4px_20px_rgb(var(--accent-main)/0.25)] text-black font-black uppercase tracking-widest'
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
