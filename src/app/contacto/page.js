'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    business: '',
    message: '',
    type: 'restaurante',
  });
  const [status, setStatus] = useState('idle');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('loading');
    // TODO: Connect to Supabase or email service
    setTimeout(() => setStatus('success'), 1000);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.layout}>
          {/* Left - Info */}
          <div className={styles.info}>
            <span className={styles.badge}>🤝 Colaboraciones</span>
            <h1 className={styles.title}>
              Haz crecer tu negocio con PlanazosBCN
            </h1>
            <p className={styles.subtitle}>
              Conecta con miles de personas que buscan los mejores planes en Barcelona.
              Cuéntanos sobre tu negocio y te explicamos cómo colaborar.
            </p>

            <div className={styles.benefits}>
              <div className={styles.benefit}>
                <span className={styles.benefitIcon}>👥</span>
                <div>
                  <h3 className={styles.benefitTitle}>Visibilidad</h3>
                  <p className={styles.benefitDesc}>
                    Tu negocio destacado ante nuestra comunidad activa
                  </p>
                </div>
              </div>
              <div className={styles.benefit}>
                <span className={styles.benefitIcon}>📈</span>
                <div>
                  <h3 className={styles.benefitTitle}>Más clientes</h3>
                  <p className={styles.benefitDesc}>
                    Genera reservas y visitas desde nuestra plataforma
                  </p>
                </div>
              </div>
              <div className={styles.benefit}>
                <span className={styles.benefitIcon}>🎯</span>
                <div>
                  <h3 className={styles.benefitTitle}>Público cualificado</h3>
                  <p className={styles.benefitDesc}>
                    Gente que busca activamente planes y experiencias
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Form */}
          <div className={styles.formCard}>
            {status === 'success' ? (
              <div className={styles.success}>
                <span className={styles.successEmoji}>🎉</span>
                <h2 className={styles.successTitle}>¡Mensaje enviado!</h2>
                <p className={styles.successDesc}>
                  Te contestaremos lo antes posible. ¡Gracias por tu interés!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form} id="contact-form">
                <h2 className={styles.formTitle}>Cuéntanos sobre tu negocio</h2>

                <div className={styles.field}>
                  <label htmlFor="name" className={styles.label}>Nombre</label>
                  <input
                    type="text"
                    id="contact-name"
                    name="name"
                    className={styles.input}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="email" className={styles.label}>Email</label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    className={styles.input}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="type" className={styles.label}>Tipo de negocio</label>
                  <select
                    id="contact-type"
                    name="type"
                    className={styles.input}
                    value={formData.type}
                    onChange={handleChange}
                  >
                    <option value="restaurante">Restaurante / Bar</option>
                    <option value="experiencia">Experiencia / Tour</option>
                    <option value="evento">Evento</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label htmlFor="business" className={styles.label}>
                    Nombre del negocio
                  </label>
                  <input
                    type="text"
                    id="contact-business"
                    name="business"
                    className={styles.input}
                    value={formData.business}
                    onChange={handleChange}
                    placeholder="Nombre de tu restaurante, bar, etc."
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="message" className={styles.label}>Mensaje</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    className={`${styles.input} ${styles.textarea}`}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Cuéntanos sobre tu negocio y cómo te gustaría colaborar..."
                    rows={4}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn--primary btn--large"
                  style={{ width: '100%' }}
                  disabled={status === 'loading'}
                  id="contact-submit"
                >
                  {status === 'loading' ? 'Enviando...' : 'Enviar mensaje'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
