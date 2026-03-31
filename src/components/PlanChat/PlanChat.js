'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './PlanChat.module.css';

export default function PlanChat({ planId }) {
  const [supabase] = useState(() => createClient());
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [unread, setUnread] = useState(0);
  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [accessError, setAccessError] = useState(null);
  const messagesEndRef = useRef(null);
  const chatBodyRef = useRef(null);
  const wantAutoOpen = useRef(false);

  // Check if URL wants auto-open
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.search.includes('chat=true') || window.location.hash === '#chat') {
        wantAutoOpen.current = true;
      }
    }
  }, []);

  // Check auth & load messages
  useEffect(() => {
    async function init() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setAccessError('not-logged-in');
        setLoading(false);
        if (wantAutoOpen.current) setIsOpen(true);
        return;
      }
      setUser(currentUser);

      try {
        const res = await fetch(`/api/chat?planId=${planId}`);

        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          setMembers(data.members || []);
          setTotalMembers(data.totalMembers || 0);
          setHasAccess(true);
          setAccessError(null);
          if (wantAutoOpen.current) setIsOpen(true);
        } else {
          const errData = await res.json().catch(() => ({}));
          console.log('PlanChat: access denied', errData);
          if (res.status === 403) {
            setAccessError('no-reservation');
          } else {
            setAccessError('error');
          }
          setHasAccess(false);
          if (wantAutoOpen.current) setIsOpen(true);
        }
      } catch (err) {
        console.warn('Chat init error:', err);
        setAccessError('error');
        if (wantAutoOpen.current) setIsOpen(true);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [planId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!hasAccess || !user) return;

    const channel = supabase
      .channel(`chat:${planId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `plan_id=eq.${planId}`,
        },
        async (payload) => {
          if (payload.new.user_id === user.id) return;

          try {
            const res = await fetch(`/api/chat?planId=${planId}`);
            if (res.ok) {
              const data = await res.json();
              setMessages(data.messages || []);
              setMembers(data.members || []);
              setTotalMembers(data.totalMembers || 0);
              if (!isOpen) {
                setUnread((prev) => prev + 1);
              }
            }
          } catch (err) {
            console.error('Realtime fetch error:', err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hasAccess, user, planId, isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, message: messageText }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (err) {
      console.error('Send error:', err);
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  }, [newMessage, sending, planId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Don't render anything while loading (except if auto-open was requested)
  if (loading && !wantAutoOpen.current) return null;

  // Group messages by date
  const groupedMessages = [];
  let lastDate = '';
  messages.forEach((msg) => {
    const dateLabel = formatDate(msg.createdAt);
    if (dateLabel !== lastDate) {
      groupedMessages.push({ type: 'date', label: dateLabel });
      lastDate = dateLabel;
    }
    groupedMessages.push({ type: 'message', ...msg });
  });

  // Visible member avatars (max 3 in header)
  const visibleMembers = members.slice(0, 3);
  const extraMembers = members.length > 3 ? members.length - 3 : 0;

  // Render the blocked/error state panel content
  const renderBlockedContent = () => {
    if (loading) {
      return (
        <div className={styles.emptyChat}>
          <span className={styles.emptyChatIcon}>⏳</span>
          <p className={styles.emptyChatText}>Cargando chat...</p>
        </div>
      );
    }
    if (accessError === 'not-logged-in') {
      return (
        <div className={styles.emptyChat}>
          <span className={styles.emptyChatIcon}>🔒</span>
          <p className={styles.emptyChatText}>
            Inicia sesión para acceder al chat del plan
          </p>
          <a href="/login" className={styles.loginBtn}>
            Iniciar sesión
          </a>
        </div>
      );
    }
    if (accessError === 'no-reservation') {
      return (
        <div className={styles.emptyChat}>
          <span className={styles.emptyChatIcon}>🎟️</span>
          <p className={styles.emptyChatText}>
            Necesitas una reserva confirmada en este plan para acceder al chat
          </p>
        </div>
      );
    }
    // generic error
    return (
      <div className={styles.emptyChat}>
        <span className={styles.emptyChatIcon}>⚠️</span>
        <p className={styles.emptyChatText}>
          No se pudo cargar el chat. Inténtalo de nuevo más tarde.
        </p>
      </div>
    );
  };

  // Members panel
  const renderMembersPanel = () => (
    <div className={styles.membersPanel}>
      <div className={styles.membersPanelHeader}>
        <button
          className={styles.membersPanelBack}
          onClick={() => setShowMembers(false)}
          aria-label="Volver al chat"
        >
          ← Chat
        </button>
        <h3 className={styles.membersPanelTitle}>
          Participantes ({totalMembers})
        </h3>
      </div>

      <div className={styles.membersPanelBody}>
        {/* Info banner */}
        <div className={styles.membersInfoBanner}>
          <span className={styles.membersInfoIcon}>📢</span>
          <div>
            <p className={styles.membersInfoTitle}>
              {totalMembers} {totalMembers === 1 ? 'persona en el plan' : 'personas en el plan'}
            </p>
            <p className={styles.membersInfoText}>
              Todos recibirán los mensajes del chat en tiempo real cuando estén conectados.
            </p>
          </div>
        </div>

        {/* Notification info */}
        <div className={styles.notifInfo}>
          <div className={styles.notifInfoItem}>
            <span className={styles.notifInfoIcon}>⚡</span>
            <div>
              <span className={styles.notifInfoLabel}>Chat en tiempo real</span>
              <span className={styles.notifInfoDesc}>Los mensajes aparecen al instante para todos los conectados</span>
            </div>
          </div>
          <div className={styles.notifInfoItem}>
            <span className={styles.notifInfoIcon}>✉️</span>
            <div>
              <span className={styles.notifInfoLabel}>Email de confirmación</span>
              <span className={styles.notifInfoDesc}>Al reservar, cada participante recibe un email con enlace al chat</span>
            </div>
          </div>
          <div className={styles.notifInfoItem}>
            <span className={styles.notifInfoIcon}>🔔</span>
            <div>
              <span className={styles.notifInfoLabel}>Notificaciones en la app</span>
              <span className={styles.notifInfoDesc}>Badge de mensajes no leídos visible en el botón del chat</span>
            </div>
          </div>
        </div>

        {/* Members list */}
        <div className={styles.membersList}>
          {members.map((m) => (
            <div key={m.id} className={styles.memberItem}>
              <div className={styles.memberAvatar}>
                {m.avatar ? (
                  <img src={m.avatar} alt={m.name} className={styles.memberAvatarImg} />
                ) : (
                  <span className={styles.memberAvatarInitial}>
                    {m.name?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <div className={styles.memberInfo}>
                <span className={styles.memberName}>
                  {m.name}
                  {m.isYou && <span className={styles.youBadge}>Tú</span>}
                </span>
              </div>
            </div>
          ))}

          {/* Anonymous attendees count */}
          {totalMembers > members.length && (
            <div className={styles.memberItem}>
              <div className={styles.memberAvatar}>
                <span className={styles.memberAvatarAnon}>+{totalMembers - members.length}</span>
              </div>
              <div className={styles.memberInfo}>
                <span className={styles.memberName} style={{ color: '#888' }}>
                  {totalMembers - members.length === 1 ? 'participante sin perfil' : 'participantes sin perfil'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Always show the floating button
  return (
    <>
      {/* Floating chat toggle button */}
      <button
        className={styles.chatToggle}
        onClick={() => {
          setIsOpen(!isOpen);
          setUnread(0);
          if (isOpen) setShowMembers(false);
        }}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat del plan'}
        id="chat-toggle"
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
        )}
        {unread > 0 && !isOpen && (
          <span className={styles.unreadBadge}>{unread}</span>
        )}
        {totalMembers > 0 && !isOpen && unread === 0 && hasAccess && (
          <span className={styles.memberCountBadge}>{totalMembers}</span>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className={styles.chatPanel}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderLeft}>
              <div className={styles.chatHeaderIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
              <div>
                <h3 className={styles.chatHeaderTitle}>Chat del plan</h3>
                {hasAccess && (
                  <button
                    className={styles.chatHeaderMembers}
                    onClick={() => setShowMembers(!showMembers)}
                  >
                    {totalMembers > 0 && (
                      <span className={styles.headerMemberAvatars}>
                        {visibleMembers.map((m, i) => (
                          <span key={m.id} className={styles.headerMiniAvatar} style={{ zIndex: 5 - i }}>
                            {m.avatar ? (
                              <img src={m.avatar} alt="" />
                            ) : (
                              <span>{m.name?.[0]?.toUpperCase() || '?'}</span>
                            )}
                          </span>
                        ))}
                        {extraMembers > 0 && (
                          <span className={`${styles.headerMiniAvatar} ${styles.headerMiniAvatarExtra}`}>
                            +{extraMembers}
                          </span>
                        )}
                      </span>
                    )}
                    <span className={styles.headerMemberCount}>
                      {totalMembers} {totalMembers === 1 ? 'participante' : 'participantes'}
                    </span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2, opacity: 0.6 }}>
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
                    </svg>
                  </button>
                )}
                {!hasAccess && (
                  <span className={styles.chatHeaderSub}>Chat de asistentes</span>
                )}
              </div>
            </div>
            <button
              className={styles.chatClose}
              onClick={() => { setIsOpen(false); setShowMembers(false); }}
              aria-label="Cerrar chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Content: either members panel or chat */}
          {showMembers && hasAccess ? (
            renderMembersPanel()
          ) : (
            <>
              <div className={styles.chatBody} ref={chatBodyRef}>
                {!hasAccess ? (
                  renderBlockedContent()
                ) : messages.length === 0 ? (
                  <div className={styles.emptyChat}>
                    <span className={styles.emptyChatIcon}>🎉</span>
                    <p className={styles.emptyChatText}>
                      ¡Sé el primero en escribir! Saluda a los demás asistentes
                    </p>
                    {totalMembers > 1 && (
                      <p className={styles.emptyChatSubtext}>
                        Hay {totalMembers} personas apuntadas a este plan
                      </p>
                    )}
                  </div>
                ) : (
                  groupedMessages.map((item, i) => {
                    if (item.type === 'date') {
                      return (
                        <div key={`date-${i}`} className={styles.dateSeparator}>
                          <span>{item.label}</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={item.id}
                        className={`${styles.messageRow} ${item.isOwn ? styles.messageOwn : ''}`}
                      >
                        {!item.isOwn && (
                          <div className={styles.messageAvatar}>
                            {item.authorAvatar ? (
                              <img src={item.authorAvatar} alt="" className={styles.messageAvatarImg} />
                            ) : (
                              <span className={styles.messageAvatarInitial}>
                                {item.authorName?.[0]?.toUpperCase() || '?'}
                              </span>
                            )}
                          </div>
                        )}
                        <div className={styles.messageBubble}>
                          {!item.isOwn && (
                            <span className={styles.messageAuthor}>{item.authorName}</span>
                          )}
                          <p className={styles.messageText}>{item.message}</p>
                          <span className={styles.messageTime}>{formatTime(item.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {hasAccess && (
                <div className={styles.chatFooter}>
                  <input
                    type="text"
                    className={styles.chatInput}
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={1000}
                    disabled={sending}
                    id="chat-input"
                  />
                  <button
                    className={styles.sendBtn}
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    aria-label="Enviar mensaje"
                    id="chat-send"
                  >
                    {sending ? (
                      <span className={styles.sendSpinner} />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
