import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';

export async function GET() {
  try {
    const payload = await getPayloadClient();
    const settings = await payload.findGlobal({ slug: 'settings' });
    return NextResponse.json({
      exchange_rate_usd: settings.exchange_rate_usd,
    });
  } catch {
    return NextResponse.json({ exchange_rate_usd: 58.5 });
  }
}
