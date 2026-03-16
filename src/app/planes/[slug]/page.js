import Link from 'next/link';
import { notFound } from 'next/navigation';
import PlanCard from '@/components/PlanCard/PlanCard';
import CapacityBar from '@/components/CapacityBar/CapacityBar';
import { PLANS, getPlanBySlug } from '@/data/plans';
import styles from './page.module.css';

export function generateStaticParams() {
  return PLANS.map((plan) => ({ slug: plan.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const plan = getPlanBySlug(slug);
  if (!plan) return {};

  return {
    title: `${plan.title} — PlanazosBCN`,
    description: plan.excerpt,
    openGraph: {
      title: plan.title,
      description: plan.excerpt,
      images: [plan.image],
    },
  };
}

export default async function PlanDetailPage({ params }) {
  const { slug } = await params;
  const plan = getPlanBySlug(slug);
  if (!plan) notFound();

  const relatedPlans = PLANS.filter(
    (p) => p.category === plan.category && p.id !== plan.id
  ).slice(0, 3);

  // If it's an evento type, render the dark FourVenues layout
  if (plan.type === 'evento') {
    return <EventLayout plan={plan} relatedPlans={relatedPlans} />;
  }

  // Default plan layout (light theme)
  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <div className={`container ${styles.breadcrumb}`}>
        <Link href="/" className={styles.crumb}>Inicio</Link>
        <span className={styles.crumbSep}>›</span>
        <Link href="/planes" className={styles.crumb}>Planes</Link>
        <span className={styles.crumbSep}>›</span>
        <span className={styles.crumbActive}>{plan.title}</span>
      </div>

      {/* Hero Image */}
      <div className={`container ${styles.heroWrap}`}>
        <div className={styles.hero}>
          <img src={plan.image} alt={plan.title} className={styles.heroImage} />
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            {plan.sponsored && (
              <span className="badge badge--sponsored">Patrocinado</span>
            )}
            {plan.featured && (
              <span className="badge badge--featured">⭐ Destacado</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`container ${styles.content}`}>
        <div className={styles.main}>
          <div className={styles.meta}>
            <span className="badge badge--category">
              {plan.categoryLabel}
            </span>
            {plan.zone && (
              <span className={styles.zone}>📍 {plan.zone}</span>
            )}
          </div>

          <h1 className={styles.title}>{plan.title}</h1>

          <div className={styles.infoCards}>
            {plan.date && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>🗓️</span>
                <div>
                  <span className={styles.infoLabel}>Fecha</span>
                  <span className={styles.infoValue}>{plan.date}</span>
                </div>
              </div>
            )}
            {plan.price && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>💰</span>
                <div>
                  <span className={styles.infoLabel}>Precio</span>
                  <span className={styles.infoValue}>
                    {plan.price === 'Gratis' ? 'Gratis' : `${plan.price}€ por persona`}
                  </span>
                </div>
              </div>
            )}
            {plan.zone && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>📍</span>
                <div>
                  <span className={styles.infoLabel}>Zona</span>
                  <span className={styles.infoValue}>{plan.zone}, Barcelona</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.description}>
            <h2 className={styles.descTitle}>Sobre este plan</h2>
            <p>{plan.description}</p>
          </div>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaPrice}>
              {plan.price === 'Gratis' ? (
                <span className={styles.ctaPriceValue}>Gratis</span>
              ) : (
                <>
                  <span className={styles.ctaPriceValue}>{plan.price}€</span>
                  <span className={styles.ctaPriceLabel}>por persona</span>
                </>
              )}
            </div>

            {plan.capacity > 0 && (
              <CapacityBar
                capacity={plan.capacity}
                spotsTaken={plan.spots_taken || 0}
                size="large"
              />
            )}

            <Link
              href={`/planes/${plan.slug}#reservar`}
              className="btn btn--primary btn--large"
              style={{ width: '100%', textAlign: 'center' }}
              id="plan-reserve"
            >
              Reservar ahora
            </Link>

            <button className="btn btn--secondary btn--large" style={{ width: '100%' }} id="plan-info">
              Más información
            </button>

            <p className={styles.ctaNote}>
              ¿Tienes dudas? Escríbenos por WhatsApp
            </p>
          </div>

          <div className={styles.shareCard}>
            <h4 className={styles.shareTitle}>Comparte este plan</h4>
            <div className={styles.shareButtons}>
              <button className={styles.shareBtn} aria-label="Compartir en WhatsApp" id="share-whatsapp">
                📱 WhatsApp
              </button>
              <button className={styles.shareBtn} aria-label="Copiar enlace" id="share-link">
                🔗 Copiar link
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Related */}
      {relatedPlans.length > 0 && (
        <section className="section section--compact">
          <div className="container">
            <div className="section-header">
              <span className="section-header__label">Te puede interesar</span>
              <h2 className="section-header__title">Planes similares</h2>
            </div>
            <div className={styles.relatedGrid}>
              {relatedPlans.map((rp) => (
                <PlanCard key={rp.id} plan={rp} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/* =============================================
   EventLayout — Dark FourVenues-style component
   ============================================= */
function EventLayout({ plan, relatedPlans }) {
  const posterSrc = plan.posterImage || plan.image;

  return (
    <div className={styles.eventPage}>
      <div className="container">
        {/* Back link */}
        <Link href="/planes" className={styles.eventBack}>
          <span className={styles.eventBackIcon}>←</span>
          {plan.venue || 'Volver'}
        </Link>

        {/* Header: Poster + Title */}
        <div className={styles.eventHeader}>
          {/* Poster */}
          <div className={styles.eventPoster}>
            <img
              src={posterSrc}
              alt={plan.title}
              className={styles.eventPosterImg}
            />
          </div>

          {/* Content */}
          <div className={styles.eventHeaderContent}>
            {/* Date & Time */}
            <div className={styles.eventDateTime}>
              <span className={styles.eventDateText}>{plan.date}</span>
              {plan.timeStart && (
                <>
                  <span className={styles.eventTimeSep}>/</span>
                  <span className={styles.eventTimeText}>{plan.timeStart}</span>
                  {plan.timeEnd && (
                    <>
                      <span className={styles.eventTimeArrow}>→</span>
                      <span className={styles.eventTimeText}>{plan.timeEnd}</span>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Title */}
            <h1 className={styles.eventTitle}>{plan.title}</h1>

            {/* Tags */}
            {plan.tags && plan.tags.length > 0 && (
              <div className={styles.eventTags}>
                {plan.tags.map((tag, i) => (
                  <span key={i} className={styles.eventTag}>
                    <span className={styles.eventTagIcon}>
                      {i === 0 ? '👔' : '🎵'}
                    </span>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ---- ENTRADAS ---- */}
        {plan.tickets && plan.tickets.length > 0 && (
          <section className={styles.eventSection}>
            <h2 className={styles.eventSectionTitle}>
              <span className={styles.eventSectionAccent} />
              ENTRADAS
            </h2>

            {plan.tickets.map((ticket, i) => (
              <div
                key={i}
                className={`${styles.ticketCard} ${ticket.soldOut ? styles.ticketCardSoldOut : ''}`}
              >
                <div className={styles.ticketInfo}>
                  <div className={styles.ticketName}>{ticket.name}</div>
                  {ticket.description && (
                    <div className={styles.ticketDesc}>{ticket.description}</div>
                  )}
                </div>
                <div className={styles.ticketRight}>
                  <span className={styles.ticketPrice}>
                    {ticket.price === 'Gratis' ? 'Gratis' : `${ticket.price}€`}
                  </span>
                  {ticket.soldOut ? (
                    <span className={styles.soldOutBadge}>Agotadas</span>
                  ) : (
                    <button className={styles.ticketBtn} aria-label="Comprar entrada" id={`ticket-${i}`}>
                      →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ---- LISTAS ---- */}
        {plan.guestList && plan.guestList.length > 0 && (
          <section className={styles.eventSection}>
            <h2 className={styles.eventSectionTitle}>
              <span className={styles.eventSectionAccent} />
              LISTAS
            </h2>

            {plan.guestList.map((list, i) => (
              <div key={i} className={styles.guestListCard}>
                <div className={styles.guestListHeader}>
                  <span className={styles.guestListName}>{list.name}</span>
                  <div className={styles.guestListRight}>
                    <span className={styles.guestListPrice}>
                      {list.price === 'Gratis' ? 'Gratis' : `${list.price}€`}
                    </span>
                    <div className={styles.guestListBtnWrap}>
                      {list.soldOut ? (
                        <span className={styles.soldOutBadge}>Agotadas</span>
                      ) : (
                        <button className={styles.ticketBtn} aria-label="Apuntarse a lista" id={`list-${i}`}>
                          →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {list.description && (
                  <div className={styles.guestListDesc}>{list.description}</div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* ---- INFORMACIÓN ---- */}
        <section className={styles.eventSection}>
          <div className={styles.eventInfoGrid}>
            {/* Left: Info text */}
            <div className={styles.eventInfoLeft}>
              <h3>Información</h3>
              <div className={styles.eventInfoText}>
                {plan.description}
              </div>

              {plan.ageRestriction && (
                <div className={styles.eventAgeNote}>
                  🔞 Evento recomendado para {plan.ageRestriction}
                </div>
              )}
            </div>

            {/* Right: Schedule + details */}
            <div>
              {plan.schedule && plan.schedule.length > 0 && (
                <>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--event-text)', marginBottom: 'var(--space-4)' }}>
                    Horario
                  </h3>
                  <div className={styles.eventSchedule} style={{ borderTop: 'none', paddingTop: 0 }}>
                    {plan.schedule.map((item, i) => (
                      <div key={i} className={styles.scheduleItem}>
                        <span className={styles.scheduleTime}>{item.time}</span>
                        <span className={styles.scheduleDesc}>{item.description}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ---- UBICACIÓN ---- */}
        {(plan.venue || plan.address) && (
          <section className={styles.eventSection}>
            <h2 className={styles.eventSectionTitle}>
              <span className={styles.eventSectionAccent} />
              UBICACIÓN
            </h2>

            <div className={styles.locationCard}>
              {plan.venue && (
                <div className={styles.locationVenue}>{plan.venue}</div>
              )}
              {plan.address && (
                <div className={styles.locationAddress}>{plan.address}</div>
              )}
              <a
                className={styles.locationMapBtn}
                id="event-map"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plan.address || plan.venue)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                📍 Ver mapa
              </a>
            </div>
          </section>
        )}

        {/* ---- Related Plans ---- */}
        {relatedPlans.length > 0 && (
          <div className={styles.eventRelated}>
            <h2 className={styles.eventRelatedTitle}>
              <span className={styles.eventSectionAccent} />
              PLANES SIMILARES
            </h2>
            <div className={styles.relatedGrid}>
              {relatedPlans.map((rp) => (
                <PlanCard key={rp.id} plan={rp} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
