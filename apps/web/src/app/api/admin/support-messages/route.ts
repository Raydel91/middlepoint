import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireStaffAdmin } from '@/lib/admin-auth';
import { handleApiError, AppError } from '@/lib/logger';
import { staffCreateChatForClient } from '@/lib/support-staff-actions';
import {
  buildWhereForSupportStatusTab,
  type SupportStatusFilter,
} from '@/lib/support-status-workflow';

const createSchema = z.object({
  email: z.string().email(),
});

export async function GET(request: Request) {
  try {
    const { payload } = await requireStaffAdmin(request);
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'all') as SupportStatusFilter;
    const where = buildWhereForSupportStatusTab(status);

    const result = await payload.find({
      collection: 'support-messages',
      where,
      sort: '-updatedAt',
      limit: 200,
      depth: 2,
      overrideAccess: true,
    });

    return NextResponse.json({ docs: result.docs });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { payload } = await requireStaffAdmin(request);
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const result = await staffCreateChatForClient(payload, parsed.data.email);
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
