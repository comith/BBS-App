import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BBS ITH',
    short_name: 'BBS ITH',
    description: 'Behavior Base Safety (BBS)',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icons/ith.png', // เอา ../public/ ออก
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/ith.png', // เอา ../public/ ออก
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}