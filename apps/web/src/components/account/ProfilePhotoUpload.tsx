'use client';

import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { MediaImage } from '@/components/media/MediaImage';

type Props = {
  name: string;
  avatarUrl?: string;
  labels: {
    change: string;
    uploading: string;
    error: string;
    hint: string;
  };
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

export function ProfilePhotoUpload({ name, avatarUrl, labels }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatarUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/account/avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || labels.error);
      }
      setPreview(data.avatarUrl as string);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.error);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-primary/20 bg-background">
        {preview ? (
          <MediaImage
            src={preview}
            alt={name}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10 font-secondary text-xl font-bold text-primary">
            {initialsFromName(name)}
          </div>
        )}
      </div>

      <div className="text-center sm:text-left">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          <Camera size={16} />
          {loading ? labels.uploading : labels.change}
        </button>
        <p className="mt-2 text-xs text-secondary/60">{labels.hint}</p>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
