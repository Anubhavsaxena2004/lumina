# Kumkum Payal (कुंकुम पायल) — Jewellery Accounting & Inventory System

[![Kumkum Payal CI](https://github.com/Anubhavsaxena2004/lumina/actions/workflows/ci.yml/badge.svg)](https://github.com/Anubhavsaxena2004/lumina/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An enterprise-grade, mobile-responsive accounting and inventory management system designed specifically for jewellery trading businesses and artisan manufacturers (featuring Polish and Meena / Enamel job-work tracking).

---

## Monorepo Architecture

```
inventory/
├── apps/
│   ├── api/                   # NestJS 10 REST API + TypeScript
│   └── web/                   # React 18 + Vite + TypeScript + Tailwind
├── docs/                      # Technical specifications, schema & architecture docs
│   ├── architecture.md        # System design and component interactions
│   ├── auth-rbac.md           # Double-layer staff isolation & RLS
│   ├── database.md            # 17-table schema, precision & migration decisions
│   ├── ui.md                  # Responsive design specifications
│   ├── whatsapp-templates.md  # Approved Meta WhatsApp Cloud API templates
│   └── OPTIMIZED_MASTER_PROMPT.md # Complete Roo Code / GSD / Ralph Loop Master Prompt
├── infra/                     # Infrastructure definitions
│   ├── postgres/init.sql      # 17 tables, sequences, enums, triggers & seed data
│   ├── Dockerfile.api         # Multi-stage container for API & BullMQ Worker (non-root)
│   ├── Dockerfile.web         # Multi-stage Vite build served by non-root Nginx
│   └── docker-compose.yml     # Production compose definitions
├── docker-compose.yml         # Root compose orchestrator
├── docker-compose.override.yml# Hot-reload development compose
└── .github/workflows/ci.yml   # Automated lint, test, and Docker build pipeline
```

---

## Technology Stack

- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS, Lucide Icons, served by unprivileged Nginx in production
- **Backend API**: Node.js, NestJS 10, TypeScript, OpenAPI / Swagger documentation
- **Database**: PostgreSQL 16 with 17 relational tables, strict numeric precision (`numeric(14,2)` money, `numeric(12,3)` Kg), and append-only trigger protection
- **Queue & Scheduling**: Redis 7 + BullMQ for asynchronous jobs and daily overdue payment reminders
- **Bill Generation**: Headless HTML-to-JPG bill rendering using Puppeteer and Sharp
- **Messaging**: WhatsApp Business Cloud API with pluggable provider architecture (`CloudApiWhatsAppProvider` and `MockWhatsAppProvider`)
- **Containerization**: Multi-stage Docker & Docker Compose with non-root security (`appuser` / `nginx`)

---

## Quick Start with Docker

```bash
# 1. Clone the repository and configure environment variables
cp .env.example .env

# 2. Build and start all services (PostgreSQL, Redis, API, Worker, Web)
docker compose up --build

# 3. Verify system health
curl http://localhost:4000/api/v1/health
```

The services will be accessible at:
- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **REST API & Swagger Docs**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **Health Check Endpoint**: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)
- **PostgreSQL**: `localhost:5432` (`kumkum_payal`)
- **Redis**: `localhost:6379`

---

## Local Development Commands

### NestJS API (`apps/api`)
```bash
cd apps/api
npm install
npm run start:dev        # Start dev server with hot reload
npm run test             # Run Jest unit and integration tests
npm run build            # Compile TypeScript bundle
npm run migration:run    # Execute database migrations
npm run seed             # Seed owner, items, parties, bank account, and settings
```

### React + Vite Web (`apps/web`)
```bash
cd apps/web
npm install
npm run dev              # Start Vite dev server on port 3000
npm run build            # Typecheck and build static production bundle
```

---

## Database Schema (17 Relational Tables)

1. `users` — Owner & Staff profiles with Argon2id password hashes
2. `parties` — Customers, Suppliers, and Job Work Artisans with international E.164 phone numbers
3. `items` — Jewellery items with default rates and opening stock
4. `bank_accounts` — Company bank accounts with IFSC codes
5. `sales` — Sale invoices with sequence numbering (`sale_bill_seq`) and due dates
6. `sale_lines` — Line items (pieces, weight in Kg, rate, amount)
7. `purchases` — Purchase bills with sequence numbering (`purchase_bill_seq`)
8. `purchase_lines` — Purchase line items
9. `job_work_entries` — Polish and Meena enamel tracking in Kg only (`ISSUE` / `RECEIVE`) with optional rupee charge
10. `money_vouchers` — Cash and Bank receipts/payments (`voucher_seq`)
11. `voucher_allocations` — Bill-to-voucher allocation table
12. `ledger_entries` — **Insert-only** party balance entries (blocked by trigger)
13. `stock_movements` — **Insert-only** stock delta entries (blocked by trigger)
14. `reminder_settings` — Single-row reminder schedule and cadence configuration
15. `reminder_log` — Sent reminder audit log
16. `whatsapp_messages` — Outbound WhatsApp queue and delivery tracking
17. `bill_images` — Puppeteer/sharp rendered JPG bills and metadata
18. `audit_log` — **Insert-only** audit trail with before and after JSON states

---

## Core Security & Business Rules

1. **Server Clock Immutability**: All entry timestamps (`entry_at`) are unconditionally set by the PostgreSQL database clock (`now()`). Request payloads attempting to supply dates or timestamps are rejected.
2. **Double-Layer Staff Isolation**: Staff members can only insert new records and view entries created by their own user ID (`created_by = current_user.id`). Enforced in both API Guards and PostgreSQL Row-Level Security (RLS).
3. **Append-Only Ledgers**: `ledger_entries`, `stock_movements`, and `audit_log` tables are protected by PostgreSQL triggers that reject all `UPDATE` and `DELETE` queries. Any owner corrections generate reversing credit/debit or stock delta rows.
4. **Resilient WhatsApp Queues**: WhatsApp delivery runs in BullMQ queues with automatic retries. An external messaging failure never blocks or fails a database transaction.
5. **Overdue Payment Automation**: Daily cron inspects unpaid invoices past their due dates, respects owner-configured `repeat_days`, sends individual customer WhatsApp reminders, and delivers a consolidated daily dues summary to the owner.

---

## Default Seed Credentials

| Role | Username | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Owner (Admin)** | `mihir` | `owner123` | Full administrative control, staff management, audit log, voucher reversals |
| **Staff Member** | `amit` | `owner123` | Fast entry only (Sales, Purchases, Job Work, Vouchers), isolated view of own entries |
