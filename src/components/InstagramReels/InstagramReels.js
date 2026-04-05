'use client';

import { useState, useEffect } from 'react';
import styles from './InstagramReels.module.css';

export default function InstagramReels({ reels = [] }) {
  const [mounted, setMounted] = useState(false);

  // Only render iframes on the client to avoid SSR/hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!reels || reels.length === 0) return null;

  // Handle both {url, sort_order} objects and plain strings
  function getReelUrl(reel) {
    const url = typeof reel === 'string' ? reel : reel.url;
    return url?.replace(/\/$/, '') || '';
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.title}>
        <span className={styles.titleIcon}>📸</span>
        Descubre este plan en Instagram
      </h2>
      <div className={styles.carousel}>
        {reels.map((reel, i) => {
          const url = getReelUrl(reel);
          if (!url) return null;
          const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm') || url.toLowerCase().endsWith('.mov');
          const embedUrl = isVideo ? url : `${url}/embed/`;

          return (
            <div key={i} className={styles.reelCard}>
              <div className={styles.reelFrame}>
                {mounted ? (
                  isVideo ? (
                    <video
                      src={embedUrl}
                      className={styles.reelIframe}
                      controls
                      playsInline
                      style={{ objectFit: 'cover' }}
                      title={`Video Reel ${i + 1}`}
                    />
                  ) : (
                    <iframe
                      src={embedUrl}
                      className={styles.reelIframe}
                      frameBorder="0"
                      scrolling="no"
                      allowTransparency="true"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      title={`Instagram Reel ${i + 1}`}
                    />
                  )
                ) : (
                  <div className={styles.reelPlaceholder}>
                    <div className={styles.reelSpinner} />
                    <span>Cargando...</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
