import LayoutShell from '@/components/LayoutShell';
import AuthProvider from '@/components/Auth/AuthProvider';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://planazosbcn.com';

export const viewport = {
  themeColor: '#0f0f1a',
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'PlanazosBCN — Los mejores planes de Barcelona',
    template: '%s — PlanazosBCN',
  },
  description:
    'Descubre los mejores planes, experiencias y actividades en Barcelona. Gastronomía, naturaleza, ocio, cultura y mucho más. ¡Tu próximo planazo te espera!',
  keywords: ['planes Barcelona', 'actividades Barcelona', 'qué hacer Barcelona', 'experiencias Barcelona', 'rutas Barcelona', 'restaurantes Barcelona'],
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
  },
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
    url: SITE_URL,
    siteName: 'PlanazosBCN',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: '/hero-planazosbcn.jpg',
        width: 1200,
        height: 630,
        alt: 'PlanazosBCN — Los mejores planes de Barcelona',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PlanazosBCN — Los mejores planes de Barcelona',
    description: 'Descubre los mejores planes y experiencias en Barcelona.',
    images: ['/hero-planazosbcn.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PlanazosBCN',
    url: SITE_URL,
    inLanguage: 'es-ES',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/planes?q={search_term_string}`,
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

