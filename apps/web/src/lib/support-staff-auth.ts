import { APIError, type PayloadRequest } from 'payload';
import { canAccessAdminNav, type UserRole } from '@middlepoint/shared';

function extractJwt(headers: Headers): string | null {
  const authorization = headers.get('Authorization');
  if (!authorization) return null;
  const token = authorization.replace(/^JWT\s+/i, '').replace(/^Bearer\s+/i, '').trim();
  return token || null;
}

function getTokenFromCookie(headers: Headers): string | null {
  const cookie = headers.get('cookie');
  if (!cookie) return null;
  const match = cookie.match(/(?:^|;\s*)payload-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function withJwtHeader(headers: Headers): Headers {
  const authHeaders = new Headers(headers);
  const token = extractJwt(authHeaders) || getTokenFromCookie(authHeaders);
  if (token && !authHeaders.get('Authorization')) {
    authHeaders.set('Authorization', `JWT ${token}`);
  }
  return authHeaders;
}

function canAccessSupportInbox(role: UserRole | null | undefined) {
  return canAccessAdminNav(role, 'support-messages');
}

export async function resolveStaffFromRequest(req: PayloadRequest) {
  if (req.user && canAccessSupportInbox(req.user.role as UserRole)) {
    return req.user;
  }

  const authHeaders = withJwtHeader(new Headers(req.headers));
  const { user } = await req.payload.auth({ headers: authHeaders });

  if (user && canAccessSupportInbox(user.role as UserRole)) {
    return user;
  }

  throw new APIError(
    'No autorizado. Cierra sesión en /admin e inicia con una cuenta de staff (ej. admin@middlepoint.do).',
    403,
  );
}
