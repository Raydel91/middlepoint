'use client'

import { Fragment, type ReactNode } from 'react'

/**
 * Payload registra este provider aunque `clientUploads` sea false.
 * Importar `@payloadcms/storage-vercel-blob/client` rompe el build de webpack
 * (pino / worker_threads). Con clientUploads desactivado solo hace falta
 * renderizar children; las subidas van por el adaptador de servidor.
 */
export function VercelBlobClientUploadHandler({
  children,
}: {
  children?: ReactNode
  collectionSlug?: string
  enabled?: boolean
  extra?: unknown
  prefix?: string
  serverHandlerPath?: string
}) {
  return <Fragment>{children}</Fragment>
}
