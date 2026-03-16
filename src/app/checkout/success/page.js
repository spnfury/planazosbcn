'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabase';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [reservation, setReservation] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    async function fetchReservation() {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, plans(title, date, venue)')
        .eq('stripe_session_id', sessionId)
        .single();

      if (!error && data) {
        setReservation(data);
        
        // Generate QR code
        if (data.qr_code) {
          try {
            const baseUrl = window.location.origin;
            const qrUrl = `${baseUrl}/api/admin/validate-qr?code=${data.qr_code}`;
            const dataUrl = await QRCode.toDataURL(qrUrl, {
              width: 200,
              margin: 2,
              color: {
                dark: '#1A1A1A',
                light: '#FFFFFF',
              },
            });
            setQrDataUrl(dataUrl);
          } catch (err) {
            console.error('Error generating QR', err);
          }
        }
      }
      setLoading(false);
    }

    // Wait a brief moment for webhook to process (if not free)
    const timer = setTimeout(fetchReservation, 1000);
    return () => clearTimeout(timer);
  }, [sessionId]);

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
        width: '100%',
        background: 'var(--color-surface)',
        padding: '3rem 2rem',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--color-border-light)'
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

        {loading ? (
          <p style={{ margin: '2rem 0', color: 'var(--color-text-secondary)' }}>
            Cargando los detalles de tu entrada...
          </p>
        ) : reservation ? (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {reservation.plans?.title}
            </h3>
            
            {(reservation.plans?.date || reservation.plans?.venue) && (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '1.5rem' }}>
                {reservation.plans.date && `🗓️ ${reservation.plans.date} `}
                {reservation.plans.venue && `📍 ${reservation.plans.venue}`}
              </p>
            )}

            {qrDataUrl && (
              <div style={{ display: 'inline-block', padding: '1rem', background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                <img src={qrDataUrl} alt="QR Entrada" style={{ width: '150px', height: '150px', display: 'block' }} />
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                  Abre esto en el recinto
                </p>
              </div>
            )}
            
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: '1rem' }}>
              Hemmos enviado un comprobante a <strong>{reservation.customer_email}</strong>.
            </p>
          </div>
        ) : (
          <p style={{ margin: '2rem 0', color: 'var(--color-error)' }}>
            No hemos podido recuperar los detalles de la reserva. Revisa tu email.
          </p>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {reservation?.user_id && reservation?.id && (
            <Link href={`/cuenta/entrada/${reservation.id}`} className="btn btn--primary" id="view-ticket-btn">
              🎫 Ver mi entrada
            </Link>
          )}
          <Link href="/planes" className="btn btn--secondary" id="back-to-plans">
            Ver más planes
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Cargando confirmación...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

