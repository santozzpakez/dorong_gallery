import { motion, AnimatePresence } from 'framer-motion'

export default function ImageModal({ isOpen, onClose, imageUrl, title }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/95 backdrop-blur-md cursor-zoom-out p-4 md:p-10"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt={title}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl select-none border border-white/10"
            />
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 md:-right-12 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10 group shadow-xl"
              title="Close (Esc)"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">&times;</span>
            </button>

            {/* Info Badge */}
            <div className="absolute -bottom-12 left-0 right-0 flex justify-center">
              <span className="bg-black/60 backdrop-blur-md text-white/70 text-[10px] uppercase tracking-widest px-4 py-2 rounded-full border border-white/5">
                {title}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
