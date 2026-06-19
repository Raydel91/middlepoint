'use client';

import Image from 'next/image';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useCart } from '@/components/cart/CartProvider';
import { ShoppingCart, User, Globe } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/utils';

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const { count } = useCart();
  const { data: session, status } = useSession();

  const otherLocale = locale === 'es' ? 'en' : 'es';
  const isLoggedIn = status === 'authenticated' && session?.user;
  const displayName = isLoggedIn
    ? `${session.user.nombre} ${session.user.apellido}`.trim() || session.user.email
    : null;

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center">
          <Image src="/icono.svg" alt={BRAND.brand.name} width={40} height={40} priority />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className={cn('text-sm font-medium hover:text-primary', pathname === '/' && 'text-primary')}
          >
            {t('home')}
          </Link>
          <Link href="/productos" className="text-sm font-medium hover:text-primary">
            {t('products')}
          </Link>
        </nav>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
          {isLoggedIn && displayName && (
            <Link
              href="/cuenta"
              className="hidden max-w-[12rem] truncate rounded-lg px-2 py-1.5 text-sm font-medium text-secondary hover:bg-background sm:block md:max-w-xs"
              title={displayName}
            >
              {t('greeting', { name: session.user.nombre || displayName })}
            </Link>
          )}

          <Link
            href={pathname}
            locale={otherLocale}
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm hover:bg-background"
          >
            <Globe size={16} />
            <span className="hidden sm:inline">{otherLocale.toUpperCase()}</span>
          </Link>

          <Link href="/carrito" className="relative shrink-0 rounded-lg p-2 hover:bg-background">
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                {count}
              </span>
            )}
          </Link>

          <Link
            href={isLoggedIn ? '/cuenta' : '/login'}
            className="flex shrink-0 items-center gap-1.5 rounded-lg p-2 hover:bg-background"
            aria-label={isLoggedIn ? t('account') : t('login')}
          >
            <User size={20} />
            {isLoggedIn && displayName && (
              <span className="max-w-[7rem] truncate text-sm font-medium sm:hidden">
                {session.user.nombre || displayName.split(' ')[0]}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
