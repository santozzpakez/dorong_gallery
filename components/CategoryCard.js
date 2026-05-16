import { motion } from 'framer-motion'
import Link from 'next/link'

export default function CategoryCard({title, image, href}){
  return (
    <Link href={href} className="group">
      <motion.div 
        whileHover={{ scale: 1.05 }} 
        className="relative rounded-2xl overflow-hidden bg-white dark:bg-black/40 border border-gray-200 dark:border-neon-cyan/20 shadow-xl shadow-gray-200/50 dark:shadow-none cinematic-glow-cyan transition-all duration-300"
      >
        <div className="h-56 md:h-80 bg-gray-100 dark:bg-black">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover opacity-100 dark:opacity-80 group-hover:scale-110 transition-transform duration-700" 
            loading="lazy" 
          />
          {/* Gradient Overlay: Darker bottom for better text legibility in both modes */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
        </div>
        
        <div className="absolute bottom-0 w-full p-6 z-10">
          <h3 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow-md group-hover:text-[#00f3ff] transition-all">
            {title}
          </h3>
          <div className="h-1 w-10 bg-gradient-to-r from-[#00b4d8] to-[#9d4edd] mt-2 group-hover:w-20 transition-all duration-300"></div>
          <p className="text-xs text-gray-200 mt-2 font-mono uppercase tracking-tighter">Premium collection</p>
        </div>
      </motion.div>
    </Link>
  )
}
