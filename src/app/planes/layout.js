export const metadata = {
  title: 'Todos los Planes en Barcelona — PlanazosBCN',
  description:
    'Explora todos los planes y actividades en Barcelona: gastronomía, naturaleza, cultura, vida nocturna, bienestar y mucho más. Encuentra tu próximo planazo.',
  openGraph: {
    title: 'Todos los Planes en Barcelona — PlanazosBCN',
    description: 'Explora todos los planes y actividades en Barcelona.',
    url: 'https://planazosbcn.com/planes',
    siteName: 'PlanazosBCN',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Todos los Planes en Barcelona — PlanazosBCN',
    description: 'Explora todos los planes y actividades en Barcelona.',
  },
  alternates: {
    canonical: 'https://planazosbcn.com/planes',
  },
};

export default function PlanesLayout({ children }) {
  return children;
}
