import Link from 'next/link';

export default function CheckoutSuccessPage() {
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
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-3xl)',
          fontWeight: 800,
          marginBottom: '1rem',
          color: 'var(--color-text)',
        }}>
          ¡Reserva confirmada!
        </h1>
        <p style={{
          fontSize: 'var(--text-lg)',
          color: 'var(--color-text-secondary)',
          marginBottom: '0.5rem',
        }}>
          Tu entrada ha sido reservada con éxito.
        </p>
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          marginBottom: '2rem',
        }}>
          Recibirás un email de confirmación con los detalles de tu reserva.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/planes" className="btn btn--primary btn--large" id="back-to-plans">
            Ver más planes
          </Link>
          <Link href="/" className="btn btn--secondary btn--large" id="back-home">
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
