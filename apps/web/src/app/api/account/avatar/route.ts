import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { auth } from '@/lib/auth/config';
import { handleApiError, AppError } from '@/lib/logger';
import { getMediaUrl } from '@/lib/media';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/xml',
]);

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AppError('Debes iniciar sesión', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    if (!Number.isFinite(userId)) {
      throw new AppError('Sesión inválida', 401, 'UNAUTHORIZED');
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      throw new AppError('Selecciona una imagen', 400, 'VALIDATION_ERROR');
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      throw new AppError('Formato no permitido. Usa JPG, PNG, WebP o SVG.', 400, 'VALIDATION_ERROR');
    }

    if (file.size > MAX_BYTES) {
      throw new AppError('La imagen no puede superar 2 MB', 400, 'VALIDATION_ERROR');
    }

    const data = Buffer.from(await file.arrayBuffer());
    const payload = await getPayloadClient();

    const media = await payload.create({
      collection: 'media',
      data: {
        alt: `Foto de perfil de ${session.user.nombre} ${session.user.apellido}`.trim(),
      },
      file: {
        data,
        mimetype: file.type,
        name: file.name,
        size: data.length,
      },
      overrideAccess: true,
    });

    await payload.update({
      collection: 'users',
      id: userId,
      data: { avatar: media.id },
      overrideAccess: true,
    });

    return NextResponse.json({
      success: true,
      avatarUrl: getMediaUrl(media),
    });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
