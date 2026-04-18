import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ScreenshotGallery() {
  const images = ["/hero_bg.png", "/gallery_4.png", "/news_1.png"];
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  return (
    <div className="my-6 relative border border-white/10 rounded-xl overflow-hidden bg-black aspect-video group shadow-xl">
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={images[index]}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full object-cover opacity-80"
          alt="Telemetry Dashboard"
        />
      </AnimatePresence>

      <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={prev} className="p-2 bg-black/50 hover:bg-ares-red/80 text-white rounded-full backdrop-blur transition-colors"><ChevronLeft size={24} /></button>
        <button onClick={next} className="p-2 bg-black/50 hover:bg-ares-cyan/80 text-white rounded-full backdrop-blur transition-colors"><ChevronRight size={24} /></button>
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {images.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === index ? "bg-ares-gold scale-125" : "bg-white/30"}`} />
        ))}
      </div>
    </div>
  );
}
