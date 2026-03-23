'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './ReserveButton.module.css';

export default function ReserveButton({
  plan,
  tickets = [],
  className = '',
  label = 'Reservar ahora',
  variant = 'primary', // 'primary' | 'event'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const [shippingData, setShippingData] = useState({
    name: '',
    address: '',
    phone: '',
    date: '',
    message: ''
  });

  // Pre-fill email if user is logged in
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        setUserId(user.id);
        // Try to get name from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profile?.full_name) {
          setName(profile.full_name);
        }
      }
    }
    if (isOpen) getUser();
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Calculate price — use precio_reserva if available (matches backend checkout logic)
  const getUnitPrice = () => {
    if (selectedTicketId && tickets.length > 0) {
      const ticket = tickets.find(t => t.id === selectedTicketId);
      if (ticket) return parseFloat(ticket.price) || 0;
    }
    if (plan.price === 'Gratis') return 0;
    // If the plan has a reservation price, charge only that amount
    if (plan.precio_reserva && plan.precio_reserva > 0) {
      return Number(plan.precio_reserva);
    }
    return parseFloat(plan.price) || 0;
  };

  const unitPrice = getUnitPrice();
  const fullPrice = parseFloat(plan.price) || 0;
  const isPreReserve = Boolean(plan.precio_reserva && plan.precio_reserva > 0 && !selectedTicketId && plan.price !== 'Gratis');
  const shippingCost = plan?.type === 'sorpresa' ? parseFloat(plan.shipping_cost || 0) : 0;
  const totalPrice = (unitPrice * quantity) + shippingCost;
  const isFree = totalPrice === 0;

  // Max available spots
  const getMaxQuantity = () => {
    if (selectedTicketId && tickets.length > 0) {
      const ticket = tickets.find(t => t.id === selectedTicketId);
      if (ticket) return Math.max(0, (ticket.capacity || 0) - (ticket.spots_taken || 0));
    }
    if (plan.capacity > 0) {
      return Math.max(0, plan.capacity - (plan.spots_taken || 0));
    }
    return 10; // default max
  };

  const maxQuantity = Math.min(getMaxQuantity(), 10);

  const handleSubmit = async () => {
    setError('');

    if (!email) {
      setError('El email es obligatorio');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Introduce un email válido');
      return;
    }

    setLoading(true);

    try {
      const body = {
        planId: plan.id,
        quantity,
        customerEmail: email,
        customerName: name || undefined,
      };

      if (plan.type === 'sorpresa') {
        if (!shippingData.name || !shippingData.address || !shippingData.phone || !shippingData.date) {
          setError('Por favor completa todos los datos de envío obligatorios (Nombre, Dirección, Teléfono, Fecha)');
          setLoading(false);
          return;
        }
        body.shippingData = shippingData;
        body.shippingCost = shippingCost;
      }

      if (selectedTicketId) {
        body.ticketId = selectedTicketId;
      }

      if (userId) {
        body.userId = userId;
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la reserva');
      }

      // Redirect to Stripe checkout or success page (for free plans)
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className={className || 'btn btn--primary btn--large'}
        style={!className ? { width: '100%', textAlign: 'center' } : undefined}
        onClick={() => setIsOpen(true)}
        id="reserve-btn"
      >
        {label}
      </button>

      {isOpen && (
        <div className={styles.overlay} onClick={(e) => {
          if (e.target === e.currentTarget) setIsOpen(false);
        }}>
          <div className={styles.modal} role="dialog" aria-modal="true">
            {/* Header */}
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {isFree ? '📋 Reservar plaza' : '🎫 Comprar entrada'}
              </h2>
              <button
                className={styles.closeBtn}
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className={styles.modalBody}>
              {/* Plan summary */}
              <div className={styles.planSummary}>
                {plan.image && (
                  <img
                    src={plan.image}
                    alt={plan.title}
                    className={styles.planSummaryImg}
                  />
                )}
                <div className={styles.planSummaryInfo}>
                  <span className={styles.planSummaryTitle}>{plan.title}</span>
                  {plan.date && (
                    <span className={styles.planSummaryMeta}>
                      🗓️ {plan.date}
                      {plan.venue && ` · 📍 ${plan.venue}`}
                    </span>
                  )}
                  <span className={styles.planSummaryPrice}>
                    {isFree ? 'Gratis' : `${fullPrice}€`}
                  </span>
                </div>
              </div>

              {/* Ticket selector (if tickets exist) */}
              {tickets.length > 0 && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tipo de entrada</label>
                  <div className={styles.ticketSelector}>
                    {tickets.map((ticket) => {
                      const isSoldOut = ticket.sold_out;
                      const isActive = selectedTicketId === ticket.id;
                      return (
                        <button
                          key={ticket.id}
                          type="button"
                          className={[
                            styles.ticketOption,
                            isActive ? styles.ticketOptionActive : '',
                            isSoldOut ? styles.ticketOptionDisabled : '',
                          ].join(' ')}
                          onClick={() => !isSoldOut && setSelectedTicketId(isActive ? null : ticket.id)}
                          disabled={isSoldOut}
                        >
                          <div>
                            <div className={styles.ticketOptionName}>{ticket.name}</div>
                            {ticket.description && (
                              <div className={styles.ticketOptionDesc}>{ticket.description}</div>
                            )}
                          </div>
                          {isSoldOut ? (
                            <span className={styles.soldOutBadge}>Agotadas</span>
                          ) : (
                            <span className={styles.ticketOptionPrice}>
                              {ticket.price === 'Gratis' ? 'Gratis' : `${ticket.price}€`}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Name */}
              <div className={styles.formGroup}>
                <label htmlFor="reserve-name" className={styles.label}>
                  Nombre completo
                </label>
                <input
                  id="reserve-name"
                  type="text"
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>

              {/* Email */}
              <div className={styles.formGroup}>
                <label htmlFor="reserve-email" className={styles.label}>
                  Email <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  id="reserve-email"
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              {/* Shipping Data (for sorpresa plans) */}
              {plan?.type === 'sorpresa' && (
                <div className={styles.shippingForm}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    📦 Datos de Envío
                  </h3>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Nombre y Apellidos del destinatario <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      value={shippingData.name}
                      onChange={(e) => setShippingData({ ...shippingData, name: e.target.value })}
                      placeholder="Para quién es el regalo"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Dirección de entrega <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <textarea
                      className={styles.input}
                      value={shippingData.address}
                      onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                      placeholder="Calle, número, piso, puerta, código postal y ciudad..."
                      rows="3"
                      style={{ resize: 'vertical' }}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Teléfono de contacto (importante para mensajero) <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      className={styles.input}
                      value={shippingData.phone}
                      onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                      placeholder="Ej. +34 600 000 000"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Fecha deseada de entrega <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <input
                      type="date"
                      className={styles.input}
                      value={shippingData.date}
                      onChange={(e) => setShippingData({ ...shippingData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Mensaje en la tarjeta (opcional)
                    </label>
                    <textarea
                      className={styles.input}
                      value={shippingData.message}
                      onChange={(e) => setShippingData({ ...shippingData, message: e.target.value })}
                      placeholder="Escribe algo bonito..."
                      rows="2"
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Cantidad</label>
                <div className={styles.quantityRow}>
                  <button
                    type="button"
                    className={styles.quantityBtn}
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Menos"
                  >
                    −
                  </button>
                  <span className={styles.quantityValue}>{quantity}</span>
                  <button
                    type="button"
                    className={styles.quantityBtn}
                    onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
                    disabled={quantity >= maxQuantity}
                    aria-label="Más"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className={styles.error}>{error}</div>
              )}
            </div>

            {/* Footer */}
            <div className={styles.modalFooter}>
              <div className={styles.priceBreakdown}>
                {isPreReserve && (
                  <div className={styles.breakdownRow}>
                    <span>Precio total del plan</span>
                    <span>{(fullPrice * quantity).toFixed(2)}€</span>
                  </div>
                )}
                {plan?.type === 'sorpresa' && shippingCost > 0 && (
                  <div className={styles.breakdownRow}>
                    <span>Gastos de envío</span>
                    <span>{shippingCost.toFixed(2)}€</span>
                  </div>
                )}
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>{isPreReserve ? 'Pagas ahora' : 'Total'}</span>
                  <span className={styles.totalAmount}>
                    {isFree ? 'Gratis' : `${totalPrice.toFixed(2)}€`}
                  </span>
                </div>
                {isPreReserve && (
                  <div className={styles.breakdownNote}>
                    <span>Restante a pagar en el local:</span>
                    <strong>{((fullPrice - unitPrice) * quantity).toFixed(2)}€</strong>
                  </div>
                )}
              </div>

              <button
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={loading || (plan.price !== 'Gratis' && tickets.length > 0 && !selectedTicketId)}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    Procesando...
                  </>
                ) : isFree ? (
                  '📋 Confirmar reserva gratuita'
                ) : (
                  `💳 Pagar ${totalPrice.toFixed(2)}€`
                )}
              </button>

              <p className={styles.secureNote}>
                🔒 Pago seguro procesado por Stripe
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
