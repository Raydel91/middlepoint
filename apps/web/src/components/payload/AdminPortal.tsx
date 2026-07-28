'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Monta el contenido en `document.body` para evitar stacking de la tabla admin. */
export function AdminPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}

/** Marca el body mientras un modal está abierto (oculta selects nativos que pintan encima). */
export function useModalOpenClass(open: boolean) {
  useEffect(() => {
    if (!open) return;
    document.body.classList.add('mp-modal-open');
    return () => {
      document.body.classList.remove('mp-modal-open');
    };
  }, [open]);
}
