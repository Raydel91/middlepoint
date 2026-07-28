'use client';

import { useEffect, useState } from 'react';

type Props = {
  value: string;
  locale: string;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  className?: string;
};

export function ClientDateTime({
  value,
  locale,
  dateStyle,
  timeStyle,
  className,
}: Props) {
  const [text, setText] = useState('');

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {};
    if (dateStyle) options.dateStyle = dateStyle;
    if (timeStyle) options.timeStyle = timeStyle;
    if (!dateStyle && !timeStyle) {
      options.dateStyle = 'short';
      options.timeStyle = 'medium';
    }
    setText(new Date(value).toLocaleString(locale, options));
  }, [value, locale, dateStyle, timeStyle]);

  return (
    <time dateTime={value} className={className} suppressHydrationWarning>
      {text || '\u00a0'}
    </time>
  );
}
