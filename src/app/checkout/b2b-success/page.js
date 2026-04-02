import Link from 'next/link';

export default function B2BSuccessPage() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-primary)' }}>
        ¡Pago completado con éxito!
      </h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', maxWidth: '600px', marginBottom: '2rem' }}>
        Enhorabuena, tu solicitud comercial ha sido activada y confirmada.<br/>
        Nuestro equipo se pondrá en contacto contigo muy pronto (menos de 24h) en el email de pago para coordinarnos, pedir tus fotos premium o activar tu visibilidad y Reels.
      </p>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link 
          href="/"
          className="btn btn--primary"
        >
          Volver a PlanazosBCN
        </Link>
        <a 
          href="mailto:hola@planazosbcn.com"
          className="btn btn--secondary"
        >
          Contactar Soporte
        </a>
      </div>
    </div>
  );
}
