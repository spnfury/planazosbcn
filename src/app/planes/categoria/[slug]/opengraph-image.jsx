import { ImageResponse } from 'next/og';
import { getCategoryBySlug } from '@/data/plans';

export const alt = 'Categorías de planes en Barcelona';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
  const { slug } = await params;
  const categoryInfo = getCategoryBySlug(slug);

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom, #0f0f1a, #151525)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: 300, background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)' }}></div>
        <div style={{ position: 'absolute', bottom: -200, left: -200, width: 700, height: 700, borderRadius: 350, background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(0,0,0,0) 70%)' }}></div>

        <div style={{ display: 'flex', fontSize: 130, marginBottom: 40, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}>
          {categoryInfo?.emoji || '📅'}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 76,
            fontWeight: 800,
            color: '#ffffff',
            textAlign: 'center',
            padding: '0 80px',
            lineHeight: 1.2,
          }}
        >
          {categoryInfo?.heroTitle || `Planes de ${slug}`}
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
