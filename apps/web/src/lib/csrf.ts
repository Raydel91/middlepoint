import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const CSRF_COOKIE = 'mp_csrf';
const CSRF_HEADER = 'x-csrf-token';

export async function generateCsrfToken(): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  return token;
}

export async function getCsrfToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE)?.value;
}

export async function validateCsrfToken(token: string): Promise<boolean> {
  const stored = await getCsrfToken();
  return !!stored && stored === token;
}

export { CSRF_COOKIE, CSRF_HEADER };
