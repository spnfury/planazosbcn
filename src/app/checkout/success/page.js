'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import styles from './success.module.css';

/* ── Confetti generator ── */
function Confetti() {
  const colors = ['#22C55E', '#16A34A', '#C8102E', '#F59E0B', '#8B5CF6', '#3B82F6', '#EC4899', '#FFD700'];
  const pieces = Array.from({ length: 50 }, (_, i) => {
    const color = colors[i % colors.length];
    const left = Math.random() * 100;
    const delay = Math.random() * 2.5;
    const duration = 2.5 + Math.random() * 2;
    const size = 6 + Math.random() * 8;
    const rotation = Math.random() * 360;
    const shape = i % 3 === 0 ? '50%' : i % 3 === 1 ? '0' : '2px';

    return (
      <div
        key={i}
        className={styles.confettiPiece}
        style={{
          left: `${left}%`,
          width: `${size}px`,
          height: `${size * (i % 2 === 0 ? 1 : 0.6)}px`,
          backgroundColor: color,
          borderRadius: shape,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          transform: `rotate(${rotation}deg)`,
        }}
      />
    );
  });

  return <div className={styles.confettiContainer}>{pieces}</div>;
}

/* ── Main Content ── */
function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [reservation, setReservation] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  const fetchReservation = useCallback(async (attempt = 1) => {
    try {
      const res = await fetch(`/api/checkout/reservation?session_id=${encodeURIComponent(sessionId)}`);
      if (!res.ok) {
        // Webhook may not have processed yet — retry
        if (attempt < 5) {
          setTimeout(() => fetchReservation(attempt + 1), 2000);
          return;
        }
        setLoading(false);
        return;
      }

      const { reservation: data } = await res.json();
      setReservation(data);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);

      // Generate QR
      if (data.qr_code) {
        try {
          const baseUrl = window.location.origin;
          const qrUrl = `${baseUrl}/api/admin/validate-qr?code=${data.qr_code}`;
          const dataUrl = await QRCode.toDataURL(qrUrl, {
            width: 240,
            margin: 2,
            color: { dark: '#1A1A1A', light: '#FFFFFF' },
          });
          setQrDataUrl(dataUrl);
        } catch (err) {
          console.error('Error generating QR', err);
        }
      }
    } catch (err) {
      console.error('Error fetching reservation:', err);
      if (attempt < 5) {
        setTimeout(() => fetchReservation(attempt + 1), 2000);
        return;
      }
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    // Small delay for webhook to process
    const timer = setTimeout(() => fetchReservation(), 800);
    return () => clearTimeout(timer);
  }, [sessionId, fetchReservation]);

  const plan = reservation?.plans;
  const amountDisplay = reservation
    ? reservation.total_amount > 0
      ? `${(reservation.total_amount / 100).toFixed(2)}€`
      : 'Gratis'
    : null;

  /* ── Format date with nice display ── */
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return dateStr;
  };

  return (
    <div className={styles.wrapper}>
      {showConfetti && <Confetti />}

      <div className={styles.card}>
        {/* ── Success Header ── */}
        <div className={styles.successHeader}>
          <div className={styles.checkIcon}>
            <svg viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className={styles.successTitle}>¡Reserva confirmada!</h1>
          <p className={styles.successSubtitle}>
            {loading ? 'Procesando tu reserva...' : 'Tu entrada está lista'}
          </p>
        </div>

        <div className={styles.cardBody}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p className={styles.loadingText}>Cargando los detalles de tu entrada...</p>
            </div>
          ) : reservation ? (
            <>
              {/* ── Plan Detail Card ── */}
              <div className={styles.planCard}>
                {plan?.image ? (
                  <img
                    src={plan.image}
                    alt={plan.title}
                    className={styles.planImage}
                  />
                ) : (
                  <div className={styles.planImagePlaceholder}>🎉</div>
                )}
                <div className={styles.planInfo}>
                  <div className={styles.planTitle}>{plan?.title || 'Plan reservado'}</div>
                  <div className={styles.planMeta}>
                    {plan?.date && (
                      <div className={styles.planMetaItem}>
                        <span>🗓️</span>
                        <span>{formatDate(plan.date)}</span>
                      </div>
                    )}
                    {(plan?.time_start || plan?.time_end) && (
                      <div className={styles.planMetaItem}>
                        <span>🕐</span>
                        <span>
                          {plan.time_start}
                          {plan.time_end ? ` — ${plan.time_end}` : ''}
                        </span>
                      </div>
                    )}
                    {plan?.venue && (
                      <div className={styles.planMetaItem}>
                        <span>📍</span>
                        <span>{plan.venue}</span>
                      </div>
                    )}
                    {plan?.address && !plan?.venue?.includes(plan.address) && (
                      <div className={styles.planMetaItem}>
                        <span>🏠</span>
                        <span>{plan.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Details Grid ── */}
              <div className={styles.detailsGrid}>
                {reservation.localizador && (
                  <div className={`${styles.detailItem} ${styles.full}`}>
                    <div className={styles.detailLabel}>Localizador</div>
                    <div className={styles.localizadorValue}>{reservation.localizador}</div>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>Cantidad</div>
                  <div className={styles.detailValue}>{reservation.quantity} {reservation.quantity === 1 ? 'entrada' : 'entradas'}</div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>Importe</div>
                  <div className={styles.detailValue}>{amountDisplay}</div>
                </div>
              </div>

              {/* ── QR Code ── */}
              {qrDataUrl && (
                <div className={styles.qrSection}>
                  <div className={styles.qrContainer}>
                    <img src={qrDataUrl} alt="QR de entrada" className={styles.qrImage} />
                  </div>
                  <p className={styles.qrLabel}>Presenta este QR en el recinto</p>
                </div>
              )}

              {/* ── Email notice ── */}
              {reservation.customer_email && (
                <div className={styles.emailNotice}>
                  <span className={styles.emailIcon}>✉️</span>
                  <p className={styles.emailText}>
                    Hemos enviado un comprobante a <strong>{reservation.customer_email}</strong>
                  </p>
                </div>
              )}

              {/* ── Chat CTA ── */}
              {plan?.slug && (
                <div className={styles.chatNotice}>
                  <span className={styles.chatNoticeIcon}>💬</span>
                  <div className={styles.chatNoticeContent}>
                    <p className={styles.chatNoticeTitle}>¡Chatea con los demás asistentes!</p>
                    <p className={styles.chatNoticeText}>
                      Entra en la página del plan para hablar con el resto de personas que se han apuntado.
                    </p>
                    <Link href={`/planes/${plan.slug}`} className={styles.chatNoticeLink} id="go-to-chat">
                      Ir al chat del plan →
                    </Link>
                  </div>
                </div>
              )}

              {/* ── Action Buttons ── */}
              <div className={styles.actions}>
                {reservation.user_id && reservation.id && (
                  <Link href={`/cuenta/entrada/${reservation.id}`} className={styles.btnPrimary} id="view-ticket-btn">
                    🎫 Ver mi entrada
                  </Link>
                )}
                <Link href="/planes" className={styles.btnSecondary} id="back-to-plans">
                  Explorar más planes
                </Link>
              </div>
            </>
          ) : (
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>😕</div>
              <h3 className={styles.errorTitle}>No hemos encontrado la reserva</h3>
              <p className={styles.errorText}>
                Es posible que el pago aún se esté procesando. Revisa tu email para confirmar la compra o inténtalo de nuevo en unos minutos.
              </p>
              <div className={styles.actions}>
                <Link href="/planes" className={styles.btnSecondary} id="back-to-plans">
                  Ver más planes
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.successHeader}>
            <div className={styles.checkIcon}>
              <svg viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className={styles.successTitle}>¡Reserva confirmada!</h1>
            <p className={styles.successSubtitle}>Procesando tu reserva...</p>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p className={styles.loadingText}>Cargando confirmación...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
