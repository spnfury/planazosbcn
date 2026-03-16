import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '500px',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😕</div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-3xl)',
          fontWeight: 800,
          marginBottom: '1rem',
          color: 'var(--color-text)',
        }}>
          Pago cancelado
        </h1>
        <p style={{
          fontSize: 'var(--text-lg)',
          color: 'var(--color-text-secondary)',
          marginBottom: '2rem',
        }}>
          No se ha realizado ningún cargo. Puedes volver a intentarlo cuando quieras.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/planes" className="btn btn--primary btn--large" id="retry-plans">
            Ver planes
          </Link>
          <Link href="/" className="btn btn--secondary btn--large" id="cancel-home">
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
