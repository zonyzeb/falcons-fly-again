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

export function GallerySection() {
  return (
    <section id="gallery" className="falcon-section bg-falcon-cream-dark">
      <div className="falcon-container">
        <div className="text-center mb-12">
          <span className="text-falcon-gold font-semibold text-sm uppercase tracking-wider">
            Gallery
          </span>
          <h2 className="falcon-heading text-foreground mt-2 mb-4">
            Cricket, Sweat & Smiles
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Early mornings. Late evenings. Hard-fought matches.
            Our gallery captures the moments that remind us why we keep playing.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden rounded-xl cursor-pointer"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-falcon-navy/0 group-hover:bg-falcon-navy/40 transition-colors duration-300 flex items-center justify-center">
                <p className="text-falcon-cream opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium px-4 text-center">
                  {image.alt}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-8 italic">
          Because these are the memories worth keeping.
        </p>
      </div>
    </section>
  );
}
