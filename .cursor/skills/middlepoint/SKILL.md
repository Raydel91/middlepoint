---
name: middlepoint
description: >-
  MiddlePoint e-commerce wellness platform conventions. Use when working on
  MiddlePoint codebase: Payload CMS collections, i18n fields, RBAC, services,
  brand identity, or Dominican Republic locale (DOP/USD, America/Santo_Domingo).
---

# MiddlePoint Platform Skill

## Brand Identity

Read `brand.json` at project root for colors, typography, and UI tokens:
- Primary: `#1F7A63`, Secondary: `#4A2E2A`, Background: `#F5E9DC`
- Fonts: Inter (primary), Poppins (secondary)
- Use Tailwind classes: `btn-primary`, `btn-secondary`, `card`, `input-field`

## i18n (Mandatory)

All user-facing text and DB text fields use bilingual format:

```json
{ "es": "...", "en": "..." }
```

- Default locale: `es`, fallback: `es` → `en`
- Use `getI18nValue(field, locale)` from `@middlepoint/shared`
- UI strings in `apps/web/messages/{es,en}.json` via next-intl
- SEO: alternate language links in metadata

## RBAC Roles

| Role | Access |
|------|--------|
| super_admin | Full CRUD all resources |
| operador | Read/update products, orders, deliveries |
| marketing | CRUD products, categories, analytics |
| cliente | Create/read own orders |
| delivery | Read/update assigned orders/deliveries |

Check permissions with `canAccess(role, resource, action)` from `@middlepoint/shared`.

## Services Architecture

Located in `apps/web/src/services/index.ts`:
- `ProductService` — catalog, view_count, related products
- `RecommendationService` — score = (purchases × 3) + (views × 1), fallback: sales_count
- `OrderService` — checkout flow, status updates
- `DeliveryService` — manual assignment, real-time status
- `AnalyticsService` — KPIs (sales, LTV, CAC, conversion)

Access via `getServices()` from `@/lib/payload`.

## Currency & Timezone

- Primary: DOP, Secondary: USD (rate from Settings global)
- Timezone: `America/Santo_Domingo`
- Use `formatCurrency(amount, currency, locale)` for display

## API Routes

| Route | Purpose |
|-------|---------|
| POST `/api/checkout` | Order creation (CSRF + rate limit) |
| POST `/api/tracking` | Analytics events |
| GET `/api/analytics` | KPIs (staff only) |
| POST `/api/deliveries` | Assign delivery |
| GET `/api/recommendations` | Personalized products |

## Auth

- Auth.js (next-auth) with JWT + refresh tokens
- bcrypt password hashing
- CSRF tokens required for checkout
- Rate limits: login (5/15min), checkout (10/min)

## Seed & Dev

```bash
npm run docker:up    # PostgreSQL
cp .env.example .env
npm install
npm run dev
npm run seed
```

Default accounts: `admin@middlepoint.do`, `delivery@middlepoint.do`, `cliente@demo.do`

## Testing

```bash
npm test  # runs vitest in packages/shared and apps/web
```
