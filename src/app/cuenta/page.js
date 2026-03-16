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

      // Fetch reservations with plan info
      const { data: reservationsData } = await supabase
        .from('reservations')
        .select('*, plans(title, slug, image, date, venue)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setReservations(reservationsData || []);
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
            {(profile?.full_name || user.email)?.[0]?.toUpperCase() || '?'}
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.profileName}>
              {profile?.full_name || 'Usuario'}
            </h1>
            <p className={styles.profileEmail}>{user.email}</p>
          </div>
          <button
            className={styles.logoutBtn}
            onClick={handleSignOut}
            id="account-logout"
          >
            Cerrar sesión
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
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
