import { motion } from 'framer-motion'

export default function Hero(){
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="h-full w-full bg-gradient-to-b from-[#0b0f12] via-[#0e1316] to-[#101418]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="text-center px-6"
      >
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight leading-tight">Dorong Gallery</h1>
        <p className="mt-4 text-lg md:text-xl text-gray-300">Premium Wall Art & Sublimation Gallery</p>

        <div className="mt-8 flex gap-4 justify-center">
          <a href="#categories" className="px-5 py-3 rounded-md bg-gradient-to-r from-glow to-gray-700 text-white shadow-lg cinematic-glow">Explore</a>
          <a href="/custom" className="px-5 py-3 rounded-md border border-gray-700 text-gray-200">Custom Order</a>
        </div>
      </motion.div>
    </section>
  )
}
