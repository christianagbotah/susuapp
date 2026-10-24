# iSusuPro Ghana — System Architecture

> Enterprise microfinance & susu savings platform for Ghana.
> Cross-platform: **Web (PWA) · Windows · macOS · Android · iOS** — one NestJS core, many clients.

---

## 1. High-Level Architecture

```
┌─────────────────────────── CLIENTS (shared TypeScript SDK) ───────────────────────────┐
│                                                                                        │
│  Web Portal          Windows / macOS        Android / iOS          Embedded Partner   │
│  Next.js 16 (PWA)    Tauri shell            Expo (React Native)    REST consumers     │
│  ─────────────       ─────────────          ─────────────                             │
│  Customer            wraps the same         native UI, shares      fintech partners,  │
│  Agent               Next.js build as       the same NestJS API    USSD gateways      │
│  Treasurer           lightweight binaries   + offline-first sync                      │
│  Admin               (~5–10 MB, no          (TanStack Query +                        │
│                      Chromium bundling)      AsyncStorage)                            │
└──────────────────────────────┬─────────────────────────────────────────────────────────┘
                               │ HTTPS · REST (OpenAPI) · WSS (Socket.IO)
┌──────────────────────────────▼─────────────────────────────────────────────────────────┐
│                                   API GATEWAY (Caddy)                                  │
│   TLS termination · single origin · port routing (?XTransformPort= in sandbox)          │
└──────────────────────────────┬─────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼─────────────────────────────────────────────────────────┐
│                            NESTJS BACKEND  (mini-services/isusu-api)                    │
│                                                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────────────┐  │
│  │ AuthModule │ │WalletsMod. │ │TransactMod.│ │ SusuModule │ │   LoansModule        │  │
│  │ JWT+bcrypt │ │ balances   │ │ transfer   │ │ groups +   │ │ apply/review/        │  │
│  │ /auth/*    │ │ /wallets   │ │ /transf... │ │ contrib.   │ │ disburse  /loans/*   │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └──────────────────────┘  │
│  ┌───────────────┐ ┌──────────────────┐ ┌──────────────────────────────────────────┐   │
│  │ UsersModule   │ │ NotificationsMod.│ │  HealthModule (liveness + stats)         │   │
│  │ admin list    │ │ read/unread      │ │                                          │   │
│  └───────────────┘ └──────────────────┘ └──────────────────────────────────────────┘   │
│                                                                                         │
│  Cross-cutting: JwtAuthGuard (custom, no passport) · RolesGuard (RBAC) ·                │
│  ValidationPipe (class-validator DTOs) · HttpExceptionFilter · Swagger/OpenAPI          │
│                                                                                         │
│  Data layer: DataStoreService (in-memory seed today → swap to Prisma/PostgreSQL         │
│  repositories tomorrow without touching module services)                                │
└──────────────────────────────┬──────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────────────────────────┐
│                        AI LAYER (Next.js route handlers + z-ai SDK)                      │
│   /api/ai/chat              — Susu AI assistant (portal-aware system prompts)            │
│   /api/ai/insights          — personalized spending analysis → structured JSON           │
│   /api/ai/loan-assessment   — credit-risk engine → riskLevel/score/factors               │
│   In production these move behind the NestJS AiModule — client contracts unchanged.      │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Layout (target)

```
isusupro/
├── apps/
│   ├── web/                 # Next.js 16 — web portal + admin (this repo today)
│   ├── api/                 # NestJS backend (mini-services/isusu-api today)
│   ├── mobile/              # Expo app (Android/iOS) — shares packages/sdk
│   └── desktop/             # Tauri shell (Windows/macOS) wrapping apps/web
├── packages/
│   ├── sdk/                 # Generated OpenAPI client — ONE client for all platforms
│   ├── types/               # Shared domain types (mirror of isusu-api/src/data/types.ts)
│   └── ui/                  # Shared design tokens (Ghana palette, radii, spacing)
└── infra/
    ├── caddy/               # Gateway config
    └── github/              # CI: lint → test → build per app
```

**Why this split**

| Concern | Decision | Rationale |
|---|---|---|
| Backend | NestJS (Node/TS) | Same language across the stack; first-class DI, guards, interceptors; Swagger/OpenAPI generated from decorators feeds `packages/sdk` |
| Web | Next.js 16 (Turbopack) | SSR for trust/SEO on public pages, PWA install for Ghana's mobile-first market |
| Desktop | **Tauri** (not Electron) | ~5–10 MB binaries for Windows/macOS, Rust core, no Chromium duplication; loads the same web build |
| Mobile | **Expo / React Native** | OTA updates via EAS, native MoMo SDK bridges, offline-first with WatermelonDB sync to the same API |
| Contracts | OpenAPI → `packages/sdk` | Clients regenerate from `/api/v1/docs-json`; no hand-written fetch layers |

---

## 3. Backend Design (current implementation)

**Location:** `mini-services/isusu-api/` — port `4000`, global prefix `api/v1`, Swagger UI at `/api/v1/docs`.

### Modules & endpoints

| Module | Endpoint | Auth | Description |
|---|---|---|---|
| Health | `GET /api/v1/health` | – | Liveness + seed stats |
| Auth | `POST /api/v1/auth/login` | – | Phone + PIN (bcrypt) → JWT (12 h) |
| Auth | `GET /api/v1/auth/me` | JWT | Current profile |
| Users | `GET /api/v1/users` | JWT + admin | All users |
| Wallets | `GET /api/v1/wallets` | JWT | Caller's wallets |
| Transactions | `GET /api/v1/transactions?type&limit` | JWT | History |
| Transactions | `POST /api/v1/transactions/transfer` | JWT | Debit + credit + auto account-number resolution |
| Susu | `GET /api/v1/susu/groups` · `/contributions` | JWT | Groups & my contributions |
| Susu | `POST /api/v1/susu/contribute` | JWT | Contribution + wallet debit + ledger entry |
| Loans | `GET /api/v1/loans` | JWT | Customers see own; admin sees all |
| Loans | `POST /api/v1/loans/apply` | JWT | Auto-priced by product type |
| Loans | `POST /api/v1/loans/:id/review` | JWT + admin | Approve (activates schedule) / reject (reason) |
| Notifications | `GET` · `POST /:id/read` · `POST /read-all` | JWT | Per-user notification inbox |

### Cross-cutting architecture

- **`DataModule`** — `@Global()` provider; in-memory seeded store implementing the repository surface (`debit`, `credit`, `nextId`, `generateReference`, `sanitizeUser`). Production swap: Prisma repositories implementing the same interface.
- **`GlobalJwtModule`** — `@Global()` JwtService so `JwtAuthGuard` (custom `CanActivate`, zero passport overhead) works in every module.
- **`RolesGuard`** — metadata-driven RBAC (`@Roles('admin')`) composing with the auth guard.
- **DTO validation** — `class-validator` + global `ValidationPipe` (whitelist + transform).
- **Error shape** — uniform `{ statusCode, timestamp, path, message }` via `HttpExceptionFilter`.
- **Demo credentials** — any seeded phone (`0241234567`, `0278899001`, …) + PIN `123456`.

### Process supervision in this sandbox

| Environment | How the API runs |
|---|---|
| Sandbox boot | `.zscripts/dev.sh → start_mini_services()` auto-starts every `mini-services/*` package with a `dev` script (logs: `.zscripts/mini-service-isusu-api.log`) |
| Sandbox dev (now) | `GET /api/backend` (Next.js route) spawns/waits for the API as a detached child of the persistent dev server — self-healing; login calls it automatically on first network failure |
| Local machine | `cd mini-services/isusu-api && bun install && bun run dev` |
| Production | `mini-services-build.sh` bundles `src/index.ts` → `mini-service-isusu-api.js`, executed by `mini-services-start.sh` under bun |

---

## 4. AI Layer

| Feature | Route | Consumed by | Output contract |
|---|---|---|---|
| **Susu AI assistant** | `POST /api/ai/chat` | Floating chat widget (all 4 portals, portal-aware greetings & suggestion chips) | `{ reply: string }` |
| **AI Financial Insights** | `POST /api/ai/insights` | Customer dashboard card | `{ summary, insights: [{ title, detail, tone: positive\|warning\|risk\|tip }] }` |
| **AI Loan Risk Assessment** | `POST /api/ai/loan-assessment` | Admin → Loans → "AI Check" on pending applications | `{ riskLevel, score, recommendation, factors: [{ factor, impact, note }] }` |

All prompts enforce **strict JSON** responses (parsed with fence-stripping + fail-soft), currency `₵`, and Ghana-specific context (MoMo, susu rounds, market traders). The SDK is server-side only — keys never reach clients.

---

## 5. Frontend Modernization (shipped)

- **Susu AI floating widget** — spring-animated FAB + panel, typing indicator, portal-aware suggestions, bold-aware message rendering, above bottom-nav on mobile (`bottom-20`) and docked on desktop (`lg:bottom-6`).
- **AI Financial Insights card** — gradient identity, skeleton-while-thinking, staggered insight reveal with tone icons.
- **AI loan risk dialog** — risk badge, score bar, factor chips, one-click "Continue to Approval".
- **Real authentication path** — login tries the NestJS API (JWT), self-heals via `/api/backend`, falls back to demo mode with an informative toast; 401 surfaces "Demo PIN: 123456".

## 6. Cross-Platform Client Strategy

### Web (live today)
Next.js 16 + Tailwind 4 + shadcn/ui + Zustand. PWA manifest + theme-color already configured → installable on Android/desktop Chrome.

### Windows & macOS (Tauri)
```
tauri.conf.json → { build: { frontendDist: '../web/out' }, app: { windows: [{ title: 'iSusuPro', width: 1280, height: 800 }] } }
```
- Reuses the web build 1:1 (static export or `devUrl` pointing at the hosted portal).
- Rust sidecar can hold the API base URL + secure token storage (keychain/credential manager).
- Native auto-updater via Tauri's updater plugin.

### Android & iOS (Expo)
- `packages/sdk` (OpenAPI-generated) + TanStack Query for server state.
- Offline-first: queue susu collections locally (agents work in low-connectivity markets), sync when online.
- Expo SecureStore for JWT; push notifications via Expo Notifications (payout reminders, loan due dates).
- Biometric login (Face ID/fingerprint) mapping to the same phone+PIN credentials on first run.

### Shared SDK flow
```
NestJS decorators ──Swagger──▶ /api/v1/docs-json ──openapi-typescript──▶ packages/sdk
                                                                     ▲ web · mobile · desktop
```

## 7. Security Roadmap

1. JWT → short-lived access + refresh rotation; PIN → argon2id; rate-limit login via `@nestjs/throttler`.
2. Prisma + PostgreSQL with row-level audit ledger for every balance mutation (double-entry).
3. Penalties/limits engine (BoG e-money directive): daily caps by KYC level, transaction monitoring hooks.
4. Webhooks + idempotency keys for Paystack/Hubtel MoMo settlement integration.
5. Observability: pino structured logs, OpenTelemetry traces, `/api/v1/health` readiness probes.
