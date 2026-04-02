import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import PlanCard from '@/components/PlanCard/PlanCard';
import CapacityBar from '@/components/CapacityBar/CapacityBar';
import Attendees from '@/components/Attendees/Attendees';
import PlanChat from '@/components/PlanChat/PlanChat';
import PlanStatus from '@/components/PlanStatus/PlanStatus';
import { supabase } from '@/lib/supabase';
import ReserveButton from '@/components/ReserveButton/ReserveButton';
import ShareButtons from './ShareButtons';
import ReviewsSection from '@/components/Reviews/ReviewsSection';
import InstagramReels from '@/components/InstagramReels/InstagramReels';
import { getEtiqueta, getAgeGroup } from '@/data/planConstants';
import { formatDate } from '@/lib/formatDate';
import styles from './page.module.css';

// ISR: regenerate every 60s for fast cached pages (critical for SEO)
export const revalidate = 60;


// Helper function to map snake_case from DB to camelCase
const mapPlanData = (plan) => ({
  ...plan,
  categoryLabel: plan.category_label,
  posterImage: plan.poster_image,
  timeStart: plan.time_start,
  timeEnd: plan.time_end,
  ageRestriction: plan.age_restriction,
  precio_reserva: Number(plan.precio_reserva) || 0,
});

export async function generateStaticParams() {
  const { data: plans } = await supabase.from('plans').select('slug').eq('published', true);
  return (plans || []).map((plan) => ({ slug: plan.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  const { data: plan } = await supabase
    .from('plans')
    .select('title, excerpt, image')
    .ilike('slug', slug)
    .eq('published', true)
    .single();
    
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
  
  // First, fetch just the plan itself — this must succeed
  const { data: rawPlan, error } = await supabase
    .from('plans')
    .select('*')
    .ilike('slug', slug)
    .eq('published', true)
    .single();

  if (!rawPlan || error) notFound();

  // Fetch related data separately so missing tables don't break the page
  let tickets = [];
  let guestList = [];
  let schedule = [];
  let tags = [];
  let reels = [];

  try {
    const [ticketsRes, guestListRes, scheduleRes, tagsRes, reelsRes] = await Promise.allSettled([
      supabase.from('plan_tickets').select('id, name, price, description, capacity, spots_taken, sold_out, sort_order').eq('plan_id', rawPlan.id).order('sort_order'),
      supabase.from('plan_guest_lists').select('id, name, time_range, price, description, sold_out, sort_order').eq('plan_id', rawPlan.id).order('sort_order'),
      supabase.from('plan_schedule').select('time, description, sort_order').eq('plan_id', rawPlan.id).order('sort_order'),
      supabase.from('plan_tags').select('tag').eq('plan_id', rawPlan.id),
      supabase.from('plan_reels').select('url, sort_order').eq('plan_id', rawPlan.id).order('sort_order'),
    ]);

    if (ticketsRes.status === 'fulfilled' && ticketsRes.value.data) tickets = ticketsRes.value.data;
    if (guestListRes.status === 'fulfilled' && guestListRes.value.data) guestList = guestListRes.value.data;
    if (scheduleRes.status === 'fulfilled' && scheduleRes.value.data) schedule = scheduleRes.value.data;
    if (tagsRes.status === 'fulfilled' && tagsRes.value.data) tags = tagsRes.value.data.map(t => t.tag);
    if (reelsRes.status === 'fulfilled' && reelsRes.value.data) reels = reelsRes.value.data;
  } catch (e) {
    console.error('Error fetching related plan data:', e);
  }

  const plan = {
    ...mapPlanData(rawPlan),
    tickets: tickets.length > 0 ? tickets : undefined,
    guestList: guestList.length > 0 ? guestList : undefined,
    schedule: schedule.length > 0 ? schedule : undefined,
    tags: tags.length > 0 ? tags : undefined,
    reels: reels.length > 0 ? reels : undefined,
  };

  const { data: relatedPlansData } = await supabase
    .from('plans')
    .select('*')
    .eq('category', plan.category)
    .eq('published', true)
    .neq('id', plan.id)
    .limit(3);
    
  const relatedPlans = (relatedPlansData || []).map(mapPlanData);

  // Generate JSON-LD
  let parsedDate;
  if (plan.date && !plan.date.includes('SÁB') && plan.date !== 'Gratis') {
    // Basic attempt to parse if possible, or fallback to current date for schema validation
    parsedDate = new Date(); 
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: plan.title,
    description: plan.excerpt || plan.description,
    image: plan.image,
    startDate: new Date().toISOString(), // Google requires valid ISO
    location: {
      '@type': 'Place',
      name: plan.venue || plan.zone || 'Barcelona',
      address: plan.address || plan.zone || 'Barcelona, España'
    },
  };

  if (plan.price) {
    jsonLd.offers = {
      '@type': 'Offer',
      price: plan.price === 'Gratis' ? '0' : String(plan.price).replace(/[^0-9.]/g, ''),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `https://planazosbcn.com/planes/${plan.slug}`
    };
  }

  if (plan.type === 'evento') {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <EventLayout plan={plan} relatedPlans={relatedPlans} />
      </>
    );
  }

  // Default plan layout (light theme)
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
          <Image 
            src={plan.image || '/apple-icon.png'} 
            alt={plan.title} 
            className={styles.heroImage} 
            fill 
            priority
            sizes="100vw"
          />
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
            {plan.date && plan.type !== 'sorpresa' && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>🗓️</span>
                <div>
                  <span className={styles.infoLabel}>Fecha</span>
                  <span className={styles.infoValue}>{formatDate(plan.date)}</span>
                </div>
              </div>
            )}
            {plan.date && plan.type === 'sorpresa' && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>🗓️</span>
                <div>
                  <span className={styles.infoLabel}>Validez / Fecha</span>
                  <span className={styles.infoValue}>{formatDate(plan.date)}</span>
                </div>
              </div>
            )}
            {plan.price && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>💰</span>
                <div>
                  <span className={styles.infoLabel}>Precio total</span>
                  <span className={styles.infoValue}>
                    {plan.price === 'Gratis' ? 'Gratis' : `${plan.price}€ por persona`}
                  </span>
                </div>
              </div>
            )}
            {plan.precio_reserva > 0 && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>💳</span>
                <div>
                  <span className={styles.infoLabel}>Reserva online</span>
                  <span className={styles.infoValue}>
                    {plan.precio_reserva}€
                  </span>
                </div>
              </div>
            )}
            {plan.zone && plan.type !== 'sorpresa' && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>📍</span>
                <div>
                  <span className={styles.infoLabel}>Zona</span>
                  <span className={styles.infoValue}>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${plan.address || plan.zone}, Barcelona`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.locationValueLink}
                    >
                      {plan.zone}, Barcelona
                    </a>
                  </span>
                </div>
              </div>
            )}
             {plan.type === 'sorpresa' && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>🎁</span>
                <div>
                  <span className={styles.infoLabel}>Envío a domicilio</span>
                  <span className={styles.infoValue}>Disponible</span>
                </div>
              </div>
            )}
          </div>

          {/* Terraza info */}
          {(plan.menu_terraza || plan.suplemento_terraza) && (
            <div className={styles.infoCards} style={{ marginTop: '0.5rem' }}>
              {plan.menu_terraza && (
                <div className={styles.infoCard}>
                  <span className={styles.infoIcon}>🌿</span>
                  <div>
                    <span className={styles.infoLabel}>Menú en terraza</span>
                    <span className={styles.infoValue}>{plan.menu_terraza}</span>
                  </div>
                </div>
              )}
              {plan.suplemento_terraza && (
                <div className={styles.infoCard}>
                  <span className={styles.infoIcon}>☀️</span>
                  <div>
                    <span className={styles.infoLabel}>Suplemento terraza</span>
                    <span className={styles.infoValue}>{plan.suplemento_terraza}€</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hotel accommodation */}
          {plan.alojamiento_hotel && (
            <div className={styles.infoCards} style={{ marginTop: '0.5rem' }}>
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>🏨</span>
                <div>
                  <span className={styles.infoLabel}>Alojamiento de Hotel</span>
                  <span className={styles.infoValue}>{plan.alojamiento_hotel}</span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.description} id="info">
            <h2 className={styles.descTitle}>Sobre este plan</h2>
            <p>{plan.description}</p>
          </div>

          {/* Age groups & Etiquetas */}
          {((plan.age_groups && plan.age_groups.length > 0) || (plan.etiquetas && plan.etiquetas.length > 0)) && (
            <div className={styles.planBadgesSection}>
              {plan.age_groups && plan.age_groups.length > 0 && (
                <div className={styles.badgeGroup}>
                  <h4 className={styles.badgeGroupTitle}>👥 Edades</h4>
                  <div className={styles.badgeList}>
                    {plan.age_groups.map((agId) => {
                      const ag = getAgeGroup(agId);
                      return (
                        <span key={agId} className={styles.ageBadge}>
                          {ag.emoji} {ag.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {plan.etiquetas && plan.etiquetas.length > 0 && (
                <div className={styles.badgeGroup}>
                  <h4 className={styles.badgeGroupTitle}>🏷️ Etiquetas</h4>
                  <div className={styles.badgeList}>
                    {plan.etiquetas.map((etId) => {
                      const et = getEtiqueta(etId);
                      return (
                        <Link href={`/planes/tag/${etId}`} key={etId} className={styles.etiquetaBadge}>
                          {et.emoji} {et.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <Attendees planId={plan.id} />

          {plan.reels && plan.reels.length > 0 && (
            <InstagramReels reels={plan.reels} />
          )}
          
          <ReviewsSection planId={plan.id} />
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaPrice}>
              {plan.price === 'Gratis' ? (
                <span className={styles.ctaPriceValue}>Gratis</span>
              ) : (
                <>
                  <span className={styles.ctaPriceValue}>{plan.precio_reserva > 0 ? plan.precio_reserva : plan.price}€</span>
                  <span className={styles.ctaPriceLabel}>{plan.precio_reserva > 0 ? (plan.type === 'sorpresa' ? 'Pago inicial' : 'Reserva online') : (plan.type === 'sorpresa' ? 'precio base' : 'por persona')}</span>
                </>
              )}
            </div>

            {plan.precio_reserva > 0 && plan.price !== 'Gratis' && (
               <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', textAlign: 'center' }}>
                 Restante a pagar en el local
               </p>
            )}

            {plan.capacity > 0 && (
              <CapacityBar
                capacity={plan.capacity}
                spotsTaken={plan.spots_taken || 0}
                size="large"
              />
            )}

            <ReserveButton 
              plan={plan} 
              tickets={plan.tickets}
              label={plan.type === 'sorpresa' ? 'Regalar ahora' : 'Reservar ahora'}
            />

            <PlanStatus 
              planId={plan.id} 
              planSlug={plan.slug}
              capacity={plan.capacity}
              spotsTaken={plan.spots_taken || 0}
            />

            <a href="#info" className="btn btn--secondary btn--large" style={{ width: '100%', display: 'inline-block', textAlign: 'center' }} id="plan-info">
              Más información
            </a>

            <p className={styles.ctaNote}>
              ¿Tienes dudas?{' '}
              <a 
                href={`https://wa.me/34600000000?text=${encodeURIComponent('Hola! Tengo dudas sobre el plan "' + plan.title + '"')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ textDecoration: 'underline' }}
              >
                Escríbenos por WhatsApp
              </a>
            </p>
          </div>

          <div className={styles.shareCard}>
            <h4 className={styles.shareTitle}>Comparte este plan</h4>
            <ShareButtons planTitle={plan.title} />
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

      <PlanChat planId={plan.id} />
    </div>
    </>
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
            <Image
              src={posterSrc || '/apple-icon.png'}
              alt={plan.title}
              className={styles.eventPosterImg}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 300px"
            />
          </div>

          {/* Content */}
          <div className={styles.eventHeaderContent}>
            {/* Date & Time */}
            <div className={styles.eventDateTime}>
              <span className={styles.eventDateText}>{formatDate(plan.date)}</span>
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

              {/* Age groups & Etiquetas */}
              {((plan.age_groups && plan.age_groups.length > 0) || (plan.etiquetas && plan.etiquetas.length > 0)) && (
                <div className={styles.eventBadgesSection}>
                  {plan.age_groups && plan.age_groups.length > 0 && (
                    <div className={styles.eventBadgeGroup}>
                      <h4 className={styles.eventBadgeGroupTitle}>👥 Edades</h4>
                      <div className={styles.eventBadgeList}>
                        {plan.age_groups.map((agId) => {
                          const ag = getAgeGroup(agId);
                          return (
                            <span key={agId} className={styles.eventAgeBadge}>
                              {ag.emoji} {ag.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {plan.etiquetas && plan.etiquetas.length > 0 && (
                    <div className={styles.eventBadgeGroup}>
                      <h4 className={styles.eventBadgeGroupTitle}>🏷️ Etiquetas</h4>
                      <div className={styles.eventBadgeList}>
                        {plan.etiquetas.map((etId) => {
                          const et = getEtiqueta(etId);
                          return (
                            <Link href={`/planes/tag/${etId}`} key={etId} className={styles.eventEtiquetaBadge}>
                              {et.emoji} {et.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hotel accommodation */}
              {plan.alojamiento_hotel && (
                <div className={styles.eventBadgeGroup}>
                  <h4 className={styles.eventBadgeGroupTitle}>🏨 Alojamiento</h4>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    {plan.alojamiento_hotel}
                  </div>
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

        {/* ---- ASISTENTES ---- */}
        <section className={styles.eventSection}>
          <Attendees planId={plan.id} />
          <div style={{ marginTop: 'var(--space-4)' }}>
            <PlanStatus 
              planId={plan.id} 
              planSlug={plan.slug}
              capacity={plan.capacity}
              spotsTaken={plan.spots_taken || 0}
            />
          </div>
        </section>

        {/* ---- INSTAGRAM REELS ---- */}
        {plan.reels && plan.reels.length > 0 && (
          <section className={styles.eventSection}>
            <h2 className={styles.eventSectionTitle}>
              <span className={styles.eventSectionAccent} />
              INSTAGRAM REELS
            </h2>
            <InstagramReels reels={plan.reels} />
          </section>
        )}

        {/* ---- RESEÑAS ---- */}
        <section className={styles.eventSection}>
          <ReviewsSection planId={plan.id} />
        </section>

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

        <PlanChat planId={plan.id} />
      </div>
    </div>
  );
}
