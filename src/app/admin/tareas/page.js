'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from '../admin.module.css';

const PRIORITY_COLORS = {
  baja: { bg: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.6)' },
  normal: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA' },
  alta: { bg: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24' },
  urgente: { bg: 'rgba(239, 68, 68, 0.15)', color: '#F87171' }
};

export default function AdminTasksPage() {
  const [supabase] = useState(() => createClient());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Custom states
  const [filterStatus, setFilterStatus] = useState('pendiente'); // 'pendiente' | 'completada' | ''
  const [search, setSearch] = useState('');
  
  // AI Input
  const [aiTextRaw, setAiTextRaw] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/tareas?${params}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Error al cargar las tareas');
      
      const data = await res.json();
      setTasks(data.tasks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAITaskSubmit = async (e) => {
    e.preventDefault();
    if (!aiTextRaw.trim()) return;

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/admin/tareas/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ text: aiTextRaw })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al procesar el texto');
      }

      const data = await res.json();
      
      if (data.count === 0) {
        setError('La IA no pudo encontrar ninguna tarea procesable en el texto.');
      } else {
        setSuccessMsg(`¡Se han importado ${data.count} tareas con éxito!`);
        setAiTextRaw('');
        
        // Reload tasks if they match the current filter
        if (filterStatus === '' || filterStatus === 'pendiente') {
          loadTasks();
        }
        
        // Hide success message after a few seconds
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTaskStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'completada' ? 'pendiente' : 'completada';
      
      // Update locally immediately for better UX
      setTasks(prev => 
        filterStatus 
          ? prev.filter(t => t.id !== id) // Remove if filtering
          : prev.map(t => t.id === id ? { ...t, status: newStatus } : t) // Update if showing all
      );

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      await fetch('/api/admin/tareas', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id, status: newStatus })
      });
      
      if (!filterStatus) {
        loadTasks(); // Only reload if we actually needed server data
      }
    } catch (err) {
      console.error(err);
      loadTasks(); // Revert on error
    }
  };

  const deleteTask = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar esta tarea permanentemente?')) return;
    
    try {
      setTasks(prev => prev.filter(t => t.id !== id));
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      await fetch(`/api/admin/tareas?id=${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.error(err);
      loadTasks();
    }
  };

  function formatDate(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Tareas Pendientes</h1>
          <p className={styles.pageSubtitle}>
            Gestión de tareas, llamadas a clientes y acciones web
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Left Column: Form */}
        <div style={{ flex: '1', minWidth: '300px', maxWidth: '400px' }}>
          <form className={styles.formSection} onSubmit={handleAITaskSubmit}>
            <h2 className={styles.formSectionTitle}>✨ Organizar Tareas con IA</h2>
            
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>
              Pega aquí tus notas, mensajes de WhatsApp o transcripciones. La Inteligencia Artificial lo analizará y extraerá automáticamente todas las tareas pendientes detalladas en el texto.
            </p>

            {error && <div className={styles.loginError} style={{ marginBottom: '1rem' }}>{error}</div>}
            
            {successMsg && (
              <div style={{ 
                padding: '0.75rem 1rem', 
                background: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid rgba(16, 185, 129, 0.2)', 
                borderRadius: '10px', 
                color: '#10B981', 
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                {successMsg}
              </div>
            )}
            
            <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
              <label className={styles.formLabel}>Texto sin formato / WhatsApp</label>
              <textarea
                value={aiTextRaw}
                onChange={(e) => setAiTextRaw(e.target.value)}
                className={styles.formTextarea}
                placeholder="Ayer vimos a tres clientes, con el cliente uno hay que hacerle esto y aquello, y para el cliente dos..."
                style={{ minHeight: '200px' }}
                required
              />
            </div>

            <button 
              type="submit" 
              className={styles.btnPrimary} 
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={submitting || !aiTextRaw.trim()}
            >
              {submitting ? 'Analizando con IA...' : 'Extraer Tareas (IA)'}
            </button>
          </form>
        </div>

        {/* Right Column: Task List */}
        <div style={{ flex: '2', minWidth: '350px' }}>
          
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <input
              type="text"
              className={styles.formInput}
              placeholder="🔍 Buscar tarea o cliente..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); }}
              onBlur={() => loadTasks()}
              onKeyDown={(e) => e.key === 'Enter' && loadTasks()}
              style={{ flex: 1 }}
            />
            <select
              className={styles.formSelect}
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); }}
              style={{ width: '180px' }}
            >
              <option value="pendiente">⏱️ Pendientes</option>
              <option value="completada">✅ Completadas</option>
              <option value="">📋 Todas</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
              Cargando tareas...
            </div>
          ) : tasks.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>✨</div>
              <h3 className={styles.emptyTitle}>Todo al día</h3>
              <p className={styles.emptyDesc}>No hay tareas que mostrar con estos filtros.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  style={{
                    background: '#161625',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                    opacity: task.status === 'completada' ? 0.6 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  {/* Status Checkbox */}
                  <button
                    onClick={() => toggleTaskStatus(task.id, task.status)}
                    style={{
                      marginTop: '0.2rem',
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: `2px solid ${task.status === 'completada' ? '#10B981' : 'rgba(255,255,255,0.3)'}`,
                      background: task.status === 'completada' ? '#10B981' : 'transparent',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.2s'
                    }}
                  >
                    {task.status === 'completada' && '✓'}
                  </button>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: '1rem', 
                        fontWeight: 600, 
                        color: '#fff',
                        textDecoration: task.status === 'completada' ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '100px',
                          textTransform: 'uppercase',
                          background: PRIORITY_COLORS[task.priority]?.bg || 'rgba(255,255,255,0.1)',
                          color: PRIORITY_COLORS[task.priority]?.color || '#fff'
                        }}>
                          {task.priority}
                        </span>
                      </div>
                    </div>

                    {task.client_name && (
                      <div style={{ 
                        color: '#A78BFA', 
                        fontSize: '0.85rem', 
                        fontWeight: 500,
                        marginTop: '0.3rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        👤 {task.client_name}
                      </div>
                    )}

                    {task.description && (
                      <p style={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.85rem',
                        margin: '0.5rem 0 0 0',
                        whiteSpace: 'pre-line'
                      }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginTop: '1rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid rgba(255,255,255,0.06)'
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                        Creada: {formatDate(task.created_at)}
                      </span>
                      
                      <button
                        onClick={() => deleteTask(task.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(239, 68, 68, 0.6)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          padding: '0.2rem',
                          transition: 'color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.color = '#EF4444'}
                        onMouseOut={(e) => e.target.style.color = 'rgba(239, 68, 68, 0.6)'}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
