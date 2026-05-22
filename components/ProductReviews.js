import { useState, useEffect } from 'react'

const reviewsTranslations = {
  id: {
    title: 'Ulasan Produk',
    overall: 'dari 5 bintang',
    writeReview: 'Tulis Ulasan',
    noReviews: 'Belum ada ulasan untuk produk ini.',
    verified: 'Pembelian Terverifikasi',
    size: 'Ukuran',
    helpful: 'Bermanfaat',
    all: 'Semua Ulasan',
    filterStars: 'Bintang {stars}',
    newReviewTitle: 'Kirim Ulasan Anda',
    yourName: 'Nama Anda',
    yourNamePlaceholder: 'Masukkan nama Anda...',
    chooseRating: 'Pilih Rating',
    chooseSize: 'Ukuran yang Dibeli',
    reviewText: 'Ulasan Anda',
    reviewTextPlaceholder: 'Tuliskan pengalaman Anda menggunakan produk ini secara detail...',
    submitting: 'Mengirimkan...',
    submit: 'Kirim Ulasan',
    successMessage: 'Ulasan Anda berhasil dikirim secara lokal! Terima kasih atas feedback Anda.',
    close: 'Tutup',
    cancel: 'Batal',
    emptyName: 'Silakan masukkan nama Anda.',
    emptyComment: 'Silakan tuliskan komentar ulasan Anda.',
    emptyRating: 'Silakan tentukan rating bintang Anda.',
    ratingLabels: ['Sangat Buruk', 'Buruk', 'Cukup', 'Bagus', 'Sangat Bagus']
  },
  en: {
    title: 'Product Reviews',
    overall: 'out of 5 stars',
    writeReview: 'Write a Review',
    noReviews: 'No reviews for this product yet.',
    verified: 'Verified Purchase',
    size: 'Size',
    helpful: 'Helpful',
    all: 'All Reviews',
    filterStars: '{stars} Stars',
    newReviewTitle: 'Submit Your Review',
    yourName: 'Your Name',
    yourNamePlaceholder: 'Enter your name...',
    chooseRating: 'Choose Rating',
    chooseSize: 'Purchased Size',
    reviewText: 'Your Review',
    reviewTextPlaceholder: 'Write about your experience with this product in detail...',
    submitting: 'Submitting...',
    submit: 'Submit Review',
    successMessage: 'Your review was submitted successfully locally! Thank you for your feedback.',
    close: 'Close',
    cancel: 'Cancel',
    emptyName: 'Please enter your name.',
    emptyComment: 'Please write your review comment.',
    emptyRating: 'Please select a star rating.',
    ratingLabels: ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent']
  }
}

export default function ProductReviews({ productId, productTitle = '', lang = 'id' }) {
  const t = reviewsTranslations[lang === 'id' ? 'id' : 'en']
  const [reviews, setReviews] = useState([])
  const [filteredReviews, setFilteredReviews] = useState([])
  const [activeFilter, setActiveFilter] = useState('all') // 'all', 5, 4, 3, 2, 1
  const [sortBy, setSortBy] = useState('newest') // 'newest', 'helpful'
  
  // Form State
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formRating, setFormRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [formSize, setFormSize] = useState('A3')
  const [formComment, setFormComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [formError, setFormError] = useState('')

  // Track voted reviews to prevent double upvoting
  const [votedReviews, setVotedReviews] = useState([])

  // Seed default reviews
  const getSeedReviews = () => {
    return [
      {
        id: `seed-1-${productId}`,
        name: 'Reza Pratama',
        rating: 5,
        date: '14 Mei 2026',
        size: 'A3+',
        comment: 'Pengerjaannya rapi banget, print metalnya presisi dan anti-luntur. Lumi Forge gak pernah mengecewakan. Dipasang di ruang kerja saya bikin aura ruangannya jadi super premium dan mewah banget!',
        helpfulCount: 24,
        isVerified: true
      },
      {
        id: `seed-2-${productId}`,
        name: 'Anisa Fitriani',
        rating: 5,
        date: '02 Mei 2026',
        size: 'A3',
        comment: 'Desainnya keren parah! Detail warnanya vibrant banget, jauh melebihi ekspektasi saya. Pas dipasang di kamar langsung jadi pusat perhatian. Packingnya juga luar biasa tebal dan aman berlapis-lapis bubble wrap. Makasih Lumi Forge!',
        helpfulCount: 18,
        isVerified: true
      },
      {
        id: `seed-3-${productId}`,
        name: 'Budi Santoso',
        rating: 4,
        date: '28 April 2026',
        size: 'F4',
        comment: 'Kualitas plat besinya top markotop, gambarnya tajam dan solid. Sedikit catatan saja untuk kurir pengiriman agak telat sehari dari estimasi, tapi respon seller luar biasa cepat membantu pelacakan. Recommended banget!',
        helpfulCount: 8,
        isVerified: true
      },
      {
        id: `seed-4-${productId}`,
        name: 'Amanda Wijaya',
        rating: 5,
        date: '10 April 2026',
        size: 'A3+',
        comment: 'Absolutely stunning! The sublimation quality is super sharp and the gloss finish feels very premium. Perfect addition to my studio workspace wall. Will definitely purchase more designs soon for other rooms!',
        helpfulCount: 15,
        isVerified: true
      }
    ]
  }

  // Load reviews from localStorage & seed if empty
  useEffect(() => {
    if (!productId) return
    
    // Load voted reviews
    const savedVotes = localStorage.getItem(`lumi_voted_${productId}`)
    if (savedVotes) {
      setVotedReviews(JSON.parse(savedVotes))
    }

    const savedReviews = localStorage.getItem(`lumi_reviews_${productId}`)
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews))
    } else {
      const seedData = getSeedReviews()
      localStorage.setItem(`lumi_reviews_${productId}`, JSON.stringify(seedData))
      setReviews(seedData)
    }
  }, [productId])

  // Filter and Sort Reviews
  useEffect(() => {
    let result = [...reviews]

    // Apply Filter
    if (activeFilter !== 'all') {
      result = result.filter(r => r.rating === Number(activeFilter))
    }

    // Apply Sort
    if (sortBy === 'newest') {
      // Custom date sorting - parsed conservatively (seed reviews dated manually, new reviews will use actual timestamp)
      result.sort((a, b) => {
        const timeA = a.timestamp || 0
        const timeB = b.timestamp || 0
        if (timeA && timeB) return timeB - timeA
        // Seed sort order preservation (1 then 2 then 3 then 4)
        return a.id.localeCompare(b.id)
      })
    } else if (sortBy === 'helpful') {
      result.sort((a, b) => b.helpfulCount - a.helpfulCount)
    }

    setFilteredReviews(result)
  }, [reviews, activeFilter, sortBy])

  // Stats calculation
  const totalCount = reviews.length
  const avgRating = totalCount > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalCount).toFixed(1)
    : '0.0'

  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => r.rating === stars).length
    const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0
    return { stars, count, percentage }
  })

  // Handle helpful upvote
  const handleHelpful = (reviewId) => {
    if (votedReviews.includes(reviewId)) return

    const updatedReviews = reviews.map(r => {
      if (r.id === reviewId) {
        return { ...r, helpfulCount: r.helpfulCount + 1 }
      }
      return r
    })

    const updatedVotes = [...votedReviews, reviewId]
    setReviews(updatedReviews)
    setVotedReviews(updatedVotes)

    localStorage.setItem(`lumi_reviews_${productId}`, JSON.stringify(updatedReviews))
    localStorage.setItem(`lumi_voted_${productId}`, JSON.stringify(updatedVotes))
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError('')

    if (!formName.trim()) {
      setFormError(t.emptyName)
      return
    }
    if (formRating === 0) {
      setFormError(t.emptyRating)
      return
    }
    if (!formComment.trim()) {
      setFormError(t.emptyComment)
      return
    }

    setIsSubmitting(true)

    // Simulate network delay
    setTimeout(() => {
      const today = new Date()
      const formattedDate = today.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })

      const newReview = {
        id: `user-${Date.now()}`,
        name: formName.trim(),
        rating: formRating,
        date: formattedDate,
        size: formSize,
        comment: formComment.trim(),
        helpfulCount: 0,
        isVerified: true,
        timestamp: Date.now()
      }

      const updatedReviews = [newReview, ...reviews]
      setReviews(updatedReviews)
      localStorage.setItem(`lumi_reviews_${productId}`, JSON.stringify(updatedReviews))

      setIsSubmitting(false)
      setSubmitSuccess(true)
      
      // Reset form
      setFormName('')
      setFormRating(0)
      setFormComment('')
      setFormSize('A3')
    }, 1200)
  }

  const renderStars = (ratingValue, sizeClass = 'w-4 h-4') => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${sizeClass} ${
              star <= ratingValue ? 'text-accent' : 'text-zinc-700'
            } fill-current transition-colors duration-150`}
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-zinc-950/50 p-6 sm:p-8 rounded-2xl border border-zinc-800/80 shadow-xl space-y-8 backdrop-blur-md">
      {/* Header & Write Review Trigger */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight">
            <span className="w-1 h-6 bg-accent rounded-full shadow-[0_0_8px_rgb(var(--accent-main)/0.6)]"></span>
            {t.title}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">{productTitle}</p>
        </div>
        
        {!showForm && !submitSuccess && (
          <button
            onClick={() => {
              setShowForm(true)
              setSubmitSuccess(false)
            }}
            className="self-start sm:self-center px-5 py-2.5 bg-gradient-to-r from-accent-light/10 to-accent/15 hover:from-accent-light/20 hover:to-accent/30 border border-accent/45 hover:border-accent rounded-xl text-xs text-accent font-black uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-accent/10 active:scale-[0.98]"
          >
            ✨ {t.writeReview}
          </button>
        )}
      </div>

      {/* Success Toast */}
      {submitSuccess && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-5 text-center space-y-3 animate-fade-in">
          <div className="w-12 h-12 bg-gradient-to-tr from-accent-light to-accent text-black rounded-full flex items-center justify-center mx-auto shadow-lg shadow-accent/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-accent">{t.successMessage}</p>
          <button
            onClick={() => {
              setSubmitSuccess(false)
              setShowForm(false)
            }}
            className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-lg text-xs font-bold text-zinc-300 transition-colors"
          >
            {t.close}
          </button>
        </div>
      )}

      {/* Write Review Form Accordion */}
      {showForm && !submitSuccess && (
        <form 
          onSubmit={handleSubmit}
          className="bg-zinc-900/60 p-6 rounded-xl border border-zinc-800/80 space-y-5 animate-fade-in shadow-inner"
        >
          <h4 className="text-md font-bold text-accent border-b border-zinc-800 pb-2 flex items-center gap-2">
            ✏️ {t.newReviewTitle}
          </h4>

          {formError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2.5 rounded-lg flex items-center gap-2">
              <span className="text-sm">⚠️</span> {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-zinc-400 tracking-wider block">{t.yourName}</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t.yourNamePlaceholder}
                className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-accent focus:ring-1 focus:ring-accent rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all"
              />
            </div>

            {/* Size Purchased */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-zinc-400 tracking-wider block">{t.chooseSize}</label>
              <div className="flex gap-2">
                {['F4', 'A3', 'A3+'].map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setFormSize(sz)}
                    className={`flex-1 py-2.5 border rounded-xl text-xs font-black transition-all ${
                      formSize === sz 
                        ? 'bg-gradient-to-r from-accent-light to-accent border-transparent text-black shadow-lg shadow-accent/10' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Rating Star Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-zinc-400 tracking-wider block">{t.chooseRating}</label>
            <div className="flex items-center gap-4 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform active:scale-90"
                  >
                    <svg
                      className={`w-8 h-8 ${
                        star <= (hoverRating || formRating) 
                          ? 'text-accent drop-shadow-[0_0_4px_rgb(var(--accent-main)/0.4)]' 
                          : 'text-zinc-800'
                      } fill-current transition-colors duration-150`}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </button>
                ))}
              </div>
              <span className="text-xs font-black tracking-wider text-accent uppercase">
                {(hoverRating || formRating) > 0 
                  ? t.ratingLabels[(hoverRating || formRating) - 1]
                  : '—'}
              </span>
            </div>
          </div>

          {/* Comment Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-zinc-400 tracking-wider block">{t.reviewText}</label>
            <textarea
              rows="4"
              value={formComment}
              onChange={(e) => setFormComment(e.target.value)}
              placeholder={t.reviewTextPlaceholder}
              className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-accent focus:ring-1 focus:ring-accent rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all resize-none scrollbar-thin"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setFormError('')
              }}
              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-300 rounded-xl text-xs font-bold transition-all"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 bg-gradient-to-r from-accent-light to-accent text-black font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-md active:scale-95 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-accent/25'
              }`}
            >
              {isSubmitting ? t.submitting : t.submit}
            </button>
          </div>
        </form>
      )}

      {/* Rating Aggregate Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-zinc-900/30 p-6 rounded-xl border border-zinc-850/50">
        {/* Left column: Aggregate Big Number */}
        <div className="md:col-span-4 text-center md:border-r border-zinc-800/80 md:pr-8 py-2">
          <div className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-light to-accent tracking-tight drop-shadow-[0_4px_12px_rgb(var(--accent-main)/0.15)] select-none">
            {avgRating}
          </div>
          <div className="flex justify-center mt-3">
            {renderStars(Math.round(Number(avgRating)), 'w-5 h-5')}
          </div>
          <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-2">
            {totalCount} Ulasan • {t.overall}
          </div>
        </div>

        {/* Right column: Distribution Rating Bars */}
        <div className="md:col-span-8 space-y-2">
          {ratingDistribution.map(({ stars, count, percentage }) => {
            const isFilterActive = activeFilter === String(stars)
            return (
              <button
                key={stars}
                onClick={() => setActiveFilter(isFilterActive ? 'all' : String(stars))}
                className={`w-full flex items-center text-left group/bar gap-3 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded-md ${
                  isFilterActive ? 'bg-accent/5 ring-1 ring-accent/20' : 'hover:bg-zinc-900/40'
                }`}
              >
                {/* Rating Label */}
                <span className="w-12 font-bold select-none shrink-0 tracking-wider flex items-center justify-end gap-1">
                  {stars} <span className="text-accent">★</span>
                </span>
                
                {/* Percentage Bar */}
                <div className="flex-1 h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
                  <div
                    className={`h-full bg-gradient-to-r from-accent-light to-accent transition-all duration-500 shadow-[0_0_6px_rgb(var(--accent-main)/0.4)] ${
                      isFilterActive ? 'opacity-100' : 'opacity-85 group-hover/bar:opacity-100'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Star Count / Percent */}
                <span className="w-10 text-right text-zinc-500 font-mono text-[10px] shrink-0 font-bold select-none group-hover/bar:text-zinc-400">
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filter and Sorting Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800 pb-3">
        {/* Active Filter Badges */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              activeFilter === 'all'
                ? 'bg-zinc-200 text-black shadow-md'
                : 'bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.all}
          </button>
          {[5, 4, 3, 2, 1].map((stars) => {
            const starCount = reviews.filter(r => r.rating === stars).length
            if (starCount === 0) return null // Hide filter if no reviews for this rating
            return (
              <button
                key={stars}
                onClick={() => setActiveFilter(String(stars))}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                  activeFilter === String(stars)
                    ? 'bg-gradient-to-r from-accent-light to-accent text-black shadow-md shadow-accent/10'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.filterStars.replace('{stars}', String(stars))}
                <span className="text-[10px] opacity-60">({starCount})</span>
              </button>
            )
          })}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Urutkan:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 focus:border-accent px-2.5 py-1.5 rounded-lg text-xs font-bold outline-none cursor-pointer transition-all"
          >
            <option value="newest">Terbaru</option>
            <option value="helpful">Terpopuler</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-10 bg-zinc-900/10 rounded-xl border border-zinc-850/50">
            <p className="text-sm text-zinc-500 italic">{t.noReviews}</p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const hasVoted = votedReviews.includes(review.id)
            const initials = review.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)

            return (
              <div 
                key={review.id}
                className="bg-zinc-900/15 p-5 sm:p-6 rounded-xl border border-zinc-850/40 space-y-4 hover:border-zinc-800 transition-colors animate-fade-in"
              >
                {/* Top Info: Avatar, Name, Rating, Badge, Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-3">
                    {/* Initials Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-300 tracking-wider border border-zinc-700/50 shadow-inner select-none shrink-0">
                      {initials}
                    </div>
                    {/* Name, Stars, Verified Badge */}
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-zinc-200 tracking-tight">{review.name}</span>
                        {review.isVerified && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-accent/10 text-[9px] font-black text-accent uppercase tracking-wider border border-accent/20 select-none">
                            ✓ {t.verified}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating, 'w-3.5 h-3.5')}
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                          {t.size}: {review.size}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Date */}
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest self-start sm:self-center">
                    {review.date}
                  </span>
                </div>

                {/* Review Text Comment */}
                <p className="text-sm text-zinc-300 leading-relaxed font-medium whitespace-pre-line">
                  {review.comment}
                </p>

                {/* Helpful Upvote Button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    disabled={hasVoted}
                    onClick={() => handleHelpful(review.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border transition-all ${
                      hasVoted
                        ? 'bg-accent/10 border-transparent text-accent'
                        : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 active:scale-95'
                    }`}
                  >
                    👍 {t.helpful} ({review.helpfulCount})
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
