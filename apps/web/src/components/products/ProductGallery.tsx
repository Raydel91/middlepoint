'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { MediaImage } from '@/components/media/MediaImage';
import type { ResolvedMedia } from '@/lib/media';
import { isVideoMedia } from '@/lib/media';

type Props = {
  items: ResolvedMedia[];
  alt: string;
};

export function ProductGallery({ items, alt }: Props) {
  const [active, setActive] = useState(0);

  if (items.length === 0) {
    return (
      <div className="card flex aspect-square items-center justify-center bg-background text-6xl">
        🌿
      </div>
    );
  }

  const current = items[active] ?? items[0];
  const currentIsVideo = isVideoMedia(current.mimeType);
  const hasMultiple = items.length > 1;

  function goTo(index: number) {
    setActive((index + items.length) % items.length);
  }

  return (
    <div>
      <div className="card relative aspect-square overflow-hidden bg-background">
        {currentIsVideo ? (
          <video
            key={current.url}
            src={current.url}
            controls
            playsInline
            className="h-full w-full object-cover"
            aria-label={alt}
          />
        ) : (
          <MediaImage
            src={current.url}
            mimeType={current.mimeType}
            alt={`${alt} — ${active + 1} de ${items.length}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={active === 0}
          />
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md transition hover:bg-white"
              aria-label="Imagen anterior"
            >
              <ChevronLeft size={20} className="text-secondary" />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md transition hover:bg-white"
              aria-label="Imagen siguiente"
            >
              <ChevronRight size={20} className="text-secondary" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
              {active + 1} / {items.length}
            </span>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {items.map((item, index) => {
            const isVideo = isVideoMedia(item.mimeType);
            const isActive = index === active;

            return (
              <button
                key={`${item.id}-${index}`}
                type="button"
                onClick={() => setActive(index)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  isActive ? 'border-primary ring-2 ring-primary/30' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
                aria-label={`${alt} ${index + 1}`}
                aria-current={isActive}
              >
                {isVideo ? (
                  <>
                    <video
                      src={item.url}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play size={22} className="text-white" fill="white" />
                    </span>
                  </>
                ) : (
                  <MediaImage
                    src={item.url}
                    mimeType={item.mimeType}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
