/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['picsum.photos', 'okgkghrlxsdkhzbpzlus.supabase.co']
  },
  async redirects() {
    return [
      { source: '/catalog', destination: '/katalog', permanent: false },
      { source: '/products', destination: '/katalog', permanent: false },
      { source: '/shop', destination: '/katalog', permanent: false }
    ]
  }
}

module.exports = nextConfig
