import type { Metadata } from "next";
import { GalleryPageShell } from "@/components/gallery/GalleryPageShell";

export const metadata: Metadata = {
  title: "Photo Gallery",
  description:
    "Photos from events catered by VB Caterers in Bengaluru — buffets, live counters, weddings and celebrations.",
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: "Photo Gallery | VB Caterers, Bengaluru",
    description:
      "Photos from events catered by VB Caterers in Bengaluru.",
    url: "/gallery",
  },
};

export default function GalleryPhotosPage() {
  return <GalleryPageShell section="photos" />;
}
