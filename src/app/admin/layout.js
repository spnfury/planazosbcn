'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import AdminAssistant from '@/components/AdminAssistant/AdminAssistant';
import styles from './admin.module.css';

// Grouped navigation sections
const NAV_SECTIONS = [
  {
    label: null, // No label for the primary section
    items: [
      { href: '/admin', icon: '📊', label: 'Estadísticas' },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { href: '/admin/planes', icon: '📋', label: 'Planes' },
      { href: '/admin/eventos', icon: '🎉', label: 'Eventos Rápidos' },
      { href: '/admin/restaurantes', icon: '🍽️', label: 'Restaurantes' },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { href: '/admin/reservas', icon: '🎟️', label: 'Reservas' },
      { href: '/admin/scanner', icon: '📱', label: 'Scanner QR' },
      { href: '/admin/tareas', icon: '✅', label: 'Tareas' },
    ],
  },
  {
    label: 'Usuarios',
    items: [
      { href: '/admin/usuarios', icon: '👥', label: 'Usuarios' },
      { href: '/admin/restaurantes/usuarios', icon: '🏪', label: 'Comercios' },
      { href: '/admin/resenas', icon: '⭐', label: 'Reseñas' },
    ],
  },
  {
    label: 'Herramientas',
    items: [
      { href: '/admin/qr-codes', icon: '🔗', label: 'QR Tracking' },
      { href: '/admin/generador-reels', icon: '🎬', label: 'Reels IA' },
      { href: '/admin/logs', icon: '📝', label: 'Logs' },
    ],
  },
];

// Flat list for convenience
const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

// Mobile bottom bar: only show the most important items
const MOBILE_TAB_ITEMS = [
  { href: '/admin', icon: '📊', label: 'Inicio' },
  { href: '/admin/planes', icon: '📋', label: 'Planes' },
  { href: '/admin/reservas', icon: '🎟️', label: 'Reservas' },
  { href: '/admin/scanner', icon: '📱', label: 'Scanner' },
  { href: '/admin/tareas', icon: '✅', label: 'Tareas' },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => createClient());
  const { session, user: authUser, loading: authLoading, signOut } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    if (authLoading) return;

    async function checkAuth() {
      if (!session) {
        router.push('/admin/login');
        return;
      }

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (!adminUser) {
        await signOut();
        router.push('/admin/login');
        return;
      }

      setUser(session.user);
      setLoading(false);
    }

    checkAuth();
  }, [pathname, router, session, authLoading, signOut]);

  async function handleLogout() {
    await signOut();
  }

  // Check if a nav item is active (exact match or starts with for sub-pages)
  function isActive(href) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className={styles.loginPage}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      {/* Mobile top header — compact */}
      <header className={styles.mobileHeader}>
        <div className={styles.mobileLogoGroup}>
          <img src="/logo-planazosbcn.png" alt="PlanazosBCN" className={styles.sidebarLogoImg} />
          <span className={styles.sidebarBadge}>Admin</span>
        </div>
        <button
          className={styles.mobileMenuBtn}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Más opciones"
          id="mobile-more-menu"
        >
          ⋯
        </button>
      </header>

      {/* Mobile dropdown menu — shows ALL nav items + actions */}
      {menuOpen && (
        <>
          <div className={styles.overlay} onClick={() => setMenuOpen(false)} />
          <div className={styles.mobileDropdown}>
            {NAV_SECTIONS.map((section, idx) => (
              <div key={idx}>
                {section.label && (
                  <div className={styles.mobileDropdownLabel}>{section.label}</div>
                )}
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.mobileDropdownItem} ${isActive(item.href) ? styles.mobileDropdownItemActive : ''}`}
                  >
                    <span>{item.icon}</span> {item.label}
                  </Link>
                ))}
              </div>
            ))}
            <div className={styles.mobileDropdownDivider} />
            <Link href="/" className={styles.mobileDropdownItem} target="_blank">
              🌐 Ver web pública
            </Link>
            <button
              className={styles.mobileDropdownItem}
              onClick={handleLogout}
              id="mobile-logout"
            >
              🚪 Cerrar sesión
            </button>
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <img src="/logo-planazosbcn.png" alt="PlanazosBCN" className={styles.sidebarLogoImg} />
          <span className={styles.sidebarBadge}>Admin</span>
        </div>

        <nav className={styles.sidebarNav}>
          {NAV_SECTIONS.map((section, idx) => (
            <div key={idx} className={styles.navSection}>
              {section.label && (
                <div className={styles.navSectionLabel}>{section.label}</div>
              )}
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ''}`}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.navItem} target="_blank">
            <span className={styles.navIcon}>🌐</span>
            Ver web pública
          </Link>
          <button className={styles.logoutBtn} onClick={handleLogout} id="admin-logout">
            <span className={styles.navIcon}>🚪</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.mainContent}>
        {children}
      </main>

      {/* Mobile bottom tab bar — only key items */}
      <nav className={styles.bottomTabBar} id="bottom-tab-bar">
        {MOBILE_TAB_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.bottomTab} ${isActive(item.href) ? styles.bottomTabActive : ''}`}
          >
            <span className={styles.bottomTabIcon}>{item.icon}</span>
            <span className={styles.bottomTabLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* AI Assistant */}
      <AdminAssistant />
    </div>
  );
}

