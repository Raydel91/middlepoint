'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { signOut, useSession } from 'next-auth/react';
import { useCart } from '@/components/cart/CartProvider';
import { useAccountCounts } from '@/hooks/useAccountCounts';
import {
  Bell,
  ClipboardList,
  Globe,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  ShoppingBag,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/utils';
import { canUseStoreAccount, type UserRole } from '@middlepoint/shared';
import type { LucideIcon } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (path: string) => boolean;
  badgeKey?: 'notifications' | 'messages';
};

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const { count } = useCart();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const otherLocale = locale === 'es' ? 'en' : 'es';
  const isLoggedIn = status === 'authenticated' && session?.user;
  const canUseAccount =
    isLoggedIn && canUseStoreAccount(session.user.role as UserRole);
  const accountCounts = useAccountCounts(canUseAccount);
  const displayName = isLoggedIn
    ? `${session.user.nombre} ${session.user.apellido}`.trim() || session.user.email
    : null;

  const shopLinks: NavItem[] = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/productos', label: t('products'), icon: ShoppingBag },
  ];

  const accountLinks: NavItem[] = canUseAccount
    ? [
        { href: '/cuenta', label: t('navProfile'), icon: User },
        { href: '/cuenta/pedidos', label: t('navOrders'), icon: ClipboardList },
        {
          href: '/cuenta/notificaciones',
          label: t('navNotifications'),
          icon: Bell,
          badgeKey: 'notifications',
        },
        {
          href: '/cuenta/mensajes',
          label: t('navMessages'),
          icon: MessageSquare,
          badgeKey: 'messages',
        },
      ]
    : [];

  const navLinks = [...shopLinks, ...accountLinks];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await signOut({ callbackUrl: `/${locale}` });
  }

  function renderNavLink(item: NavItem, mobile = false) {
    const active = item.match ? item.match(pathname) : isActivePath(pathname, item.href);
    const Icon = item.icon;
    const badgeCount =
      item.badgeKey === 'notifications' ? accountCounts.notifications
      : item.badgeKey === 'messages' ? accountCounts.messages
      : 0;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMenuOpen(false)}
        className={cn(
          'relative flex items-center gap-2 font-medium transition',
          mobile
            ? cn(
                'rounded-xl px-4 py-3 text-base',
                active ? 'bg-primary text-white' : 'text-secondary hover:bg-primary/10',
              )
            : cn(
                'text-sm',
                active ? 'text-primary' : 'text-secondary hover:text-primary',
              ),
        )}
      >
        <span className="relative shrink-0">
          <Icon size={mobile ? 20 : 18} className="shrink-0" />
          {badgeCount > 0 && (
            <span
              className={cn(
                'absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white',
                mobile && active && 'bg-white text-primary',
              )}
            >
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          )}
        </span>
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-background lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t('closeMenu') : t('menu')}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link href="/" className="flex shrink-0 items-center">
            <Image src="/icono.svg" alt={BRAND.brand.name} width={40} height={40} priority />
          </Link>
        </div>

        <nav className="hidden items-center gap-5 lg:flex">
          {navLinks.map((item) => renderNavLink(item))}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-2">
          {isLoggedIn && displayName && (
            <Link
              href="/cuenta"
              className="hidden max-w-[10rem] truncate rounded-lg px-2 py-1.5 text-sm font-medium text-secondary hover:bg-background md:block xl:max-w-xs"
              title={displayName}
            >
              {t('greeting', { name: session.user.nombre || displayName })}
            </Link>
          )}

          <Link
            href={pathname}
            locale={otherLocale}
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-sm hover:bg-background"
            aria-label={t('language')}
          >
            <Globe size={18} />
            <span className="hidden sm:inline">{otherLocale.toUpperCase()}</span>
          </Link>

          {isLoggedIn && (
            <Link
              href="/carrito"
              className="relative shrink-0 rounded-lg p-2 hover:bg-background"
              aria-label={t('cart')}
            >
              <ShoppingCart size={20} />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                  {count}
                </span>
              )}
            </Link>
          )}

          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="hidden shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-secondary hover:bg-background sm:flex"
              aria-label={t('logout')}
              title={t('logout')}
            >
              <LogOut size={18} />
              <span className="hidden lg:inline">{t('logout')}</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="hidden shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium hover:bg-background sm:flex"
            >
              <User size={18} />
              <span>{t('login')}</span>
            </Link>
          )}
        </div>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            aria-label={t('closeMenu')}
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-50 border-b border-primary/10 bg-white shadow-lg lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
              {isLoggedIn && displayName && (
                <p className="mb-2 px-4 text-sm font-semibold text-secondary">
                  {t('greeting', { name: session.user.nombre || displayName })}
                </p>
              )}

              {shopLinks.map((item) => renderNavLink(item, true))}

              {accountLinks.length > 0 && (
                <>
                  <p className="mb-1 mt-3 px-4 text-xs font-semibold uppercase tracking-wide text-secondary/50">
                    {t('account')}
                  </p>
                  {accountLinks.map((item) => renderNavLink(item, true))}
                </>
              )}

              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex items-center gap-2 rounded-xl px-4 py-3 font-medium text-red-700 hover:bg-red-50"
                >
                  <LogOut size={20} />
                  {t('logout')}
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 flex items-center gap-2 rounded-xl px-4 py-3 font-medium text-secondary hover:bg-primary/10"
                >
                  <User size={20} />
                  {t('login')}
                </Link>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
