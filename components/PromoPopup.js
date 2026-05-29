import { useEffect, useState } from 'react'
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient'
import Link from 'next/link'

export default function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    // Don't show if already dismissed this session
    if (typeof window !== 'undefined' && sessionStorage.getItem('lumi-promo-dismissed')) {
      return
    }

    async function loadPromo() {
      if (!hasSupabaseConfig || !supabase) return
      try {
        const { data } = await supabase
          .from('site_assets')
          .select('text_value')
          .eq('key', 'promo-popup-settings')
          .single()

        if (data?.text_value) {
          const parsed = JSON.parse(data.text_value)
          if (parsed.isActive && parsed.imageUrl) {
            // Check schedule if in scheduled mode
            if (parsed.mode === 'scheduled') {
              const now = new Date()
              const start = parsed.startDate ? new Date(parsed.startDate) : null
              const end = parsed.endDate ? new Date(parsed.endDate) : null
              // Skip if not within schedule window
              if (start && now < start) return
              if (end && now > end) return
            }
            setSettings(parsed)
            // Small delay for entrance animation
            setTimeout(() => setIsOpen(true), 800)
          }
        }
      } catch {}
    }

    loadPromo()
  }, [])

  function handleClose() {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
      setSettings(null)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('lumi-promo-dismissed', '1')
      }
    }, 400)
  }

  // Close on backdrop click
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    function onKey(e) {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  if (!settings || !isOpen) return null

  const bannerContent = (
    <div
      className={`promo-popup-card ${isClosing ? 'promo-closing' : 'promo-opening'}`}
      style={{ position: 'relative' }}
    >
      {/* Close button */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClose() }}
        className="promo-close-btn"
        aria-label="Tutup popup promo"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Loading skeleton */}
      {!imageLoaded && (
        <div className="promo-skeleton">
          <div className="promo-skeleton-shimmer" />
        </div>
      )}

      {/* Banner image */}
      <img
        src={settings.imageUrl}
        alt="Promo Banner"
        className={`promo-banner-img ${imageLoaded ? 'loaded' : ''}`}
        onLoad={() => setImageLoaded(true)}
        draggable={false}
      />

      {/* Subtle branding */}
      <div className="promo-branding">
        <span className="promo-brand-dot" />
        LUMI FORGE PROMO
      </div>
    </div>
  )

  return (
    <div
      className={`promo-popup-overlay ${isClosing ? 'promo-overlay-closing' : ''}`}
      onClick={handleBackdropClick}
    >
      {settings.redirectUrl ? (
        <Link href={settings.redirectUrl} onClick={() => handleClose()}>
            {bannerContent}
        </Link>
      ) : (
        bannerContent
      )}
    </div>
  )
}
