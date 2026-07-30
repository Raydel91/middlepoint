import type { ServerFunctionClient } from 'payload';
import { RootLayout, metadata, handleServerFunctions } from '@payloadcms/next/layouts';
import config from '@/payload.config';
import { importMap } from './admin/importMap.js';
import { supportInboxServerFunctions } from '@/lib/support-inbox-server-functions';
import '@payloadcms/next/css';
import './custom.scss';

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function (args) {
  'use server';
  return handleServerFunctions({
    ...args,
    config,
    importMap,
    serverFunctions: supportInboxServerFunctions,
  });
};

/**
 * Solo {children} dentro de RootLayout.
 * Un hermano client (PasswordRevealBoot) hacía que en Vercel el slot de página
 * llegara como null → admin en blanco (fondo cream sin login).
 */
export default function Layout({ children }: Args) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}

export { metadata };
