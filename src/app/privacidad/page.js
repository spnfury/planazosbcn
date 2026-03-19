import styles from '@/components/LegalPage.module.css';

export const metadata = {
  title: 'Política de Privacidad — PlanazosBCN',
  description:
    'Consulta nuestra política de privacidad. En PlanazosBCN protegemos tus datos personales con las máximas garantías.',
};

export default function PrivacidadPage() {
  return (
    <main className={styles.legalPage}>
      <div className="container">
        <header className={styles.header}>
          <h1 className={styles.title}>Política de Privacidad</h1>
          <p className={styles.lastUpdated}>Última actualización: 19 de marzo de 2026</p>
        </header>

        <div className={styles.content}>
          <section>
            <h2>1. Responsable del Tratamiento</h2>
            <p>
              El responsable del tratamiento de tus datos personales es <strong>PlanazosBCN</strong>, 
              accesible desde <a href="https://planazosbcn.com">planazosbcn.com</a>.
            </p>
            <p>
              Para cualquier cuestión relacionada con el tratamiento de tus datos, puedes contactarnos 
              a través de nuestra <a href="/contacto">página de contacto</a>.
            </p>
          </section>

          <section>
            <h2>2. Datos que Recopilamos</h2>
            <p>Recopilamos los siguientes tipos de datos personales:</p>
            <ul>
              <li><strong>Datos de registro:</strong> nombre, dirección de correo electrónico y número de teléfono cuando creas una cuenta.</li>
              <li><strong>Datos de perfil:</strong> información adicional que decidas añadir a tu perfil, como foto, preferencias o intereses.</li>
              <li><strong>Datos de uso:</strong> información sobre cómo interactúas con nuestra plataforma, incluyendo páginas visitadas, planes consultados y búsquedas realizadas.</li>
              <li><strong>Datos de comunicación:</strong> mensajes que nos envíes a través de formularios de contacto o correo electrónico.</li>
            </ul>
          </section>

          <section>
            <h2>3. Finalidad del Tratamiento</h2>
            <p>Utilizamos tus datos personales para:</p>
            <ul>
              <li>Gestionar tu cuenta y proporcionarte acceso a nuestros servicios.</li>
              <li>Personalizar tu experiencia y mostrarte planes relevantes según tus preferencias.</li>
              <li>Enviarte comunicaciones sobre planes, novedades y ofertas si te has suscrito a nuestra newsletter.</li>
              <li>Mejorar nuestra plataforma y desarrollar nuevas funcionalidades.</li>
              <li>Atender tus consultas y solicitudes de soporte.</li>
              <li>Cumplir con nuestras obligaciones legales.</li>
            </ul>
          </section>

          <section>
            <h2>4. Base Legal del Tratamiento</h2>
            <p>
              El tratamiento de tus datos se basa en tu <strong>consentimiento</strong> (al registrarte o suscribirte a la newsletter), 
              la <strong>ejecución de un contrato</strong> (prestación de nuestros servicios) y nuestro <strong>interés legítimo</strong> 
              (mejora de la plataforma y análisis de uso).
            </p>
          </section>

          <section>
            <h2>5. Compartición de Datos</h2>
            <p>
              No vendemos tus datos personales a terceros. Podemos compartir tus datos con:
            </p>
            <ul>
              <li><strong>Proveedores de servicios:</strong> herramientas de análisis, alojamiento web y servicios de correo electrónico que nos ayudan a operar la plataforma.</li>
              <li><strong>Organizadores de planes:</strong> solo los datos necesarios para gestionar tu reserva, cuando reserves un plan.</li>
              <li><strong>Autoridades:</strong> cuando sea requerido por ley.</li>
            </ul>
          </section>

          <section>
            <h2>6. Conservación de Datos</h2>
            <p>
              Conservamos tus datos personales mientras tu cuenta esté activa o sea necesario para prestarte nuestros servicios. 
              Si solicitas la eliminación de tu cuenta, borraremos tus datos en un plazo máximo de 30 días, salvo que debamos conservarlos 
              por obligación legal.
            </p>
          </section>

          <section>
            <h2>7. Tus Derechos</h2>
            <p>Tienes derecho a:</p>
            <ul>
              <li><strong>Acceso:</strong> solicitar una copia de tus datos personales.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
              <li><strong>Supresión:</strong> solicitar la eliminación de tus datos.</li>
              <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos.</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado.</li>
              <li><strong>Limitación:</strong> solicitar la limitación del tratamiento en determinadas circunstancias.</li>
            </ul>
            <p>
              Para ejercer cualquiera de estos derechos, contacta con nosotros a través de nuestra 
              <a href="/contacto">página de contacto</a>.
            </p>
          </section>

          <section>
            <h2>8. Seguridad</h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas adecuadas para proteger tus datos personales 
              contra el acceso no autorizado, la alteración, divulgación o destrucción.
            </p>
          </section>

          <section>
            <h2>9. Cambios en esta Política</h2>
            <p>
              Nos reservamos el derecho de actualizar esta política de privacidad en cualquier momento. 
              Te notificaremos de cambios significativos a través de nuestra plataforma o por correo electrónico.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
