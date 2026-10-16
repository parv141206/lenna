import "@/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Geist } from "next/font/google";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lenna.art";

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "[Lenna] — Algorithmic Image Transformer & Editorial Matrix Lab",
    template: "%s | [Lenna]",
  },
  description:
    "Transform images with 56 mathematical transformations, spatial convolutions, Lichtenstein polka dots, CMYK halftones, Bayer dithers, Risograph spot inks, and an After Effects multi-layer composition timeline. 100% client-side compute.",
  applicationName: "[Lenna]",
  authors: [{ name: "Lenna Core Team" }],
  generator: "Next.js",
  keywords: [
    "Lenna",
    "image transformer",
    "algorithmic art",
    "halftone generator",
    "bayer dither",
    "floyd-steinberg",
    "atkinson zine dither",
    "risograph printmaking",
    "analog glitch",
    "pixel sort",
    "voronoi cellular mosaic",
    "moire pattern interference",
    "after effects web timeline",
    "multi-layer image compositing",
    "client-side image processing",
    "canvas 2d image filters",
    "editorial matrix lab",
    "monochrome duotone",
  ],
  creator: "Lenna",
  publisher: "Lenna",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "[Lenna]",
    title: "[Lenna] — Algorithmic Image Transformer & Editorial Matrix Lab",
    description:
      "Transform images with 56 mathematical transformations, spatial convolutions, CMYK halftones, Bayer dithers, Risograph inks, and an After Effects multi-layer composition timeline.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "[Lenna] — Algorithmic Image Transformer & Editorial Matrix Lab",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "[Lenna] — Algorithmic Image Transformer & Editorial Matrix Lab",
    description:
      "56 algorithmic transformations, Halftone screens, Bayer dithers, Risograph spot inks, and an After Effects multi-layer composition timeline. 100% client-side compute.",
    images: ["/opengraph-image"],
    creator: "@lenna_lab",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "[Lenna]",
  alternateName: "Lenna Image Transformer",
  url: siteUrl,
  description:
    "An advanced algorithmic image transformer and editorial matrix lab offering 56 mathematical transformations, spatial convolutions, halftone screening, ordered dithering, analog glitches, and an After Effects multi-layer composition timeline with zero server uploads.",
  applicationCategory: "MultimediaApplication, DesignApplication",
  operatingSystem: "All modern web browsers",
  browserRequirements: "Requires HTML5 Canvas and JavaScript support",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "56 Pure Mathematical and Algorithmic Image Transformations",
    "12 Halftone & Rosette Screen Systems (CMYK, Newsprint, Polka Dots, Spirals)",
    "10 Dithering Algorithms (Bayer 4x4, Bayer 8x8, Floyd-Steinberg, Atkinson, Stucki, Blue Noise)",
    "10 Printmaking Modules (Risograph Inks, Banknote Intaglio, Woodcut, Cyanotype)",
    "12 Analog & Digital Glitches (Pixel Sort, Chromatic Dispersion, Slit-Scan, CRT Phosphor)",
    "12 Generative Systems (ASCII Typography, Voronoi Stained Glass, Moiré Waves, Reaction-Diffusion)",
    "After Effects Style Vertical Multi-Layer Composition Timeline",
    "Photoshop Blend Modes (Normal, Multiply, Screen, Overlay, Hard Light, Darken, Lighten, Difference, Add)",
    "Horizontal Multi-Image Drag-to-Expand Layer Spans",
    "Custom Editorial Color Palette Manager with 1-Click Parameter Quick-Pick",
    "High-Performance 60/120 FPS Realtime Render Engine with RequestAnimationFrame",
    "100% Client-Side Private Compute with Zero Server Uploads",
    "Batch Image ZIP Export via JSZip",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
