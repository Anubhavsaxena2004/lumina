# Kumkum Payal — System Architecture

**Author:** Snuggles / System Architecture Team  
**Scope:** Accounting and Inventory system for jewelry / ornaments trading with Polish & Meena job work.

## Component Overview

```
Browser (Desktop & Mobile Web)
  │
  │ HTTPS / JSON / Cookies
  ▼
┌─────────────────────────── API (Node.js + NestJS) ──────────────────────────┐
│  Auth + RBAC Guard  │  Entry Services  │  Ledger / Stock  │  Bill Renderer  │
└─────────┬───────────────────────┬────────────────────────────┬──────────────┘
          │                       │ enqueue jobs               │ file write
          ▼                       ▼                            ▼
   PostgreSQL 16            Redis (BullMQ)               Object Storage
  (17 Tables + RLS)               │                        (Bill JPGs)
                                  ▼
                            Worker Process
                  ┌───────────────┴────────────────┐
                  │ WhatsApp Sender │ Reminder     │
                  │ (with retries)  │ Scheduler    │
                  └───────────────┬────────────────┘
                                  ▼
                     WhatsApp Business Cloud API
```

## Technology Stack

| Layer | Technology | Key Justification |
| :--- | :--- | :--- |
| **Frontend** | React / Next.js (App Router), Tailwind CSS, shadcn/ui | Unified responsive web application for desktop and mobile browsers |
| **Backend API** | Node.js with NestJS, TypeScript | Strong modular architecture, dependency injection, and declarative role guards |
| **Database** | PostgreSQL 16 | ACID transactions, strict numeric precision (`numeric(14,2)` & `numeric(12,3)`), JSONB audit trail |
| **Queue & Worker**| Redis 7 + BullMQ | Reliable asynchronous retries for WhatsApp messages and daily reminder crons |
| **Bill Rendering**| HTML template to JPG (Puppeteer + Sharp) | Pixel-perfect bill image rendered without requiring native mobile software |
| **Messaging** | WhatsApp Business Cloud API | Pre-approved utility message templates & media bill distribution |

## Key Runtime Flows

### 1. Save Transaction Entry (Sale, Purchase, Job Work, Voucher)
1. **API Guard**: Validates authenticated session and role permissions.
2. **Server-Side Timestamp**: `entry_at` is generated solely by the database (`now()`). Client payloads attempting to supply timestamps or `created_by` are rejected.
3. **Atomic DB Transaction**:
   - Inserts entry into header/lines tables.
   - Generates corresponding append-only `ledger_entries` row (Debit/Credit).
   - Generates corresponding append-only `stock_movements` row (Pieces/Kg delta).
   - Generates audit log snapshot.
4. **Post-Commit Event**: Publishes `EntrySaved` event to enqueue WhatsApp owner alert in BullMQ without blocking the response.

### 2. Daily Overdue Payment Reminder Engine
1. **BullMQ Repeatable Job**: Fires daily at configured `send_time` (default 10:00 AM IST, `Asia/Kolkata`).
2. **Idempotent Bill Selection**: Selects active unpaid sales (`total_amount - voucher_allocations > 0`) where `due_date < today`.
3. **Repeat Rules**: Sends a reminder only if no reminder has been sent yet, or if `repeat_days` have elapsed since the last reminder.
4. **Consolidated Owner Summary**: Exactly ONE summary WhatsApp message is sent to the business owner covering all outstanding party balances.
