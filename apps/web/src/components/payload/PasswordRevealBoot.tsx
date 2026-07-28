'use client';

import { useEffect } from 'react';

const EYE = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_OFF = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-4.86"/><path d="m2 2 20 20"/></svg>`;

function enhancePasswordInput(input: HTMLInputElement) {
  if (input.dataset.mpRevealReady === '1') return;
  if (input.closest('[data-password-reveal]')) {
    input.dataset.mpRevealReady = '1';
    return;
  }

  input.dataset.mpRevealReady = '1';

  const wrap = document.createElement('div');
  wrap.className = 'mp-password-field';
  wrap.dataset.passwordReveal = '';

  const parent = input.parentNode;
  if (!parent) return;

  parent.insertBefore(wrap, input);
  wrap.appendChild(input);
  input.classList.add('mp-password-field__input');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mp-password-field__toggle';
  btn.setAttribute('aria-label', 'Mostrar contraseña');
  if (input.id) btn.setAttribute('aria-controls', input.id);
  btn.innerHTML = EYE;

  btn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    btn.innerHTML = show ? EYE_OFF : EYE;
  });

  wrap.appendChild(btn);
}

function scan(root: ParentNode = document) {
  root.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach(enhancePasswordInput);
}

/** Activa el reveal en login/admin aunque no pase por providers. */
export function PasswordRevealBoot() {
  useEffect(() => {
    scan(document);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.matches?.('input[type="password"]')) {
            enhancePasswordInput(node as HTMLInputElement);
          } else {
            scan(node);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
