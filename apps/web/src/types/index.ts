export type Role = 'OWNER' | 'STAFF';

export interface User {
  id: string;
  name: string;
  username: string;
  mobile_number?: string;
  role: Role;
  isActive?: boolean;
}

export type PartyType = 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
export type BalanceType = 'DEBIT' | 'CREDIT';

export interface Party {
  id: string;
  name: string;
  party_type: PartyType;
  whatsapp_number: string;
  opening_balance: string | number;
  opening_balance_type: BalanceType;
  current_balance?: string | number;
  current_balance_type?: BalanceType;
  created_by?: string;
  created_at?: string;
}

export interface Item {
  id: string;
  name: string;
  hsn_code?: string;
  default_rate_per_kg: string | number;
  opening_stock_kg: string | number;
  current_stock_kg?: string | number;
  current_pieces?: number;
  created_at?: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  opening_balance: string | number;
  current_balance?: string | number;
  is_active: boolean;
  created_at?: string;
}

export interface SaleLineInput {
  item_id: string;
  pieces: number;
  weight_kg: number;
  rate_per_kg: number;
  amount: number;
}

export interface SaleLine extends SaleLineInput {
  id: string;
  sale_id: string;
  item_name?: string;
  created_at?: string;
}

export type PaymentStatus = 'OPEN' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export interface Sale {
  id: string;
  bill_no: number | string;
  bill_number?: string;
  party_id: string;
  party_name?: string;
  party_phone?: string;
  total_amount: string | number;
  allocated_amount?: string | number;
  outstanding_amount?: string | number;
  due_date: string;
  status: 'ACTIVE' | 'SOFT_DELETED';
  payment_status?: PaymentStatus;
  created_by: string;
  staff_name?: string;
  entry_at: string;
  updated_at?: string;
  lines?: SaleLine[];
}

export interface PurchaseLineInput {
  item_id: string;
  pieces: number;
  weight_kg: number;
  rate_per_kg: number;
  amount: number;
}

export interface PurchaseLine extends PurchaseLineInput {
  id: string;
  purchase_id: string;
  item_name?: string;
  created_at?: string;
}

export interface Purchase {
  id: string;
  bill_no: number | string;
  supplier_id: string;
  supplier_name?: string;
  supplier_phone?: string;
  total_amount: string | number;
  due_date: string;
  status: 'ACTIVE' | 'SOFT_DELETED';
  created_by: string;
  staff_name?: string;
  entry_at: string;
  lines?: PurchaseLine[];
}

export type JobWorkType = 'POLISH' | 'MEENA';
export type JobWorkDirection = 'ISSUE' | 'RECEIVE';

export interface JobWorkEntry {
  id: string;
  entry_type: JobWorkType;
  direction: JobWorkDirection;
  party_id: string;
  party_name?: string;
  party_phone?: string;
  weight_kg: string | number;
  charge_amount: string | number;
  notes?: string;
  created_by: string;
  staff_name?: string;
  entry_at: string;
  status: 'ACTIVE' | 'SOFT_DELETED';
}

export type VoucherType = 'RECEIPT' | 'PAYMENT';
export type PaymentMode = 'CASH' | 'BANK';

export interface VoucherAllocation {
  id?: string;
  voucher_id?: string;
  sale_id?: string;
  purchase_id?: string;
  bill_number?: string;
  allocated_amount: number;
}

export interface MoneyVoucher {
  id: string;
  voucher_no: number | string;
  party_id: string;
  party_name?: string;
  voucher_type: VoucherType;
  mode: PaymentMode;
  bank_account_id?: string;
  bank_name?: string;
  amount: string | number;
  reference_no?: string;
  notes?: string;
  created_by: string;
  staff_name?: string;
  entry_at: string;
  status: 'ACTIVE' | 'SOFT_DELETED';
  allocations?: VoucherAllocation[];
}

export interface LedgerEntry {
  id: string;
  party_id: string;
  party_name?: string;
  voucher_id?: string;
  sale_id?: string;
  purchase_id?: string;
  job_work_id?: string;
  entry_type: string;
  debit: string | number;
  credit: string | number;
  running_balance?: string | number;
  balance_type?: BalanceType;
  narration?: string;
  created_by?: string;
  staff_name?: string;
  entry_at: string;
}

export interface StockRegisterItem {
  id: string;
  name: string;
  hsn_code?: string;
  opening_stock_kg: string | number;
  purchase_in_kg: string | number;
  sale_out_kg: string | number;
  polish_issued_kg: string | number;
  polish_received_kg: string | number;
  meena_issued_kg: string | number;
  meena_received_kg: string | number;
  current_balance_kg: string | number;
  current_pieces: number;
}

export interface OwnerDashboardData {
  totalReceivables: number;
  totalPayables: number;
  totalOverdueAmount: number;
  overdueBillsCount: number;
  todaySalesAmount: number;
  todayPurchasesAmount: number;
  cashInHand: number;
  bankBalances: Array<{ id: string; bank_name: string; account_number: string; balance: number }>;
  topDelinquentDebtors: Array<{
    party_id: string;
    party_name: string;
    whatsapp_number: string;
    overdue_amount: number;
    oldest_due_date: string;
    days_overdue: number;
    bill_count: number;
  }>;
  lowStockItems: Array<{
    id: string;
    name: string;
    current_stock_kg: number;
    current_pieces: number;
  }>;
}

export interface ReminderSettings {
  id?: string;
  repeat_days: number;
  send_time_utc: string;
  send_time_ist?: string;
  language: string;
  is_active: boolean;
  updated_at?: string;
}

export interface AuditLogItem {
  id: string;
  entity_name: string;
  entity_id: string;
  action: 'INSERT' | 'UPDATE' | 'SOFT_DELETE';
  performed_by: string;
  user_name?: string;
  before_state?: any;
  after_state?: any;
  created_at: string;
}
