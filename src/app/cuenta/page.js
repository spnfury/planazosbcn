'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import styles from './cuenta.module.css';

export default function CuentaPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(true);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    async function fetchData() {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);
      setShowProfile(profileData?.show_profile !== false);

      // Fetch reservations via the new API endpoint to ensure auto-linking
      try {
        const res = await fetch('/api/profile/reservations');
        if (res.ok) {
          const { reservations } = await res.json();
          setReservations(reservations || []);
        } else {
          setReservations([]);
        }
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setReservations([]);
      }
      setLoading(false);
    }

    fetchData();
  }, [user, authLoading, router]);

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  if (authLoading || loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingSpinner} />
        <p>Cargando tu cuenta...</p>
      </div>
    );
  }

  if (!user) return null;

  const statusLabels = {
    paid: { label: 'Confirmada', emoji: '✅', className: styles.statusPaid },
    pending: { label: 'Pendiente', emoji: '⏳', className: styles.statusPending },
    cancelled: { label: 'Cancelada', emoji: '❌', className: styles.statusCancelled },
    refunded: { label: 'Reembolsada', emoji: '↩️', className: styles.statusRefunded },
  };

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.profileAvatar}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className={styles.profileAvatarImg} />
            ) : (
              (profile?.full_name || user.email)?.[0]?.toUpperCase() || '?'
            )}
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.profileName}>
              {profile?.full_name || 'Usuario'}
            </h1>
            <p className={styles.profileEmail}>{user.email}</p>
            <Link
              href="/cuenta/perfil"
              className={styles.editProfileLink}
              id="account-edit-profile"
            >
              ✏️ Editar perfil completo
            </Link>
          </div>
          <button
            className={styles.logoutBtn}
            onClick={handleSignOut}
            id="account-logout"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Privacy Toggle */}
        <div className={styles.privacySection}>
          <div className={styles.privacyInfo}>
            <span className={styles.privacyIcon}>👁️</span>
            <div>
              <h3 className={styles.privacyTitle}>Visibilidad del perfil</h3>
              <p className={styles.privacyDesc}>
                {showProfile
                  ? 'Tu foto y nombre son visibles para otros asistentes'
                  : 'Tu perfil está oculto para otros asistentes'}
              </p>
            </div>
          </div>
          <button
            className={`${styles.toggle} ${showProfile ? styles.toggleActive : ''}`}
            onClick={async () => {
              setTogglingVisibility(true);
              const newValue = !showProfile;
              try {
                const res = await fetch('/api/profile/visibility', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ showProfile: newValue }),
                });
                if (res.ok) {
                  setShowProfile(newValue);
                }
              } catch (err) {
                console.error('Toggle error:', err);
              } finally {
                setTogglingVisibility(false);
              }
            }}
            disabled={togglingVisibility}
            aria-label={showProfile ? 'Ocultar perfil' : 'Mostrar perfil'}
            id="toggle-visibility"
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        {/* Reservations */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🎟️</span>
            Mis reservas
          </h2>

          {reservations.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📭</span>
              <h3 className={styles.emptyTitle}>Aún no tienes reservas</h3>
              <p className={styles.emptyDesc}>
                Explora los mejores planes de Barcelona y reserva tu próxima experiencia
              </p>
              <Link href="/planes" className="btn btn--primary" id="explore-plans">
                Explorar planes →
              </Link>
            </div>
          ) : (
            <div className={styles.reservationsList}>
              {reservations.map((res) => {
                const status = statusLabels[res.status] || statusLabels.pending;
                return (
                  <div key={res.id} className={styles.reservationCard}>
                    {res.plans?.image && (
                      <div className={styles.reservationImage}>
                        <img src={res.plans.image} alt={res.plans?.title || 'Plan'} />
                      </div>
                    )}
                    <div className={styles.reservationInfo}>
                      <h3 className={styles.reservationTitle}>
                        {res.plans?.title || 'Plan eliminado'}
                      </h3>
                      <div className={styles.reservationMeta}>
                        {res.plans?.date && (
                          <span className={styles.reservationDate}>🗓️ {res.plans.date}</span>
                        )}
                        {res.plans?.venue && (
                          <span className={styles.reservationVenue}>📍 {res.plans.venue}</span>
                        )}
                        <span className={styles.reservationQty}>
                          🎫 {res.quantity} {res.quantity === 1 ? 'entrada' : 'entradas'}
                        </span>
                      </div>
                      <div className={styles.reservationFooter}>
                        <span className={`${styles.statusBadge} ${status.className}`}>
                          {status.emoji} {status.label}
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {res.status === 'paid' && res.plans?.slug && (
                            <Link
                              href={`/planes/${res.plans.slug}?chat=true`}
                              className={styles.viewTicketBtn}
                              style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}
                              id={`chat-plan-${res.id}`}
                            >
                              💬 Ir al chat
                            </Link>
                          )}
                          {res.status === 'paid' && res.qr_code && (
                            <Link
                              href={`/cuenta/entrada/${res.id}`}
                              className={styles.viewTicketBtn}
                              id={`view-ticket-${res.id}`}
                            >
                              Ver entrada →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
