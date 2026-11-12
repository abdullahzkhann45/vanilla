// Centralised env access. Fails fast at startup if a required var is missing,
// so the app never boots with a dev-secret fallback in production.

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function opt(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const env = {
  get NODE_ENV() { return opt('NODE_ENV', 'development'); },
  get PORT() { return Number(opt('PORT', '4000')); },
  get MONGODB_URI() { return req('MONGODB_URI'); },
  get JWT_SECRET() {
    const s = req('JWT_SECRET');
    if (s.length < 24) {
      throw new Error('JWT_SECRET must be at least 24 characters');
    }
    return s;
  },
  get JWT_EXPIRES_IN() { return opt('JWT_EXPIRES_IN', '15m'); },
  get JWT_REFRESH_EXPIRES_IN() { return opt('JWT_REFRESH_EXPIRES_IN', '7d'); },
  get STOREFRONT_ORIGIN() {
    // Comma-separated list, e.g. "https://vanilla.pk,https://www.vanilla.pk"
    const raw = process.env.STOREFRONT_ORIGIN;
    if (!raw) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('STOREFRONT_ORIGIN is required in production');
      }
      return ['http://localhost:3000'];
    }
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  },
  get TRUST_PROXY() { return opt('TRUST_PROXY', '1'); },
  get NTFY_TOPIC() { return process.env.NTFY_TOPIC || ''; },
  // Ops/health alerts. Falls back to NTFY_TOPIC when unset.
  get NTFY_ALERT_TOPIC() { return process.env.NTFY_ALERT_TOPIC || process.env.NTFY_TOPIC || ''; },
  // A variant at or below this many units triggers a "running low" warning.
  get LOW_STOCK_THRESHOLD() { return Number(opt('LOW_STOCK_THRESHOLD', '3')); },
  // Orders left unconfirmed longer than this many hours trigger a backlog warning.
  get ORDER_BACKLOG_HOURS() { return Number(opt('ORDER_BACKLOG_HOURS', '24')); },
};

export function validateEnvOrDie() {
  // Touch the required ones so missing vars throw at startup, not at first request.
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  env.MONGODB_URI; env.JWT_SECRET; env.STOREFRONT_ORIGIN;
}
