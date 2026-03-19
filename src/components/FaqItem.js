'use client';

import { useState } from 'react';
import styles from '../app/faq/page.module.css';

export default function FaqItem({ faq }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`${styles.item} ${open ? styles.itemOpen : ''}`}>
      <button
        className={styles.question}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{faq.question}</span>
        <span className={`${styles.icon} ${open ? styles.iconOpen : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </button>
      <div className={`${styles.answer} ${open ? styles.answerOpen : ''}`}>
        <div className={styles.answerInner}>
          <p className={styles.answerContent}>{faq.answer}</p>
        </div>
      </div>
    </div>
  );
}
