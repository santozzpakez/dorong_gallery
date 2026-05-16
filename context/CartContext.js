import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabaseClient'

const STORAGE_KEY = 'dorong_cart_v1'
const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [isReady, setIsReady] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setItems(parsed)
      }
    } catch (error) {
      console.error('Failed to read cart from storage', error)
    } finally {
      setIsReady(true)
    }
  }, [])

  // ── 2. Sync with Database when User Logged In ──
  useEffect(() => {
    if (!isReady || !user || !supabase) return

    async function syncCart() {
      try {
        const { data, error } = await supabase
          .from('user_carts')
          .select('items')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!error && data) {
          const dbItems = data.items || []
          setItems(prev => {
            const merged = [...dbItems]
            prev.forEach(localItem => {
              const exists = merged.find(i => i.id === localItem.id)
              if (!exists) merged.push(localItem)
            })
            return merged
          })
        }
      } catch (err) { console.error('Sync error:', err) }
    }

    syncCart()
  }, [user, isReady])

  // ── 3. Save Changes to LocalStorage & Database ──
  useEffect(() => {
    if (!isReady || typeof window === 'undefined') return
    
    // Save to Local
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))

    // Save to Database (jika user login)
    if (user && supabase) {
      const saveToDb = async () => {
        try {
          await supabase
            .from('user_carts')
            .upsert({ 
              user_id: user.id, 
              items: items, 
              updated_at: new Date() 
            })
        } catch (err) { console.error('Save to DB error:', err) }
      }
      saveToDb()
    }
  }, [items, isReady, user])

  function addItem(item) {
    setItems((prev) => {
      const existing = prev.find(
        (entry) =>
          entry.id === item.id &&
          entry.variant === item.variant &&
          entry.size === item.size
      )

      if (existing) {
        return prev.map((entry) =>
          entry === existing
            ? { ...entry, quantity: entry.quantity + (item.quantity || 1) }
            : entry
        )
      }

      return [...prev, { ...item, quantity: item.quantity || 1 }]
    })
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function updateQuantity(id, quantity) {
    if (quantity < 1) return
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    )
  }

  function clearCart() {
    setItems([])
  }

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  )

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      subtotal
    }),
    [items, totalItems, subtotal]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
