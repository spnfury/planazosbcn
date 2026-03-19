'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './ReviewsSection.module.css';

export default function ReviewsSection({ planId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [hasPaidReservation, setHasPaidReservation] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadReviews();
    checkUser();
  }, [planId]);

  async function loadReviews() {
    try {
      const res = await fetch(`/api/reviews?planId=${planId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  }

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      
      // Check if user has a paid reservation for this plan
      const { data } = await supabase
        .from('reservations')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('plan_id', planId)
        .eq('status', 'paid')
        .limit(1);
        
      if (data && data.length > 0) {
        setHasPaidReservation(true);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) {
      setError('Por favor, selecciona una puntuación.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Debes iniciar sesión');

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ planId, rating, comment }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar la reseña');

      setSuccess('¡Gracias por tu valoración!');
      setRating(0);
      setComment('');
      loadReviews(); // reload list
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function getInitials(name) {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  }

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className={styles.reviewsContainer}>
      <div className={styles.reviewsHeader}>
        <h2 className={styles.title}>Opiniones de los asistentes</h2>
        {reviews.length > 0 && (
          <div className={styles.averageScore}>
            <span className={styles.avgNumber}>{avgRating}</span>
            <span className={styles.avgStars}>★</span>
            <span className={styles.reviewCount}>({reviews.length} valoraciones)</span>
          </div>
        )}
      </div>

      {/* Review Form - only for logged in users with paid reservation */}
      {user ? (
        hasPaidReservation ? (
          <div className={styles.formCard}>
            <h3 className={styles.formTitle}>¿Qué te pareció el plan?</h3>
            {success ? (
              <div className={styles.successMessage}>{success}</div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <div className={styles.errorMessage}>{error}</div>}
                <div className={styles.ratingSelector}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`${styles.starBtn} ${(hoverRating || rating) >= star ? styles.starActive : ''}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  className={styles.commentInput}
                  placeholder="Cuéntanos tu experiencia (opcional)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <button 
                  type="submit" 
                  className={styles.submitBtn}
                  disabled={submitting || rating === 0}
                >
                  {submitting ? 'Publicando...' : 'Publicar opinión'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className={styles.noticeMessage}>
            Solo los usuarios que han asistido (reserva confirmada) pueden dejar una opinión.
          </div>
        )
      ) : (
        <div className={styles.noticeMessage}>
          Inicia sesión para dejar una opinión si has asistido al plan.
        </div>
      )}

      {/* Reviews List */}
      <div className={styles.reviewsList}>
        {loading ? (
          <p className={styles.loadingText}>Cargando opiniones...</p>
        ) : reviews.length === 0 ? (
          <p className={styles.emptyText}>Aún no hay opiniones. ¡Sé el primero en valorar!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.reviewerAvatar}>
                  {review.profiles?.avatar_url ? (
                    <img src={review.profiles.avatar_url} alt={review.profiles.full_name} />
                  ) : (
                    <span>{getInitials(review.profiles?.full_name)}</span>
                  )}
                </div>
                <div className={styles.reviewerInfo}>
                  <div className={styles.reviewerName}>{review.profiles?.full_name || 'Usuario anónimo'}</div>
                  <div className={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div className={styles.reviewStars}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
              </div>
              {review.comment && (
                <div className={styles.reviewComment}>{review.comment}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
