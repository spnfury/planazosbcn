import { ImageResponse } from 'next/og';
import { getEtiqueta } from '@/data/planConstants';

export const alt = 'Planes tematizados en Barcelona';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
  const { hashtag } = await params;
  const tagInfo = getEtiqueta(hashtag);

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom, #0f0f1a, #1a1a2f)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ position: 'absolute', top: -200, left: -200, width: 600, height: 600, borderRadius: 300, background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, rgba(0,0,0,0) 70%)' }}></div>
        <div style={{ position: 'absolute', bottom: -300, right: -100, width: 800, height: 800, borderRadius: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(0,0,0,0) 70%)' }}></div>

        <div style={{ display: 'flex', fontSize: 130, marginBottom: 40, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}>
          {tagInfo?.emoji || '📍'}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 800,
            color: '#ffffff',
            textAlign: 'center',
            padding: '0 80px',
            lineHeight: 1.2,
          }}
        >
          {`Planes de ${tagInfo?.label || hashtag} en Barcelona`}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            fontWeight: 500,
            color: '#f59e0b',
            marginTop: 40,
            letterSpacing: 2,
            textTransform: 'uppercase'
          }}
        >
          PlanazosBCN
        </div>
      </div>
    ),
    { ...size }
  );
}
