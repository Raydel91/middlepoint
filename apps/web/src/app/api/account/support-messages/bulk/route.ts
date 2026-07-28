import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCustomerSession } from '@/lib/account-auth';
import { getPayloadClient } from '@/lib/payload';
import { handleApiError, AppError } from '@/lib/logger';

const bulkSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('markRead'), ids: z.array(z.union([z.string(), z.number()])).optional() }),
  z.object({ action: z.literal('markUnread'), ids: z.array(z.union([z.string(), z.number()])).optional() }),
  z.object({ action: z.literal('delete'), ids: z.array(z.union([z.string(), z.number()])).optional() }),
  z.object({ action: z.literal('deleteAll') }),
  z.object({ action: z.literal('markAllRead') }),
  z.object({ action: z.literal('markAllUnread') }),
]);

export async function POST(request: Request) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    const body = await request.json();
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const payload = await getPayloadClient();
    let affected = 0;

    const baseWhere = { user: { equals: userId } } as const;

    switch (parsed.data.action) {
      case 'markRead':
      case 'markUnread': {
        const read = parsed.data.action === 'markRead';
        const where =
          parsed.data.ids?.length ?
            { and: [baseWhere, { id: { in: parsed.data.ids.map((id) => Number(id)) } }] }
          : baseWhere;
        const result = await payload.find({
          collection: 'support-messages',
          where,
          limit: 500,
          overrideAccess: true,
        });
        await Promise.all(
          result.docs.map((doc) =>
            payload.update({
              collection: 'support-messages',
              id: doc.id,
              data: { read_by_customer: read },
              overrideAccess: true,
            }),
          ),
        );
        affected = result.docs.length;
        break;
      }
      case 'markAllRead':
      case 'markAllUnread': {
        const read = parsed.data.action === 'markAllRead';
        const result = await payload.find({
          collection: 'support-messages',
          where: baseWhere,
          limit: 500,
          overrideAccess: true,
        });
        await Promise.all(
          result.docs.map((doc) =>
            payload.update({
              collection: 'support-messages',
              id: doc.id,
              data: { read_by_customer: read },
              overrideAccess: true,
            }),
          ),
        );
        affected = result.docs.length;
        break;
      }
      case 'delete': {
        const where =
          parsed.data.ids?.length ?
            { and: [baseWhere, { id: { in: parsed.data.ids.map((id) => Number(id)) } }] }
          : baseWhere;
        const result = await payload.find({
          collection: 'support-messages',
          where,
          limit: 500,
          overrideAccess: true,
        });
        await Promise.all(
          result.docs.map((doc) =>
            payload.delete({
              collection: 'support-messages',
              id: doc.id,
              overrideAccess: true,
            }),
          ),
        );
        affected = result.docs.length;
        break;
      }
      case 'deleteAll': {
        const result = await payload.find({
          collection: 'support-messages',
          where: baseWhere,
          limit: 500,
          overrideAccess: true,
        });
        await Promise.all(
          result.docs.map((doc) =>
            payload.delete({
              collection: 'support-messages',
              id: doc.id,
              overrideAccess: true,
            }),
          ),
        );
        affected = result.docs.length;
        break;
      }
    }

    return NextResponse.json({ success: true, affected });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
