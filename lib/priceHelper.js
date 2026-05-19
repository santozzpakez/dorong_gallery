export const DEFAULT_SIZES = ['F4', 'A3', 'A3+']

export const DEFAULT_PRICES = {
  f4: { original: 125000, discount: 99000 },
  a3: { original: 165000, discount: 139000 },
  a3plus: { original: 225000, discount: 189000 }
}

export const DEFAULT_DIMENSIONS = {
  f4: '21 x 33 cm',
  a3: '30 x 42 cm',
  a3plus: '32 x 48 cm'
}

/**
 * Clean size code to match keys
 */
export function cleanSizeKey(size) {
  const s = (size || 'F4').trim().toLowerCase()
  if (s.includes('+') || s.includes('plus')) return 'a3plus'
  if (s === 's') return 'f4' // backward compatibility fallbacks
  if (s === 'm') return 'a3'
  if (s === 'l') return 'a3plus'
  return s
}

/**
 * Fetch resolved original and discount prices for a specific size from dynamic site_assets texts.
 * 
 * @param {Function} getText - useSiteAssets hook getText helper
 * @param {string} size - size code ('F4', 'A3', 'A3+')
 * @returns {object} { original, discount, hasDiscount }
 */
export function getPriceInfo(getText, size = 'F4') {
  const sizeKey = cleanSizeKey(size)
  const origKey = `size_price_${sizeKey}_original`
  const discKey = `size_price_${sizeKey}_discount`
  
  const def = DEFAULT_PRICES[sizeKey] || DEFAULT_PRICES.f4
  
  const rawOriginal = getText(origKey)
  const rawDiscount = getText(discKey)
  
  const original = rawOriginal !== undefined && rawOriginal !== '' ? Number(rawOriginal) : def.original
  const discount = rawDiscount !== undefined && rawDiscount !== '' ? Number(rawDiscount) : def.discount
  
  const finalOriginal = Number.isFinite(original) ? original : def.original
  const finalDiscount = Number.isFinite(discount) ? discount : def.discount
  
  return {
    original: finalOriginal,
    discount: finalDiscount,
    hasDiscount: finalDiscount > 0 && finalDiscount < finalOriginal
  }
}

/**
 * Fetch resolved dimension string (e.g. '21 x 33 cm') for a specific size from dynamic site_assets texts.
 * 
 * @param {Function} getText - useSiteAssets hook getText helper
 * @param {string} size - size code ('F4', 'A3', 'A3+')
 * @returns {string} dimension value
 */
export function getDimensionInfo(getText, size = 'F4') {
  const sizeKey = cleanSizeKey(size)
  const dimKey = `size_dimension_${sizeKey}`
  const def = DEFAULT_DIMENSIONS[sizeKey] || DEFAULT_DIMENSIONS.f4
  
  const rawDim = getText(dimKey)
  return rawDim !== undefined && rawDim !== '' ? rawDim : def
}
