/**
 * All editable site copy, links and image credits live here.
 * Menu content is never stored here — it comes from data/menu.json.
 */

export const site = {
  name: "VB Caterers",
  tagline: "Luxury on Every Plate, Royalty in Every Bite",
  subLine: "Best Catering Service in Bengaluru · With Heart, Heritage & Hospitality",
  description:
    "VB Caterers is a premium catering service in Bengaluru serving 2000+ dishes across South Indian, North Indian, Chinese and continental cuisines for weddings, corporate events and private parties.",
  url: "https://vbcaterers.com",
  phoneDisplay: "+91 78990 40404",
  phoneHref: "tel:+917899040404",
  email: "vbcaterers5@gmail.com",
  address:
    "28, 11th Main Rd, behind KEB Counter, JC Nagar, Kurubarahalli, Basaweshwara Nagar, Bengaluru, Karnataka 560086",
  addressLocality: "Bengaluru",
  addressRegion: "Karnataka",
  postalCode: "560086",
  country: "IN",
  copyright: "© VB Caterers",
} as const;

const quoteText =
  "Hi VB Caterers, I'd like a quote for my event.";
const tastingText =
  "Hi VB Caterers, I'd like to book a food tasting session for my event.";

export const whatsApp = {
  quote: `https://wa.me/917899040404?text=${encodeURIComponent(quoteText)}`,
  tasting: `https://wa.me/917899040404?text=${encodeURIComponent(tastingText)}`,
  direct: "https://wa.me/917899040404",
} as const;

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  site.address,
)}`;

export const pdfUrl = "/VB-Caterers-Menu.pdf";

/**
 * Social / media handles. Left empty on purpose — fill them in and the
 * matching button renders automatically (see `linkStack` in app/page.tsx).
 * The photo album and video album are the in-site, Drive-backed galleries.
 */
export const socials = {
  instagram: "#",
  facebook: "#",
  photoAlbum: "/gallery",
  videoChannel: "/gallery/videos",
} as const;

export type LinkItem = {
  label: string;
  sub: string;
  href: string;
  icon:
    | "whatsapp"
    | "menu"
    | "calendar"
    | "phone"
    | "download"
    | "globe"
    | "star"
    | "pin"
    | "mail"
    | "instagram"
    | "facebook"
    | "photos"
    | "video";
  external?: boolean;
};

export const linkStack: LinkItem[] = [
  {
    label: "View Full Menu",
    sub: "2000+ dishes, 9 cuisines",
    href: "/menu",
    icon: "menu",
  },
  {
    label: "Book a Tasting Session",
    sub: "Taste before you book",
    href: whatsApp.tasting,
    icon: "calendar",
    external: true,
  },
  {
    label: "Find Us",
    sub: "Basaweshwara Nagar, Bengaluru",
    href: mapsUrl,
    icon: "pin",
    external: true,
  },
  {
    label: "Photo Album",
    sub: "Real events we catered",
    href: socials.photoAlbum,
    icon: "photos",
  },
  {
    label: "Watch Our Videos",
    sub: "Live counters in action",
    href: socials.videoChannel,
    icon: "video",
  },
];

export const trustChips = [
  "FSSAI certified kitchen",
  "300+ dishes",
  "Food tasting before booking",
];

export type Occasion = {
  title: string;
  blurb: string;
  image: string;
  alt: string;
};

export const occasions: Occasion[] = [
  {
    title: "Weddings",
    blurb:
      "Grand catering with multi-course menus, lavish setups, and cultural richness for your special day.",
    image: "/images/stock/occasion-wedding.webp",
    alt: "Bride and groom dressed in traditional attire at a wedding",
  },
  {
    title: "Engagements",
    blurb:
      "Elegant and intimate catering services that match the charm and importance of your engagement.",
    image: "/images/stock/occasion-engagement.webp",
    alt: "Close-up of an engagement ring held by a couple",
  },
  {
    title: "Birthdays",
    blurb:
      "Fun and festive catering for kids and adults, with customised menus and sweet surprises.",
    image: "/images/stock/occasion-birthday.webp",
    alt: "Birthday party table laid out with cake and decorations",
  },
  {
    title: "Anniversaries",
    blurb:
      "Celebrate years of togetherness with a romantic and refined dining experience for your guests.",
    image: "/images/stock/occasion-anniversary.webp",
    alt: "Romantic candle-lit dinner table set for two",
  },
  {
    title: "Housewarmings",
    blurb:
      "Warm your new space with soulful food, traditional dishes, and welcoming hospitality.",
    image: "/images/stock/occasion-housewarming.webp",
    alt: "Decorated dining room ready for a housewarming gathering",
  },
  {
    title: "Corporate Events",
    blurb:
      "Professional catering solutions for conferences, office parties, and business luncheons.",
    image: "/images/stock/occasion-corporate.webp",
    alt: "Guests seated at a corporate conference before a presentation",
  },
  {
    title: "Private Parties",
    blurb:
      "Luxury catering for intimate gatherings, reunions, or surprise parties at any location.",
    image: "/images/stock/occasion-private-party.webp",
    alt: "Formal banquet seating arranged for a private party",
  },
  {
    title: "Themed Events",
    blurb:
      "From Bollywood to retro, our theme-based catering creates immersive dining experiences.",
    image: "/images/stock/occasion-outdoor.webp",
    alt: "Celebration space glowing with warm themed string lights",
  },
  {
    title: "Outdoor Catering",
    blurb:
      "Buffet setups and live counters in open spaces, ideal for garden parties and outdoor events.",
    image: "/images/stock/occasion-outdoor2.webp",
    alt: "Outdoor event venue with stage, seating and decorations",
  },
];

export type Cuisine = {
  title: string;
  sectionId: string;
  groupTitle?: string;
  note: string;
};

/**
 * Each cuisine points at a real section / group anchor in data/menu.json.
 * Anchors are resolved at build time with `resolveCuisineAnchor`.
 */
export const cuisines: Cuisine[] = [
  {
    title: "South Indian",
    sectionId: "main-course",
    groupTitle: "South Indian Counter",
    note: "Sambar, rasam, palya & rice bath",
  },
  {
    title: "North Indian",
    sectionId: "main-course",
    groupTitle: "North Indian Gravy",
    note: "Rich gravies & tandoor classics",
  },
  {
    title: "Punjabi",
    sectionId: "main-course",
    groupTitle: "Punjabi Counter",
    note: "Creamy gravies & dhaba classics",
  },
  {
    title: "Rajasthani",
    sectionId: "main-course",
    groupTitle: "Rajasthani Counter",
    note: "Dal baati, gatte & ker sangri",
  },
  {
    title: "Gujarati",
    sectionId: "main-course",
    groupTitle: "Gujarati Counter",
    note: "Sweet-savoury thali favourites",
  },
  {
    title: "Jain",
    sectionId: "main-course",
    note: "No onion, no garlic preparations",
  },
  {
    title: "Brahmin",
    sectionId: "breakfast",
    note: "Traditional sattvic breakfast spreads",
  },
  {
    title: "Chinese",
    sectionId: "asian-food",
    groupTitle: "Chinese Food",
    note: "Indo-Chinese starters & noodles",
  },
  {
    title: "Continental",
    sectionId: "extra-counter",
    note: "Italian, Mexican & Lebanese counters",
  },
];

export type WhyCard = { title: string; bullets: string[] };

export const whyCards: WhyCard[] = [
  {
    title: "Royal Experience",
    bullets: [
      "Regal buffet setup with themed decor",
      "Live counters with traditional chefs",
      "Silver & brass serving ware",
    ],
  },
  {
    title: "Best Quality",
    bullets: [
      "Premium, fresh ingredients",
      "FSSAI certified kitchen",
      "Zero compromise on hygiene",
    ],
  },
  {
    title: "Authentic Taste",
    bullets: [
      "Traditional recipes passed down generations",
      "No added preservatives or colours",
      "Chef-special spice blends",
    ],
  },
  {
    title: "Presentation & Decor",
    bullets: [
      "Themed food counters for every cuisine",
      "Decor with flowers, lights & elements",
      "Eco-friendly plating & serving",
    ],
  },
  {
    title: "Widest Menu",
    bullets: [
      "300+ dishes across cuisines",
      "Live dosa, chaat & dessert counters",
      "Wedding, festival and corporate menus",
    ],
  },
  {
    title: "Client Satisfaction",
    bullets: [
      "Customised service for every event",
      "Food tasting before booking",
      "Support through the entire event",
    ],
  },
];

export const brandStory = {
  heading: "Crafted with Quality & Elegance",
  paragraphs: [
    "VB Caterers stands as a symbol of trust, taste, and timeless tradition in Bengaluru's catering scene. Known for delivering rich culinary experiences with a royal touch, we specialise in turning every event into an unforgettable celebration.",
    "Whether you are planning a lavish wedding, a graceful engagement, a corporate gala, or a festive family function — our expert chefs and event team blend heritage with hospitality to deliver not just food, but lasting impressions.",
    "From traditional South Indian feasts to North Indian delights, fusion cuisines and global flavours, every menu is served with signature presentation and golden service quality.",
  ],
};

export type GalleryImage = { src: string; alt: string; note?: string };

/**
 * Photo strip. The first four are VB Caterers' own photographs (Canva exports,
 * 500×500); the rest are locally saved royalty-free images — see CREDITS.md.
 */
export const gallery: GalleryImage[] = [
  {
    src: "/images/buffet.jpg",
    alt: "A beautiful, luxurious Indian catering buffet spread",
  },
  {
    src: "/images/dosa.jpg",
    alt: "Live dosa cooking counter at a luxurious Indian wedding",
  },
  {
    src: "/images/stock/gallery-thali.webp",
    alt: "South Indian meals served on a banana leaf",
  },
  {
    src: "/images/3-1.jpg",
    alt: "Colourful catering spread prepared by VB Caterers",
  },
  {
    src: "/images/stock/gallery-mithai.webp",
    alt: "Tray of Indian mithai and sweets ready to be served",
  },
  {
    src: "/images/344434.jpg",
    alt: "Freshly cooked dish from the VB Caterers kitchen",
  },
  {
    src: "/images/stock/gallery-tikka.webp",
    alt: "Vegetarian tikka platter served hot at a celebration",
  },
  {
    src: "/images/stock/gallery-street-food.webp",
    alt: "Indian street food counter with chaat and snacks",
  },
];

export const heroImage = {
  src: "/images/stock/hero-buffet.webp",
  alt: "A generous Indian buffet spread laid out for guests",
};

/** Local image credits (CC0 needs no attribution, but we credit anyway). */
export const imageCredits = [
  "Hero & stock photography: rawpixel / StockSnap (CC0), nenadstojkovicart (CC BY 2.0).",
  "Banana-leaf thali: Melanie M, Wikimedia Commons (CC BY 2.0).",
  "Mithai tray: DDohler, Wikimedia Commons (CC BY 2.0).",
  "Vegetarian platter: Contrapunctus-1, Wikimedia Commons (CC BY-SA 4.0).",
  "String-light café: PattayaPatrol, Wikimedia Commons (CC BY-SA 4.0).",
  "Full list: public/images/CREDITS.md.",
];
