import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate, spring, Sequence } from 'remotion';

export const PlanazoReel = ({ 
  title = "Planazo Increíble", 
  price = "9€", 
  zone = "Eixample", 
  images = [],
  hooks = [
    "¿Un restaurante secreto...",
    "con una oferta brutal?",
    "Etiqueta a con quien irías 👇"
  ]
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Asegurarse de tener al menos una foto para el background
  const bgImage = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974&auto=format&fit=crop';
  
  // Efecto Ken Burns: Escala de 1 a 1.2 suavemente a lo largo del vídeo (ej: 15 seg = 450 frames a 30fps)
  const scale = interpolate(frame, [0, 450], [1, 1.2], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Background Image con Zoom */}
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <Img 
          src={bgImage} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      </AbsoluteFill>

      {/* Capa Oscura (Dimmer) para que el texto resalte siempre */}
      <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />

      {/* Secuencia de Ganchos (Titles) */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        {hooks.map((text, index) => {
          // Cada texto dura 3.5 segundos = 105 frames a 30fps
          const enterFrame = index * 105;
          const exitFrame = enterFrame + 90; // Se va un poco antes para transicionar

          const slideUp = spring({
            frame: frame - enterFrame,
            fps,
            config: { damping: 12 },
          });
          const fadeOut = interpolate(frame, [exitFrame, exitFrame + 15], [1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          const isVisible = frame >= enterFrame && frame <= exitFrame + 15;

          if (!isVisible) return null;

          return (
            <h1
              key={index}
              style={{
                position: 'absolute',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 900,
                fontSize: '85px',
                color: '#FFF',
                textAlign: 'center',
                textTransform: 'uppercase',
                lineHeight: 1.1,
                // Efecto de pop in
                transform: `scale(${interpolate(slideUp, [0, 1], [0.8, 1])}) translateY(${interpolate(slideUp, [0, 1], [50, 0])}px)`,
                opacity: slideUp * fadeOut,
                filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.8))',
                // Glassmorphism suave
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                padding: '30px 40px',
                borderRadius: '30px',
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              {text}
            </h1>
          );
        })}
      </AbsoluteFill>

      {/* Footer Permanente con Info del Planazo (Aparece a los 2 segundos) */}
      <Sequence from={60}>
        <AbsoluteFill style={{ justifyContent: 'flex-end', padding: '50px' }}>
           <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              fontFamily: "'Inter', sans-serif",
              animation: 'fadeInUp 1s ease forwards', // El animado del player, mejor con spring pero para la demo
              transform: `translateY(${interpolate(spring({ frame: frame - 60, fps, config: { damping: 14 } }), [0, 1], [100, 0])}px)`,
              opacity: spring({ frame: frame - 60, fps })
           }}>
              {/* Sticker de Precio */}
              <div style={{
                 alignSelf: 'flex-start',
                 backgroundColor: '#FF3366',
                 color: 'white',
                 fontSize: '50px',
                 fontWeight: 800,
                 padding: '10px 30px',
                 borderRadius: '50px',
                 boxShadow: '0 8px 16px rgba(255, 51, 102, 0.4)',
                 transform: `scale(${interpolate(spring({ frame: frame - 70, fps, config: { damping: 10 } }), [0, 1], [0, 1])})`
              }}>
                {price}
              </div>

              {/* Título Principal y Zona */}
              <div style={{
                 backgroundColor: 'rgba(0, 0, 0, 0.65)',
                 backdropFilter: 'blur(15px)',
                 padding: '40px',
                 borderRadius: '30px',
                 border: '1px solid rgba(255,255,255,0.1)'
              }}>
                 <h2 style={{ color: 'white', fontSize: '65px', fontWeight: 800, margin: '0 0 10px 0', lineHeight: 1 }}>{title}</h2>
                 <p style={{ color: '#aaa', fontSize: '40px', fontWeight: 500, margin: 0 }}>📍 {zone}</p>
              </div>
           </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
