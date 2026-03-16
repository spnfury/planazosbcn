import styles from './CapacityBar.module.css';

export default function CapacityBar({ capacity = 0, spotsTaken = 0, size = 'normal' }) {
  if (capacity <= 0) return null;

  const pct = Math.min(Math.round((spotsTaken / capacity) * 100), 100);
  const remaining = Math.max(capacity - spotsTaken, 0);

  let colorClass = styles.fillGreen;
  let label = 'Plazas disponibles';

  if (pct >= 100) {
    colorClass = styles.fillFull;
    label = 'Agotado';
  } else if (pct >= 80) {
    colorClass = styles.fillRed;
    label = '¡Últimas plazas!';
  } else if (pct >= 50) {
    colorClass = styles.fillOrange;
    label = 'Plazas limitadas';
  }

  return (
    <div className={`${styles.wrapper} ${size === 'large' ? styles.wrapperLarge : ''}`}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.count}>
          {remaining > 0 ? `${remaining} de ${capacity}` : 'Sin plazas'}
        </span>
      </div>
      <div className={styles.track}>
        <div
          className={`${styles.fill} ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={styles.pct}>{pct}% ocupado</div>
    </div>
  );
}
