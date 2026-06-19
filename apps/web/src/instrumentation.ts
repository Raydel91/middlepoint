export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getPayloadClient } = await import('@/lib/payload');
    getPayloadClient().catch(() => {
      /* DB may not be ready yet on cold start */
    });
  }
}
