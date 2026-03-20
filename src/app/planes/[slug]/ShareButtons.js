'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function ShareButtons({ planTitle }) {
  const [copied, setCopied] = useState(false);

  const getUrl = () => typeof window !== 'undefined' ? window.location.href : '';
  const getText = () => `¡Mira este plan!: ${planTitle}\n${getUrl()}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: planTitle,
          text: `¡Mira este plan en PlanazosBCN!`,
          url: getUrl(),
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(getText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleTelegram = () => {
    const url = encodeURIComponent(getUrl());
    const text = encodeURIComponent(`¡Mira este plan!: ${planTitle}`);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(`${getText()}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar el enlace', err);
    }
  };

  return (
    <div className={styles.shareButtons}>
      {typeof navigator !== 'undefined' && navigator.share && (
        <button
          className={`${styles.shareBtn} ${styles.shareBtnNative}`}
          aria-label="Compartir"
          id="share-native"
          onClick={handleNativeShare}
        >
          📤 Compartir
        </button>
      )}
      <button
        className={styles.shareBtn}
        aria-label="Compartir en WhatsApp"
        id="share-whatsapp"
        onClick={handleWhatsApp}
      >
        📱 WhatsApp
      </button>
      <button
        className={styles.shareBtn}
        aria-label="Compartir en Telegram"
        id="share-telegram"
        onClick={handleTelegram}
      >
        ✈️ Telegram
      </button>
      <button
        className={styles.shareBtn}
        aria-label="Compartir en Twitter"
        id="share-twitter"
        onClick={handleTwitter}
      >
        🐦 Twitter
      </button>
      <button
        className={styles.shareBtn}
        aria-label="Copiar enlace"
        id="share-link"
        onClick={handleCopy}
      >
        🔗 {copied ? '¡Copiado!' : 'Copiar link'}
      </button>
    </div>
  );
}
