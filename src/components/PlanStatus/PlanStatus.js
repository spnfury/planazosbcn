'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './PlanStatus.module.css';

export default function PlanStatus({ planId, planSlug, capacity, spotsTaken }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'reserved' | 'not-reserved'
  const [reservation, setReservation] = useState(null);

  useEffect(() => {
    async function checkReservation() {
      try {
        const res = await fetch(`/api/reservation-check?planId=${planId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.hasReservation) {
            setStatus('reserved');
            setReservation(data.reservation);
          } else {
            setStatus('not-reserved');
          }
        } else {
          setStatus('not-reserved');
        }
      } catch {
        setStatus('not-reserved');
      }
    }

    checkReservation();
  }, [planId]);

  const spotsLeft = capacity > 0 ? capacity - (spotsTaken || 0) : null;
  const occupancyPct = capacity > 0 ? Math.round(((spotsTaken || 0) / capacity) * 100) : 0;

  // Reserved state — show "ya estás dentro"
  if (status === 'reserved') {
    return (
      <div className={styles.reservedCard}>
        <div className={styles.reservedHeader}>
          <span className={styles.reservedCheck}>✅</span>
          <div>
            <p className={styles.reservedTitle}>¡Ya estás apuntado!</p>
            <p className={styles.reservedSub}>Tu plaza está confirmada</p>
          </div>
        </div>

        {reservation?.localizador && (
          <div className={styles.reservedLocalizador}>
            <span className={styles.reservedLocLabel}>Localizador</span>
            <span className={styles.reservedLocCode}>{reservation.localizador}</span>
          </div>
        )}

        <div className={styles.chatCta}>
          <span className={styles.chatCtaIcon}>💬</span>
          <div className={styles.chatCtaContent}>
            <p className={styles.chatCtaTitle}>Chat del plan</p>
            <p className={styles.chatCtaText} style={{ marginBottom: '8px' }}>
              Habla con los demás asistentes
            </p>
            <Link 
              href={`/planes/${planSlug}?chat=true`}
              style={{
                backgroundColor: '#EFF6FF',
                color: '#1E40AF',
                border: '1px solid #BFDBFE',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Abrir chat ahora →
            </Link>
          </div>
        </div>

        {reservation?.id && (
          <Link href={`/cuenta/entrada/${reservation.id}`} className={styles.viewTicketBtn} id="view-my-ticket">
            🎫 Ver mi entrada
          </Link>
        )}
      </div>
    );
  }

  // Not reserved or loading — show urgency elements
  if (status === 'loading') return null;

  return (
    <div className={styles.urgencyWrapper}>
      {/* Live activity indicator */}
      {spotsTaken > 0 && (
        <div className={styles.liveIndicator}>
          <span className={styles.liveDot} />
          <span className={styles.liveText}>
            <strong>{spotsTaken}</strong> {spotsTaken === 1 ? 'persona se ha apuntado' : 'personas se han apuntado'}
          </span>
        </div>
      )}

      {/* Urgency bar — few spots left */}
      {spotsLeft !== null && spotsLeft <= 10 && spotsLeft > 0 && (
        <div className={styles.urgencyBanner}>
          <span className={styles.urgencyIcon}>🔥</span>
          <span className={styles.urgencyText}>
            ¡Solo quedan <strong>{spotsLeft}</strong> {spotsLeft === 1 ? 'plaza' : 'plazas'}!
          </span>
        </div>
      )}

      {/* High demand indicator */}
      {occupancyPct >= 50 && (spotsLeft === null || spotsLeft > 10) && (
        <div className={styles.demandBanner}>
          <span className={styles.demandIcon}>⚡</span>
          <span className={styles.demandText}>Alta demanda — {occupancyPct}% ocupado</span>
        </div>
      )}

      {/* Social proof avatars */}
      {spotsTaken >= 3 && (
        <div className={styles.socialProof}>
          <div className={styles.socialAvatars}>
            {[...Array(Math.min(spotsTaken, 4))].map((_, i) => (
              <div key={i} className={styles.socialAvatar} style={{ zIndex: 5 - i, marginLeft: i > 0 ? '-8px' : '0' }}>
                <span>{['😊', '🥳', '😎', '🤩'][i]}</span>
              </div>
            ))}
            {spotsTaken > 4 && (
              <div className={styles.socialAvatarMore} style={{ marginLeft: '-8px' }}>
                +{spotsTaken - 4}
              </div>
            )}
          </div>
          <span className={styles.socialText}>Gente ya apuntada al plan</span>
        </div>
      )}
    </div>
  );
}
