# Vanilla — Deployment guide

## What runs where

- **frontend/** — Next.js 14 (App Router). Static + SSR. Needs Node ≥ 18.
- **backend/** — NestJS 10 + Mongoose. Connects to MongoDB (Atlas or self-hosted).
- **MongoDB** — any Atlas cluster or managed Mongo instance.

The frontend proxies `/api/*` to the backend via Next's `rewrites`, so the browser never hits the backend directly — only the frontend's server does. That keeps CORS simple and hides your API host.

## Required environment variables

### backend (`backend/.env` or platform env)

| Key | Required | Notes |
|---|---|---|
| `NODE_ENV` | yes | set to `production` |
| `PORT` | yes | port to listen on (most PaaS inject this) |
| `MONGODB_URI` | yes | full connection string (SRV URIs supported) |
| `JWT_SECRET` | yes | ≥ 24 chars. Generate: `openssl rand -hex 32` |
| `STOREFRONT_ORIGIN` | yes | comma-separated allowed origins, e.g. `https://vanilla.pk,https://www.vanilla.pk` — **no trailing slash** |
| `TRUST_PROXY` | optional | number of proxies in front of the API (default `1`) |
| `JWT_EXPIRES_IN` | optional | default `15m` |
| `JWT_REFRESH_EXPIRES_IN` | optional | default `7d` |
| `MAIL_FROM` | optional | from-address on order emails |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | first run only | used by `npm run seed` to create the first admin — change password after login |

The app **fails fast at startup** if any required var is missing or if `JWT_SECRET` is shorter than 24 chars. It will not boot with a dev secret.

### frontend (`frontend/.env` or platform env)

| Key | Required | Notes |
|---|---|---|
| `API_URL` | yes | full URL of the backend, e.g. `https://api.vanilla.pk` (no trailing slash) |
| `NEXT_PUBLIC_SITE_URL` | yes | the public URL of the storefront, used by sitemap/robots |

## First-time deploy

1. **Provision Mongo** (Atlas free tier is fine for launch). Whitelist your backend's IP, or `0.0.0.0/0` if the host rotates IPs.
2. **Deploy the backend.** Build: `npm --workspace backend run build`. Start: `npm --workspace backend run start`. Node ≥ 18.
3. **Seed the first admin + settings:** on the backend host, once only, `npm --workspace backend run seed`. Note: this does **not** insert products.
4. **Deploy the frontend.** Build: `npm --workspace frontend run build`. Start: `npm --workspace frontend start`.
5. **Point your domain** at the frontend. Point `api.yourdomain.com` (or similar) at the backend.
6. **Set `STOREFRONT_ORIGIN`** on the backend to your storefront URL(s).
7. **Log into `/admin/login`** with the seeded credentials, change the password, add real products via the admin UI (or `npm --workspace backend run add:product` after editing [backend/src/add-product.ts](backend/src/add-product.ts)).

## Checklist before going live

- [ ] `JWT_SECRET` is ≥ 32 random hex chars, unique per environment
- [ ] `STOREFRONT_ORIGIN` lists the exact public URL(s), no trailing slash
- [ ] Mongo connection string points at a production cluster, not dev
- [ ] Admin password changed from the seed default
- [ ] HTTPS terminated in front of both services (platform usually does this)
- [ ] `TRUST_PROXY` matches your proxy chain so rate-limits bind to the real client IP
- [ ] Backups configured on the Mongo cluster

## Operational notes

- **Payments:** Cash-on-delivery only. The Safepay integration and `/webhooks/payment` endpoint were removed. If you ever add card payments back, they must be verified server-to-server via webhook — never trust the browser success URL.
- **Stock:** COD orders land as `pending_confirmation` and do **not** decrement stock until an admin confirms the order. This is deliberate — reduces fake orders tying up inventory.
- **Rate limits:** 120 req/min default, 10 req/min on checkout and admin auth. Scoped per client IP.
- **Shutdown:** backend uses `app.enableShutdownHooks()` so SIGTERM finishes in-flight requests and closes the Mongo pool cleanly.

## Common deploy platforms

- **Backend:** Railway, Render, Fly.io, or any Docker host. The `start` script is `node dist/main.js`; make sure your platform runs `npm run build` first.
- **Frontend:** Vercel is simplest (set `API_URL` + `NEXT_PUBLIC_SITE_URL` in the project env). Or self-host `next start`.

## Staying up & preventive monitoring

**Run the backend under a process manager** so it restarts automatically. On an uncaught error the process logs, pushes an ntfy crash alert, and exits — a supervisor must bring it back:
- Railway/Render/Fly/Vercel restart crashed processes automatically — nothing to do.
- Bare VM: use `pm2 start dist/main.js --name vanilla-api` or a systemd unit with `Restart=always`.

**Resilience built in:**
- Global exception filter — a bad request returns a clean 500, never a stack leak or a crash.
- `unhandledRejection` is logged (process keeps serving); `uncaughtException` logs + alerts + exits for a clean restart.
- `GET /health` — a public liveness probe returning `{ status, db, uptimeSeconds }`. Point an uptime monitor (UptimeRobot, Better Uptime, etc.) at it to be paged on downtime.

**Preventive alerts (ntfy):** a sweep runs ~20s after boot and then hourly, and pushes a heads-up *before* a problem bites:
- **Low stock** — any variant at/below `LOW_STOCK_THRESHOLD` (default 3) → "running low, reorder". Predicts a stockout.
- **Sold out** — a product fully out of stock → sales are being lost now.
- **Order backlog** — COD orders unconfirmed longer than `ORDER_BACKLOG_HOURS` (default 24) → confirm them.
- **Database unreachable** → predicts storefront/order failures.

Each distinct warning is de-duplicated for 12h so it never nags. Alerts go to `NTFY_ALERT_TOPIC` (falls back to `NTFY_TOPIC`). Admins can force a sweep any time with `POST /health/run` (bearer token). Consider a **separate, private alert topic** so ops noise is apart from order notifications.
