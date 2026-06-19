'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';

type Message = {
  id: string | number;
  subject: string;
  message: string;
  status: string;
  admin_reply?: string | null;
  createdAt: string;
};

type Props = {
  messages: Message[];
  labels: {
    title: string;
    subject: string;
    message: string;
    submit: string;
    success: string;
    error: string;
    empty: string;
    yourMessage: string;
    teamReply: string;
    statusOpen: string;
    statusAnswered: string;
    statusClosed: string;
  };
};

export function SupportSection({ messages, labels }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const statusLabel: Record<string, string> = {
    open: labels.statusOpen,
    answered: labels.statusAnswered,
    closed: labels.statusClosed,
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/support-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || labels.error);

      setSubject('');
      setMessage('');
      setFeedback({ type: 'success', text: labels.success });
      router.refresh();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : labels.error,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <h2 className="font-secondary text-xl font-semibold text-secondary">{labels.title}</h2>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={labels.subject}
          required
          minLength={3}
          className="input-field"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={labels.message}
          required
          minLength={10}
          rows={4}
          className="input-field resize-none"
        />
        {feedback && (
          <p className={`text-sm ${feedback.type === 'success' ? 'text-primary' : 'text-red-600'}`}>
            {feedback.text}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? '...' : labels.submit}
        </button>
      </form>

      {messages.length > 0 && (
        <div className="card space-y-4 p-6">
          {messages.map((item) => (
            <article key={item.id} className="rounded-xl border border-primary/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-secondary">{item.subject}</h3>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {statusLabel[item.status] || item.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-secondary/80">
                <span className="font-medium">{labels.yourMessage}: </span>
                {item.message}
              </p>
              {item.admin_reply && (
                <p className="mt-3 rounded-lg bg-primary/5 p-3 text-sm text-secondary">
                  <span className="font-medium">{labels.teamReply}: </span>
                  {item.admin_reply}
                </p>
              )}
              <p className="mt-2 text-xs text-secondary/50">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      )}

      {messages.length === 0 && (
        <p className="text-center text-sm text-secondary/60">{labels.empty}</p>
      )}
    </section>
  );
}
