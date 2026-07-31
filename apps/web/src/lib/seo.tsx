import type { Metadata } from 'next'
import { getI18nValue, type Locale } from '@middlepoint/shared'
import { getMediaUrl } from '@/lib/media'
import type { Media } from '@/payload-types'

type I18nText = { es?: string | null; en?: string | null } | null | undefined

export type SeoDoc = {
  meta_title?: I18nText
  meta_description?: I18nText
  keywords?: I18nText
  og_title?: I18nText
  og_description?: I18nText
  og_image?: number | Media | null
  robots?: string | null
} | null

export function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.AUTH_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

function absoluteUrl(pathOrUrl: string | undefined): string | undefined {
  if (!pathOrUrl) return undefined
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${siteOrigin()}${path}`
}

function pickSeo(
  field: I18nText,
  locale: Locale,
  fallback?: string,
): string | undefined {
  const value = getI18nValue(field, locale)?.trim()
  if (value) return value
  const trimmed = fallback?.trim()
  return trimmed || undefined
}

export function buildPageMetadata(args: {
  locale: Locale
  seo?: SeoDoc
  fallbackTitle: string
  fallbackDescription?: string
  fallbackImageUrl?: string
  /** Ruta relativa con locale, ej. `/es/productos/mi-slug` */
  path: string
  alternates?: Metadata['alternates']
}): Metadata {
  const { locale, seo, fallbackTitle, fallbackDescription, fallbackImageUrl, path, alternates } =
    args

  const title = pickSeo(seo?.meta_title, locale, fallbackTitle) || fallbackTitle
  const description = pickSeo(seo?.meta_description, locale, fallbackDescription)
  const keywords = pickSeo(seo?.keywords, locale)
  const ogTitle = pickSeo(seo?.og_title, locale, title) || title
  const ogDescription = pickSeo(seo?.og_description, locale, description)

  const ogImage =
    absoluteUrl(getMediaUrl(seo?.og_image)) || absoluteUrl(fallbackImageUrl)

  const canonical = absoluteUrl(path)

  const robotsRaw = seo?.robots?.trim() || 'index'
  const robotsIndex = !robotsRaw.includes('noindex')

  return {
    title,
    description,
    keywords: keywords || undefined,
    alternates: {
      canonical,
      ...alternates,
    },
    robots: {
      index: robotsIndex && !robotsRaw.includes('noindex'),
      follow: true,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      locale: locale === 'es' ? 'es_DO' : 'en_US',
      type: 'website',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    // WhatsApp / otras apps también leen Open Graph; Twitter card reutiliza OG.
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export function buildProductJsonLd(args: {
  locale: Locale
  name: string
  description?: string
  slug: string
  price: number
  imageUrls: string[]
  currency?: string
}): object {
  const url = absoluteUrl(`/${args.locale}/productos/${args.slug}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: args.name,
    description: args.description,
    image: args.imageUrls.length ? args.imageUrls : undefined,
    url,
    offers: {
      '@type': 'Offer',
      priceCurrency: args.currency || 'DOP',
      price: args.price,
      availability: 'https://schema.org/InStock',
      url,
    },
  }
}

export function buildCategoryJsonLd(args: {
  locale: Locale
  name: string
  description?: string
  slug: string
  imageUrl?: string
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: args.name,
    description: args.description,
    url: absoluteUrl(`/${args.locale}/categorias/${args.slug}`),
    image: args.imageUrl ? [args.imageUrl] : undefined,
  }
}

export function buildOrganizationJsonLd(args: {
  name: string
  email?: string
  phone?: string
  address?: string
  logoUrl?: string
  sameAs?: string[]
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: args.name,
    email: args.email,
    telephone: args.phone,
    address: args.address
      ? {
          '@type': 'PostalAddress',
          addressLocality: args.address,
          addressCountry: 'DO',
        }
      : undefined,
    logo: args.logoUrl,
    url: siteOrigin(),
    sameAs: args.sameAs?.filter(Boolean),
  }
}

export function JsonLdScript({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
