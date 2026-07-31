import { NextResponse } from 'next/server'
import { blobStorageDiagnostics } from '@/lib/vercel-blob-storage'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Diagnóstico sin secretos: ¿llega el token Blob en runtime? */
export async function GET() {
  return NextResponse.json(blobStorageDiagnostics())
}
