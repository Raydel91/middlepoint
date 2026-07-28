import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getPayloadClient } from '@/lib/payload';
import { createAccessToken, createRefreshToken, hashToken } from '@/lib/auth/tokens';
import { loginSchema } from '@/lib/validations';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import type { UserRole } from '@middlepoint/shared';

declare module 'next-auth' {
  interface User {
    id: string;
    role: UserRole;
    nombre: string;
    apellido: string;
  }
  interface Session {
    user: User & { accessToken?: string };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const rl = rateLimit(`login:${email}`, RATE_LIMITS.login.limit, RATE_LIMITS.login.windowMs);
        if (!rl.success) return null;

        const payload = await getPayloadClient();

        let user;
        try {
          const loginResult = await payload.login({
            collection: 'users',
            data: { email: email.toLowerCase().trim(), password },
            overrideAccess: true,
          });
          user = loginResult.user;
        } catch {
          return null;
        }

        if (!user) return null;

        const accessToken = await createAccessToken({
          sub: String(user.id),
          role: user.role,
          email: user.email,
        });
        const refreshToken = await createRefreshToken({ sub: String(user.id) });
        const refreshHash = await hashToken(refreshToken);

        await payload.update({
          collection: 'users',
          id: user.id,
          data: {
            refreshTokenHash: refreshHash,
            refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        });

        return {
          id: String(user.id),
          email: user.email,
          role: user.role as UserRole,
          nombre: user.nombre,
          apellido: user.apellido,
          accessToken,
        };
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 2 * 60 * 60 },
  pages: {
    signIn: '/es/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.nombre = user.nombre;
        token.apellido = user.apellido;
        token.email = user.email;
        token.accessToken = (user as { accessToken?: string }).accessToken;
      }
      if (trigger === 'update' && session) {
        const data = session as {
          nombre?: string;
          apellido?: string;
          email?: string;
        };
        if (data.nombre) token.nombre = data.nombre;
        if (data.apellido) token.apellido = data.apellido;
        if (data.email) token.email = data.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.nombre = token.nombre as string;
        session.user.apellido = token.apellido as string;
        if (token.email) session.user.email = token.email as string;
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
});
