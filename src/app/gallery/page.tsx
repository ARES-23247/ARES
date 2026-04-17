import Image from "next/image";

export const runtime = "edge";

export default function GalleryPage() {
  const photos = [
    { src: "/gallery_1.png", alt: "Sleek robotic chassis in a dark lab", aspect: "aspect-[4/3]" },
    { src: "/gallery_2.png", alt: "FTC competition arena action shot", aspect: "aspect-video" },
    { src: "/gallery_3.png", alt: "Machining robotic joints with sparks", aspect: "aspect-[3/4]" },
    { src: "/gallery_4.png", alt: "Team editing code in neon layout", aspect: "aspect-[4/5]" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 md:py-24">
      {/* Header */}
      <div className="mb-12">
        <h3 className="text-ares-cyan font-bold uppercase tracking-widest text-sm mb-2">Build Season & Comps</h3>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter shadow-sm">
          Team <span className="text-ares-red">Gallery</span>
        </h1>
        <p className="text-white/60 mt-4 max-w-2xl text-balance">
          Explore behind the scenes of ARES 23247. From raw CAD prototypes and machining all the way to performing under the bright lights of our qualification arenas.
        </p>
      </div>

      {/* Masonry CSS Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {photos.map((photo, index) => (
          <div 
            key={index} 
            className={`relative w-full overflow-hidden rounded-2xl glass-card group cursor-pointer transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(220,38,38,0.1)] ${photo.aspect}`}
          >
            <Image 
              src={photo.src} 
              alt={photo.alt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={index < 2}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
              <p className="text-white font-medium text-sm drop-shadow-md">{photo.alt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
