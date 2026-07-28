'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { notifyAccountCountsChanged } from '@/hooks/useAccountCounts';
import { ClientDateTime } from '@/components/ui/ClientDateTime';
import {
  buildChatBubbles,
  isThreadUnread,
  pickPrimaryChat,
  statusBadgeClass,
  type SupportThread,
} from '@/lib/support-chat';
import { normalizeSupportStatus } from '@/lib/support-status-workflow';
import { Send, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Labels = {
  title: string;
  teamName: string;
  yourMessage: string;
  teamReply: string;
  statusPending: string;
  statusResponded: string;
  noReplyYet: string;
  sendInChat: string;
  chatPlaceholder: string;
  chatClosed: string;
  replyError: string;
  deleteMessage: string;
  deleteChat: string;
  confirmDeleteMessage: string;
  confirmDeleteChat: string;
  select: string;
  cancel: string;
  selectAll: string;
  deleteForMe: string;
  deleteForEveryone: string;
};

type Props = {
  messages: SupportThread[];
  labels: Labels;
};

export function SupportSection({ messages, labels }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const dateLocale = locale === 'es' ? 'es-DO' : 'en-US';
  const searchParams = useSearchParams();
  const hiloParam = searchParams.get('hilo');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const primaryChat = useMemo(() => pickPrimaryChat(messages), [messages]);
  const [activeId, setActiveId] = useState<string | number | null>(primaryChat?.id ?? null);
  const [replyBody, setReplyBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [menuKey, setMenuKey] = useState<string | null>(null);

  const activeMessage =
    messages.find((m) => m.id === activeId) ?? primaryChat ?? null;
  const activeBubbles = activeMessage ? buildChatBubbles(activeMessage, 'customer') : [];

  function exitSelection() {
    setSelectionMode(false);
    setSelectedKeys(new Set());
  }

  function toggleSelect(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  const statusLabel: Record<string, string> = {
    received: labels.statusPending,
    responded: labels.statusResponded,
    open: labels.statusPending,
    answered: labels.statusResponded,
    closed: labels.statusResponded,
  };

  useEffect(() => {
    if (primaryChat) setActiveId(primaryChat.id);
  }, [primaryChat?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, activeBubbles.length]);

  useEffect(() => {
    setSelectionMode(false);
    setSelectedKeys(new Set());
    setMenuKey(null);
  }, [activeId]);

  useEffect(() => {
    if (!hiloParam || messages.length === 0) return;
    const match = messages.find((m) => String(m.id) === hiloParam);
    if (!match) return;
    setActiveId(match.id);
    if (isThreadUnread(match)) {
      fetch(`/api/account/support-messages/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read', read: true }),
      }).then(() => {
        notifyAccountCountsChanged();
        router.refresh();
      });
    }
  }, [hiloParam, messages, router]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/support-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyBody.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || labels.replyError);

      setReplyBody('');
      if (data.message?.id) setActiveId(data.message.id);
      notifyAccountCountsChanged();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.replyError);
    } finally {
      setLoading(false);
    }
  }

  async function deleteMessages(keys: string[], scope: 'me' | 'everyone') {
    if (!activeMessage || keys.length === 0) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/account/support-messages/${activeMessage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteMessage', keys, scope }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || labels.replyError);

      setMenuKey(null);
      exitSelection();
      notifyAccountCountsChanged();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.replyError);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteChat() {
    if (!activeMessage) return;
    if (!window.confirm(labels.confirmDeleteChat)) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/account/support-messages/${activeMessage.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || labels.replyError);

      setActiveId(null);
      notifyAccountCountsChanged();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.replyError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <div className="card flex min-h-[32rem] flex-col overflow-hidden">
        <div className="border-b border-primary/10 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-secondary text-lg font-semibold text-secondary sm:text-xl">
                {labels.title}
              </h2>
              <p className="text-sm text-secondary/60">{labels.teamName}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activeMessage && (
                <>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      statusBadgeClass(activeMessage.status),
                    )}
                  >
                    {statusLabel[normalizeSupportStatus(activeMessage.status)] ||
                      activeMessage.status}
                  </span>
                  {activeBubbles.length > 0 && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setMenuKey(null);
                        if (selectionMode) exitSelection();
                        else setSelectionMode(true);
                      }}
                      className="text-xs font-semibold text-secondary/70 hover:underline"
                    >
                      {selectionMode ? labels.cancel : labels.select}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleDeleteChat}
                    className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                  >
                    <Trash2 size={14} />
                    {labels.deleteChat}
                  </button>
                </>
              )}
            </div>
          </div>

          {selectionMode && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-primary/5 px-3 py-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-secondary/80">
                <input
                  type="checkbox"
                  checked={
                    selectedKeys.size > 0 && selectedKeys.size === activeBubbles.length
                  }
                  onChange={(e) =>
                    setSelectedKeys(
                      e.target.checked
                        ? new Set(activeBubbles.map((b) => b.key))
                        : new Set(),
                    )
                  }
                />
                {labels.selectAll} ({selectedKeys.size})
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={loading || selectedKeys.size === 0}
                  onClick={() => deleteMessages([...selectedKeys], 'me')}
                  className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-40"
                >
                  {labels.deleteForMe}
                </button>
                <button
                  type="button"
                  disabled={loading || selectedKeys.size === 0}
                  onClick={() => deleteMessages([...selectedKeys], 'everyone')}
                  className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-40"
                >
                  {labels.deleteForEveryone}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="max-h-[26rem] min-h-[16rem] flex-1 space-y-3 overflow-y-auto bg-background/40 p-4 sm:p-6">
          {activeBubbles.map((bubble) => {
            const isSelected = selectedKeys.has(bubble.key);
            return (
              <div
                key={bubble.key}
                className={cn(
                  'flex items-start gap-2',
                  bubble.role === 'customer' ? 'justify-end' : 'justify-start',
                )}
                onClick={selectionMode ? () => toggleSelect(bubble.key) : undefined}
              >
                {selectionMode && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(bubble.key)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3"
                  />
                )}
                <div
                  className={cn(
                    'group relative max-w-[85%] rounded-2xl px-4 py-3',
                    bubble.role === 'customer'
                      ? 'rounded-br-md bg-primary/15'
                      : 'rounded-bl-md border border-primary/15 bg-white shadow-sm',
                    isSelected && 'ring-2 ring-primary ring-offset-1',
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p
                      className={cn(
                        'text-xs font-medium',
                        bubble.role === 'customer' ? 'text-primary' : 'text-secondary/70',
                      )}
                    >
                      {bubble.role === 'customer' ? labels.yourMessage : labels.teamReply}
                    </p>
                    {!selectionMode && (
                      <div className="relative">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() =>
                            setMenuKey((prev) => (prev === bubble.key ? null : bubble.key))
                          }
                          className="text-secondary/40 opacity-0 transition hover:text-red-600 group-hover:opacity-100"
                          title={labels.deleteMessage}
                        >
                          <Trash2 size={14} />
                        </button>
                        {menuKey === bubble.key && (
                          <div className="absolute right-0 top-full z-20 mt-1 flex min-w-[10rem] flex-col overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg">
                            <button
                              type="button"
                              onClick={() => deleteMessages([bubble.key], 'me')}
                              className="px-3 py-2 text-left text-xs text-secondary hover:bg-red-50 hover:text-red-600"
                            >
                              {labels.deleteForMe}
                            </button>
                            {bubble.canDeleteForEveryone && (
                              <button
                                type="button"
                                onClick={() => deleteMessages([bubble.key], 'everyone')}
                                className="px-3 py-2 text-left text-xs text-secondary hover:bg-red-50 hover:text-red-600"
                              >
                                {labels.deleteForEveryone}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-secondary">{bubble.body}</p>
                  <p className="mt-2 text-[10px] text-secondary/50">
                    <ClientDateTime value={bubble.sentAt} locale={dateLocale} />
                  </p>
                </div>
              </div>
            );
          })}

          {activeBubbles.length === 0 && (
            <p className="py-8 text-center text-sm text-secondary/50">{labels.noReplyYet}</p>
          )}
          <div ref={chatEndRef} />
        </div>

        {error && (
          <p className="px-4 text-sm text-red-600 sm:px-6" role="alert">
            {error}
          </p>
        )}

        <div className="border-t border-primary/10 bg-white p-4 sm:p-6">
          <form onSubmit={handleSend} className="flex gap-2">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder={labels.chatPlaceholder}
              required
              minLength={2}
              rows={2}
              className="input-field min-h-[2.75rem] flex-1 resize-none py-2"
            />
            <button
              type="submit"
              disabled={loading || replyBody.trim().length < 2}
              className="btn-primary flex shrink-0 items-center gap-2 self-end px-4"
              title={labels.sendInChat}
            >
              <Send size={18} />
              <span className="hidden sm:inline">{labels.sendInChat}</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
