import Image from 'next/image';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getStoreContent } from '@/lib/store-content';
import { FOOTER_CONFIG } from '@/lib/footer-config';
import type { Locale } from '@middlepoint/shared';
import { Mail, MapPin, Phone, ExternalLink } from 'lucide-react';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 font-secondary text-sm font-bold uppercase tracking-wide text-primary">
      {children}
    </h3>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className = 'text-sm text-secondary/80 transition hover:text-primary';

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export async function Footer() {
  const locale = (await getLocale()) as Locale;
  const content = await getStoreContent(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-primary/15 bg-background text-secondary">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block">
              <Image
                src="/texto-logo.svg"
                alt={FOOTER_CONFIG.brandDisplayName}
                width={180}
                height={48}
                className="h-auto w-44 max-w-full"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-secondary/70">{content.footer.tagline}</p>
          </div>

          <div>
            <FooterHeading>{content.nav.quickNavHeading}</FooterHeading>
            <ul className="space-y-2.5">
              <li>
                <FooterLink href="/">{content.nav.home}</FooterLink>
              </li>
              <li>
                <FooterLink href="/productos">{content.nav.shop}</FooterLink>
              </li>
              <li>
                <FooterLink href="/productos">{content.nav.categories}</FooterLink>
              </li>
              <li>
                <FooterLink href="/sobre-nosotros">{content.nav.about}</FooterLink>
              </li>
              <li>
                <FooterLink href="/cuenta">{content.nav.account}</FooterLink>
              </li>
              <li>
                <FooterLink href="/faq">{content.nav.faq}</FooterLink>
              </li>
            </ul>
          </div>

          <div>
            <FooterHeading>{content.nav.legalHeading}</FooterHeading>
            <ul className="space-y-2.5">
              <li>
                <span className="text-sm font-medium text-secondary/90">{content.footer.rnc}</span>
              </li>
              <li>
                <FooterLink href="/legal/terminos">{content.nav.terms}</FooterLink>
              </li>
              <li>
                <FooterLink href="/legal/privacidad">{content.nav.privacy}</FooterLink>
              </li>
              <li>
                <FooterLink href="/legal/devoluciones">{content.nav.returns}</FooterLink>
              </li>
            </ul>
          </div>

          <div>
            <FooterHeading>{content.nav.contactHeading}</FooterHeading>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${content.contact.email}`}
                  className="flex items-start gap-2.5 text-sm text-secondary/80 transition hover:text-primary"
                >
                  <Mail size={16} className="mt-0.5 shrink-0 text-primary" />
                  {content.contact.email}
                </a>
              </li>
              <li>
                <a
                  href={content.contact.phoneHref}
                  className="flex items-start gap-2.5 text-sm text-secondary/80 transition hover:text-primary"
                >
                  <Phone size={16} className="mt-0.5 shrink-0 text-primary" />
                  {content.contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={content.contact.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 text-sm text-secondary/80 transition hover:text-primary"
                >
                  <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {content.contact.whatsappDisplay}
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-secondary/80">
                <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
                {content.contact.address}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-primary/15 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-secondary/60">
              © {year} {content.footer.copyrightName}. {content.footer.rights}.
            </p>
            <p className="flex items-center gap-1 text-sm text-secondary/60">
              {content.footer.developedBy}{' '}
              <a
                href={content.footer.developerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary transition hover:underline"
              >
                {content.footer.developerName}
                <ExternalLink size={12} />
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
