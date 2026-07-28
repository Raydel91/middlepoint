import type { Where } from 'payload';

export const SUPPORT_CHAT_STATUSES = ['received', 'responded'] as const;
export type SupportChatStatus = (typeof SUPPORT_CHAT_STATUSES)[number];
export type SupportStatusFilter = 'all' | 'received' | 'responded';

export const SUPPORT_STATUS_TABS: Array<{ id: SupportStatusFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'received', label: 'Pendientes' },
  { id: 'responded', label: 'Respondidos' },
];

const LEGACY_RECEIVED = ['received', 'open'] as const;
const LEGACY_RESPONDED = ['responded', 'answered', 'closed'] as const;

export function normalizeSupportStatus(status: string): SupportChatStatus {
  if ((LEGACY_RESPONDED as readonly string[]).includes(status)) return 'responded';
  return 'received';
}

export function isPendingSupportStatus(status: string): boolean {
  return normalizeSupportStatus(status) === 'received';
}

export function parseSupportStatusTabFromWhere(where: unknown): SupportStatusFilter {
  if (!where || typeof where !== 'object') return 'all';
  const w = where as { status?: { equals?: string; in?: string[] } };
  const equals = w.status?.equals;
  if (equals === 'received' || equals === 'open') return 'received';
  if (equals === 'responded' || equals === 'answered' || equals === 'closed') return 'responded';

  const values = w.status?.in;
  if (Array.isArray(values)) {
    if (values.some((v) => (LEGACY_RECEIVED as readonly string[]).includes(v))) return 'received';
    if (values.some((v) => (LEGACY_RESPONDED as readonly string[]).includes(v))) return 'responded';
  }

  return 'all';
}

// El enum vigente en la BD solo tiene: received, responded, closed.
// Los valores legacy 'open' y 'answered' fueron migrados y ya no existen,
// por lo que incluirlos en un WHERE rompe la consulta de Postgres.
const DB_RECEIVED = ['received'] as const;
const DB_RESPONDED = ['responded', 'closed'] as const;

export function buildWhereForSupportStatusTab(tab: SupportStatusFilter): Where | undefined {
  if (tab === 'all') return undefined;
  if (tab === 'received') {
    return { status: { in: [...DB_RECEIVED] } };
  }
  return { status: { in: [...DB_RESPONDED] } };
}

export function migrateSupportStatusValue(status: string | undefined): SupportChatStatus {
  if (!status) return 'received';
  return normalizeSupportStatus(status);
}
