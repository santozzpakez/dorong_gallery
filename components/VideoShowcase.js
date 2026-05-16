import { motion } from 'framer-motion'

export default function VideoShowcase(){
  return (
    <section className="py-16 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        <div className="rounded-xl overflow-hidden glass p-6 flex flex-col items-center">
          <div className="w-80 h-80 bg-black rounded-lg overflow-hidden shadow-lg">
            <motion.video
              src="/sublimation-sample.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <h3 className="mt-6 text-2xl font-semibold">Crafted With Precision</h3>
          <p className="text-gray-400 mt-2">From printing to packaging — premium sublimation process.</p>
        </div>
      </div>
    </section>
  )
}
