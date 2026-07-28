import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireStaffAdmin } from '@/lib/admin-auth';
import { handleApiError, AppError } from '@/lib/logger';
import {
  staffDeleteAllChatMessages,
  staffDeleteChatMessages,
  staffReplyToChat,
} from '@/lib/support-staff-actions';

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('reply'),
    message: z.string().min(2).max(2000),
  }),
  z.object({
    action: z.literal('deleteMessage'),
    keys: z.array(z.string().min(1)).min(1),
    scope: z.enum(['me', 'everyone']).default('everyone'),
  }),
  z.object({
    action: z.literal('deleteAll'),
    scope: z.enum(['me', 'everyone']).default('everyone'),
  }),
]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { payload } = await requireStaffAdmin(request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    if (parsed.data.action === 'deleteMessage') {
      const updated = await staffDeleteChatMessages(
        payload,
        id,
        parsed.data.keys,
        parsed.data.scope,
      );
      return NextResponse.json({ message: updated });
    }

    if (parsed.data.action === 'deleteAll') {
      const updated = await staffDeleteAllChatMessages(payload, id, parsed.data.scope);
      return NextResponse.json({ message: updated });
    }

    const updated = await staffReplyToChat(payload, id, parsed.data.message);
    return NextResponse.json({ message: updated });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { payload } = await requireStaffAdmin(request);
    const { id } = await context.params;

    await payload.delete({
      collection: 'support-messages',
      id,
      overrideAccess: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
