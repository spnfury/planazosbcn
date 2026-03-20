import LayoutShell from '@/components/LayoutShell';
import DossierClient from './DossierClient';

export const metadata = {
  title: 'Para Comercios | Dossier Planazos BCN',
  description: 'Únete a Planazos BCN y conecta tu negocio con miles de personas que buscan su próximo plan en Barcelona.',
};

export default function ComerciosPage() {
  return (
    <LayoutShell>
      <DossierClient />
    </LayoutShell>
  );
}
