# Kumkum Payal — UI/UX Specification & Design Tokens

## Visual Tokens

| Token | Hex Value | Application |
| :--- | :--- | :--- |
| **Primary (Kumkum Red)** | `#9B1C31` | Brand identity, primary CTAs, active indicators, sale invoices |
| **Accent (Antique Gold)** | `#B8893B` | Secondary branding, purchase vouchers, karigar work highlights |
| **Paper Background** | `#FBF7F2` | Warm off-white page background |
| **Card / Surface** | `#FFFFFF` | Container panels, dialog cards, input fields |
| **Text Ink** | `#2B2B2B` | Primary reading typography |
| **Muted Ink** | `#7A7268` | Secondary labels, timestamps, metadata |
| **Line / Border** | `#E9E0D7` | Subtle dividers, card contours |

## Typography
- **Headings & Numbers**: Serif (`Georgia`, `Playfair Display`)
- **Body & Controls**: Clean Sans (`Inter`, `Helvetica Neue`, `Arial`)
- **Financial & Weights**: Tabular figures (`font-variant-numeric: tabular-nums`)

## Responsive Dual-Role Experience

### Staff Workflow
- **Staff Home**: Greeting banner, 6 large 1-tap entry cards (New Sale, New Purchase, Polish, Meena, Receipt, Payment), recent 5 entries list.
- **New Sale**: Repeatable multi-line items (pieces, kg, rate, calculated amount), party search/quick-add, required due date, server clock indicator, one-click WhatsApp bill dispatch.
- **My Entries**: Staff-isolated directory (`created_by = current_user.id`), status badges (Open, Partial, Paid, Overdue with days counter). No edit or delete controls.

### Owner Workflow
- **Dashboard**: 6 core financial KPIs (Receivables, Payables, Overdue count/amount, Today's Sales/Purchases, Cash/Bank books), Top customer dues bar list, Low stock alerts.
- **Master Entries**: Filterable directory with owner View, Edit, and Soft-Delete controls. Soft-delete triggers double-entry ledger & stock reversals with audit log diffs.
- **Parties & Ledger**: Detailed customer/supplier statements with opening balance and running ledger totals.
- **Stock Register**: Real-time physical inventory in pieces and kilograms, complete with movement history drawer.
- **Cash & Bank Books**: Running cash register and multi-bank account ledgers.
- **Staff Management**: Team credentials management, instant deactivation switch, password reset.
- **Payment Reminders**: Configurable repeat intervals, send time, owner WhatsApp number, live HSM preview.
- **Audit Log**: Immutable chronological trail with expandable before-and-after JSON state diffs.
