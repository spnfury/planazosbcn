import styles from '@/components/LegalPage.module.css';

export const metadata = {
  title: 'Política de Cookies — PlanazosBCN',
  description:
    'Información sobre el uso de cookies en PlanazosBCN. Conoce qué cookies utilizamos y cómo gestionarlas.',
};

export default function CookiesPage() {
  return (
    <main className={styles.legalPage}>
      <div className="container">
        <header className={styles.header}>
          <h1 className={styles.title}>Política de Cookies</h1>
          <p className={styles.lastUpdated}>Última actualización: 19 de marzo de 2026</p>
        </header>

        <div className={styles.content}>
          <section>
            <h2>1. ¿Qué son las Cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. 
              Se utilizan para recordar tus preferencias, mejorar tu experiencia de navegación y proporcionarnos 
              información sobre cómo se utiliza nuestra plataforma.
            </p>
          </section>

          <section>
            <h2>2. Tipos de Cookies que Utilizamos</h2>

            <h3>Cookies Esenciales</h3>
            <p>
              Son necesarias para el funcionamiento básico de la plataforma. Permiten funciones como la navegación entre 
              páginas, el inicio de sesión y el acceso a áreas seguras. Sin estas cookies, el sitio no puede funcionar correctamente.
            </p>

            <h3>Cookies de Rendimiento</h3>
            <p>
              Nos ayudan a entender cómo los visitantes interactúan con nuestra web, recopilando información de forma anónima. 
              Utilizamos esta información para mejorar la experiencia del usuario y el rendimiento de la plataforma.
            </p>

            <h3>Cookies de Funcionalidad</h3>
            <p>
              Permiten que la plataforma recuerde tus preferencias (como el idioma o la región) para proporcionarte 
              una experiencia más personalizada.
            </p>

            <h3>Cookies de Marketing</h3>
            <p>
              Se utilizan para mostrarte contenido y publicidad relevante según tus intereses. También nos ayudan a 
              medir la efectividad de nuestras campañas publicitarias.
            </p>
          </section>

          <section>
            <h2>3. Cookies de Terceros</h2>
            <p>Algunas cookies son establecidas por servicios de terceros que utilizamos:</p>
            <ul>
              <li><strong>Google Analytics:</strong> para analizar el tráfico y uso de la plataforma.</li>
              <li><strong>Supabase:</strong> para la gestión de autenticación y sesiones de usuario.</li>
              <li><strong>Redes sociales:</strong> si compartes contenido en redes sociales, estas pueden establecer sus propias cookies.</li>
            </ul>
          </section>

          <section>
            <h2>4. Gestión de Cookies</h2>
            <p>
              Puedes gestionar y eliminar cookies a través de la configuración de tu navegador. 
              Ten en cuenta que deshabilitar ciertas cookies puede afectar al funcionamiento de nuestra plataforma.
            </p>
            <p>Instrucciones para los navegadores más comunes:</p>
            <ul>
              <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
              <li><strong>Firefox:</strong> Opciones → Privacidad → Cookies</li>
              <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
              <li><strong>Edge:</strong> Configuración → Cookies y permisos del sitio</li>
            </ul>
          </section>

          <section>
            <h2>5. Consentimiento</h2>
            <p>
              Al utilizar nuestra plataforma, aceptas el uso de cookies de acuerdo con esta política. 
              Puedes retirar tu consentimiento en cualquier momento eliminando las cookies de tu navegador 
              o modificando su configuración.
            </p>
          </section>

          <section>
            <h2>6. Actualizaciones</h2>
            <p>
              Podemos actualizar esta política de cookies periódicamente para reflejar cambios en las cookies que utilizamos 
              o por otros motivos operativos, legales o regulatorios. Te recomendamos revisar esta página de forma regular.
            </p>
          </section>

          <section>
            <h2>7. Contacto</h2>
            <p>
              Si tienes preguntas sobre nuestra política de cookies, puedes contactarnos a través de nuestra 
              <a href="/contacto">página de contacto</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
