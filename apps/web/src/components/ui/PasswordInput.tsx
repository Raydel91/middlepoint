'use client';

import { useId, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  revealLabel?: string;
  hideLabel?: string;
};

export function PasswordInput({
  className = '',
  revealLabel = 'Mostrar contraseña',
  hideLabel = 'Ocultar contraseña',
  ...props
}: Props) {
  const [visible, setVisible] = useState(false);
  const reactId = useId();
  const inputId = props.id || `password-${reactId}`;

  return (
    <div className="mp-password-field" data-password-reveal="">
      <input
        {...props}
        id={inputId}
        type={visible ? 'text' : 'password'}
        className={`input-field mp-password-field__input ${className}`.trim()}
      />
      <button
        type="button"
        className="mp-password-field__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? hideLabel : revealLabel}
        aria-controls={inputId}
        tabIndex={0}
      >
        {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
}
