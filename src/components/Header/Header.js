'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/Auth/AuthProvider';
import styles from './Header.module.css';

const NAV_LINKS = [
  { href: '/#planes', label: 'Planes' },
  { href: '/#categorias', label: 'Categorías' },
  { href: '/contacto', label: 'Colaborar' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo}>
          <img
            src="/logo-planazosbcn.png"
            alt="PlanazosBCN"
            className={styles.logoImg}
          />
        </Link>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.navLink}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/planes"
            className={`btn btn--primary ${styles.navCta}`}
            onClick={() => setMenuOpen(false)}
          >
            Ver todos los planes
          </Link>

          {/* Auth section — mobile only (inside nav) */}
          <div className={styles.navAuthMobile}>
            {!loading && (
              user ? (
                <Link
                  href="/cuenta"
                  className={styles.navAuthLink}
                  onClick={() => setMenuOpen(false)}
                  id="mobile-account"
                >
                  👤 Mi cuenta
                </Link>
              ) : (
                <Link
                  href="/login"
                  className={styles.navAuthLink}
                  onClick={() => setMenuOpen(false)}
                  id="mobile-login"
                >
                  Iniciar sesión
                </Link>
              )
            )}
          </div>
        </nav>

        {/* Auth section — desktop */}
        <div className={styles.authDesktop}>
          {!loading && (
            user ? (
              <Link href="/cuenta" className={styles.userBtn} id="desktop-account">
                <span className={styles.userAvatar}>
                  {(user.user_metadata?.full_name || user.email)?.[0]?.toUpperCase() || '?'}
                </span>
              </Link>
            ) : (
              <Link href="/login" className={styles.loginBtn} id="desktop-login">
                Iniciar sesión
              </Link>
            )
          )}
        </div>

        <button
          className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
          id="menu-toggle"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
