import { normalizeSupportStatus } from '@/lib/support-status-workflow';

/** Quién está viendo el chat: el cliente o el equipo de soporte. */
export type ChatViewer = 'customer' | 'staff';

export type ChatBubble = {
  key: string;
  role: 'customer' | 'staff';
  body: string;
  sentAt: string;
  /** true si el viewer puede eliminar este mensaje también para el otro lado. */
  canDeleteForEveryone: boolean;
};

export type SupportThreadEntry = {
  role?: 'customer' | 'staff' | null;
  body?: string | null;
  sent_at?: string | null;
  deleted_for_customer?: boolean | null;
  deleted_for_staff?: boolean | null;
};

export type SupportThread = {
  id: string | number;
  subject: string;
  message: string;
  status: string;
  admin_reply?: string | null;
  admin_reply_at?: string | null;
  read_by_customer?: boolean | null;
  createdAt: string;
  updatedAt?: string;
  user?: unknown;
  thread?: Array<SupportThreadEntry> | null;
};

function isDeletedForViewer(entry: SupportThreadEntry, viewer: ChatViewer): boolean {
  return viewer === 'customer'
    ? Boolean(entry.deleted_for_customer)
    : Boolean(entry.deleted_for_staff);
}

export const SUPPORT_CHAT_STATUSES = ['received', 'responded'] as const;
export type SupportChatStatus = (typeof SUPPORT_CHAT_STATUSES)[number];

export function getUserIdFromRelation(user: unknown): string | number | null {
  if (typeof user === 'object' && user !== null && 'id' in user) {
    return (user as { id: string | number }).id;
  }
  if (typeof user === 'string' || typeof user === 'number') return user;
  return null;
}

export function getUserEmailFromRelation(user: unknown): string {
  if (typeof user === 'object' && user !== null && 'email' in user) {
    return String((user as { email?: string }).email ?? '');
  }
  return '';
}

export function getUserDisplayFromRelation(user: unknown): string {
  if (typeof user !== 'object' || user === null) return '';

  const u = user as { email?: string; nombre?: string; apellido?: string };
  const fullName = [u.nombre, u.apellido].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;
  if (u.email) return u.email;
  return '';
}

/** Un chat por cliente: conserva el hilo más reciente de cada usuario. */
export function groupChatsByClient(messages: SupportThread[]): SupportThread[] {
  const byUser = new Map<string | number, SupportThread>();

  for (const item of messages) {
    const userId = getUserIdFromRelation(item.user);
    if (userId == null) continue;

    const existing = byUser.get(userId);
    if (!existing) {
      byUser.set(userId, item);
      continue;
    }

    const existingTime = new Date(existing.updatedAt || existing.createdAt).getTime();
    const itemTime = new Date(item.updatedAt || item.createdAt).getTime();
    if (itemTime > existingTime) byUser.set(userId, item);
  }

  return [...byUser.values()].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime(),
  );
}

export function pickPrimaryChat(messages: SupportThread[]): SupportThread | null {
  const grouped = groupChatsByClient(messages);
  return grouped[0] ?? null;
}

export function buildChatBubbles(
  item: SupportThread,
  viewer: ChatViewer = 'staff',
): ChatBubble[] {
  const bubbles: ChatBubble[] = [];

  // Campos legacy (chats no migrados). No admiten borrado por-lado.
  if (item.message?.trim()) {
    bubbles.push({
      key: 'message',
      role: 'customer',
      body: item.message.trim(),
      sentAt: item.createdAt,
      canDeleteForEveryone: viewer === 'customer',
    });
  }

  if (item.admin_reply?.trim()) {
    bubbles.push({
      key: 'admin_reply',
      role: 'staff',
      body: item.admin_reply.trim(),
      sentAt: item.admin_reply_at || item.updatedAt || item.createdAt,
      canDeleteForEveryone: viewer === 'staff',
    });
  }

  for (let i = 0; i < (item.thread ?? []).length; i++) {
    const entry = item.thread![i];
    const body = entry.body?.trim();
    if (!body) continue;
    if (isDeletedForViewer(entry, viewer)) continue;

    const role = entry.role === 'staff' ? 'staff' : 'customer';
    bubbles.push({
      key: `thread-${i}`,
      role,
      body,
      sentAt: entry.sent_at || item.updatedAt || item.createdAt,
      // Solo puedes eliminar "para todos" tus propios mensajes (estilo WhatsApp).
      canDeleteForEveryone: role === viewer,
    });
  }

  return bubbles.sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
  );
}

export function getThreadPreview(item: SupportThread, viewer: ChatViewer = 'staff'): string {
  const bubbles = buildChatBubbles(item, viewer);
  const last = bubbles[bubbles.length - 1]?.body;
  if (last) return last;
  return '';
}

export function isThreadUnread(item: SupportThread, viewer: ChatViewer = 'customer'): boolean {
  const bubbles = buildChatBubbles(item, viewer);
  const lastStaff = [...bubbles].reverse().find((b) => b.role === 'staff');
  return Boolean(lastStaff) && !item.read_by_customer;
}

export function statusBadgeClass(status: string): string {
  const normalized = normalizeSupportStatus(status);
  if (normalized === 'received') return 'bg-amber-100 text-amber-900';
  return 'bg-primary/15 text-primary';
}
