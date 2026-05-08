export const metadata = {
  title: 'Contacto y colaboraciones',
  description:
    'Contacta con PlanazosBCN para colaborar, sugerir planes o resolver dudas. Conecta tu negocio con miles de personas que buscan los mejores planes de Barcelona.',
  alternates: { canonical: '/contacto' },
  openGraph: {
    title: 'Contacto y colaboraciones — PlanazosBCN',
    description:
      'Contacta con PlanazosBCN para colaborar, sugerir planes o resolver dudas.',
    url: '/contacto',
    siteName: 'PlanazosBCN',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contacto y colaboraciones — PlanazosBCN',
    description:
      'Contacta con PlanazosBCN para colaborar, sugerir planes o resolver dudas.',
  },
};

export default function ContactoLayout({ children }) {
  return children;
}
