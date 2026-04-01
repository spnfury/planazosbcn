import { Composition } from 'remotion';
import { PlanazoReel } from './PlanazoReel';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PlanazoReel"
        component={PlanazoReel}
        durationInFrames={450} // 15 seconds at 30 fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: "Dinner In The Dark",
          price: "45€",
          zone: "Eixample, Barcelona",
          images: [
            "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974&auto=format&fit=crop"
          ],
          hooks: [
            "¿Un restaurante secreto...",
            "donde comes en la más estricta oscuridad?",
            "¡Una experiencia que agudiza tus sentidos!",
            "Guarda esto para tu próxima cita"
          ]
        }}
      />
    </>
  );
};
