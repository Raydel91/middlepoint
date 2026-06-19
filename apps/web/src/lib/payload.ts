import { getPayload } from 'payload';
import config from '@/payload.config';
import { createServices } from '@/services';

let cachedPayload: Awaited<ReturnType<typeof getPayload>> | null = null;
let payloadInitPromise: Promise<Awaited<ReturnType<typeof getPayload>>> | null = null;

export async function getPayloadClient() {
  if (cachedPayload) return cachedPayload;

  if (!payloadInitPromise) {
    payloadInitPromise = getPayload({ config }).then((payload) => {
      cachedPayload = payload;
      return payload;
    });
  }

  return payloadInitPromise;
}

export async function getServices() {
  const payload = await getPayloadClient();
  return createServices(payload);
}
