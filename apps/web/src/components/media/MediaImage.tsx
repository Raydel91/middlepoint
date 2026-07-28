import Image from 'next/image';
import { isSvgMedia } from '@/lib/media';

type MediaImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  mimeType?: string | null;
};

export function MediaImage({
  src,
  alt,
  className = '',
  fill,
  sizes,
  priority,
  loading,
  mimeType,
}: MediaImageProps) {
  if (isSvgMedia(mimeType, src)) {
    const svgClass = fill ? `absolute inset-0 h-full w-full object-cover ${className}` : className;
    return <img src={src} alt={alt} className={svgClass} loading={loading} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      loading={loading}
    />
  );
}
