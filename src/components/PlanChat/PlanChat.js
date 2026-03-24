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
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const chatBodyRef = useRef(null);

  // Check auth & load messages
  useEffect(() => {
    async function init() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }
      setUser(currentUser);

      try {
        const res = await fetch(`/api/chat?planId=${planId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          setHasAccess(true);
        } else if (res.status === 403) {
          // User doesn't have a reservation
          setHasAccess(false);
        }
      } catch (err) {
        console.error('Chat init error:', err);
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
          // Don't duplicate messages we just sent
          if (payload.new.user_id === user.id) return;

          // Fetch the full message with profile info
          try {
            const res = await fetch(`/api/chat?planId=${planId}`);
            if (res.ok) {
              const data = await res.json();
              setMessages(data.messages || []);
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
      setNewMessage(messageText); // Restore message on error
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

  // Don't render if user has no access or is not logged in
  if (loading || !hasAccess || !user) return null;

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

  return (
    <>
      {/* Floating chat toggle button */}
      <button
        className={styles.chatToggle}
        onClick={() => {
          setIsOpen(!isOpen);
          setUnread(0);
        }}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat del plan'}
        id="chat-toggle"
      >
        {isOpen ? '✕' : '💬'}
        {unread > 0 && !isOpen && (
          <span className={styles.unreadBadge}>{unread}</span>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className={styles.chatPanel}>
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderInfo}>
              <span className={styles.chatHeaderIcon}>💬</span>
              <div>
                <h3 className={styles.chatHeaderTitle}>Chat del plan</h3>
                <span className={styles.chatHeaderSub}>
                  {messages.length} {messages.length === 1 ? 'mensaje' : 'mensajes'}
                </span>
              </div>
            </div>
            <button
              className={styles.chatClose}
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar chat"
            >
              ✕
            </button>
          </div>

          <div className={styles.chatBody} ref={chatBodyRef}>
            {messages.length === 0 ? (
              <div className={styles.emptyChat}>
                <span className={styles.emptyChatIcon}>🎉</span>
                <p className={styles.emptyChatText}>
                  ¡Sé el primero en escribir! Saluda a los demás asistentes
                </p>
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
                '➤'
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
