import { jsPDF } from 'jspdf';
import { formatCurrency } from '@middlepoint/shared';
import type { OrderReceiptData } from '@/lib/order-receipt';

export type ReceiptPdfLabels = {
  summary: string;
  orderNumber: string;
  slogan: string;
  product: string;
  amount: string;
  total: string;
  customer: string;
  phone: string;
  payment: string;
  cash: string;
  transfer: string;
  account: string;
  delivery: string;
  schedule: string;
  thanks: string;
};

// Paleta de marca (brand.json)
const COLOR = {
  primary: [31, 122, 99] as [number, number, number],
  secondary: [74, 46, 42] as [number, number, number],
  creamSoft: [250, 244, 236] as [number, number, number],
  cream: [245, 233, 220] as [number, number, number],
  premium: [201, 166, 107] as [number, number, number],
  border: [214, 199, 180] as [number, number, number],
  muted: [122, 104, 96] as [number, number, number],
  totalTint: [232, 244, 239] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

/** Carga el logo SVG y lo rasteriza a PNG para incrustarlo en el PDF. */
async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('logo load failed'));
      img.src = '/icono.svg';
    });
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, size, size);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

function formatReceiptAddress(address: OrderReceiptData['address']): string {
  if (!address) return '';
  return [
    address.street,
    [address.city, address.province].filter(Boolean).join(', '),
    address.reference,
  ]
    .filter((part) => part && String(part).trim())
    .join(' · ');
}

/**
 * Genera y descarga el comprobante del pedido en PDF, con la identidad visual
 * de MiddlePoint (logo, colores de marca, tabla de productos y total).
 */
export async function generateReceiptPdf(
  receipt: OrderReceiptData,
  labels: ReceiptPdfLabels,
  fileName: string,
): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const money = (n: number) => formatCurrency(n, receipt.currency, receipt.locale);

  // Fondo crema + tarjeta blanca (como el card de la web)
  doc.setFillColor(...COLOR.creamSoft);
  doc.rect(0, 0, pageW, pageH, 'F');

  const cardX = margin;
  const cardY = margin;
  const cardW = pageW - margin * 2;
  const cardH = pageH - margin * 2;
  doc.setFillColor(...COLOR.white);
  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(1);
  doc.roundedRect(cardX, cardY, cardW, cardH, 14, 14, 'FD');

  const px = cardX + 28;
  const contentW = cardW - 56;
  const rightX = cardX + cardW - 28;
  let y = cardY + 38;

  // Logo
  const logo = await loadLogoDataUrl();
  if (logo) {
    const lw = 56;
    doc.addImage(logo, 'PNG', pageW / 2 - lw / 2, y, lw, lw);
    y += lw + 12;
  } else {
    y += 6;
  }

  // Wordmark: MIDDLE • POINT (punto verde)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const wmLeft = 'MIDDLE';
  const wmRight = 'POINT';
  const gap = 12;
  const wl = doc.getTextWidth(wmLeft);
  const wr = doc.getTextWidth(wmRight);
  const wmStart = pageW / 2 - (wl + gap + wr) / 2;
  doc.setTextColor(...COLOR.secondary);
  doc.text(wmLeft, wmStart, y);
  doc.text(wmRight, wmStart + wl + gap, y);
  doc.setFillColor(...COLOR.primary);
  doc.circle(wmStart + wl + gap / 2, y - 4, 2.2, 'F');
  y += 24;

  // Título + número de pedido + eslogan (centrados)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...COLOR.secondary);
  doc.text(labels.summary, pageW / 2, y, { align: 'center' });
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR.muted);
  doc.text(labels.orderNumber, pageW / 2, y, { align: 'center' });
  y += 15;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(...COLOR.premium);
  doc.text(labels.slogan, pageW / 2, y, { align: 'center' });
  y += 22;

  // Divisor
  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(1);
  doc.line(px, y, rightX, y);
  y += 22;

  // Helper: fila etiqueta (arriba, mayúsculas) + valor (abajo)
  const drawKeyValue = (label: string, value: string) => {
    if (!value || !value.trim()) return;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR.muted);
    doc.text(label.toUpperCase(), px, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...COLOR.secondary);
    const vy = y + 13;
    const wrapped = doc.splitTextToSize(value, contentW) as string[];
    doc.text(wrapped, px, vy);
    y = vy + wrapped.length * 13 + 8;
  };

  // Datos del cliente
  if (receipt.customerName) drawKeyValue(labels.customer, receipt.customerName);
  if (receipt.customerPhone) drawKeyValue(labels.phone, receipt.customerPhone);

  // Cabecera de la tabla de productos
  doc.setFillColor(...COLOR.cream);
  doc.roundedRect(px, y, contentW, 22, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.secondary);
  doc.text(labels.product.toUpperCase(), px + 12, y + 15);
  doc.text(labels.amount.toUpperCase(), rightX - 12, y + 15, { align: 'right' });
  y += 22 + 4;

  // Filas de productos (con zebra)
  doc.setFontSize(11);
  receipt.items.forEach((item, index) => {
    const nameText = `${item.quantity}x ${item.name}`;
    const wrapped = doc.splitTextToSize(nameText, contentW - 110) as string[];
    const rowH = Math.max(22, wrapped.length * 13 + 9);

    if (y + rowH > cardY + cardH - 150) {
      doc.addPage();
      doc.setFillColor(...COLOR.creamSoft);
      doc.rect(0, 0, pageW, pageH, 'F');
      y = margin + 20;
    }

    if (index % 2 === 1) {
      doc.setFillColor(...COLOR.creamSoft);
      doc.rect(px, y, contentW, rowH, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.secondary);
    doc.text(wrapped, px + 12, y + 14);
    doc.text(money(item.price * item.quantity), rightX - 12, y + 14, { align: 'right' });
    y += rowH;
  });

  y += 6;

  // Total destacado
  const totalBoxH = 32;
  doc.setFillColor(...COLOR.totalTint);
  doc.roundedRect(px, y, contentW, totalBoxH, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLOR.primary);
  doc.text(labels.total.toUpperCase(), px + 12, y + 21);
  doc.text(money(receipt.total), rightX - 12, y + 21, { align: 'right' });
  y += totalBoxH + 18;

  // Detalles de pago / entrega
  const paymentValue = receipt.paymentMethod === 'transfer' ? labels.transfer : labels.cash;
  drawKeyValue(labels.payment, paymentValue);

  if (receipt.paymentMethod === 'transfer' && receipt.paymentAccount?.accountNumber?.trim()) {
    const acc = receipt.paymentAccount;
    const accSummary = [acc.bankName, acc.currency, acc.accountTypeLabel, acc.accountNumber]
      .filter(Boolean)
      .join(' · ');
    drawKeyValue(labels.account, accSummary);
  }

  const addressText = formatReceiptAddress(receipt.address);
  if (addressText) drawKeyValue(labels.delivery, addressText);

  if (receipt.scheduledDate?.trim() || receipt.scheduledTime?.trim()) {
    const when = [receipt.scheduledDate, receipt.scheduledTime]
      .filter((v) => v && v.trim())
      .join('  ·  ');
    drawKeyValue(labels.schedule, when);
  }

  // Pie: agradecimiento + marca
  const footerY = cardY + cardH - 40;
  if (y < footerY - 10) y = footerY - 10;
  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(1);
  doc.line(px, y, rightX, y);
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLOR.premium);
  doc.text(labels.thanks, pageW / 2, y, { align: 'center' });
  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.muted);
  doc.text(`MiddlePoint · ${labels.slogan}`, pageW / 2, y, { align: 'center' });

  doc.save(fileName);
}
