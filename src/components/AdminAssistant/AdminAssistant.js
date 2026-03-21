'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const autoSendRef = useRef(false);

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

  // Setup Speech Recognition
  const initRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        setInput((prev) => {
          const newVal = (prev + ' ' + final).trim();
          // If auto-send mode (long press / quick tap), send immediately
          if (autoSendRef.current) {
            setTimeout(() => {
              recognition.stop();
            }, 300);
          }
          return newVal;
        });
        setInterimText('');
      } else {
        setInterimText(interim);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'aborted') {
        setIsListening(false);
        setInterimText('');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
      // Auto-send the accumulated text
      if (autoSendRef.current) {
        autoSendRef.current = false;
        // Small delay so state updates from onresult are processed
        setTimeout(() => {
          setInput((current) => {
            if (current.trim()) {
              sendMessage(current);
            }
            return '';
          });
        }, 150);
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
    };
  }, []);

  function toggleVoice() {
    if (isListening) {
      // Stop listening and auto-send
      autoSendRef.current = true;
      recognitionRef.current?.stop();
      return;
    }

    const recognition = initRecognition();
    if (!recognition) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }

    autoSendRef.current = true;
    setIsListening(true);
    setInterimText('');

    try {
      recognition.start();
    } catch (e) {
      // Already started
      console.warn('Recognition already started', e);
    }
  }

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
            {/* Interim voice preview */}
            {isListening && interimText && (
              <div className={styles.interimPreview}>
                <span className={styles.interimDot} />
                {interimText}
              </div>
            )}
            <div className={styles.chatInputRow}>
              <textarea
                ref={inputRef}
                className={styles.chatInput}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Escuchando...' : 'Escribe un comando o pregunta...'}
                rows={1}
                disabled={loading}
                id="assistant-input"
              />
              <button
                className={`${styles.chatVoiceBtn} ${isListening ? styles.chatVoiceBtnActive : ''}`}
                onClick={toggleVoice}
                disabled={loading}
                id="assistant-voice"
                aria-label={isListening ? 'Detener grabación' : 'Comando de voz'}
                title={isListening ? 'Parar y enviar' : 'Hablar'}
              >
                {isListening ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
              </button>
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
