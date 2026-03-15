import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import './globals.css';

export const metadata = {
  title: 'PlanazosBCN — Los mejores planes de Barcelona',
  description:
    'Descubre los mejores planes, experiencias y actividades en Barcelona. Gastronomía, naturaleza, ocio, cultura y mucho más. ¡Tu próximo planazo te espera!',
  keywords: 'planes Barcelona, actividades Barcelona, qué hacer Barcelona, experiencias Barcelona, rutas Barcelona, restaurantes Barcelona',
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
  return (
    <html lang="es">
      <body>
        <Header />
        <main style={{ paddingTop: 'var(--header-height)' }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
