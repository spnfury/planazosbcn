import LayoutShell from '@/components/LayoutShell';
import AuthProvider from '@/components/Auth/AuthProvider';
import './globals.css';

export const viewport = {
  themeColor: '#0f0f1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata = {
  title: 'PlanazosBCN — Los mejores planes de Barcelona',
  description:
    'Descubre los mejores planes, experiencias y actividades en Barcelona. Gastronomía, naturaleza, ocio, cultura y mucho más. ¡Tu próximo planazo te espera!',
  keywords: 'planes Barcelona, actividades Barcelona, qué hacer Barcelona, experiencias Barcelona, rutas Barcelona, restaurantes Barcelona',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'PlanazosBCN',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'PlanazosBCN — Los mejores planes de Barcelona',
    description: 'Descubre los mejores planes, experiencias y actividades en Barcelona.',
    url: 'https://planazosbcn.com',
    siteName: 'PlanazosBCN',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PlanazosBCN — Los mejores planes de Barcelona',
    description: 'Descubre los mejores planes y experiencias en Barcelona.',
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PlanazosBCN',
    url: 'https://planazosbcn.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://planazosbcn.com/planes?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}

