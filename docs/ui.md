# Kumkum Payal — Frontend UI/UX Design System & Documentation

**Platform:** Web-only (Mobile & Desktop browsers)  
**Stack:** React 18 + Vite 5 + TypeScript + Tailwind CSS, Lucide Icons, TanStack Query, React Hook Form + Zod  
**Target Viewports:** Mobile-first (375px – 430px) with fluid responsive scaling up to desktop (1280px+)  

---

## 1. Visual Direction & Design Tokens

Kumkum Payal embodies a **warm, premium, calm, and trustworthy luxury jewelry aesthetic**:
- **Primary Color:** Deep Kumkum Red (`#9B1C31` / `brand-700`) — evoking auspicious tradition, precision, and authority.
- **Accent Color:** Antique Gold (`#B8893B` / `gold-500`) — reflecting crafted gold, silver ornaments, and fine jewelry work.
- **Background:** Warm Off-White (`#FBF7F2` / `warm-200`) — softer and calmer than stark pure white, creating an inviting trading atmosphere.
- **Text & Contrast:** Charcoal (`#2B2B2B`) with high contrast meeting **WCAG AA** accessibility standards.
- **Card Surfaces:** Crisp White (`#FFFFFF`) with 12px/16px rounded borders (`rounded-2xl`) and subtle gold/kumkum shadows (`shadow-soft`).

### Color Tokens

| Token Name | Hex Code | HSL Equivalent | Primary Usage |
|---|---|---|---|
| `brand-DEFAULT` | `#9B1C31` | `hsl(350, 69%, 36%)` | Primary buttons, brand headers, key KPI highlights |
| `brand-hover` | `#84192B` | `hsl(350, 68%, 31%)` | Primary button hover / active states |
| `gold-DEFAULT` | `#B8893B` | `hsl(37, 51%, 48%)` | Accent highlights, unit badges, WhatsApp send buttons |
| `gold-light` | `#FAF6EF` | `hsl(39, 44%, 96%)` | Notice cards, unit containers, input backgrounds |
| `warm-bg` | `#FBF7F2` | `hsl(36, 45%, 97%)` | Main viewport and screen background |
| `charcoal` | `#2B2B2B` | `hsl(0, 0%, 17%)` | Primary text headings and data values |
| `text-muted` | `#66615C` | `hsl(33, 5%, 38%)` | Labels, descriptions, secondary values |
| `border-subtle`| `#E8DFD5` | `hsl(33, 26%, 87%)` | Card borders, table dividers |

### Typography Tokens
- **Headings & Display:** `font-serif` (`Cinzel`, `Playfair Display`, `Georgia`, serif) for elegance and trust.
- **Data & Forms:** `font-sans` (`Inter`, system sans-serif) for maximum legibility and speed of entry.
- **Numbers & Metrics:** `tabular-nums` applied globally across all currency, weight, and date displays for aligned numeric columns.

---

## 2. Indian Formatting Standards & Invariants

All monetary, weight, and date displays strictly adhere to Indian commercial standards:
1. **Currency (Rupees ₹):**
   - Indian lakh and crore grouping (e.g., `₹ 12,34,567.50`).
   - Implemented via `formatRupee(amount)`.
2. **Weight (Kilograms Kg):**
   - Strictly formatted to **3 decimal places** in Kg (e.g., `1.250 Kg`, `0.005 Kg`).
   - Implemented via `formatWeightKg(weight)`.
3. **Dates & Timestamps:**
   - Format: `dd/mm/yyyy` (e.g., `01/10/2026`).
   - Date & Time: `dd/mm/yyyy, hh:mm a` (e.g., `01/10/2026, 04:30 pm`).
4. **Zero Client Date/Time Injection (Non-Negotiable Invariant):**
   - The UI **never** shows editable entry date or time inputs.
   - Every creation screen prominently renders `<ServerTimestampNotice />`: *"Entry timestamp is recorded automatically by the database server (Immutable)"*.

---

## 3. Dual Role User Experience

Two distinct operational modes originate from a single login portal:

```
                          ┌──────────────┐
                          │ Unified Login│
                          └──────┬───────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │ Authenticated Role Check      │
                 ▼                               ▼
      ┌───────────────────────┐     ┌────────────────────────┐
      │   STAFF EXPERIENCE    │     │    OWNER EXPERIENCE    │
      ├───────────────────────┤     ├────────────────────────┤
      │ • 6 Rapid Entry Tiles │     │ • Executive KPI Cards  │
      │ • Keyboard-first Form │     │ • Consolidated Entries │
      │ • Search-as-you-type  │     │ • Party Ledger Stmt    │
      │ • Party Quick-Add     │     │ • Live Stock Register  │
      │ • 1-Click WhatsApp    │     │ • Cash & Bank Books    │
      │ • Isolated Entries    │     │ • Staff Accounts CRUD  │
      │ • NO Edit/Delete      │     │ • WhatsApp Settings    │
      │ • NO Client Dates     │     │ • Reversal Audit Logs  │
      └───────────────────────┘     └────────────────────────┘
```

### Staff Experience (Rapid Entry Focus)
- **Home Dashboard:** 6 prominent, high-contrast action tiles:
  1. *New Sale* (Sell jewellery to customer)
  2. *New Purchase* (Stock inward from supplier)
  3. *Polish Work* (Issue / receive ornaments for polish)
  4. *Meena Work* (Issue / receive enamel artwork)
  5. *Receipt Voucher* (Record customer payment in cash/bank)
  6. *Payment Voucher* (Pay supplier or artisan)
- **Speed of Entry:**
  - Search-as-you-type combobox for customer/supplier party and jewellery items.
  - Automatic default rate per Kg auto-fill upon item selection.
  - Decimal keypad (`inputMode="decimal"`) on numeric inputs.
  - Auto-calculating line totals and bill grand totals.
  - "Keep form open & Add another" toggle shortcut.
  - One-click Party Quick-Add modal without leaving the entry form.
- **Double-Barrier Security Isolation:**
  - Staff never see edit or delete buttons anywhere.
  - Staff only see self-created entries and self-created customer bills.

### Owner Experience (Management & Integrity Focus)
- **Executive Dashboard:** Live metrics for Total Receivables, Total Payables, Overdue Delinquencies, Today's Sales/Purchases, Cash in Hand, and Bank Accounts.
- **Top Delinquent Debtors:** Auto-ranked list of delinquent accounts past due date with direct WhatsApp reminder triggers.
- **Consolidated Entries:** Comprehensive audit list filterable by staff member, party, module, and payment status (`OPEN`, `PARTIAL`, `PAID`, `OVERDUE`).
- **Compensating Reversal Dialog:** Destructive actions (soft-delete) display `<ConfirmDialog />` clearly stating:
  > *"The database will execute an atomic compensating transaction: reversing ledger entries will credit the party's account, returning deducted stock quantities back into stock_movements, and recording before/after delta snapshots in the immutable audit_log."*
- **Party Ledger Statement:** Double-entry running balance statement with opening and closing balance.
- **Stock Register:** Live inventory balances across purchases, sales, and job work issue/receive in both pieces and Kg.
- **Staff Management:** Create unlimited individual staff logins, deactivate accounts, and reset passwords with Argon2id encryption.
- **Reminder Settings:** Configure repeat cadence (days), send time (UTC/IST), and trigger manual test batches.
- **Immutable Audit Trail:** Append-only audit log with before/after state JSON diffs.

---

## 4. UI Component Library Architecture

Located in `apps/web/src/components/`:

1. **`ui/Button.tsx`**:
   - Variants: `primary` (Kumkum Red), `gold` (Antique Gold), `secondary` (Warm Sand), `outline`, `danger`, `ghost`.
   - Minimum 44px tap targets (`min-h-[44px]`).
   - Loading spinner state with disabled interaction.
2. **`ui/Input.tsx`**:
   - Clean floating-friendly labels, error indicators, helper text, and left/right addon slots.
3. **`ui/MoneyInput.tsx`**:
   - Pre-pended with currency symbol (₹), decimal keypad (`inputMode="decimal"`), and real-time Indian lakh-grouping preview badge.
4. **`ui/WeightInput.tsx`**:
   - Enforces 3 decimal places in Kilograms with a gold `Kg` unit badge on the right.
5. **`ui/Combobox.tsx`**:
   - Fast search-as-you-type dropdown with keyboard navigation and integrated `+ Quick Add` modal trigger.
6. **`ui/StatusChip.tsx`**:
   - Colored pill tags for `OPEN`, `PARTIAL`, `PAID`, `OVERDUE`, `ACTIVE`, `SOFT_DELETED`, `POLISH`, `MEENA`, `RECEIPT`, `PAYMENT`.
7. **`ui/ConfirmDialog.tsx`**:
   - Accessible modal explaining double-entry financial effects and immutable audit logging before confirming destructive actions.
8. **`ui/ServerTimestampNotice.tsx`**:
   - Visual banner reinforcing the zero-client date/time injection invariant.
9. **`modals/PartyQuickAddModal.tsx`**:
   - Quick modal to register new customers or suppliers on-the-fly during bill creation.
10. **`modals/BillPreviewModal.tsx`**:
    - High-DPI tax invoice preview rendered via Puppeteer + sharp, with a 1-click "Send via WhatsApp" button.
11. **`layout/AppShell.tsx`**:
    - Responsive layout with desktop sidebar, mobile top header, and fixed bottom navigation bar (min 48px height) optimized for single-thumb mobile interaction.
12. **`layout/ProtectedRoute.tsx`**:
    - Role-based route guard verifying authentication session and RBAC access permissions.

---

## 5. Docker Deployment & Production Configuration

- **Development:** Runs Vite with HMR on port 3000 (`docker-compose.dev.yml`).
- **Production:** Multi-stage build (`infra/Dockerfile.web`):
  1. `builder` stage: `node:20-alpine` builds production bundle (`tsc && vite build`).
  2. `production` stage: Unprivileged `nginx:alpine` running as non-root user `nginx` on port 3000.
  3. Gzip compression enabled for HTML, CSS, JS, and SVG.
  4. 6-month caching headers for static assets (`.ico`, `.css`, `.js`, `.jpg`, `.woff2`).
  5. SPA fallback routing configured: `try_files $uri $uri/ /index.html;`.
