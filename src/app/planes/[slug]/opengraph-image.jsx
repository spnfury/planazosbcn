import { ImageResponse } from 'next/og';
import { supabase } from '@/lib/supabase';

export const alt = 'Plan en Barcelona — PlanazosBCN';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const CATEGORY_EMOJIS = {
  gastro: '🍽️',
  naturaleza: '🌿',
  cultura: '🎭',
  rutas: '🚶',
  nocturno: '🌙',
  servicios: '🛠️',
  bienestar: '💆‍♀️',
};

export default async function Image({ params }) {
  const { slug } = await params;

  const { data: plan } = await supabase
    .from('plans')
    .select('title, excerpt, image, category, category_label, zone, price, date')
    .ilike('slug', slug)
    .eq('published', true)
    .single();

  const title = plan?.title || 'Planazo en Barcelona';
  const subtitle = plan?.excerpt || '';
  const emoji = CATEGORY_EMOJIS[plan?.category] || '📅';
  const categoryLabel = plan?.category_label || 'Plan';
  const zone = plan?.zone;
  const price =
    plan?.price === 'Gratis'
      ? 'Gratis'
      : plan?.price
        ? `${plan.price}€`
        : null;

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16161f 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 80,
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -250,
            right: -250,
            width: 700,
            height: 700,
            borderRadius: 350,
            background:
              'radial-gradient(circle, rgba(245,158,11,0.18) 0%, rgba(0,0,0,0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -250,
            left: -250,
            width: 700,
            height: 700,
            borderRadius: 350,
            background:
              'radial-gradient(circle, rgba(236,72,153,0.12) 0%, rgba(0,0,0,0) 70%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 28,
            color: '#f59e0b',
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          <span style={{ fontSize: 40 }}>{emoji}</span>
          {categoryLabel}
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 84,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.05,
            marginTop: 40,
            marginBottom: 28,
            maxWidth: 1040,
          }}
        >
          {title.length > 70 ? title.slice(0, 67) + '…' : title}
        </div>

        {subtitle && (
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              color: 'rgba(255,255,255,0.78)',
              lineHeight: 1.35,
              maxWidth: 1040,
            }}
          >
            {subtitle.length > 140 ? subtitle.slice(0, 137) + '…' : subtitle}
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {zone && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 28,
                  color: '#ffffff',
                  fontWeight: 500,
                }}
              >
                📍 {zone}
              </div>
            )}
            {price && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 28,
                  color: '#22c55e',
                  fontWeight: 700,
                  background: 'rgba(34,197,94,0.12)',
                  padding: '10px 22px',
                  borderRadius: 999,
                }}
              >
                {price}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 30,
              fontWeight: 800,
              color: '#f59e0b',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            PlanazosBCN
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
