# Vanilla — E-commerce

Direct-to-consumer store for Vanilla. Built to the PRD (Nov 11, 2026).

## Stack

| Layer    | Tech                                                   |
|----------|--------------------------------------------------------|
| Frontend | Next.js 14 (App Router) — `apps/web`                   |
| Backend  | NestJS 10 — `apps/api`                                 |
| Database | MongoDB (Mongoose)                                     |
| Images   | Cloudinary (URLs stored on product docs; seed uses SVGs) |
| Payments | Safepay (stub) + COD                                   |
| Shared   | `packages/shared` (types + `formatPKR`)                |

The frontend never talks to MongoDB directly — it calls NestJS over HTTPS. Prices, stock and totals are decided by the backend only.

## Monorepo layout

```
vanilla/
├── apps/
│   ├── api/   NestJS: products, cart, orders, payments, discounts, admin, mail, settings, checkout
│   └── web/   Next.js: storefront + /admin route group
└── packages/
    └── shared/   Types shared between api and web
```

## Quick start

```bash
# 1. Install everything
npm install

# 2. Configure
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Start a local MongoDB (or point MONGODB_URI at Atlas)
docker run -d -p 27017:27017 --name vanilla-mongo mongo:7

# 4. Seed products (4 × 32 variants), admin, settings, sample discount
npm run seed

# 5. Dev — concurrent API + web
npm run dev
# API    → http://localhost:4000
# Web    → http://localhost:3000
# Admin  → http://localhost:3000/admin  (admin@vanilla.test / changeme)
```

## Tests

Pure-logic tests you can run with no database:

```bash
npm test
```

Covers the two highest-risk areas:
- **Pricing math** — integer paisa throughout, percentage-floor rounding, fixed-cap, free-shipping threshold, zero/negative defences
- **Webhook signature verification** — HMAC-SHA256 timing-safe comparison, tamper and short-sig rejection

## Architectural rules from the PRD — where they live

1. **Money as integers (paisa)** — every price / amount / total in `packages/shared`, `apps/api`, UI. No floats anywhere.
2. **Server calculates totals** — `apps/api/src/cart/pricing.ts` + `cart.service.ts`. Checkout DTO accepts variant IDs + quantities only; `ValidationPipe({ forbidNonWhitelisted: true })` rejects any client-sent price field.
3. **Order snapshots** — `apps/api/src/checkout/checkout.controller.ts` copies `productName`, `unitPrice`, `imageUrl`, size, colour into the order. Never references the live product.
4. **Stock on variant** — `product.variants[].stock` and `.sku`. 4 products × 32 variants = 32 rows in all.
5. **Stock decrements on `confirmed`** — `OrdersService.confirmAndDecrementStock` uses an atomic `$inc` with a `stock >= qty` filter. Decrements happen on gateway webhook (prepaid) or on admin confirmation (COD) — never on add-to-cart.
6. **Webhook is truth** — `PaymentsController.webhook` verifies HMAC; the browser success URL is never trusted. The dev `/mock` endpoint posts a real signed webhook server-to-server.
7. **Sold-out = "Sold out"** — `ProductBuy` disables the size button, and the primary CTA renders as "Sold out" text (not just disabled).
8. **Cart = localStorage + server cart doc** — `apps/web/src/lib/cart-store.tsx` holds the id in `localStorage`; the server cart has a 30-day TTL index.
9. **Mobile-first** — `globals.css` is built for 390 px and widens up.
10. **Server-rendered PDP** — `/product/[slug]` is a server component with `Product` + `Offer` JSON-LD, `sitemap.ts`, `robots.ts`, OG tags.

## Endpoints (all validated by `class-validator` DTOs)

```
GET    /products                      List published products
GET    /products/:slug                One product with variants
POST   /cart                          Create a cart
PATCH  /cart/:id                      Add / change quantity / remove
POST   /cart/:id/discount             Apply a code
POST   /checkout/session              Validate stock, price, start gateway session
POST   /webhooks/payment              Gateway webhook (signed)
GET    /webhooks/payment/mock         Dev-only redirect that simulates a signed webhook
GET    /orders/:number?email=         Guest order lookup (email must match)
POST   /admin/auth/login              Admin login (JWT access + httpOnly refresh cookie)
*      /admin/products                CRUD, incl. stock + publish toggle
*      /admin/orders                  List, status transitions, tracking, packing slip
*      /admin/discounts               CRUD
*      /admin/settings                Shipping, free-ship threshold, COD cap, store email
```

## Admin UI

Lives at `/admin`, same Next.js app, sits behind JWT. Screens: Orders (list, open, status transitions, tracking, print), Products (price, publish, per-variant stock), Discounts (create, expire, usage limits), Settings.

## Out of v1 (not built, by design)

Reviews, wishlist, multi-currency, in-app returns/refunds, subscriptions, bundles, gift cards, blog/lookbook CMS, native app.

## What is stubbed vs production-ready

| Area                 | State                                                                                   |
|----------------------|------------------------------------------------------------------------------------------|
| Mail                 | `MailService` logs to console. Swap in Postmark/SES SMTP before launch.                 |
| Safepay              | Session creation stubbed; webhook signature + flow are real. Wire real REST calls.      |
| Cloudinary uploads   | Admin stores image URLs directly. Add a signed-upload endpoint before admin can upload. |
| COD OTP              | Field + flag on the order model; OTP flow (send + verify) not yet wired.                |
| Analytics            | GA4 / Meta Pixel env slots present; add a `<Script>` tag + event helpers.               |
| Rate limiting        | `ThrottlerModule` on; tightened on `/admin/auth/login` and `/checkout/session`.         |

## Production checklist (from PRD)

- Separate dev + prod Atlas databases
- Store all secrets as env vars
- Vercel for web, Railway/Render for API, Cloudinary free tier for images
- Daily Atlas backup, 7-day retention
- Rate-limit `/admin/auth/login` and `/checkout/session` (done)
- Helmet headers + CORS locked to the storefront domain (done)
- Privacy, terms, shipping/returns pages live before gateway review (done)

Attribution for commits & PRs follows the Claude Code conventions configured in this session.
