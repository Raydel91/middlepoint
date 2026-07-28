import { NextResponse } from 'next/server';
import { DELIVERY_ASSIGNABLE_ROLES, canAccessAdminNav } from '@middlepoint/shared';
import { handleApiError, AppError } from '@/lib/logger';
import { requireStaffAdmin } from '@/lib/admin-auth';

export async function GET() {
  try {
    const { payload, user } = await requireStaffAdmin();
    if (!canAccessAdminNav(user.role, 'orders')) {
      throw new AppError('No autorizado', 403, 'FORBIDDEN');
    }

    const result = await payload.find({
      collection: 'users',
      where: {
        role: {
          in: [...DELIVERY_ASSIGNABLE_ROLES],
        },
      },
      limit: 100,
      depth: 0,
      sort: 'nombre',
      overrideAccess: true,
    });

    const users = result.docs.map((doc) => {
      const nombre = typeof doc.nombre === 'string' ? doc.nombre : '';
      const apellido = typeof doc.apellido === 'string' ? doc.apellido : '';
      const nombreCompleto =
        (typeof doc.nombreCompleto === 'string' && doc.nombreCompleto.trim()) ||
        [nombre, apellido].filter(Boolean).join(' ').trim() ||
        (typeof doc.email === 'string' ? doc.email : `Usuario #${doc.id}`);

      return {
        id: doc.id,
        nombreCompleto,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
