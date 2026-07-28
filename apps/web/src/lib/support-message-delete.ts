import type { ChatViewer, SupportThread, SupportThreadEntry } from './support-chat';

export const DEFAULT_CHAT_SUBJECT = 'Soporte MiddlePoint';

/** Alcance del borrado, estilo WhatsApp. */
export type DeleteScope = 'me' | 'everyone';

function markEntryDeleted(
  entry: SupportThreadEntry,
  viewer: ChatViewer,
  scope: DeleteScope,
): SupportThreadEntry {
  const role = entry.role === 'staff' ? 'staff' : 'customer';
  const next = { ...entry };

  // "Para todos" solo aplica a mensajes propios del viewer (regla WhatsApp).
  // Si se pide sobre un mensaje ajeno, se degrada a "para mí".
  if (scope === 'everyone' && role === viewer) {
    next.deleted_for_customer = true;
    next.deleted_for_staff = true;
    return next;
  }

  if (viewer === 'customer') next.deleted_for_customer = true;
  else next.deleted_for_staff = true;
  return next;
}

/**
 * Aplica el borrado (por-lado o para-todos) a una o varias entradas del hilo.
 * No elimina filas físicamente: marca banderas para conservar los índices.
 */
export function applyMessageDeletions(
  doc: SupportThread,
  keys: string[],
  viewer: ChatViewer,
  scope: DeleteScope,
): Record<string, unknown> {
  const thread: SupportThreadEntry[] = Array.isArray(doc.thread)
    ? doc.thread.map((e) => ({ ...e }))
    : [];
  const update: Record<string, unknown> = {};

  for (const key of keys) {
    // Campos legacy (chats muy antiguos sin migrar): borrado total.
    if (key === 'message') {
      update.message = '';
      continue;
    }
    if (key === 'admin_reply') {
      update.admin_reply = null;
      update.admin_reply_at = null;
      continue;
    }

    if (key.startsWith('thread-')) {
      const index = Number(key.replace('thread-', ''));
      if (!Number.isInteger(index) || index < 0 || index >= thread.length) continue;
      thread[index] = markEntryDeleted(thread[index], viewer, scope);
    }
  }

  update.thread = thread;
  return update;
}

/**
 * Marca TODOS los mensajes visibles para el viewer como borrados.
 * `scope` decide si es solo para el viewer o también para el otro lado
 * (para-todos solo afecta a los mensajes propios del viewer).
 */
export function applyDeleteAll(
  doc: SupportThread,
  viewer: ChatViewer,
  scope: DeleteScope,
): Record<string, unknown> {
  const thread: SupportThreadEntry[] = Array.isArray(doc.thread)
    ? doc.thread.map((e) => ({ ...e }))
    : [];

  const next = thread.map((entry) => {
    const alreadyHidden =
      viewer === 'customer' ? entry.deleted_for_customer : entry.deleted_for_staff;
    if (alreadyHidden) return entry;
    return markEntryDeleted(entry, viewer, scope);
  });

  return { thread: next, message: '', admin_reply: null, admin_reply_at: null };
}
