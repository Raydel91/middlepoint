'use client';

import { useEffect, useState } from 'react';
import { Button } from '@payloadcms/ui';
import { MessageCircle, X } from 'lucide-react';
import { buildWhatsAppChatUrl } from '@/lib/whatsapp';
import { getOrderContactName, getOrderContactPhone } from '@/lib/order-contact';
import { AdminPortal, useModalOpenClass } from './AdminPortal';

type OrderRow = {
  id: string | number;
  contact_primary?: { name?: string; phone?: string; email?: string } | null;
};

type Props = {
  open: boolean;
  order: OrderRow;
  loading: boolean;
  onClose: () => void;
  onConfirm: (reason: string, options: { sendMessage: boolean }) => void;
};

export function CancelOrderModal({ open, order, loading, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('');
  const [whatsappOnly, setWhatsappOnly] = useState(false);
  useModalOpenClass(open);

  useEffect(() => {
    if (!open) {
      setReason('');
      setWhatsappOnly(false);
    }
  }, [open]);

  if (!open) return null;

  const phone = getOrderContactPhone(order);
  const customerName = getOrderContactName(order);
  const defaultMessage = `Hola ${customerName}, te contactamos de MiddlePoint respecto a tu pedido #${order.id}.`;
  const whatsappUrl = phone ? buildWhatsAppChatUrl(phone, reason.trim() || defaultMessage) : '';
  const validReason = reason.trim().length >= 3;

  return (
    <AdminPortal>
      <div
        className="mp-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-title"
      >
        <div className="mp-modal-panel mp-modal-panel--wide">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 id="cancel-order-title" className="mp-modal-title">
                Cancelar pedido #{order.id}
              </h2>
              <p className="mp-modal-subtitle">
                {whatsappOnly
                  ? 'Marca el pedido como cancelado y escribe al cliente por WhatsApp.'
                  : 'El mensaje irá a Mensajes del cliente y la notificación será solo de cancelación.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mp-icon-btn mp-icon-btn--ghost shrink-0"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          <label className="mp-field-label" htmlFor="cancel-reason">
            Motivo de la cancelación
          </label>
          <textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Explica al cliente por qué se cancela el pedido..."
            className="mp-field-textarea mb-4"
          />

          <label className="mb-4 flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={whatsappOnly}
              onChange={(e) => setWhatsappOnly(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-primary/30"
            />
            <span className="text-sm text-[var(--mp-secondary)]">
              Marcar como cancelado (solo WhatsApp)
              <span className="mt-0.5 block text-xs text-[var(--theme-elevation-500)]">
                Desactiva el envío por mensajes internos; usa WhatsApp para contactar al cliente.
              </span>
            </span>
          </label>

          <div className="mp-modal-actions">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mr-auto inline-flex items-center gap-2 text-sm font-medium text-[#25D366] transition hover:opacity-80"
              >
                <MessageCircle size={16} />
                WhatsApp
              </a>
            )}
            <Button buttonStyle="secondary" onClick={onClose} disabled={loading}>
              Cerrar
            </Button>
            {!whatsappOnly && (
              <Button
                onClick={() => onConfirm(reason, { sendMessage: true })}
                disabled={loading || !validReason}
              >
                {loading ? 'Enviando...' : 'Enviar mensaje y cancelar'}
              </Button>
            )}
            {whatsappOnly && (
              <Button
                onClick={() => onConfirm(reason, { sendMessage: false })}
                disabled={loading || !validReason}
              >
                {loading ? 'Cancelando...' : 'Confirmar cancelación'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </AdminPortal>
  );
}
