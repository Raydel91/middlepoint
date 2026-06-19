import type { Media } from '@/payload-types';

export type ResolvedMedia = {
  id: string | number;
  url: string;
  mimeType?: string | null;
};

export function getMediaUrl(
  media: number | Media | null | undefined,
): string | undefined {
  if (!media || typeof media === 'number') return undefined;

  const url = media.url;
  if (url) {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return url.startsWith('/') ? url : `/${url}`;
  }

  if (media.filename) {
    return `/api/media/file/${encodeURIComponent(media.filename)}`;
  }

  return undefined;
}

export function resolveMedia(
  media: number | Media | null | undefined,
): ResolvedMedia | undefined {
  if (!media || typeof media === 'number') return undefined;

  const url = getMediaUrl(media);
  if (!url) return undefined;

  return {
    id: media.id,
    url,
    mimeType: media.mimeType,
  };
}

export function resolveMediaList(
  items: (number | Media)[] | null | undefined,
): ResolvedMedia[] {
  if (!items?.length) return [];
  return items.map(resolveMedia).filter((item): item is ResolvedMedia => Boolean(item));
}

/** Combina galería + imagen legada sin duplicados (orden: galería primero). */
export function resolveProductGallery(product: {
  galeria?: (number | Media)[] | null;
  imagen?: (number | Media) | null;
}): ResolvedMedia[] {
  const seen = new Set<string | number>();
  const merged: (number | Media)[] = [];

  const add = (item: number | Media | null | undefined) => {
    if (item == null) return;
    const id = typeof item === 'object' ? item.id : item;
    if (seen.has(id)) return;
    seen.add(id);
    merged.push(item);
  };

  if (Array.isArray(product.galeria)) {
    for (const item of product.galeria) add(item);
  }
  add(product.imagen);

  return resolveMediaList(merged);
}

export function isVideoMedia(mimeType?: string | null): boolean {
  return Boolean(mimeType?.startsWith('video/'));
}

export function isSvgMedia(mimeType?: string | null, url?: string): boolean {
  if (mimeType === 'image/svg+xml') return true;
  if (!url) return false;
  const path = url.split('?')[0]?.toLowerCase() ?? '';
  return path.endsWith('.svg');
}

export function getCategoryImageUrl(
  imagen: number | Media | null | undefined,
): string | undefined {
  return getMediaUrl(imagen);
}

export function getProductCardImageUrl(product: {
  galeria?: (number | Media)[] | null;
  imagen?: (number | Media) | null;
}): string | undefined {
  const items = resolveProductGallery(product);
  if (items.length > 0) {
    const firstImage = items.find((item) => !isVideoMedia(item.mimeType));
    return firstImage?.url ?? items[0]?.url;
  }
  return undefined;
}
