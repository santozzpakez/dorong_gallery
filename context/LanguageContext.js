import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('id') // Default to 'id' (Indonesian)

  useEffect(() => {
    // 1. Check if user already set preference
    const savedLang = localStorage.getItem('user-lang')
    if (savedLang) {
      setLang(savedLang)
      return
    }

    // 2. Auto-detect location/language
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const userLang = navigator.language.toLowerCase()
      
      // If timezone is Indonesian or browser language is 'id'
      const isIndonesian = 
        tz.includes('Jakarta') || 
        tz.includes('Pontianak') || 
        tz.includes('Makassar') || 
        tz.includes('Jayapura') ||
        userLang.startsWith('id')

      if (isIndonesian) {
        setLang('id')
      } else {
        setLang('en')
      }
    } catch (e) {
      console.error('Language detection failed', e)
    }
  }, [])

  const switchLanguage = (newLang) => {
    // Mendukung: id, en, jp, kr, cn
    setLang(newLang)
    localStorage.setItem('user-lang', newLang)
  }

  return (
    <LanguageContext.Provider value={{ lang, switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
