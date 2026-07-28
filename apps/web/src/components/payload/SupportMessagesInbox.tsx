'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Send, Trash2 } from 'lucide-react';
import { ClientDateTime } from '@/components/ui/ClientDateTime';
import {
  buildChatBubbles,
  getThreadPreview,
  getUserDisplayFromRelation,
  groupChatsByClient,
  type SupportThread,
} from '@/lib/support-chat';
import {
  SUPPORT_STATUS_TABS,
  isPendingSupportStatus,
  normalizeSupportStatus,
  type SupportStatusFilter,
} from '@/lib/support-status-workflow';

const STATUS_LABELS: Record<string, string> = {
  received: 'Recibido',
  responded: 'Respondido',
  open: 'Recibido',
  answered: 'Respondido',
  closed: 'Respondido',
};

function statusBadgeModifier(status: string): string {
  const normalized = normalizeSupportStatus(status);
  if (normalized === 'received') return 'mp-support-inbox__badge--received';
  return 'mp-support-inbox__badge--responded';
}

function parseApiError(result: unknown, fallback: string): string {
  if (!result || typeof result !== 'object') return fallback;
  const payload = result as Record<string, unknown>;
  if (typeof payload.error === 'string') return payload.error;
  return fallback;
}

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : {};
  if (!res.ok) throw new Error(parseApiError(data, 'Error en la solicitud'));
  return data as T;
}

export function SupportMessagesInbox() {
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<SupportStatusFilter>('all');
  const [messages, setMessages] = useState<SupportThread[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [menuKey, setMenuKey] = useState<string | null>(null);

  const clientChats = useMemo(() => groupChatsByClient(messages), [messages]);
  const activeMessage = clientChats.find((m) => m.id === activeId) ?? null;
  const clientName = activeMessage ? getUserDisplayFromRelation(activeMessage.user) : '';
  const bubbles = activeMessage ? buildChatBubbles(activeMessage, 'staff') : [];

  const exitSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedKeys(new Set());
  }, []);

  const toggleSelect = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const loadMessages = useCallback(async (tab: SupportStatusFilter = activeTab) => {
    setListLoading(true);
    try {
      const data = await adminFetch<{ docs: SupportThread[] }>(
        `/api/admin/support-messages?status=${tab}`,
      );
      setMessages(data.docs);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los chats');
    } finally {
      setListLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadMessages(activeTab);
  }, [activeTab, loadMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadMessages(activeTab);
    }, 15000);
    return () => clearInterval(interval);
  }, [activeTab, loadMessages]);

  useEffect(() => {
    if (activeId && !clientChats.some((m) => m.id === activeId)) {
      setActiveId(clientChats[0]?.id ?? null);
    } else if (!activeId && clientChats[0]) {
      setActiveId(clientChats[0].id);
    }
  }, [clientChats, activeId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, bubbles.length]);

  useEffect(() => {
    exitSelection();
    setMenuKey(null);
  }, [activeId, exitSelection]);

  async function handleCreateChat() {
    if (!clientEmail.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await adminFetch<{ message?: SupportThread }>('/api/admin/support-messages', {
        method: 'POST',
        body: JSON.stringify({ email: clientEmail.trim() }),
      });

      setShowNewChat(false);
      setClientEmail('');
      if (result.message?.id) setActiveId(result.message.id);
      await loadMessages(activeTab);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear chat');
    } finally {
      setLoading(false);
    }
  }

  async function handleReply() {
    if (!activeMessage || !replyBody.trim()) return;

    setLoading(true);
    setError('');
    try {
      const result = await adminFetch<{ message: SupportThread }>(
        `/api/admin/support-messages/${activeMessage.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ action: 'reply', message: replyBody.trim() }),
        },
      );

      setReplyBody('');
      setMessages((prev) =>
        prev.map((item) => (item.id === result.message.id ? result.message : item)),
      );

      const nextTab = activeTab === 'received' ? 'all' : activeTab;
      if (nextTab !== activeTab) setActiveTab(nextTab);
      else await loadMessages(nextTab);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setLoading(false);
    }
  }

  async function deleteMessages(keys: string[], scope: 'me' | 'everyone') {
    if (!activeMessage || keys.length === 0) return;

    setLoading(true);
    setError('');
    try {
      const result = await adminFetch<{ message: SupportThread }>(
        `/api/admin/support-messages/${activeMessage.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ action: 'deleteMessage', keys, scope }),
        },
      );

      setMessages((prev) =>
        prev.map((item) => (item.id === result.message.id ? result.message : item)),
      );
      setMenuKey(null);
      exitSelection();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteChat() {
    if (!activeMessage) return;
    if (!window.confirm('¿Eliminar toda la conversación con este cliente?')) return;

    setLoading(true);
    setError('');
    try {
      await adminFetch(`/api/admin/support-messages/${activeMessage.id}`, { method: 'DELETE' });
      setActiveId(null);
      await loadMessages(activeTab);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mp-support-inbox-wrap">
      <div className="mp-support-inbox__toolbar">
        <button
          type="button"
          onClick={() => {
            setShowNewChat((v) => !v);
            setError('');
          }}
          className="mp-btn mp-btn--outline mp-support-inbox__new-chat"
        >
          <Plus size={16} />
          Nuevo chat
        </button>
      </div>

      {showNewChat && (
        <div className="mp-support-inbox__new-form">
          <p className="mp-support-inbox__new-form-title">Iniciar chat con un cliente</p>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="Correo del cliente"
            required
            className="mp-field-input"
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleCreateChat()}
            className="mp-btn mp-btn--primary"
          >
            Crear chat
          </button>
        </div>
      )}

      <div className="mp-status-tabs">
        <nav className="mp-status-tabs__nav" aria-label="Filtrar clientes por estado de respuesta">
          {SUPPORT_STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`mp-status-tabs__tab${activeTab === tab.id ? ' mp-status-tabs__tab--active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mp-support-inbox">
        <aside className="mp-support-inbox__sidebar">
          {listLoading && messages.length === 0 ? (
            <p className="mp-support-inbox__empty">Cargando...</p>
          ) : clientChats.length === 0 ? (
            <p className="mp-support-inbox__empty">No hay clientes en este filtro.</p>
          ) : (
            <ul>
              {clientChats.map((item) => {
                const isActive = item.id === activeId;
                const displayName = getUserDisplayFromRelation(item.user);
                const needsReply = isPendingSupportStatus(item.status);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(item.id);
                        setReplyBody('');
                        setError('');
                      }}
                      className={`mp-support-inbox__thread${isActive ? ' mp-support-inbox__thread--active' : ''}`}
                    >
                      <div className="mp-support-inbox__thread-head">
                        <span className="mp-support-inbox__thread-title">
                          {displayName || 'Cliente'}
                        </span>
                        <span
                          className={`mp-support-inbox__badge ${statusBadgeModifier(item.status)}`}
                        >
                          {STATUS_LABELS[normalizeSupportStatus(item.status)] || item.status}
                        </span>
                      </div>
                      <span className="mp-support-inbox__thread-preview">{getThreadPreview(item)}</span>
                      <span className="mp-support-inbox__thread-date">
                        <ClientDateTime
                          value={item.updatedAt || item.createdAt}
                          locale="es-DO"
                          dateStyle="short"
                          timeStyle="short"
                        />
                      </span>
                      {needsReply && (
                        <span className="mp-support-inbox__thread-dot" title="Pendiente de respuesta" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <div className="mp-support-inbox__chat">
          {activeMessage ? (
            <>
              <div className="mp-support-inbox__chat-header">
                <div>
                  <h3 className="mp-support-inbox__chat-title">{clientName || 'Cliente'}</h3>
                </div>
                <div className="mp-support-inbox__chat-actions">
                  <span
                    className={`mp-support-inbox__badge ${statusBadgeModifier(activeMessage.status)}`}
                  >
                    {STATUS_LABELS[normalizeSupportStatus(activeMessage.status)] ||
                      activeMessage.status}
                  </span>
                  {bubbles.length > 0 && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        if (selectionMode) exitSelection();
                        else setSelectionMode(true);
                        setMenuKey(null);
                      }}
                      className="mp-support-inbox__delete-chat"
                    >
                      {selectionMode ? 'Cancelar' : 'Seleccionar'}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void handleDeleteChat()}
                    className="mp-support-inbox__delete-chat"
                  >
                    <Trash2 size={14} />
                    Eliminar chat
                  </button>
                </div>
              </div>

              {selectionMode && (
                <div className="mp-support-inbox__selbar">
                  <label className="mp-support-inbox__selbar-all">
                    <input
                      type="checkbox"
                      checked={selectedKeys.size > 0 && selectedKeys.size === bubbles.length}
                      onChange={(e) =>
                        setSelectedKeys(
                          e.target.checked ? new Set(bubbles.map((b) => b.key)) : new Set(),
                        )
                      }
                    />
                    Seleccionar todos ({selectedKeys.size})
                  </label>
                  <div className="mp-support-inbox__selbar-actions">
                    <button
                      type="button"
                      disabled={loading || selectedKeys.size === 0}
                      onClick={() => void deleteMessages([...selectedKeys], 'me')}
                      className="mp-support-inbox__delete-chat"
                    >
                      Eliminar para mí
                    </button>
                    <button
                      type="button"
                      disabled={loading || selectedKeys.size === 0}
                      onClick={() => void deleteMessages([...selectedKeys], 'everyone')}
                      className="mp-support-inbox__delete-chat"
                    >
                      Eliminar para todos
                    </button>
                  </div>
                </div>
              )}

              <div className="mp-support-inbox__messages">
                {bubbles.length === 0 && (
                  <p className="mp-support-inbox__empty-hint">
                    Sin mensajes aún. Escribe el primer mensaje al cliente.
                  </p>
                )}
                {bubbles.map((bubble) => (
                  <div
                    key={bubble.key}
                    className={`mp-support-inbox__bubble mp-support-inbox__bubble--${bubble.role}${
                      selectionMode && selectedKeys.has(bubble.key)
                        ? ' mp-support-inbox__bubble--selected'
                        : ''
                    }`}
                    onClick={selectionMode ? () => toggleSelect(bubble.key) : undefined}
                  >
                    <div className="mp-support-inbox__bubble-top">
                      {selectionMode && (
                        <input
                          type="checkbox"
                          checked={selectedKeys.has(bubble.key)}
                          onChange={() => toggleSelect(bubble.key)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      <p className="mp-support-inbox__bubble-label">
                        {bubble.role === 'customer' ? clientName || 'Cliente' : 'Equipo'}
                      </p>
                      {!selectionMode && (
                        <div className="mp-support-inbox__msg-menu-wrap">
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              setMenuKey((prev) => (prev === bubble.key ? null : bubble.key))
                            }
                            className="mp-support-inbox__delete-msg"
                            title="Opciones"
                          >
                            <Trash2 size={14} />
                          </button>
                          {menuKey === bubble.key && (
                            <div className="mp-support-inbox__msg-menu">
                              <button
                                type="button"
                                onClick={() => void deleteMessages([bubble.key], 'me')}
                              >
                                Eliminar para mí
                              </button>
                              {bubble.canDeleteForEveryone && (
                                <button
                                  type="button"
                                  onClick={() => void deleteMessages([bubble.key], 'everyone')}
                                >
                                  Eliminar para todos
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="mp-support-inbox__bubble-body">{bubble.body}</p>
                    <p className="mp-support-inbox__bubble-time">
                      <ClientDateTime
                        value={bubble.sentAt}
                        locale="es-DO"
                        dateStyle="short"
                        timeStyle="short"
                      />
                    </p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {error && (
                <p className="mp-support-inbox__error" role="alert">
                  {error}
                </p>
              )}

              <div className="mp-support-inbox__composer">
                <div className="mp-support-inbox__composer-form">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleReply();
                      }
                    }}
                    placeholder="Escribe tu mensaje al cliente..."
                    minLength={2}
                    rows={2}
                    className="mp-field-textarea mp-support-inbox__composer-input"
                  />
                  <button
                    type="button"
                    disabled={loading || replyBody.trim().length < 2}
                    onClick={() => void handleReply()}
                    className="mp-btn mp-btn--primary mp-support-inbox__send"
                  >
                    <Send size={16} />
                    Enviar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="mp-support-inbox__empty">Selecciona un cliente.</p>
          )}
        </div>
      </div>
    </div>
  );
}
