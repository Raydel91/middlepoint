import { APIError, type PayloadRequest, type ServerFunction } from 'payload';
import { isStaffRole, type UserRole } from '@middlepoint/shared';
import {
  staffCreateChatForClient,
  staffDeleteChatMessages,
  staffReplyToChat,
} from '@/lib/support-staff-actions';

function requireStaffReq(req: PayloadRequest) {
  if (!req.user || !isStaffRole(req.user.role as UserRole)) {
    throw new APIError(
      'No autorizado. Cierra sesión en /admin e inicia con una cuenta de staff (ej. admin@middlepoint.do).',
      403,
    );
  }
}

export const supportInboxServerFunctions: Record<string, ServerFunction> = {
  'support-staff-reply': async (args) => {
    const { req } = args;
    const chatId = args.chatId as string | number;
    const message = args.message as string;
    requireStaffReq(req);
    const trimmed = message?.trim();
    if (!trimmed || trimmed.length < 2) {
      throw new APIError('Mensaje inválido', 400);
    }
    const updated = await staffReplyToChat(req.payload, chatId, trimmed);
    return { message: updated };
  },
  'support-staff-create': async (args) => {
    const { req } = args;
    const email = args.email as string;
    requireStaffReq(req);
    if (!email?.trim()) {
      throw new APIError('Correo inválido', 400);
    }
    return staffCreateChatForClient(req.payload, email);
  },
  'support-staff-delete-message': async (args) => {
    const { req } = args;
    const chatId = args.chatId as string | number;
    const key = args.key as string;
    requireStaffReq(req);
    if (!key?.trim()) {
      throw new APIError('Mensaje no válido', 400);
    }
    const updated = await staffDeleteChatMessages(req.payload, chatId, [key], 'everyone');
    return { message: updated };
  },
  'support-staff-delete-chat': async (args) => {
    const { req } = args;
    const chatId = args.chatId as string | number;
    requireStaffReq(req);
    await req.payload.delete({
      collection: 'support-messages',
      id: chatId,
      overrideAccess: true,
    });
    return { success: true };
  },
};
