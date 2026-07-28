import { cookies, headers } from 'next/headers';
import { isStaffRole, type UserRole } from '@middlepoint/shared';
import { auth } from '@/lib/auth/config';
import { getPayloadClient } from '@/lib/payload';
import { AppError } from '@/lib/logger';

type StaffUser = {
  id: string | number;
  role: UserRole;
  email?: string;
};

async function resolveRequestHeaders(request?: Request): Promise<Headers> {
  if (request?.headers) return request.headers;
  return new Headers(await headers());
}

async function authenticatePayloadStaff(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  requestHeaders: Headers,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get('payload-token')?.value;

  const authHeaders = new Headers(requestHeaders);
  if (token && !authHeaders.get('Authorization')) {
    authHeaders.set('Authorization', `JWT ${token}`);
  }

  const payloadAuth = await payload.auth({ headers: authHeaders });
  if (payloadAuth.user && isStaffRole(payloadAuth.user.role as UserRole)) {
    return payloadAuth.user as StaffUser;
  }

  return null;
}

export async function requireStaffAdmin(request?: Request) {
  const payload = await getPayloadClient();
  const requestHeaders = await resolveRequestHeaders(request);

  const payloadUser = await authenticatePayloadStaff(payload, requestHeaders);
  if (payloadUser) {
    return { payload, user: payloadUser };
  }

  const session = await auth();
  if (session?.user && isStaffRole(session.user.role)) {
    return { payload, user: session.user as StaffUser };
  }

  throw new AppError('No autorizado', 403, 'FORBIDDEN');
}
