import { APIError, type Endpoint } from 'payload';
import {
  staffCreateChatForClient,
  staffDeleteChatMessages,
  staffReplyToChat,
} from '@/lib/support-staff-actions';
import { resolveStaffFromRequest } from '@/lib/support-staff-auth';
import { AppError } from '@/lib/logger';

function handleStaffError(error: unknown): never {
  if (error instanceof AppError) {
    throw new APIError(error.message, error.statusCode);
  }
  throw error;
}

export const supportStaffEndpoints: Endpoint[] = [
  {
    path: '/staff-create',
    method: 'post',
    handler: async (req) => {
      try {
        await resolveStaffFromRequest(req);
        const body = (await req.json?.()) as { email?: string };
        if (!body?.email?.trim()) {
          throw new APIError('Correo inválido', 400);
        }

        const result = await staffCreateChatForClient(req.payload, body.email);
        return Response.json(result, { status: result.created ? 201 : 200 });
      } catch (error) {
        handleStaffError(error);
      }
    },
  },
  {
    path: '/:id/staff-reply',
    method: 'post',
    handler: async (req) => {
      try {
        await resolveStaffFromRequest(req);
        const idParam = req.routeParams?.id;
        if (idParam === undefined || idParam === null || idParam === '') {
          throw new APIError('Chat no válido', 400);
        }
        const id = typeof idParam === 'string' ? idParam : String(idParam);

        const body = (await req.json?.()) as { message?: string };
        const message = body?.message?.trim();
        if (!message || message.length < 2) {
          throw new APIError('Mensaje inválido', 400);
        }

        const updated = await staffReplyToChat(req.payload, id, message);
        return Response.json({ message: updated });
      } catch (error) {
        handleStaffError(error);
      }
    },
  },
  {
    path: '/:id/delete-message',
    method: 'post',
    handler: async (req) => {
      try {
        await resolveStaffFromRequest(req);
        const idParam = req.routeParams?.id;
        if (idParam === undefined || idParam === null || idParam === '') {
          throw new APIError('Chat no válido', 400);
        }
        const id = typeof idParam === 'string' ? idParam : String(idParam);

        const body = (await req.json?.()) as { key?: string };
        if (!body?.key?.trim()) {
          throw new APIError('Mensaje no válido', 400);
        }

        const updated = await staffDeleteChatMessages(req.payload, id, [body.key], 'everyone');
        return Response.json({ message: updated });
      } catch (error) {
        handleStaffError(error);
      }
    },
  },
];
