import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [adminRole, setAdminRole] = useState(null) // 'superior', 'regular', or null
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    const fetchRole = async (u) => {
      if (!u) return null
      const { data } = await supabase
        .from('site_admins')
        .select('role')
        .eq('email', u.email)
        .maybeSingle()
      return data?.role || null
    }

    // 1. Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        const role = await fetchRole(session.user)
        setAdminRole(role)
      }
      setLoading(false)
    })

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        const role = await fetchRole(session.user)
        setAdminRole(role)
      } else {
        setUser(null)
        setAdminRole(null)
      }
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  const loginWithApple = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: window.location.origin }
    })
  }

  const loginWithPhone = async (phone, fullName) => {
    // Supabase supports phone OTP
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        data: {
          full_name: fullName // Metadata akan tersimpan di auth.users (user_metadata)
        }
      }
    })
    return { data, error }
  }

  const verifyOtp = async (phone, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    })
    return { data, error }
  }

  const loginWithPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setAdminRole(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, loading, adminRole, loginWithGoogle, loginWithApple, loginWithPhone, verifyOtp, loginWithPassword, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
