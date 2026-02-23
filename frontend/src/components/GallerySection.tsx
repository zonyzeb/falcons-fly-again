import { motion } from "framer-motion";
import { GradientMesh } from "@/components/ui/GradientMesh";
import galleryImage1 from "@/assets/gallery-1.jpg";
import galleryImage2 from "@/assets/gallery-2.jpg";
import galleryImage3 from "@/assets/gallery-3.jpg";
import galleryImage4 from "@/assets/gallery-4.jpg";

const galleryImages = [
  { src: galleryImage1, alt: "Team celebration after victory" },
  { src: galleryImage2, alt: "Cricket match action shot" },
  { src: galleryImage3, alt: "Team huddle before match" },
  { src: galleryImage4, alt: "Post-match team photo" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

export function GallerySection() {
  return (
    <section id="gallery" className="falcon-section bg-falcon-cream-dark relative">
      <GradientMesh variant="section" />
      
      <div className="falcon-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-falcon-gold font-semibold text-sm uppercase tracking-wider glass px-4 py-1.5 rounded-full mb-4">
            Gallery
          </span>
          <h2 className="falcon-heading text-foreground mt-4 mb-6">
            Cricket, Sweat &{" "}
            <span className="text-gradient-gold">Smiles</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Early mornings. Late evenings. Hard-fought matches.
            Our gallery captures the moments that remind us why we keep playing.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {galleryImages.map((image, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              className="group relative aspect-square overflow-hidden rounded-2xl cursor-pointer glass"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-falcon-navy/80 via-falcon-navy/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Glassmorphic caption */}
              <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <div className="glass-dark rounded-xl px-4 py-3">
                  <p className="text-falcon-cream text-sm font-medium text-center">
                    {image.alt}
                  </p>
                </div>
              </div>
              
              {/* Top corner glow */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-falcon-gold/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-muted-foreground mt-12 italic text-lg"
        >
          Because these are the memories worth keeping.
        </motion.p>
      </div>
    </section>
  );
}
