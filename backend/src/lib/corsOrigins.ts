/**
 * Allowed browser origins for CORS / Socket.IO.
 * FRONTEND_URL and ALLOWED_ORIGINS accept comma-separated values.
 * Vercel preview/production URLs (*.vercel.app) are allowed unless CORS_ALLOW_VERCEL=false.
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;

  const configured = (process.env.FRONTEND_URL || process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (configured.includes(origin) || configured.includes('*')) return true;

  if (process.env.CORS_ALLOW_VERCEL !== 'false' && /^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) {
    return true;
  }

  return false;
}

export function corsOriginCallback(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean | string) => void
): void {
  if (isOriginAllowed(origin)) {
    callback(null, origin ?? true);
  } else {
    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(null, false);
  }
}
