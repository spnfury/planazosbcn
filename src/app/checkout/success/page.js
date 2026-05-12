'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { WHATSAPP_GROUP_URL } from '@/components/WhatsAppCTA/WhatsAppCTA';
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
                    <Link href={`/planes/${plan.slug}?chat=true`} className={styles.chatNoticeLink} id="go-to-chat">
                      Ir al chat del plan →
                    </Link>
                  </div>
                </div>
              )}

              {/* ── WhatsApp group CTA ── */}
              <div className={styles.waNotice}>
                <div className={styles.waNoticeIcon}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                </div>
                <div className={styles.waNoticeContent}>
                  <p className={styles.waNoticeTitle}>Apúntate al grupo de WhatsApp</p>
                  <p className={styles.waNoticeText}>
                    Recibe los próximos planazos, descuentos exclusivos y avisos cuando se abren las plazas.
                  </p>
                  <a
                    href={WHATSAPP_GROUP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.waNoticeLink}
                    id="success-whatsapp-cta"
                  >
                    Unirme al grupo →
                  </a>
                </div>
              </div>

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
