import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'

export default function Login() {
  const router = useRouter()
  const { lang } = useLanguage()
  const { theme } = useTheme()
  const { loginWithGoogle, loginWithApple, loginWithPhone, verifyOtp, loginWithPassword } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState(1) // 1: Phone/Email, 2: OTP
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('signin') // 'signin' or 'signup'

  const t = {
    id: {
      welcome: mode === 'signin' ? 'Selamat Datang' : 'Buat Akun',
      desc: mode === 'signin' ? 'Masuk untuk melanjutkan ke koleksimu.' : 'Daftar untuk mulai mengumpulkan favoritmu.',
      nameLabel: 'Nama Lengkap',
      phoneLabel: 'Nomor WhatsApp',
      waBtn: mode === 'signin' ? 'Login dengan WhatsApp' : 'Daftar Sekarang',
      verifyBtn: 'Verifikasi & Masuk',
      or: 'Atau lanjut dengan',
      changeNum: 'Ganti Nomor'
    },
    en: {
      welcome: mode === 'signin' ? 'Welcome Back' : 'Create Account',
      desc: mode === 'signin' ? 'Sign in to continue to your collection.' : 'Sign up to start collecting your favorites.',
      nameLabel: 'Full Name',
      phoneLabel: 'WhatsApp Number',
      waBtn: mode === 'signin' ? 'Login with WhatsApp' : 'Sign Up Now',
      verifyBtn: 'Verify & Enter',
      or: 'Or continue with',
      changeNum: 'Change Number'
    }
  }[lang] || { welcome: 'Welcome Back', desc: 'Sign in to continue.' }

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: loginErr } = await loginWithPassword(email, password)
      if (loginErr) throw loginErr
      router.push('/admin')
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Email atau Password Admin salah!' : err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    // Jika Sign Up, kita bisa kirim metadata nama (Supabase akan menyimpannya jika dikonfigurasi)
    const { error } = await loginWithPhone(phone, mode === 'signup' ? fullName : null)
    if (error) setError(error.message)
    else setStep(2)
    setLoading(false)
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await verifyOtp(phone, otp)
    if (error) setError(error.message)
    setLoading(false)
  }

  // Dynamic Styles based on Theme
  const isDark = theme === 'dark'
  const textColor = isDark ? 'text-white' : 'text-slate-900'
  const subTextColor = isDark ? 'text-zinc-500' : 'text-slate-500'
  const cardBg = isDark ? 'bg-zinc-950/80 backdrop-blur-2xl' : 'bg-white'
  const inputBg = isDark ? 'bg-white/5' : 'bg-slate-100'
  const inputBorder = isDark ? 'border-white/10' : 'border-slate-200'
  const socialBtnBg = isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-200'
  const tabInactive = isDark ? 'text-zinc-500' : 'text-slate-400'

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] transition-colors duration-300 font-sans flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center pt-32 pb-16 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-md backdrop-blur-2xl border ${isDark ? 'border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'border-zinc-200 shadow-2xl'} rounded-[2rem] overflow-hidden relative ${cardBg}`}
        >
          {/* Subtle background glow */}
          {isDark && (
            <>
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent/5 blur-[80px] rounded-full"></div>
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent/5 blur-[80px] rounded-full"></div>
            </>
          )}

          <div className="p-8 relative z-10">
            {/* Professional Sliding Tab Switcher */}
            <div className={`relative flex ${isDark ? 'bg-black/20' : 'bg-slate-100'} p-1 rounded-2xl mb-8 border ${isDark ? 'border-white/5' : 'border-black/5'}`}>
              {/* Sliding Background */}
              <motion.div 
                layout
                initial={false}
                animate={{ x: mode === 'signin' ? 0 : '100%' }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl shadow-lg bg-gradient-to-r from-accent-light via-accent to-accent-alt"
              />
              
              <button 
                onClick={() => { setMode('signin'); setStep(1); setError(''); }}
                className={`relative z-10 flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${mode === 'signin' ? 'text-black' : tabInactive}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setMode('signup'); setStep(1); setError(''); }}
                className={`relative z-10 flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${mode === 'signup' ? 'text-black' : tabInactive}`}
              >
                Sign Up
              </button>
            </div>

            <h1 className="text-4xl font-black uppercase tracking-[0.05em] mb-2 text-transparent bg-clip-text bg-gradient-to-b from-accent-light via-accent to-accent-dark font-serif">
              {t.welcome}
            </h1>
            <p className={`text-xs mb-10 font-medium tracking-wide ${subTextColor}`}>{t.desc}</p>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] p-4 rounded-2xl mb-8 font-black uppercase tracking-widest flex items-center gap-3"
              >
                <span>⚠️</span> {error}
              </motion.div>
            )}

            {/* Phone Login Section */}
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form 
                  key={isAdminMode ? "admin" : "phone"}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={isAdminMode ? handleAdminLogin : handlePhoneLogin} 
                  className="space-y-5"
                >
                  {isAdminMode ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-5"
                    >
                      <div className="space-y-2">
                        <label className={`block text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Admin Email</label>
                        <div className="relative group">
                          <span className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-white/20 group-focus-within:text-accent' : 'text-slate-300 group-focus-within:text-slate-600'}`}>📧</span>
                          <input 
                            type="email" 
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full ${inputBg} border ${inputBorder} rounded-2xl pl-12 pr-6 py-4 ${textColor} focus:border-accent focus:outline-none transition-all placeholder:text-gray-400 font-bold`}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className={`block text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Password</label>
                        <div className="relative group">
                          <span className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-white/20 group-focus-within:text-accent' : 'text-slate-300 group-focus-within:text-slate-600'}`}>🔑</span>
                          <input 
                            type="password" 
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full ${inputBg} border ${inputBorder} rounded-2xl pl-12 pr-6 py-4 ${textColor} focus:border-accent focus:outline-none transition-all placeholder:text-gray-400 font-bold`}
                            required
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {mode === 'signup' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-2"
                        >
                          <label className={`block text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{t.nameLabel}</label>
                          <div className="relative group">
                            <span className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-white/20 group-focus-within:text-accent' : 'text-slate-300 group-focus-within:text-slate-600'}`}>👤</span>
                            <input 
                              type="text" 
                              placeholder="John Doe" 
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className={`w-full ${inputBg} border ${inputBorder} rounded-2xl pl-12 pr-6 py-4 ${textColor} focus:border-accent focus:outline-none transition-all placeholder:text-gray-400 font-bold`}
                              required={mode === 'signup'}
                            />
                          </div>
                        </motion.div>
                      )}

                      <div className="space-y-2">
                        <label className={`block text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{t.phoneLabel}</label>
                        <div className="relative group">
                          <span className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-white/20 group-focus-within:text-accent' : 'text-slate-300 group-focus-within:text-slate-600'}`}>📱</span>
                          <input 
                            type="tel" 
                            placeholder="+62 812..." 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={`w-full ${inputBg} border ${inputBorder} rounded-2xl pl-12 pr-6 py-4 ${textColor} focus:border-accent focus:outline-none transition-all placeholder:text-gray-400 font-bold`}
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className={`w-full ${isAdminMode ? 'bg-gradient-to-r from-accent-light via-accent to-accent-alt shadow-[0_10px_30px_rgb(var(--accent-main)/0.25)] text-black' : 'bg-[#25D366] shadow-[0_10px_20px_rgba(37,211,102,0.2)] text-white'} font-black uppercase tracking-widest py-4 rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50`}
                  >
                    {isAdminMode ? null : <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>}
                    <span>{loading ? '...' : (isAdminMode ? 'Unlock Admin Access 🔓' : t.waBtn)}</span>
                  </button>
                </motion.form>
              ) : (
                <motion.form 
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleVerifyOtp} 
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <label className={`block text-[10px] font-black uppercase tracking-widest text-center tracking-[0.2em] ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{lang === 'id' ? 'Masukkan Kode Verifikasi' : 'Enter Verification Code'}</label>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="000000" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className={`w-full ${inputBg} border ${inputBorder} rounded-2xl px-6 py-5 ${textColor} text-center text-3xl font-black tracking-[0.5em] focus:border-accent focus:outline-none transition-all placeholder:text-gray-200`}
                      maxLength={6}
                      required
                    />
                  </div>
                  <button 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-accent-light via-accent to-accent-alt text-black font-black uppercase tracking-widest py-4 rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_10px_30px_rgb(var(--accent-main)/0.25)] disabled:opacity-50"
                  >
                    {loading ? '...' : t.verifyBtn}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className={`w-full text-[10px] uppercase font-black transition-colors ${isDark ? 'text-white/30 hover:text-accent' : 'text-slate-400 hover:text-slate-900'}`}
                  >
                    ← {t.changeNum}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="relative my-12">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}></div>
              </div>
              <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.3em]">
                <span className={`${isDark ? 'bg-zinc-950 text-white/30' : 'bg-white text-slate-400'} px-4 transition-colors`}>{t.or}</span>
              </div>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={loginWithGoogle}
                className={`flex items-center justify-center gap-3 ${socialBtnBg} border ${isDark ? 'border-white/5' : 'border-black/5'} rounded-2xl py-4 hover:brightness-95 transition-all group shadow-sm`}
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDark ? 'text-white/40 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-900'}`}>Google</span>
              </button>
              <button 
                onClick={loginWithApple}
                className={`flex items-center justify-center gap-3 ${socialBtnBg} border ${isDark ? 'border-white/5' : 'border-black/5'} rounded-2xl py-4 hover:brightness-95 transition-all group shadow-sm`}
              >
                <svg className={`w-5 h-5 ${isDark ? 'fill-white' : 'fill-slate-900'}`} viewBox="0 0 384 512">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-51.1-20.8-82.3-20.2-41.2.6-78.2 25.6-91.4 54.7-23.5 52.1-13.1 128.7 11.5 183.5 11.5 25.3 26.5 54.5 52 54.5 22.8 0 30.6-13.1 58.7-13.1 27 0 34.3 13.1 57.6 13.1 25 0 40.2-24.9 51.7-54.7 15-33.6 21.2-66.2 21.4-67.8-.1-.1-41.8-16.1-42-63zM249.1 80c15.4-19.4 25.2-45.7 22.3-71.5-22.1 1-49.8 15.3-65.4 33.7-14.3 16.8-26.4 43.6-22.9 68.3 24.3 2 50.4-11.1 66-30.5z"/>
                </svg>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDark ? 'text-white/40 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-900'}`}>Apple</span>
              </button>
            </div>
            {/* Help / Forgot Access Section */}
            <div className="mt-12 text-center space-y-6">
              <button 
                onClick={() => {
                  const msg = lang === 'id' 
                    ? 'Halo Admin, saya butuh bantuan akses akun di LUMI FORGE.' 
                    : 'Hello Admin, I need help accessing my account on LUMI FORGE.';
                  window.open(`https://wa.me/491633949013?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className={`block w-full text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 ${isDark ? 'text-white/20 hover:text-accent' : 'text-slate-400 hover:text-slate-900'}`}
              >
                {lang === 'id' ? 'Lupa akses atau nomor hilang?' : 'Lost access or number changed?'}
              </button>

              <button 
                onClick={() => {
                  setIsAdminMode(!isAdminMode);
                  setError('');
                }}
                className={`text-[9px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full border transition-all ${isDark ? 'border-zinc-800/80 text-zinc-500 hover:text-accent hover:border-accent/35' : 'border-black/5 text-slate-350 hover:text-slate-900'}`}
              >
                {isAdminMode ? '← User Login' : 'Admin Portal 🔒'}
              </button>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
