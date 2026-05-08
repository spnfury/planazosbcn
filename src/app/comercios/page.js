import DossierClient from './DossierClient';

export const metadata = {
  title: 'Para Comercios — Dossier Planazos BCN',
  description:
    'Únete a Planazos BCN y conecta tu negocio con miles de personas que buscan su próximo plan en Barcelona.',
  alternates: { canonical: '/comercios' },
  openGraph: {
    title: 'Para Comercios — Dossier Planazos BCN',
    description:
      'Únete a Planazos BCN y conecta tu negocio con miles de personas que buscan su próximo plan en Barcelona.',
    url: '/comercios',
    siteName: 'PlanazosBCN',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Para Comercios — Dossier Planazos BCN',
    description:
      'Únete a Planazos BCN y conecta tu negocio con miles de personas que buscan su próximo plan en Barcelona.',
  },
};

export default function ComerciosPage() {
  return (
    <DossierClient />
  );
}
