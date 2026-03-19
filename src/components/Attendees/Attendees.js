'use client';

import { useState, useEffect } from 'react';
import styles from './Attendees.module.css';

export default function Attendees({ planId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!planId) return;

    async function fetchAttendees() {
      try {
        const res = await fetch(`/api/plans/${planId}/attendees`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Attendees fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAttendees();
  }, [planId]);

  if (loading || !data || data.total === 0) return null;

  const visibleAvatars = data.attendees.slice(0, 5);
  const extraCount = data.total - visibleAvatars.length;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.icon}>👥</span>
        <span className={styles.count}>
          {data.total} {data.total === 1 ? 'persona se ha apuntado' : 'personas se han apuntado'}
        </span>
      </div>

      {visibleAvatars.length > 0 && (
        <div className={styles.avatarStack}>
          {visibleAvatars.map((attendee, i) => (
            <div
              key={attendee.id}
              className={styles.avatar}
              style={{ zIndex: visibleAvatars.length - i }}
              title={attendee.name}
            >
              {attendee.avatar ? (
                <img
                  src={attendee.avatar}
                  alt={attendee.name}
                  className={styles.avatarImg}
                />
              ) : (
                <span className={styles.avatarInitial}>
                  {attendee.name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
          ))}
          {extraCount > 0 && (
            <div className={styles.avatar} style={{ zIndex: 0 }}>
              <span className={styles.avatarExtra}>+{extraCount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
