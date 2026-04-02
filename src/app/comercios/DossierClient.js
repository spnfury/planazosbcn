'use client';

import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, TrendingUp, Users, Video, MapPin, CheckCircle, Smartphone, Camera, BarChart3, Percent, Star, Zap, Globe, MessageCircle } from 'lucide-react';
import styles from './Dossier.module.css';

export default function DossierClient() {
  const dossierRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(null);

  const handleCheckout = async (planName, amount, productId) => {
    try {
      setLoadingCheckout(planName);
      
      const res = await fetch('/api/checkout/b2b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName,
          amount,
          productId,
        })
      });
      
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Error al iniciar el pago: ' + (data.error || 'Desconocido'));
        setLoadingCheckout(null);
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al iniciar el pago.');
      setLoadingCheckout(null);
    }
  };

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

            {/* Pricing / Tiers - 3 columnas */}
            <div className={styles.dPricing}>
              <h2 className={styles.dSectionTitle}>Nuestros Planes de Colaboración</h2>
              <p className={styles.dSectionDesc}>Elige el modelo que mejor se adapte a tu etapa de crecimiento.</p>
              
              <div className={styles.dPricingGrid3}>
                {/* Plan Básico */}
                <div className={styles.dPricingCard}>
                  <div className={styles.dPriceHeader}>
                    <h3>Plan Básico</h3>
                    <div className={styles.dPriceValue}>0€ <span>/mes</span></div>
                  </div>
                  <ul className={styles.dPriceList}>
                    <li><CheckCircle size={16} /> Ficha de negocio en el directorio</li>
                    <li><CheckCircle size={16} /> 1 Foto principal</li>
                    <li><CheckCircle size={16} /> Enlace a tu web o menú</li>
                    <li><CheckCircle size={16} /> Mapa de ubicación</li>
                    <li className={styles.dPriceDisabled}>Sin Reels de Instagram</li>
                    <li className={styles.dPriceDisabled}>Sin prioridad en búsquedas</li>
                  </ul>
                  <div className={styles.dPriceAction}>Empieza Gratis</div>
                </div>

                {/* Plan Visibilidad */}
                <div className={styles.dPricingCard}>
                  <div className={styles.dPriceHeader}>
                    <div className={styles.dBadgeNew}>Popular</div>
                    <h3>Plan Visibilidad</h3>
                    <div className={styles.dPriceValue}>49€ <span>/mes</span></div>
                  </div>
                  <ul className={styles.dPriceList}>
                    <li><CheckCircle size={16} color="#dd6b20" /> Todo lo del Plan Básico</li>
                    <li><CheckCircle size={16} color="#dd6b20" /> Posición destacada en búsquedas</li>
                    <li><CheckCircle size={16} color="#dd6b20" /> Hasta 6 Reels integrados</li>
                    <li><CheckCircle size={16} color="#dd6b20" /> Botón de CTA personalizado</li>
                    <li><CheckCircle size={16} color="#dd6b20" /> Badge &quot;Recomendado&quot;</li>
                    <li className={styles.dPriceDisabled}>Sin promoción en RRSS</li>
                  </ul>
                  <button 
                    className={styles.dPriceActionMid} 
                    style={{ width: '100%', border: 'none', cursor: 'pointer' }}
                    onClick={() => handleCheckout('Visibilidad', 49, 'sub_visibilidad')}
                    disabled={loadingCheckout !== null}
                  >
                    {loadingCheckout === 'Visibilidad' ? 'Cargando...' : 'Comprar Suscripción'}
                  </button>
                </div>

                {/* Plan Premium */}
                <div className={`${styles.dPricingCard} ${styles.dPricingPremium}`}>
                  <div className={styles.dRibbon}>Máximo ROI</div>
                  <div className={styles.dPriceHeaderPremium}>
                    <h3>Plan Premium</h3>
                    <div className={styles.dPriceValue}>149€ <span>/mes</span></div>
                  </div>
                  <ul className={styles.dPriceList}>
                    <li><CheckCircle size={16} color="#e53e3e" /> Todo lo del Plan Visibilidad</li>
                    <li><CheckCircle size={16} color="#e53e3e" /> Hasta 12 Reels integrados</li>
                    <li><CheckCircle size={16} color="#e53e3e" /> Promoción en RRSS de PlanazosBCN</li>
                    <li><CheckCircle size={16} color="#e53e3e" /> Categoría exclusiva (Tardeo, Brunch…)</li>
                    <li><CheckCircle size={16} color="#e53e3e" /> Reportes mensuales de visitas</li>
                    <li><CheckCircle size={16} color="#e53e3e" /> Reservas integradas</li>
                  </ul>
                  <button 
                    className={styles.dPriceActionPremium} 
                    style={{ width: '100%', border: 'none', cursor: 'pointer' }}
                    onClick={() => handleCheckout('Premium', 149, 'sub_premium')}
                    disabled={loadingCheckout !== null}
                  >
                    {loadingCheckout === 'Premium' ? 'Cargando...' : 'Comprar Premium'}
                  </button>
                </div>
              </div>
            </div>

            {/* Modelo de Comisión 30% */}
            <div className={styles.dCommission}>
              <div className={styles.dCommissionHeader}>
                <div className={styles.dCommissionIcon}><Percent size={32} color="#e53e3e" /></div>
                <div>
                  <h2 className={styles.dSectionTitle}>Modelo de Comisión</h2>
                  <p className={styles.dCommissionSubtitle}>Solo pagas cuando vendes. Cero riesgo para tu negocio.</p>
                </div>
              </div>
              <div className={styles.dCommissionGrid}>
                <div className={styles.dCommissionCard}>
                  <div className={styles.dCommissionPercent}>30%</div>
                  <p>Comisión sobre reservas y ventas gestionadas a través de PlanazosBCN</p>
                </div>
                <div className={styles.dCommissionCard}>
                  <div className={styles.dCommissionPercent}>70%</div>
                  <p>El restaurante se queda con el 70% de cada venta generada</p>
                </div>
                <div className={styles.dCommissionCard}>
                  <div className={styles.dCommissionDetail}>
                    <BarChart3 size={24} color="#e53e3e" />
                    <span>Reporte mensual</span>
                  </div>
                  <p>Cobro mensual con detalle de todas las transacciones</p>
                </div>
              </div>
            </div>

            {/* Servicios Adicionales */}
            <div className={styles.dServices}>
              <h2 className={styles.dSectionTitle}>Servicios Adicionales</h2>
              <p className={styles.dSectionDesc}>Potencia tu presencia con nuestros servicios profesionales à la carte.</p>

              <div className={styles.dServicesGrid}>
                <div className={styles.dServiceCard}>
                  <div className={styles.dServiceIcon}><Camera size={24} color="#e53e3e" /></div>
                  <h4>Creación de Reel</h4>
                  <div className={styles.dServicePrice}>100€<span>/reel</span></div>
                  <p>Producción profesional de reel para Instagram y TikTok</p>
                  <button 
                    onClick={() => handleCheckout('Creación Reel Anual/Puntual', 100, 'servicio_reel')}
                    className={styles.dPriceActionMid}
                    style={{ width: '100%', border: 'none', padding: '0.4rem', marginTop: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Contratar
                  </button>
                </div>

                <div className={styles.dServiceCard}>
                  <div className={styles.dServiceIcon}><Video size={24} color="#e53e3e" /></div>
                  <h4>Pack 3 Reels</h4>
                  <div className={styles.dServicePrice}>250€</div>
                  <p>Ahorra con un paquete trimestral de contenido</p>
                </div>

                <div className={styles.dServiceCard}>
                  <div className={styles.dServiceIcon}><Zap size={24} color="#e53e3e" /></div>
                  <h4>Pack 6 Reels</h4>
                  <div className={styles.dServicePrice}>450€</div>
                  <p>Pack semestral con máximo ahorro</p>
                </div>

                <div className={styles.dServiceCard}>
                  <div className={styles.dServiceIcon}><Camera size={24} color="#e53e3e" /></div>
                  <h4>Sesión Fotográfica</h4>
                  <div className={styles.dServicePrice}>150€</div>
                  <p>10-15 fotos profesionales del local y platos</p>
                </div>

                <div className={styles.dServiceCard}>
                  <div className={styles.dServiceIcon}><Globe size={24} color="#e53e3e" /></div>
                  <h4>Menú Digital con QR</h4>
                  <div className={styles.dServicePrice}>50€<span>/mes</span></div>
                  <p>Carta digitalizada con código QR y actualizaciones</p>
                </div>

                <div className={styles.dServiceCard}>
                  <div className={styles.dServiceIcon}><MessageCircle size={24} color="#e53e3e" /></div>
                  <h4>Pack RRSS Mensual</h4>
                  <div className={styles.dServicePrice}>250€<span>/mes</span></div>
                  <p>4 posts + 4 stories al mes en nuestras redes</p>
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
