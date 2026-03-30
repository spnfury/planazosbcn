'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import styles from './restaurant.module.css';

const NAV_ITEMS = [
  { href: '/restaurant', icon: '📊', label: 'Inicio' },
  { href: '/restaurant/scanner', icon: '📱', label: 'Scanner' },
  { href: '/restaurant/reservas', icon: '🎟️', label: 'Reservas' },
];

export default function RestaurantLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => createClient());
  const { session, loading: authLoading, signOut: authSignOut } = useAuth();
  const [restaurantUser, setRestaurantUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === '/restaurant/login') {
      setLoading(false);
      return;
    }

    if (authLoading) return;

    async function checkAuth() {
      if (!session) {
        router.push('/restaurant/login');
        return;
      }

      // Check sessionStorage first for speed
      const cached = sessionStorage.getItem('restaurant_user');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.auth_user_id === session.user.id) {
            setRestaurantUser(parsed);
            setLoading(false);
            return;
          }
        } catch { /* ignore */ }
      }

      // Verify via API
      try {
        const res = await fetch('/api/restaurant/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: session.user.id }),
        });

        const data = await res.json();

        if (!res.ok || !data.isRestaurant) {
          await signOut();
          return;
        }

        setRestaurantUser(data.user);
        sessionStorage.setItem('restaurant_user', JSON.stringify(data.user));
      } catch {
        await signOut();
        return;
      }

      setLoading(false);
    }

    checkAuth();
  }, [pathname, session, authLoading]);

  async function signOut() {
    sessionStorage.removeItem('restaurant_user');
    await authSignOut();
    router.push('/restaurant/login');
  }

  function isActive(href) {
    if (href === '/restaurant') return pathname === '/restaurant';
    return pathname.startsWith(href);
  }

  // Login page — render without layout
  if (pathname === '/restaurant/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.portalLayout}>
      {/* Header */}
      <header className={styles.portalHeader}>
        <div className={styles.portalBrand}>
          {restaurantUser?.logo_url ? (
            <img
              src={restaurantUser.logo_url}
              alt={restaurantUser.name}
              className={styles.portalLogo}
            />
          ) : (
            <div className={styles.portalLogoPlaceholder}>🍽️</div>
          )}
          <div>
            <div className={styles.portalName}>
              {restaurantUser?.restaurants?.nombre || restaurantUser?.name || 'Restaurante'}
            </div>
            <span className={styles.portalBadge}>Comercio</span>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={signOut} id="restaurant-logout">
          🚪 Salir
        </button>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className={styles.bottomNav} id="restaurant-bottom-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ''}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
