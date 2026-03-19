'use client';

import { useState } from 'react';
import styles from './InstagramReels.module.css';

export default function InstagramReels({ reels = [] }) {
  const [loadedIndexes, setLoadedIndexes] = useState({});

  if (!reels || reels.length === 0) return null;

  // Convert Instagram reel URL to embed URL
  function getEmbedUrl(url) {
    // Ensure trailing slash and append embed
    const cleanUrl = url.replace(/\/$/, '');
    return `${cleanUrl}/embed`;
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.title}>
        <span className={styles.titleIcon}>📸</span>
        Descubre este plan en Instagram
      </h2>
      <div className={styles.carousel}>
        {reels.map((reel, i) => (
          <div key={i} className={styles.reelCard}>
            <div className={styles.reelFrame}>
              {!loadedIndexes[i] && (
                <div className={styles.reelPlaceholder}>
                  <div className={styles.reelSpinner} />
                  <span>Cargando reel...</span>
                </div>
              )}
              <iframe
                src={getEmbedUrl(reel.url)}
                className={styles.reelIframe}
                frameBorder="0"
                scrolling="no"
                allowTransparency="true"
                allow="encrypted-media"
                title={`Instagram Reel ${i + 1}`}
                onLoad={() => setLoadedIndexes(prev => ({ ...prev, [i]: true }))}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
