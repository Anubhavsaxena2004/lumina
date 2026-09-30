# Kumkum Payal — Database Design & ER Specification

## Conventions
- **Primary Keys**: UUID v4 (`gen_random_uuid()`).
- **Precision**: Money is `numeric(14,2)`, Weight is `numeric(12,3)` (in Kg), Pieces are `integer`.
- **Server Clock**: `entry_at timestamptz DEFAULT now()`. The API strictly forbids client timestamp inputs.
- **Audit & Isolation**: Entry tables include `created_by`, `is_deleted`, `deleted_at`, `deleted_by`.
- **Append-Only Immutability**: `ledger_entries`, `stock_movements`, and `audit_log` have database triggers preventing any `UPDATE` or `DELETE`.
- **Sequences**: Bills and vouchers use non-repeating database sequences:
  - `sale_bill_seq`
  - `purchase_bill_seq`
  - `voucher_seq`

## 17 Tables Overview

1. `users`: Owner and Staff profiles, Argon2 password hashes, active flags, and last login timestamps.
2. `parties`: Customers and Suppliers with E.164 WhatsApp numbers, opening balances, and addresses.
3. `items`: Inventory items categorized with unique item names.
4. `bank_accounts`: Business bank accounts with opening balances.
5. `sales`: Sale invoice header with customer reference, bill number sequence, and due date.
6. `sale_lines`: Line items detailing pieces, weight in Kg, unit rate, and calculated amounts.
7. `purchases`: Purchase invoice header with supplier reference and bill sequence.
8. `purchase_lines`: Purchase line items with pieces, weight in Kg, rate, and amounts.
9. `job_work_entries`: Polish and Meena enamel tracking in Kg only, direction (`ISSUE` / `RECEIVE`), and optional service charges.
10. `money_vouchers`: Cash and Bank receipts/payments with mandatory bank account validation for bank mode.
11. `voucher_allocations`: Links vouchers to specific open sales or purchase bills.
12. `ledger_entries`: Append-only debit and credit entries with running party balances.
13. `stock_movements`: Append-only stock transactions tracking piece and kg deltas.
14. `reminder_settings`: Single-row configuration for overdue reminders (repeat days, send time, owner phone).
15. `reminder_log`: Historical log of customer bill reminders and owner daily summaries.
16. `whatsapp_messages`: Outbound queue records tracking message status (`QUEUED`, `SENT`, `DELIVERED`, `FAILED`).
17. `bill_images`: Storage paths for generated bill JPGs and delivery associations.
18. `audit_log`: Tamper-proof record storing before-and-after JSON state for every owner edit/delete.

## Derived Calculations

- **Party Balance**:  
  $$\text{Balance} = \text{opening\_balance} + \sum(\text{debit}) - \sum(\text{credit})$$
  *(Positive = Party owes business; Negative = Business owes party)*
- **Item Stock**:  
  $$\text{Pieces} = \sum(\text{pieces\_delta}), \quad \text{Kg} = \sum(\text{kg\_delta})$$
- **Bill Outstanding**:  
  $$\text{Outstanding} = \text{total\_amount} - \sum(\text{voucher\_allocations})$$
- **Bill Status**:
  - `OPEN`: $\sum(\text{allocations}) = 0$
  - `PARTIAL`: $0 < \sum(\text{allocations}) < \text{total\_amount}$
  - `PAID`: $\sum(\text{allocations}) \ge \text{total\_amount}$

## Migration & ORM Strategy Decision

We selected **TypeORM / Native SQL Migrations** over Prisma for this domain. Here is the rationale:

1. **Native PostgreSQL Pl/PgSQL Triggers & Invariants**:
   The immutable tables (`ledger_entries`, `stock_movements`, `audit_log`) require strict `BEFORE UPDATE OR DELETE` triggers that throw PL/pgSQL exceptions. Standard Prisma migrations do not natively model or manage custom PostgreSQL procedural triggers.
2. **Session-Level Row-Level Security (RLS)**:
   Kumkum Payal enforces database-level multi-tenant staff isolation using:
   ```sql
   SET LOCAL app.current_user_id = '<uuid>';
   SET LOCAL app.current_role = 'STAFF' | 'OWNER';
   ```
   Executing session variables on pooled connections requires direct access to transactional query runners, which maps naturally to native SQL execution and TypeORM `QueryRunner`.
3. **Independent Sequences**:
   Bill numbering requires explicit PostgreSQL sequences (`sale_bill_seq`, `purchase_bill_seq`, `voucher_seq`) with custom offsets (1001, 5001, 2001) that operate independently of table primary keys (which use UUID v4).

### Running Migrations & Seeds
- Apply schema migrations: `npm run migration:run` (or automatic via Docker `init.sql`)
- Seed demo dataset: `npm run seed` (creates 1 OWNER, items, 2 parties, bank account, and reminder settings)
