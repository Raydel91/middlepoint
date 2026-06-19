'use client';

import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';

type Item = { href: string; label: string };

export function AccountNav({ items }: { items: Item[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-primary/10 pb-4">
      {items.map((item) => {
        const active =
          item.href === '/cuenta'
            ? pathname === '/cuenta'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition',
              active
                ? 'bg-primary text-white'
                : 'bg-white text-secondary/80 hover:bg-primary/10 hover:text-primary',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
