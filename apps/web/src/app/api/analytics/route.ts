import { NextResponse } from 'next/server';
import { getServices } from '@/lib/payload';
import { auth } from '@/lib/auth/config';
import { handleApiError, AppError } from '@/lib/logger';
import { isStaffRole } from '@middlepoint/shared';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !isStaffRole(session.user.role)) {
      throw new AppError('No autorizado', 403, 'FORBIDDEN');
    }

    const services = await getServices();
    const kpis = await services.analytics.getKPIs();

    return NextResponse.json(kpis);
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
