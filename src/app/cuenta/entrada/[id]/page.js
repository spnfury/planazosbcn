'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import QRCode from 'qrcode';
import styles from './entrada.module.css';

export default function EntradaPage({ params }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [resolvedParams, setResolvedParams] = useState(null);

  // Resolve params (Next.js 15+ async params)
  useEffect(() => {
    async function resolve() {
      const p = await params;
      setResolvedParams(p);
    }
    resolve();
  }, [params]);

  useEffect(() => {
    if (authLoading || !resolvedParams) return;

    if (!user) {
      router.push('/login');
      return;
    }

    async function fetchReservation() {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, plans(title, slug, image, date, venue, address, time_start, time_end)')
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        router.push('/cuenta');
        return;
      }

      setReservation(data);

      // Generate QR code
      if (data.qr_code) {
        const baseUrl = window.location.origin;
        const qrUrl = `${baseUrl}/api/admin/validate-qr?code=${data.qr_code}`;
        const dataUrl = await QRCode.toDataURL(qrUrl, {
          width: 280,
          margin: 2,
          color: {
            dark: '#1A1A1A',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
        });
        setQrDataUrl(dataUrl);
      }

      setLoading(false);
    }

    fetchReservation();
  }, [user, authLoading, resolvedParams, router]);

  if (authLoading || loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingSpinner} />
        <p>Cargando entrada...</p>
      </div>
    );
  }

  if (!reservation) return null;

  const plan = reservation.plans;
  const isValidated = !!reservation.validated_at;

  return (
    <div className={styles.page}>
      <div className="container">
        <Link href="/cuenta" className={styles.backLink} id="back-to-account">
          ← Volver a mi cuenta
        </Link>

        <div className={styles.ticketCard}>
          {/* Ticket Header */}
          <div className={styles.ticketHeader}>
            <div className={styles.ticketHeaderBg} />
            <div className={styles.ticketHeaderContent}>
              <span className={styles.ticketBrand}>🔥 PlanazosBCN</span>
              <h1 className={styles.ticketTitle}>{plan?.title || 'Entrada'}</h1>
              <div className={styles.ticketMeta}>
                {plan?.date && <span>🗓️ {plan.date}</span>}
                {plan?.time_start && (
                  <span>
                    🕐 {plan.time_start}
                    {plan?.time_end ? ` — ${plan.time_end}` : ''}
                  </span>
                )}
              </div>
              {plan?.venue && (
                <div className={styles.ticketVenue}>
                  📍 {plan.venue}
                  {plan?.address && <span className={styles.ticketAddress}> · {plan.address}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Perforation line */}
          <div className={styles.perforation}>
            <div className={styles.perforationHole} style={{ left: '-12px' }} />
            <div className={styles.perforationLine} />
            <div className={styles.perforationHole} style={{ right: '-12px' }} />
          </div>

          {/* QR Code Section */}
          <div className={styles.qrSection}>
            {isValidated ? (
              <div className={styles.validatedBadge}>
                <span className={styles.validatedIcon}>✅</span>
                <span className={styles.validatedText}>Entrada validada</span>
                <span className={styles.validatedDate}>
                  {new Date(reservation.validated_at).toLocaleString('es-ES')}
                </span>
              </div>
            ) : qrDataUrl ? (
              <>
                <div className={styles.qrWrapper}>
                  <img
                    src={qrDataUrl}
                    alt="QR de entrada"
                    className={styles.qrImage}
                  />
                </div>
                <p className={styles.qrHint}>
                  Muestra este QR en la entrada del evento
                </p>
              </>
            ) : (
              <div className={styles.qrPlaceholder}>
                <span>QR no disponible</span>
              </div>
            )}
          </div>

          {/* Ticket Footer */}
          <div className={styles.ticketFooter}>
            <div className={styles.ticketDetail}>
              <span className={styles.detailLabel}>Cantidad</span>
              <span className={styles.detailValue}>
                {reservation.quantity} {reservation.quantity === 1 ? 'entrada' : 'entradas'}
              </span>
            </div>
            <div className={styles.ticketDetail}>
              <span className={styles.detailLabel}>Estado</span>
              <span className={`${styles.detailValue} ${styles.detailPaid}`}>
                {reservation.status === 'paid' ? '✅ Confirmada' : reservation.status}
              </span>
            </div>
            <div className={styles.ticketDetail}>
              <span className={styles.detailLabel}>ID</span>
              <span className={styles.detailValue}>#{reservation.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
