import path from 'path'
import type { Config } from 'payload'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'
import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'
import { del, head, put } from '@vercel/blob'

/** Acceso que Next no puede inlinear en build (vars Sensitive solo existen en runtime). */
function runtimeEnv(name: string): string | undefined {
  const value = process['env'][name]
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed || undefined
}

function resolveBlobBaseUrl(): string | undefined {
  const token = runtimeEnv('BLOB_READ_WRITE_TOKEN')
  const fromToken = token?.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]
  const storeId = (fromToken || runtimeEnv('BLOB_STORE_ID') || '').toLowerCase()
  if (!storeId) return undefined
  return `https://${storeId}.public.blob.vercel-storage.com`
}

function buildFileUrl(args: {
  baseUrl: string
  collectionPrefix?: string
  docPrefix?: string
  filename: string
}): string {
  const { fileKey } = getFileKey({
    collectionPrefix: args.collectionPrefix ?? '',
    docPrefix: args.docPrefix,
    filename: args.filename,
    useCompositePrefixes: false,
  })
  const dir = path.posix.dirname(fileKey)
  const encodedFilename = encodeURIComponent(path.posix.basename(fileKey))
  const key = dir === '.' ? encodedFilename : path.posix.join(dir, encodedFilename)
  return `${args.baseUrl}/${key}`
}

/**
 * Adaptador Blob que NO pasa `token` a `@vercel/blob`.
 * Así el SDK lee `BLOB_READ_WRITE_TOKEN` en runtime (incluye vars Sensitive de Vercel).
 * El plugin oficial se desactiva si el token falta en el build → mkdir local `media` y 500.
 */
const createRuntimeVercelBlobAdapter: Adapter = ({ prefix = '' }) => ({
  name: 'vercel-blob',
  generateURL: ({ filename, prefix: docPrefix = '' }) => {
    const baseUrl = resolveBlobBaseUrl() || 'https://blob.vercel-storage.com'
    return buildFileUrl({
      baseUrl,
      collectionPrefix: prefix,
      docPrefix,
      filename,
    })
  },
  handleUpload: async ({ data, file }) => {
    const { fileKey } = getFileKey({
      collectionPrefix: prefix,
      docPrefix: data.prefix,
      filename: file.filename,
      useCompositePrefixes: false,
    })

    // Sin `token`: getTokenFromOptionsOrEnv lee process.env en el momento del upload.
    const result = await put(fileKey, file.buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.mimeType,
    })

    const pathname = result.pathname.replace(/^\/+/, '')
    data.filename = decodeURIComponent(path.posix.basename(pathname))
    return data
  },
  handleDelete: async ({ doc, filename }) => {
    if (typeof doc.url === 'string' && doc.url.startsWith('http')) {
      await del(doc.url)
      return
    }
    const baseUrl = resolveBlobBaseUrl()
    if (!baseUrl) return
    await del(
      buildFileUrl({
        baseUrl,
        collectionPrefix: prefix,
        docPrefix: doc.prefix,
        filename,
      }),
    )
  },
  staticHandler: async (req, { headers: incomingHeaders, params: { filename, prefix: prefixQueryParam } }) => {
    const baseUrl = resolveBlobBaseUrl()
    if (!baseUrl) {
      return new Response('Blob storage is not configured', { status: 500 })
    }

    const fileUrl = buildFileUrl({
      baseUrl,
      collectionPrefix: prefix,
      docPrefix: typeof prefixQueryParam === 'string' ? prefixQueryParam : undefined,
      filename,
    })

    try {
      const meta = await head(fileUrl)
      const headers = new Headers(incomingHeaders)
      headers.set('Content-Type', meta.contentType)
      headers.set('Content-Disposition', meta.contentDisposition)
      headers.set('Cache-Control', 'public, max-age=31536000')

      const response = await fetch(fileUrl)
      if (!response.ok || !response.body) {
        return new Response(null, { status: 404 })
      }
      return new Response(response.body, { headers, status: response.status })
    } catch {
      return new Response(null, { status: 404 })
    }
  },
})

export function shouldUseVercelBlobStorage(): boolean {
  // VERCEL=1 siempre existe en Vercel (no es Sensitive) → activamos el adaptador
  // aunque BLOB_READ_WRITE_TOKEN solo exista en runtime.
  return runtimeEnv('VERCEL') === '1' || Boolean(runtimeEnv('BLOB_READ_WRITE_TOKEN'))
}

export function vercelBlobStorageFromEnv(): (config: Config) => Config {
  return cloudStoragePlugin({
    collections: {
      media: {
        adapter: createRuntimeVercelBlobAdapter,
        disableLocalStorage: true,
      },
    },
  })
}
