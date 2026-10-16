import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '[Lenna] — Algorithmic Image Transformer',
    short_name: '[Lenna]',
    description: 'Transform images with 56 algorithmic transformations, halftone screens, Bayer dithers, and After Effects style multi-layer composition.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/favicon.svg',
        sizes: '128x128',
        type: 'image/svg+xml',
      },
    ],
  };
}
