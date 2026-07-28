export function normalizeWhatsAppPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function buildWhatsAppChatUrl(phone: string, message?: string): string {
  const digits = normalizeWhatsAppPhone(phone);
  if (!digits) return '';
  const base = `https://wa.me/${digits}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}
