'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import styles from './Header.module.css';

const NAV_LINKS = [
  { href: '/#planes', label: 'Planes' },
  { href: '/restaurantes', label: 'Restaurantes' },
  { href: '/#categorias', label: 'Categorías' },
  { href: '/comercios', label: 'Para Comercios' },
  { href: '/contacto', label: 'Colaborar' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
  }, [user]);

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

          <div className={styles.navSocialMobile}>
            <a href="https://www.instagram.com/planazosbcnreal" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="5" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="https://www.tiktok.com/@planazosbcn.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="TikTok">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v3a8 8 0 0 1-5-3Z" />
              </svg>
            </a>
          </div>

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
          <div className={styles.socialDesktop}>
            <a href="https://www.instagram.com/planazosbcnreal" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="5" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="https://www.tiktok.com/@planazosbcn.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="TikTok">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v3a8 8 0 0 1-5-3Z" />
              </svg>
            </a>
          </div>

          {!loading && (
            user ? (
              <Link href="/cuenta" className={styles.userBtn} id="desktop-account">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className={styles.userAvatarImg} />
                ) : (
                  <span className={styles.userAvatar}>
                    {(user.user_metadata?.full_name || user.email)?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
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
