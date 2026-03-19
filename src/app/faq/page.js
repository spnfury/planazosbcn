import FaqItem from '@/components/FaqItem';
import styles from './page.module.css';

const faqs = [
  {
    question: '¿Qué es PlanazosBCN?',
    answer:
      'PlanazosBCN es una plataforma donde recopilamos los mejores planes, experiencias y actividades de Barcelona. Nuestro equipo selecciona y verifica cada plan para que puedas descubrir lo mejor de la ciudad sin perder el tiempo buscando.',
  },
  {
    question: '¿Cómo puedo reservar un plan?',
    answer:
      'Cada plan tiene su propia página con toda la información necesaria. Simplemente haz clic en el plan que te interese, revisa los detalles (fecha, precio, ubicación) y sigue las instrucciones de reserva. Algunos planes se reservan directamente desde nuestra web y otros te redirigen al organizador.',
  },
  {
    question: '¿Los planes tienen coste?',
    answer:
      'Depende del plan. Publicamos tanto actividades gratuitas como de pago. El precio siempre se indica claramente en la ficha del plan antes de que realices ninguna reserva.',
  },
  {
    question: '¿Puedo cancelar una reserva?',
    answer:
      'Las condiciones de cancelación dependen del organizador de cada plan. Te recomendamos revisar la política de cancelación específica antes de reservar. Si tienes dudas, puedes contactarnos y te ayudaremos.',
  },
  {
    question: '¿Cómo puedo colaborar con PlanazosBCN?',
    answer:
      'Si eres organizador de actividades, tienes un negocio local o simplemente conoces un planazo que deberíamos publicar, escríbenos a través de nuestra página de contacto. Estamos siempre abiertos a nuevas colaboraciones.',
  },
  {
    question: '¿Cómo funciona la newsletter?',
    answer:
      'Cada semana enviamos un correo con los mejores planes seleccionados para ti. Puedes suscribirte de forma gratuita desde nuestra página principal. Sin spam, solo planazos. Puedes darte de baja en cualquier momento.',
  },
  {
    question: '¿Los planes están verificados?',
    answer:
      'Sí. Nuestro equipo revisa cada plan antes de publicarlo. Verificamos la información del organizador, las condiciones del plan y nos aseguramos de que la experiencia sea de calidad. Si algo no cumple nuestros estándares, no lo publicamos.',
  },
  {
    question: '¿Puedo sugerir un plan?',
    answer:
      '¡Por supuesto! Nos encanta recibir sugerencias de nuestra comunidad. Envíanos tu propuesta a través de la página de contacto e incluye todos los detalles que puedas. Si encaja con nuestro portal, lo publicaremos.',
  },
];

export const metadata = {
  title: 'Preguntas Frecuentes — PlanazosBCN',
  description:
    'Resolvemos tus dudas sobre PlanazosBCN: cómo reservar planes, cancelaciones, colaboraciones y más.',
};

export default function FaqPage() {
  return (
    <main className={styles.faqPage}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Preguntas Frecuentes</h1>
          <p className={styles.subtitle}>
            Todo lo que necesitas saber sobre PlanazosBCN
          </p>
        </div>

        <div className={styles.list}>
          {faqs.map((faq, i) => (
            <FaqItem key={i} faq={faq} />
          ))}
        </div>

        <div className={styles.contact}>
          <p className={styles.contactText}>
            ¿No encuentras la respuesta que buscas?
          </p>
          <a href="/contacto" className={styles.contactLink}>
            Contáctanos →
          </a>
        </div>
      </div>
    </main>
  );
}
