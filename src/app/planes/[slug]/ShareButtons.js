'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function ShareButtons({ planTitle }) {
  const [copied, setCopied] = useState(false);

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`¡Mira este plan!: ${planTitle}\n${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar el enlace', err);
    }
  };

  return (
    <div className={styles.shareButtons}>
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
        aria-label="Copiar enlace" 
        id="share-link"
        onClick={handleCopy}
      >
        🔗 {copied ? '¡Copiado!' : 'Copiar link'}
      </button>
    </div>
  );
}
