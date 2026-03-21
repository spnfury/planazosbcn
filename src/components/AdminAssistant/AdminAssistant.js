'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './AdminAssistant.module.css';

// Page context labels
function getPageLabel(pathname) {
  if (pathname?.includes('/restaurantes/nuevo')) return '📝 Crear Restaurante';
  if (pathname?.includes('/restaurantes/') && pathname?.includes('/menus')) return '🍽️ Configurar Menús';
  if (pathname?.includes('/restaurantes/')) return '✏️ Editar Restaurante';
  if (pathname?.includes('/restaurantes')) return '🍽️ Restaurantes';
  if (pathname?.includes('/planes/nuevo')) return '📝 Crear Plan';
  if (pathname?.includes('/planes/')) return '✏️ Editar Plan';
  if (pathname?.includes('/planes')) return '📋 Planes';
  if (pathname?.includes('/reservas')) return '🎟️ Reservas';
  if (pathname?.includes('/usuarios')) return '👥 Usuarios';
  if (pathname?.includes('/resenas')) return '⭐ Reseñas';
  if (pathname?.includes('/logs')) return '📝 Logs';
  return '📊 Dashboard';
}

function getQuickActions(pathname) {
  if (pathname?.includes('/restaurantes/nuevo') || (pathname?.includes('/restaurantes/') && !pathname?.endsWith('/restaurantes'))) {
    return [
      'Rellena un restaurante italiano',
      'Crea un japonés en Gràcia',
      'Restaurante mexicano',
    ];
  }
  if (pathname?.includes('/planes/nuevo') || (pathname?.includes('/planes/') && !pathname?.endsWith('/planes'))) {
    return [
      'Plan de tapas por El Born',
      'Evento nocturno en Luz de Gas',
      'Ruta de brunch',
    ];
  }
  return [
    'Crear un restaurante',
    'Crear un plan nuevo',
    'Ir a reservas',
  ];
}

export default function AdminAssistant() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  async function sendMessage(text) {
    if (!text?.trim() || loading) return;

    const userMsg = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context: { page: pathname },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages([...newMessages, {
          role: 'assistant',
          content: data.error || 'Error al procesar tu solicitud.',
          action: null,
        }]);
        return;
      }

      setMessages([...newMessages, {
        role: 'assistant',
        content: data.reply,
        action: data.action,
      }]);
    } catch (err) {
      console.error('Assistant error:', err);
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Error de conexión. Inténtalo de nuevo.',
        action: null,
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleAction(action) {
    if (!action) return;

    if (action.type === 'fill_form' && action.data?.formData) {
      // Dispatch global event that form pages listen to
      window.dispatchEvent(new CustomEvent('assistant:fill_form', {
        detail: action.data.formData,
      }));
    }

    if (action.type === 'navigate' && action.data?.path) {
      router.push(action.data.path);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className={styles.assistantWrapper}>
      {/* Chat Panel */}
      {open && (
        <div className={styles.chatPanel}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderInfo}>
              <div className={styles.chatHeaderAvatar}>🤖</div>
              <div>
                <div className={styles.chatHeaderTitle}>Asistente IA</div>
                <div className={styles.chatHeaderSubtitle}>PlanazosBCN Admin</div>
              </div>
            </div>
            <button
              className={styles.chatHeaderClose}
              onClick={() => setOpen(false)}
              id="assistant-close"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className={styles.chatMessages}>
            {messages.length === 0 && (
              <div className={styles.welcomeMsg}>
                <div className={styles.welcomeEmoji}>✨</div>
                <div className={styles.welcomeTitle}>¡Hola! Soy tu asistente</div>
                <div className={styles.welcomeDesc}>
                  Puedo rellenar formularios, crear planes, gestionar restaurantes y mucho más. ¡Dime qué necesitas!
                </div>
                <div className={styles.quickActions}>
                  {getQuickActions(pathname).map((action, i) => (
                    <button
                      key={i}
                      className={styles.quickActionBtn}
                      onClick={() => sendMessage(action)}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`${styles.message} ${
                  msg.role === 'user' ? styles.messageUser : styles.messageAssistant
                }`}
              >
                <div className={styles.messageBubble}>
                  {msg.content}
                </div>
                {msg.role === 'assistant' && msg.action && (
                  <div className={styles.messageAction}>
                    {msg.action.type === 'fill_form' && (
                      <button
                        className={styles.messageActionBtn}
                        onClick={() => handleAction(msg.action)}
                      >
                        ✏️ Rellenar formulario
                      </button>
                    )}
                    {msg.action.type === 'navigate' && (
                      <button
                        className={`${styles.messageActionBtn} ${styles.messageActionBtnNav}`}
                        onClick={() => handleAction(msg.action)}
                      >
                        🔗 Ir a la página
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className={styles.typingIndicator}>
                <div className={styles.typingDot} />
                <div className={styles.typingDot} />
                <div className={styles.typingDot} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Context badge */}
          <div className={styles.contextBadge}>
            📍 Contexto: {getPageLabel(pathname)}
          </div>

          {/* Input */}
          <div className={styles.chatInputArea}>
            <textarea
              ref={inputRef}
              className={styles.chatInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un comando o pregunta..."
              rows={1}
              disabled={loading}
              id="assistant-input"
            />
            <button
              className={styles.chatSendBtn}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              id="assistant-send"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        className={`${styles.floatingBtn} ${open ? styles.floatingBtnOpen : ''}`}
        onClick={() => setOpen(!open)}
        id="assistant-toggle"
        aria-label="Asistente IA"
      >
        <span className={styles.floatingBtnIcon}>
          {open ? '✕' : '🤖'}
        </span>
      </button>
    </div>
  );
}
