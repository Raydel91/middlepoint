'use client';

import { useState } from 'react';
import type { OrderReceiptData } from '@/lib/order-receipt';
import { generateReceiptPdf, type ReceiptPdfLabels } from '@/lib/receipt-pdf';

type Props = {
  whatsappUrl?: string;
  whatsappLabel: string;
  pdfLabel: string;
  pdfFileName: string;
  receipt: OrderReceiptData;
  labels: ReceiptPdfLabels;
};

export function ReceiptActions({
  whatsappUrl,
  whatsappLabel,
  pdfLabel,
  pdfFileName,
  receipt,
  labels,
}: Props) {
  const [generating, setGenerating] = useState(false);

  async function downloadPdf() {
    if (generating) return;
    setGenerating(true);
    try {
      await generateReceiptPdf(receipt, labels, pdfFileName);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 font-semibold text-white transition hover:bg-[#1ebe5b]"
        >
          {whatsappLabel}
        </a>
      )}
      <button
        type="button"
        onClick={downloadPdf}
        disabled={generating}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-white px-4 py-3 font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
      >
        {pdfLabel}
      </button>
    </div>
  );
}
