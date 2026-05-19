import '../styles/globals.css'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { CartProvider } from '../context/CartContext'
import { SiteAssetsProvider } from '../lib/siteAssets'
import { ThemeProvider } from '../context/ThemeContext'
import { LanguageProvider } from '../context/LanguageContext'
import { AuthProvider } from '../context/AuthContext'
import Head from 'next/head'

function MyApp({ Component, pageProps }) {
  const router = useRouter()

  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <CartProvider>
            <SiteAssetsProvider>
              <div className="min-h-screen relative transition-colors duration-300">
                <Head>
                  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
                </Head>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={router.route}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.45 }}
                  >
                    <Component {...pageProps} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </SiteAssetsProvider>
          </CartProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default MyApp
