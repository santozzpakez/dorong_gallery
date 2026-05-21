// Mock dataset for simulation fallback mode
const MOCK_PROVINCES = [
  { province_id: "1", province: "Bali" },
  { province_id: "2", province: "Bangka Belitung" },
  { province_id: "3", province: "Banten" },
  { province_id: "4", province: "Bengkulu" },
  { province_id: "5", province: "DI Yogyakarta" },
  { province_id: "6", province: "DKI Jakarta" },
  { province_id: "7", province: "Gorontalo" },
  { province_id: "8", province: "Jambi" },
  { province_id: "9", province: "Jawa Barat" },
  { province_id: "10", province: "Jawa Tengah" },
  { province_id: "11", province: "Jawa Timur" },
  { province_id: "12", province: "Kalimantan Barat" },
  { province_id: "13", province: "Kalimantan Selatan" },
  { province_id: "14", province: "Kalimantan Tengah" },
  { province_id: "15", province: "Kalimantan Timur" },
  { province_id: "16", province: "Kalimantan Utara" },
  { province_id: "17", province: "Kepulauan Riau" },
  { province_id: "18", province: "Lampung" },
  { province_id: "19", province: "Maluku" },
  { province_id: "20", province: "Maluku Utara" },
  { province_id: "21", province: "Nanggroe Aceh Darussalam (NAD)" },
  { province_id: "22", province: "Nusa Tenggara Barat (NTB)" },
  { province_id: "23", province: "Nusa Tenggara Timur (NTT)" },
  { province_id: "24", province: "Papua" },
  { province_id: "25", province: "Papua Barat" },
  { province_id: "26", province: "Riau" },
  { province_id: "27", province: "Sulawesi Barat" },
  { province_id: "28", province: "Sulawesi Selatan" },
  { province_id: "29", province: "Sulawesi Tengah" },
  { province_id: "30", province: "Sulawesi Tenggara" },
  { province_id: "31", province: "Sulawesi Utara" },
  { province_id: "32", province: "Sumatera Barat" },
  { province_id: "33", province: "Sumatera Selatan" },
  { province_id: "34", province: "Sumatera Utara" }
]

const MOCK_CITIES = {
  "1": [{ city_id: "114", province_id: "1", province: "Bali", type: "Kota", city_name: "Denpasar", postal_code: "80111" }],
  "2": [{ city_id: "327", province_id: "2", province: "Bangka Belitung", type: "Kota", city_name: "Pangkal Pinang", postal_code: "33111" }],
  "3": [{ city_id: "457", province_id: "3", province: "Banten", type: "Kota", city_name: "Tangerang", postal_code: "15111" }],
  "4": [{ city_id: "67", province_id: "4", province: "Bengkulu", type: "Kota", city_name: "Bengkulu", postal_code: "38111" }],
  "5": [{ city_id: "501", province_id: "5", province: "DI Yogyakarta", type: "Kota", city_name: "Yogyakarta", postal_code: "55111" }],
  "6": [
    { city_id: "151", province_id: "6", province: "DKI Jakarta", type: "Kota", city_name: "Jakarta Pusat", postal_code: "10110" },
    { city_id: "152", province_id: "6", province: "DKI Jakarta", type: "Kota", city_name: "Jakarta Barat", postal_code: "11210" },
    { city_id: "153", province_id: "6", province: "DKI Jakarta", type: "Kota", city_name: "Jakarta Selatan", postal_code: "12110" },
    { city_id: "154", province_id: "6", province: "DKI Jakarta", type: "Kota", city_name: "Jakarta Timur", postal_code: "13110" },
    { city_id: "155", province_id: "6", province: "DKI Jakarta", type: "Kota", city_name: "Jakarta Utara", postal_code: "14110" }
  ],
  "7": [{ city_id: "137", province_id: "7", province: "Gorontalo", type: "Kota", city_name: "Gorontalo", postal_code: "96111" }],
  "8": [{ city_id: "156", province_id: "8", province: "Jambi", type: "Kota", city_name: "Jambi", postal_code: "36111" }],
  "9": [
    { city_id: "23", province_id: "9", province: "Jawa Barat", type: "Kota", city_name: "Bandung", postal_code: "40111" },
    { city_id: "54", province_id: "9", province: "Jawa Barat", type: "Kota", city_name: "Bekasi", postal_code: "17111" },
    { city_id: "78", province_id: "9", province: "Jawa Barat", type: "Kota", city_name: "Bogor", postal_code: "16111" },
    { city_id: "115", province_id: "9", province: "Jawa Barat", type: "Kota", city_name: "Depok", postal_code: "16411" }
  ],
  "10": [
    { city_id: "399", province_id: "10", province: "Jawa Tengah", type: "Kota", city_name: "Semarang", postal_code: "50135" },
    { city_id: "427", province_id: "10", province: "Jawa Tengah", type: "Kota", city_name: "Surakarta (Solo)", postal_code: "57111" }
  ],
  "11": [
    { city_id: "444", province_id: "11", province: "Jawa Timur", type: "Kota", city_name: "Surabaya", postal_code: "60111" },
    { city_id: "256", province_id: "11", province: "Jawa Timur", type: "Kota", city_name: "Malang", postal_code: "65111" }
  ],
  "12": [{ city_id: "364", province_id: "12", province: "Kalimantan Barat", type: "Kota", city_name: "Pontianak", postal_code: "78111" }],
  "13": [{ city_id: "36", province_id: "13", province: "Kalimantan Selatan", type: "Kota", city_name: "Banjarmasin", postal_code: "70111" }],
  "14": [{ city_id: "321", province_id: "14", province: "Kalimantan Tengah", type: "Kota", city_name: "Palangkaraya", postal_code: "73111" }],
  "15": [
    { city_id: "387", province_id: "15", province: "Kalimantan Timur", type: "Kota", city_name: "Samarinda", postal_code: "75111" },
    { city_id: "19", province_id: "15", province: "Kalimantan Timur", type: "Kota", city_name: "Balikpapan", postal_code: "76111" },
    { city_id: "89", province_id: "15", province: "Kalimantan Timur", type: "Kota", city_name: "Bontang", postal_code: "75311" },
    { city_id: "354", province_id: "15", province: "Kalimantan Timur", type: "Kabupaten", city_name: "Penajam Paser Utara", postal_code: "76311" },
    { city_id: "222", province_id: "15", province: "Kalimantan Timur", type: "Kabupaten", city_name: "Kutai Kartanegara", postal_code: "75511" },
    { city_id: "221", province_id: "15", province: "Kalimantan Timur", type: "Kabupaten", city_name: "Kutai Barat", postal_code: "75711" },
    { city_id: "223", province_id: "15", province: "Kalimantan Timur", type: "Kabupaten", city_name: "Kutai Timur", postal_code: "75611" },
    { city_id: "342", province_id: "15", province: "Kalimantan Timur", type: "Kabupaten", city_name: "Paser", postal_code: "76211" },
    { city_id: "59", province_id: "15", province: "Kalimantan Timur", type: "Kabupaten", city_name: "Berau", postal_code: "76811" },
    { city_id: "502", province_id: "15", province: "Kalimantan Timur", type: "Kabupaten", city_name: "Mahakam Ulu", postal_code: "76711" }
  ],
  "16": [{ city_id: "462", province_id: "16", province: "Kalimantan Utara", type: "Kota", city_name: "Tarakan", postal_code: "77111" }],
  "17": [
    { city_id: "48", province_id: "17", province: "Kepulauan Riau", type: "Kota", city_name: "Batam", postal_code: "29411" },
    { city_id: "461", province_id: "17", province: "Kepulauan Riau", type: "Kota", city_name: "Tanjung Pinang", postal_code: "29111" }
  ],
  "18": [{ city_id: "21", province_id: "18", province: "Lampung", type: "Kota", city_name: "Bandar Lampung", postal_code: "35111" }],
  "19": [{ city_id: "14", province_id: "19", province: "Maluku", type: "Kota", city_name: "Ambon", postal_code: "97111" }],
  "20": [{ city_id: "470", province_id: "20", province: "Maluku Utara", type: "Kota", city_name: "Ternate", postal_code: "97711" }],
  "21": [{ city_id: "20", province_id: "21", province: "Nanggroe Aceh Darussalam (NAD)", type: "Kota", city_name: "Banda Aceh", postal_code: "23111" }],
  "22": [{ city_id: "271", province_id: "22", province: "Nusa Tenggara Barat (NTB)", type: "Kota", city_name: "Mataram", postal_code: "83111" }],
  "23": [{ city_id: "222", province_id: "23", province: "Nusa Tenggara Timur (NTT)", type: "Kota", city_name: "Kupang", postal_code: "85111" }],
  "24": [{ city_id: "160", province_id: "24", province: "Papua", type: "Kota", city_name: "Jayapura", postal_code: "99111" }],
  "25": [{ city_id: "423", province_id: "25", province: "Papua Barat", type: "Kota", city_name: "Sorong", postal_code: "98111" }],
  "26": [{ city_id: "350", province_id: "26", province: "Riau", type: "Kota", city_name: "Pekanbaru", postal_code: "28111" }],
  "27": [{ city_id: "257", province_id: "27", province: "Sulawesi Barat", type: "Kota", city_name: "Mamuju", postal_code: "91511" }],
  "28": [{ city_id: "254", province_id: "28", province: "Sulawesi Selatan", type: "Kota", city_name: "Makassar", postal_code: "90111" }],
  "29": [{ city_id: "323", province_id: "29", province: "Sulawesi Tengah", type: "Kota", city_name: "Palu", postal_code: "94111" }],
  "30": [{ city_id: "181", province_id: "30", province: "Sulawesi Tenggara", type: "Kota", city_name: "Kendari", postal_code: "93111" }],
  "31": [{ city_id: "260", province_id: "31", province: "Sulawesi Utara", type: "Kota", city_name: "Manado", postal_code: "95111" }],
  "32": [{ city_id: "312", province_id: "32", province: "Sumatera Barat", type: "Kota", city_name: "Padang", postal_code: "25111" }],
  "33": [{ city_id: "322", province_id: "33", province: "Sumatera Selatan", type: "Kota", city_name: "Palembang", postal_code: "30111" }],
  "34": [{ city_id: "278", province_id: "34", province: "Sumatera Utara", type: "Kota", city_name: "Medan", postal_code: "20111" }]
}

// Reusable fetch function with a fast 1.5s timeout for maximum UX responsiveness
async function fetchWithTimeout(url, options = {}, timeoutMs = 1500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Reusable mock rate calculation helper
function getMockShippingCost(destination, pkgWeight, courier) {
  let destProvince = "15" // default East Kalimantan (where Balikpapan is located)
  let cityName = "Balikpapan"
  
  Object.keys(MOCK_CITIES).forEach(provId => {
    const match = MOCK_CITIES[provId].find(c => c.city_id === String(destination))
    if (match) {
      destProvince = provId
      cityName = match.city_name
    }
  })

  let baseRate = 9000
  let baseDays = "1-2"

  switch (destProvince) {
    case "15": // Kalimantan Timur (Intra-province)
      if (String(destination) === "19") { // Balikpapan to Balikpapan
        baseRate = 7000
        baseDays = "1"
      } else { // Balikpapan to other East Kalimantan cities/regencies
        baseRate = 12000
        baseDays = "1-3"
      }
      break
    case "12": // Kalbar
    case "13": // Kalsel
    case "14": // Kalteng
    case "16": // Kalut
      baseRate = 22000
      baseDays = "2-4"
      break
    case "6": // DKI Jakarta
    case "3": // Banten
    case "9": // Jawa Barat
    case "5": // DI Yogyakarta
    case "10": // Jawa Tengah
    case "11": // Jawa Timur
      baseRate = 28000
      baseDays = "3-4"
      break
    case "28": // Sulawesi Selatan
    case "27": // Sulbar
    case "29": // Sulteng
    case "30": // Sultra
    case "31": // Sulut
    case "7":  // Gorontalo
      baseRate = 32000
      baseDays = "3-5"
      break
    case "34": // Sumatera Utara
    case "32": // Sumbar
    case "33": // Sumsel
    case "18": // Lampung
    case "26": // Riau
    case "17": // Kepri
    case "8": // Jambi
    case "4": // Bengkulu
    case "2": // Bangka Belitung
    case "21": // NAD Aceh
    case "1": // Bali
    case "22": // NTB
      baseRate = 38000
      baseDays = "3-5"
      break
    case "19": // Maluku
    case "20": // Maluku Utara
    case "23": // NTT
      baseRate = 45000
      baseDays = "4-6"
      break
    case "24": // Papua
    case "25": // Papua Barat
      baseRate = 58000
      baseDays = "5-7"
      break
    default:
      baseRate = 35000
      baseDays = "3-5"
  }

  const weightMultiplier = Math.max(1, Math.ceil(pkgWeight / 1000))
  let baseCost = baseRate * weightMultiplier

  let services = []
  const cr = courier.toLowerCase()

  if (cr === 'jne') {
    services = [
      {
        service: 'REG',
        description: 'Layanan Reguler',
        cost: [{ value: baseCost, etd: baseDays, note: '' }]
      },
      {
        service: 'YES',
        description: 'Yakin Esok Sampai',
        cost: [{ value: Math.round(baseCost * 1.6), etd: "1", note: '' }]
      },
      {
        service: 'OKE',
        description: 'Ongkos Kirim Ekonomis',
        cost: [{ value: Math.round(baseCost * 0.8), etd: baseDays.split('-').map(x => Number(x) + 1).join('-'), note: '' }]
      }
    ]
  } else if (cr === 'pos') {
    services = [
      {
        service: 'Kilat Khusus',
        description: 'Pos Kilat Khusus',
        cost: [{ value: Math.round(baseCost * 0.95), etd: baseDays, note: '' }]
      },
      {
        service: 'Express',
        description: 'Pos Express',
        cost: [{ value: Math.round(baseCost * 1.5), etd: "1", note: '' }]
      }
    ]
  } else if (cr === 'tiki') {
    services = [
      {
        service: 'REG',
        description: 'Regular Service',
        cost: [{ value: Math.round(baseCost * 0.98), etd: baseDays, note: '' }]
      },
      {
        service: 'ONS',
        description: 'Over Night Service',
        cost: [{ value: Math.round(baseCost * 1.55), etd: "1", note: '' }]
      }
    ]
  } else {
    services = [
      {
        service: 'Standard',
        description: 'Standard Shipping',
        cost: [{ value: baseCost, etd: baseDays, note: '' }]
      }
    ]
  }

  return {
    rajaongkir: {
      status: { code: 200, description: "OK (Simulation Mode - Fallback)" },
      results: [
        {
          code: courier,
          name: courier.toUpperCase(),
          costs: services
        }
      ]
    }
  }
}

export default async function handler(req, res) {
  const apiKey = process.env.RAJAONGKIR_API_KEY
  const originCityId = process.env.RAJAONGKIR_ORIGIN_CITY_ID || "19" // default Balikpapan

  const isMockMode = !apiKey || apiKey.trim() === ""

  // 1. Handle GET requests (fetch provinces & cities)
  if (req.method === 'GET') {
    const { action, provinceId } = req.query

    // ==================== MOCK MODE GET ====================
    if (isMockMode) {
      if (action === 'provinces') {
        return res.status(200).json({
          rajaongkir: {
            status: { code: 200, description: "OK (Simulation Mode)" },
            results: MOCK_PROVINCES
          }
        })
      }

      if (action === 'cities') {
        const province = provinceId || "6"
        const results = MOCK_CITIES[province] || []
        return res.status(200).json({
          rajaongkir: {
            status: { code: 200, description: "OK (Simulation Mode)" },
            results: results
          }
        })
      }

      return res.status(400).json({ error: "Invalid action" })
    }

    // ==================== LIVE RAJAONGKIR GET (WITH MOCK FALLBACK & TIMEOUT) ====================
    try {
      if (action === 'provinces') {
        console.log(`[Rajaongkir Proxy] Fetching live provinces...`)
        const response = await fetchWithTimeout('https://api.rajaongkir.com/starter/province', {
          headers: { key: apiKey }
        }, 1500)
        
        const data = await response.json()
        
        if (response.status !== 200 || data.rajaongkir?.status?.code !== 200) {
          console.warn("⚠️ [RAJAONGKIR LIVE GET PROVINCES FAILED] Status:", response.status, "Body:", JSON.stringify(data))
          console.log("ℹ️ Falling back to Province Simulation/Mock mode to keep checkout functional.")
          return res.status(200).json({
            rajaongkir: {
              status: { code: 200, description: "OK (Simulation Mode - Fallback)" },
              results: MOCK_PROVINCES
            }
          })
        }
        return res.status(200).json(data)
      }

      if (action === 'cities') {
        console.log(`[Rajaongkir Proxy] Fetching live cities for province ID: ${provinceId}`)
        const url = provinceId 
          ? `https://api.rajaongkir.com/starter/city?province=${provinceId}`
          : 'https://api.rajaongkir.com/starter/city'
        
        const response = await fetchWithTimeout(url, {
          headers: { key: apiKey }
        }, 1500)
        const data = await response.json()

        if (response.status !== 200 || data.rajaongkir?.status?.code !== 200) {
          console.warn("⚠️ [RAJAONGKIR LIVE GET CITIES FAILED] Status:", response.status, "Body:", JSON.stringify(data))
          console.log("ℹ️ Falling back to City Simulation/Mock mode to keep checkout functional.")
          const province = provinceId || "6"
          const results = MOCK_CITIES[province] || []
          return res.status(200).json({
            rajaongkir: {
              status: { code: 200, description: "OK (Simulation Mode - Fallback)" },
              results: results
            }
          })
        }
        return res.status(200).json(data)
      }

      return res.status(400).json({ error: "Invalid action" })
    } catch (err) {
      console.error("⚠️ Rajaongkir Proxy GET Error (falling back to mock):", err.message)
      if (action === 'provinces') {
        return res.status(200).json({
          rajaongkir: {
            status: { code: 200, description: "OK (Simulation Mode - Fallback)" },
            results: MOCK_PROVINCES
          }
        })
      }
      if (action === 'cities') {
        const province = provinceId || "6"
        const results = MOCK_CITIES[province] || []
        return res.status(200).json({
          rajaongkir: {
            status: { code: 200, description: "OK (Simulation Mode - Fallback)" },
            results: results
          }
        })
      }
      return res.status(500).json({ error: "Failed to connect to Rajaongkir API" })
    }
  }

  // 2. Handle POST requests (calculate shipping costs)
  if (req.method === 'POST') {
    const { destination, weight, courier } = req.body

    if (!destination || !courier) {
      return res.status(400).json({ error: "Missing required parameters (destination, courier)" })
    }

    const pkgWeight = Number(weight) || 1000

    // ==================== MOCK MODE POST ====================
    if (isMockMode) {
      const mockResult = getMockShippingCost(destination, pkgWeight, courier)
      return res.status(200).json(mockResult)
    }

    // ==================== LIVE RAJAONGKIR POST (WITH MOCK FALLBACK & TIMEOUT) ====================
    try {
      console.log(`[Rajaongkir Proxy] Calculating live shipping cost to destination: ${destination}, courier: ${courier}`)
      const response = await fetchWithTimeout('https://api.rajaongkir.com/starter/cost', {
        method: 'POST',
        headers: {
          'key': apiKey,
          'content-type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          origin: originCityId,
          destination: String(destination),
          weight: String(pkgWeight),
          courier: courier.toLowerCase()
        })
      }, 1500)

      const data = await response.json()

      if (response.status !== 200 || data.rajaongkir?.status?.code !== 200) {
        console.warn("⚠️ [RAJAONGKIR LIVE POST COST FAILED] Status:", response.status, "Body:", JSON.stringify(data))
        console.log("ℹ️ Falling back to Shipping Cost Simulation/Mock mode to keep checkout functional.")
        const mockResult = getMockShippingCost(destination, pkgWeight, courier)
        return res.status(200).json(mockResult)
      }

      return res.status(response.status).json(data)
    } catch (err) {
      console.error("⚠️ Rajaongkir Proxy POST Error (falling back to mock):", err.message)
      const mockResult = getMockShippingCost(destination, pkgWeight, courier)
      return res.status(200).json(mockResult)
    }
  }

  return res.status(450).json({ error: "Method not supported" })
}
