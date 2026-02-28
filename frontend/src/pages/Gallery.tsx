import { SEO } from "@/components/SEO";
import { GallerySection } from "@/components/GallerySection";

export default function GalleryPage() {
  return (
    <div className="pt-20">
      <SEO
        title="Gallery"
        description="Falcons Cricket Club photo gallery — match action, team celebrations, and behind-the-scenes moments."
        path="/gallery"
      />
      <GallerySection />
    </div>
  );
}
