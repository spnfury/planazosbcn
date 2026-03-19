import styles from '@/components/LegalPage.module.css';

export const metadata = {
  title: 'Términos y Condiciones — PlanazosBCN',
  description:
    'Lee los términos y condiciones de uso de PlanazosBCN. Conoce las normas que rigen el uso de nuestra plataforma.',
};

export default function TerminosPage() {
  return (
    <main className={styles.legalPage}>
      <div className="container">
        <header className={styles.header}>
          <h1 className={styles.title}>Términos y Condiciones</h1>
          <p className={styles.lastUpdated}>Última actualización: 19 de marzo de 2026</p>
        </header>

        <div className={styles.content}>
          <section>
            <h2>1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar la plataforma PlanazosBCN (<a href="https://planazosbcn.com">planazosbcn.com</a>), 
              aceptas estos términos y condiciones en su totalidad. Si no estás de acuerdo con alguno de ellos, 
              te rogamos que no utilices nuestra plataforma.
            </p>
          </section>

          <section>
            <h2>2. Descripción del Servicio</h2>
            <p>
              PlanazosBCN es una plataforma digital que recopila, selecciona y presenta planes, experiencias y 
              actividades disponibles en Barcelona y su área metropolitana. Actuamos como intermediarios entre los 
              usuarios y los organizadores de los planes.
            </p>
            <p>
              No organizamos ni ejecutamos los planes publicados, salvo que se indique expresamente. La responsabilidad 
              sobre el desarrollo de cada plan recae en su organizador correspondiente.
            </p>
          </section>

          <section>
            <h2>3. Registro de Usuario</h2>
            <p>Para acceder a determinadas funcionalidades, es necesario crear una cuenta de usuario. Al registrarte, te comprometes a:</p>
            <ul>
              <li>Proporcionar información veraz, completa y actualizada.</li>
              <li>Mantener la confidencialidad de tus credenciales de acceso.</li>
              <li>Notificarnos de cualquier uso no autorizado de tu cuenta.</li>
              <li>Ser mayor de 16 años o contar con el consentimiento de un tutor legal.</li>
            </ul>
          </section>

          <section>
            <h2>4. Uso Aceptable</h2>
            <p>Al utilizar PlanazosBCN, te comprometes a no:</p>
            <ul>
              <li>Utilizar la plataforma para fines ilegales o no autorizados.</li>
              <li>Publicar contenido ofensivo, difamatorio, discriminatorio o que vulnere derechos de terceros.</li>
              <li>Intentar acceder de forma no autorizada a los sistemas o datos de la plataforma.</li>
              <li>Realizar scraping, crawling o cualquier forma de extracción automatizada de datos.</li>
              <li>Suplantar la identidad de otra persona o entidad.</li>
              <li>Interferir con el funcionamiento normal de la plataforma.</li>
            </ul>
          </section>

          <section>
            <h2>5. Reservas y Pagos</h2>
            <p>
              Cuando realizas una reserva a través de PlanazosBCN, estás estableciendo un acuerdo directamente con 
              el organizador del plan. PlanazosBCN no es parte de dicho acuerdo, salvo que se indique expresamente.
            </p>
            <p>
              Las condiciones de pago, cancelación y reembolso son establecidas por cada organizador y se indican 
              en la ficha del plan correspondiente.
            </p>
          </section>

          <section>
            <h2>6. Propiedad Intelectual</h2>
            <p>
              Todos los contenidos de PlanazosBCN (diseño, textos, logotipos, imágenes, código y estructura) 
              son propiedad de PlanazosBCN o de sus respectivos autores y están protegidos por las leyes de 
              propiedad intelectual.
            </p>
            <p>
              Queda prohibida la reproducción, distribución o modificación de cualquier contenido sin 
              autorización previa y por escrito.
            </p>
          </section>

          <section>
            <h2>7. Contenido de Usuarios</h2>
            <p>
              Al publicar reseñas, comentarios u otro contenido en la plataforma, nos concedes una licencia no 
              exclusiva, mundial y gratuita para usar, reproducir y mostrar dicho contenido en relación con 
              nuestros servicios.
            </p>
            <p>
              Nos reservamos el derecho de moderar, editar o eliminar cualquier contenido que consideremos 
              inapropiado o que viole estos términos.
            </p>
          </section>

          <section>
            <h2>8. Limitación de Responsabilidad</h2>
            <p>
              PlanazosBCN proporciona la plataforma &ldquo;tal cual&rdquo; y &ldquo;según disponibilidad&rdquo;. No garantizamos que:
            </p>
            <ul>
              <li>La plataforma esté disponible de forma ininterrumpida o libre de errores.</li>
              <li>La información de los planes sea siempre exacta o esté actualizada.</li>
              <li>Los planes publicados cumplan las expectativas de cada usuario.</li>
            </ul>
            <p>
              En ningún caso seremos responsables de daños indirectos, incidentales o consecuentes derivados 
              del uso de nuestra plataforma.
            </p>
          </section>

          <section>
            <h2>9. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán 
              en vigor desde su publicación en esta página. El uso continuado de la plataforma tras la 
              publicación de cambios implica la aceptación de los mismos.
            </p>
          </section>

          <section>
            <h2>10. Legislación Aplicable</h2>
            <p>
              Estos términos se rigen por la legislación española. Para cualquier controversia derivada de su 
              interpretación o aplicación, las partes se someten a los juzgados y tribunales de Barcelona.
            </p>
          </section>

          <section>
            <h2>11. Contacto</h2>
            <p>
              Para cualquier consulta relativa a estos términos y condiciones, puedes contactarnos a través de 
              nuestra <a href="/contacto">página de contacto</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
