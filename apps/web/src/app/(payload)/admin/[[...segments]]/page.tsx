import type { Metadata } from 'next';
import config from '@/payload.config';
import { RootPage, generatePageMetadata } from '@payloadcms/next/views';
import { importMap } from '../importMap.js';

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
};

export const dynamic = 'force-dynamic';

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams });

export default async function Page({ params, searchParams }: Args) {
  try {
    return await RootPage({ config, params, searchParams, importMap });
  } catch (error) {
    // next/navigation redirect() y notFound() deben propagarse
    const digest = typeof error === 'object' && error && 'digest' in error
      ? String((error as { digest?: string }).digest)
      : '';
    if (digest.startsWith('NEXT_REDIRECT') || digest.startsWith('NEXT_NOT_FOUND')) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('[admin RootPage]', message, stack);
    return (
      <div
        style={{
          minHeight: '100vh',
          padding: 24,
          fontFamily: 'system-ui, sans-serif',
          background: '#F5E9DC',
          color: '#4A2E2A',
        }}
      >
        <h1 style={{ fontSize: 20, marginBottom: 12 }}>Error al cargar el admin</h1>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            background: '#fff',
            padding: 16,
            borderRadius: 8,
            border: '1px solid #e0d4c4',
          }}
        >
          {message}
        </pre>
      </div>
    );
  }
}
