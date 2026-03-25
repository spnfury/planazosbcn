export default function manifest() {
  return {
    name: 'PlanazosBCN Admin',
    short_name: 'Admin P-BCN',
    description: 'Gestor y panel de administración de PlanazosBCN',
    start_url: '/admin',
    display: 'standalone',
    background_color: '#0f0f1a',
    theme_color: '#0f0f1a',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
