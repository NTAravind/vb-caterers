import type { Metadata } from "next";
import { GalleryPageShell } from "@/components/gallery/GalleryPageShell";

export const metadata: Metadata = {
  title: "Videos",
  description:
    "Video clips from events catered by VB Caterers in Bengaluru — live counters, buffets and celebrations.",
  alternates: { canonical: "/gallery/videos" },
  openGraph: {
    title: "Videos | VB Caterers, Bengaluru",
    description: "Video clips from events catered by VB Caterers in Bengaluru.",
    url: "/gallery/videos",
  },
};

export default function GalleryVideosPage() {
  return <GalleryPageShell section="videos" />;
}
