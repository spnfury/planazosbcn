'use client';

import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, TrendingUp, Users, Video, MapPin, CheckCircle, Smartphone } from 'lucide-react';
import styles from './Dossier.module.css';

export default function DossierClient() {
  const dossierRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    try {
      setIsGenerating(true);
      const element = dossierRef.current;
      
      // Capturar canvas con alta resolución
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // A4 size in mm
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; 
      const pageHeight = 297;  
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if the content is longer than one A4 page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('Dossier_Comercial_PlanazosBCN.pdf');
    } catch (error) {
      console.error('Error generando el PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.actionsBar}>
        <div className="container">
          <div className={styles.flexActions}>
            <div>
              <h1 className={styles.pageTitle}>Dossier para Comercios</h1>
              <p className={styles.pageSubtitle}>Descubre por qué cientos de locales ya están en Planazos BCN</p>
            </div>
            <button 
              onClick={generatePDF} 
              disabled={isGenerating}
              className={styles.downloadButton}
            >
              {isGenerating ? (
                <span>Generando...</span>
              ) : (
                <>
                  <Download size={20} />
                  Descargar PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.scrollArea}>
        {/* Este es el contenedor que se captura para el PDF */}
        <div className={styles.dossierContainer} ref={dossierRef}>
          
          {/* Header del Dossier */}
          <div className={styles.dHeader}>
            <div className={styles.dLogoBox}>
              <img src="/logo-planazosbcn.png" alt="Planazos BCN" style={{ height: '60px', objectFit: 'contain', marginBottom: '0.5rem' }} />
              <p className={styles.dLogoSub}>La guía definitiva de Barcelona</p>
            </div>
          </div>

          <div className={styles.dContent}>
            {/* Hero / Propuesta */}
            <div className={styles.dHero}>
              <h1 className={styles.dHeroTitle}>
                Conecta tu negocio con miles de personas que buscan su próximo plan.
              </h1>
              <p className={styles.dHeroDesc}>
                Planazos BCN no es solo un directorio estático, es una comunidad vibrante de barceloneses y visitantes 
                buscando dónde cenar, salir de fiesta o pasar la tarde. Únete a nosotros y llena tu local.
              </p>
            </div>

            {/* Stats */}
            <div className={styles.dStatsGrid}>
              <div className={styles.dStatCard}>
                <div className={styles.dStatIcon}><Users size={28} /></div>
                <h3>+50.000</h3>
                <p>Usuarios activos mensuales explorando la ciudad.</p>
              </div>
              <div className={styles.dStatCard}>
                <div className={styles.dStatIcon}><TrendingUp size={28} /></div>
                <h3>18 - 35 años</h3>
                <p>El público ideal: gente joven, proactiva y con ganas de consumir.</p>
              </div>
              <div className={styles.dStatCard}>
                <div className={styles.dStatIcon}><Smartphone size={28} /></div>
                <h3>85% Mobile</h3>
                <p>Una experiencia optimizada para descubrir en movimiento.</p>
              </div>
            </div>

            {/* Benefits */}
            <div className={styles.dBenefits}>
              <h2 className={styles.dSectionTitle}>¿Por qué unirte a Planazos BCN?</h2>
              
              <div className={styles.dBenefitList}>
                <div className={styles.dBenefitRow}>
                  <div className={styles.dBenefitIcon}><Video size={24} color="#e53e3e" /></div>
                  <div>
                    <h4>Contenido Visual y Dinámico (Reels integrados)</h4>
                    <p>Olvídate de las descripciones aburridas. Mostramos la verdadera esencia de tu local permitiendo añadir hasta 12 Instagram Reels directamente en tu ficha. ¡La mejor manera de convertir una visita en una reserva!</p>
                  </div>
                </div>
                
                <div className={styles.dBenefitRow}>
                  <div className={styles.dBenefitIcon}><MapPin size={24} color="#e53e3e" /></div>
                  <div>
                    <h4>Tráfico Altamente Segmentado</h4>
                    <p>Nuestros usuarios filtran por edad, ambiente (Tardeo, Nocturno), y categoría (Gastronomía, Fiesta, etc). Llegarás exactamente al tipo de público que busca lo que tu local ofrece.</p>
                  </div>
                </div>

                <div className={styles.dBenefitRow}>
                  <div className={styles.dBenefitIcon}><CheckCircle size={24} color="#e53e3e" /></div>
                  <div>
                    <h4>Vínculos Directos a Reservas</h4>
                    <p>Facilitamos el proceso: los usuarios pueden saltar de descubrir tu plan a reservar una mesa o comprar entradas en tan solo un clic. Menos fricción significa más clientes.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing / Tiers */}
            <div className={styles.dPricing}>
              <h2 className={styles.dSectionTitle}>Nuestros Planes de Colaboración</h2>
              <p className={styles.dSectionDesc}>Elige el modelo que mejor se adapte a tu etapa de crecimiento.</p>
              
              <div className={styles.dPricingGrid}>
                <div className={styles.dPricingCard}>
                  <div className={styles.dPriceHeader}>
                    <h3>Plan Básico</h3>
                    <div className={styles.dPriceValue}>0€ <span>/mes</span></div>
                  </div>
                  <ul className={styles.dPriceList}>
                    <li><CheckCircle size={16} /> Ficha de negocio en el directorio</li>
                    <li><CheckCircle size={16} /> 1 Foto principal</li>
                    <li><CheckCircle size={16} /> Enlace a tu web o menú</li>
                    <li className={styles.dPriceDisabled}>Sin Reels de Instagram</li>
                    <li className={styles.dPriceDisabled}>Sin prioridad en búsquedas</li>
                  </ul>
                  <div className={styles.dPriceAction}>Empieza Gratis</div>
                </div>

                <div className={`${styles.dPricingCard} ${styles.dPricingPremium}`}>
                  <div className={styles.dRibbon}>Recomendado</div>
                  <div className={styles.dPriceHeaderPremium}>
                    <h3>Plan Premium</h3>
                    <div className={styles.dPriceValue}>Contactar</div>
                  </div>
                  <ul className={styles.dPriceList}>
                    <li><CheckCircle size={16} color="#e53e3e" /> Ficha Destacada (Top posiciones)</li>
                    <li><CheckCircle size={16} color="#e53e3e" /> Integración de hasta 12 Reels</li>
                    <li><CheckCircle size={16} color="#e53e3e" /> Botones de CTA personalizados</li>
                    <li><CheckCircle size={16} color="#e53e3e" /> Apoyo en nuestras Redes Sociales</li>
                    <li><CheckCircle size={16} color="#e53e3e" /> Categoría exlusiva (Ej: Tardeo)</li>
                  </ul>
                  <div className={styles.dPriceActionPremium}>Hablemos</div>
                </div>
              </div>
            </div>

            {/* Footer / CTA */}
            <div className={styles.dFooterCta}>
              <h2>¿Listo para recibir nuevos clientes?</h2>
              <p>Escríbenos y nuestro equipo analizará cómo impulsar tu local.</p>
              <div className={styles.dContactInfo}>
                <p>Email: <b>hola@planazosbcn.com</b></p>
                <p>Web: <b>www.planazosbcn.com</b></p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
