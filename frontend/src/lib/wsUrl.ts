/** WebSocket server URL (must be the public backend URL; cannot be proxied like REST). */
export function getWebSocketUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    console.warn(
      '[WS] NEXT_PUBLIC_WS_URL is not set. Real-time updates will not work until you set it to your backend URL on Vercel.'
    );
  }

  return 'http://localhost:4000';
}
