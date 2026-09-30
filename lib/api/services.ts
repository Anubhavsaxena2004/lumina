import { apiClient } from './client';
import {
  User,
  Party,
  Item,
  BankAccount,
  Sale,
  Purchase,
  JobWorkEntry,
  MoneyVoucher,
  ReminderSettings,
  AuditLogRow,
  DashboardStats,
} from './types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

// --- In-Memory Mock Store for interactive demo / offline mode ---
let mockUsers: User[] = [
  { id: 'u1', name: 'Mihir Sharma', username: 'mihir', role: 'OWNER', is_active: true, last_login_at: '2026-10-01T01:15:00Z', created_at: '2026-09-01T00:00:00Z' },
  { id: 'u2', name: 'Amit Verma', username: 'amit', role: 'STAFF', is_active: true, last_login_at: '2026-10-01T01:10:00Z', created_at: '2026-09-05T00:00:00Z' },
  { id: 'u3', name: 'Priya Patel', username: 'priya', role: 'STAFF', is_active: true, last_login_at: '2026-09-30T18:20:00Z', created_at: '2026-09-12T00:00:00Z' },
];

let mockParties: Party[] = [
  { id: 'p1', name: 'Rajasthan Jewellers', type: 'CUSTOMER', whatsapp_number: '+919829012345', address: 'Johri Bazaar, Jaipur', opening_balance: 125000, current_balance: 186500, is_active: true, created_at: '2026-09-01T00:00:00Z' },
  { id: 'p2', name: 'Mehta Gold Works', type: 'SUPPLIER', whatsapp_number: '+919829054321', address: 'Sarafa Bazaar, Meerut', opening_balance: -75000, current_balance: -94200, is_active: true, created_at: '2026-09-02T00:00:00Z' },
  { id: 'p3', name: 'Shree Balaji Arts', type: 'BOTH', whatsapp_number: '+919829098765', address: 'Zaveri Bazaar, Mumbai', opening_balance: 0, current_balance: 31800, is_active: true, created_at: '2026-09-03T00:00:00Z' },
  { id: 'p4', name: 'Kohinoor Exports', type: 'CUSTOMER', whatsapp_number: '+919829088888', address: 'Bandra West, Mumbai', opening_balance: 200000, current_balance: 275000, is_active: true, created_at: '2026-09-04T00:00:00Z' },
];

let mockItems: Item[] = [
  { id: 'i1', name: 'Gold 22K Plain Bangles', category: 'Gold Ornaments', stock_pieces: 18, stock_kg: 0.425, is_active: true },
  { id: 'i2', name: 'Silver Traditional Payal 92.5', category: 'Silver Ornaments', stock_pieces: 84, stock_kg: 8.640, is_active: true },
  { id: 'i3', name: 'Silver Heavy Kada 80T', category: 'Silver Ornaments', stock_pieces: 32, stock_kg: 4.800, is_active: true },
  { id: 'i4', name: 'CZ Solitaire Ring Mountings', category: 'Diamond Studded', stock_pieces: 4, stock_kg: 0.035, is_active: true },
];

let mockBankAccounts: BankAccount[] = [
  { id: 'b1', name: 'HDFC Current A/C (..4012)', opening_balance: 450000, current_balance: 520000, is_active: true },
  { id: 'b2', name: 'SBI Trade Account (..8821)', opening_balance: 280000, current_balance: 356240, is_active: true },
];

let mockSales: Sale[] = [
  { id: 's1', bill_no: 1048, party_id: 'p1', party_name: 'Rajasthan Jewellers', party_phone: '+919829012345', entry_at: '2026-09-30T10:30:00Z', due_date: '2026-10-05', total_amount: 186500, allocated_amount: 50000, outstanding_amount: 136500, status: 'PARTIAL', created_by: 'u2', creator_name: 'Amit Verma' },
  { id: 's2', bill_no: 1047, party_id: 'p4', party_name: 'Kohinoor Exports', party_phone: '+919829088888', entry_at: '2026-09-24T14:15:00Z', due_date: '2026-09-26', total_amount: 275000, allocated_amount: 0, outstanding_amount: 275000, status: 'OPEN', created_by: 'u2', creator_name: 'Amit Verma' },
  { id: 's3', bill_no: 1046, party_id: 'p3', party_name: 'Shree Balaji Arts', party_phone: '+919829098765', entry_at: '2026-09-20T11:00:00Z', due_date: '2026-09-28', total_amount: 31800, allocated_amount: 31800, outstanding_amount: 0, status: 'PAID', created_by: 'u1', creator_name: 'Mihir Sharma' },
];

let mockPurchases: Purchase[] = [
  { id: 'pr1', bill_no: 5001, party_id: 'p2', party_name: 'Mehta Gold Works', party_phone: '+919829054321', entry_at: '2026-09-29T16:00:00Z', due_date: '2026-10-10', total_amount: 94200, status: 'OPEN', created_by: 'u1', creator_name: 'Mihir Sharma' },
];

let mockJobWork: JobWorkEntry[] = [
  { id: 'jw1', work_type: 'POLISH', party_id: 'p2', party_name: 'Mehta Gold Works', item_id: 'i2', item_name: 'Silver Traditional Payal 92.5', direction: 'ISSUE', weight_kg: 2.500, charge_amount: 0, entry_at: '2026-09-29T11:30:00Z', created_by: 'u2', creator_name: 'Amit Verma' },
  { id: 'jw2', work_type: 'MEENA', party_id: 'p3', party_name: 'Shree Balaji Arts', item_id: 'i1', item_name: 'Gold 22K Plain Bangles', direction: 'RECEIVE', weight_kg: 0.850, charge_amount: 4500, entry_at: '2026-09-30T15:20:00Z', created_by: 'u1', creator_name: 'Mihir Sharma' },
];

let mockVouchers: MoneyVoucher[] = [
  { id: 'v1', voucher_no: 2001, kind: 'RECEIPT', party_id: 'p1', party_name: 'Rajasthan Jewellers', mode: 'BANK', bank_account_id: 'b1', bank_name: 'HDFC Current A/C (..4012)', amount: 50000, reference_no: 'IMPS-987211', entry_at: '2026-09-30T17:00:00Z', created_by: 'u2', creator_name: 'Amit Verma' },
];

let mockSettings: ReminderSettings = {
  id: 1,
  repeat_days: 3,
  send_time: '10:00',
  owner_whatsapp: '+919690000000',
  is_active: true,
};

let mockAuditLogs: AuditLogRow[] = [
  { id: 101, actor_id: 'u1', actor_name: 'Mihir Sharma', action: 'CREATE', table_name: 'users', record_id: 'u2', after_data: { username: 'amit', role: 'STAFF' }, at: '2026-09-05T10:00:00Z' },
  { id: 102, actor_id: 'u1', actor_name: 'Mihir Sharma', action: 'UPDATE_SETTINGS', table_name: 'reminder_settings', record_id: '1', before_data: { repeat_days: 5 }, after_data: { repeat_days: 3 }, at: '2026-09-20T12:00:00Z' },
];

// --- Services ---

export async function getDashboard(): Promise<DashboardStats> {
  if (USE_MOCK) {
    return {
      totalReceivable: 1284500,
      totalPayable: 642800,
      overdueAmount: 275000,
      overdueCount: 1,
      todaySales: 186500,
      todayPurchases: 94200,
      cashBalance: 214680,
      bankBalance: 876240,
      topCustomersByDues: [
        { id: 'p4', customer_name: 'Kohinoor Exports', pending_amount: 275000, whatsapp_number: '+919829088888' },
        { id: 'p1', customer_name: 'Rajasthan Jewellers', pending_amount: 136500, whatsapp_number: '+919829012345' },
      ],
      lowStockItems: [
        { id: 'i4', name: 'CZ Solitaire Ring Mountings', category: 'Diamond Studded', pieces: 4, weight_kg: 0.035 },
      ],
      recentEntries: [
        { id: 's1', type: 'Sale', party_name: 'Rajasthan Jewellers', amount: 186500, entry_at: '2026-09-30T10:30:00Z', creator_name: 'Amit Verma' },
        { id: 'pr1', type: 'Purchase', party_name: 'Mehta Gold Works', amount: 94200, entry_at: '2026-09-29T16:00:00Z', creator_name: 'Mihir Sharma' },
        { id: 'v1', type: 'Receipt', party_name: 'Rajasthan Jewellers', amount: 50000, entry_at: '2026-09-30T17:00:00Z', creator_name: 'Amit Verma' },
      ],
    };
  }
  return apiClient<DashboardStats>('/dashboard/metrics');
}

export async function listParties(search?: string, type?: string): Promise<Party[]> {
  if (USE_MOCK) {
    return mockParties.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (type && p.type !== type && p.type !== 'BOTH') return false;
      return true;
    });
  }
  const q = new URLSearchParams();
  if (search) q.append('search', search);
  if (type) q.append('type', type);
  return apiClient<Party[]>(`/parties?${q.toString()}`);
}

export async function createParty(dto: { name: string; type: string; whatsapp_number?: string; address?: string; opening_balance?: number }): Promise<Party> {
  if (USE_MOCK) {
    const newP: Party = {
      id: `p_${Date.now()}`,
      name: dto.name,
      type: dto.type as any,
      whatsapp_number: dto.whatsapp_number,
      address: dto.address,
      opening_balance: dto.opening_balance || 0,
      current_balance: dto.opening_balance || 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    mockParties.push(newP);
    return newP;
  }
  return apiClient<Party>('/parties', { method: 'POST', body: JSON.stringify(dto) });
}

export async function listItems(search?: string): Promise<Item[]> {
  if (USE_MOCK) {
    return mockItems.filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()));
  }
  return apiClient<Item[]>(`/items${search ? `?search=${encodeURIComponent(search)}` : ''}`);
}

export async function createItem(dto: { name: string; category?: string }): Promise<Item> {
  if (USE_MOCK) {
    const newItem: Item = {
      id: `i_${Date.now()}`,
      name: dto.name,
      category: dto.category,
      stock_pieces: 0,
      stock_kg: 0,
      is_active: true,
    };
    mockItems.push(newItem);
    return newItem;
  }
  return apiClient<Item>('/items', { method: 'POST', body: JSON.stringify(dto) });
}

export async function listBankAccounts(): Promise<BankAccount[]> {
  if (USE_MOCK) return mockBankAccounts;
  return apiClient<BankAccount[]>('/bank-accounts');
}

export async function listSales(partyId?: string): Promise<Sale[]> {
  if (USE_MOCK) {
    return mockSales.filter((s) => !partyId || s.party_id === partyId);
  }
  return apiClient<Sale[]>(`/sales${partyId ? `?party_id=${partyId}` : ''}`);
}

export async function createSale(dto: any): Promise<Sale> {
  if (USE_MOCK) {
    const party = mockParties.find((p) => p.id === dto.party_id);
    let total = 0;
    const lines = dto.lines.map((l: any) => {
      const amt = l.amount || (l.weight_kg > 0 ? l.weight_kg * l.rate : l.pieces * l.rate);
      total += amt;
      const item = mockItems.find((i) => i.id === l.item_id);
      return { ...l, amount: amt, item_name: item?.name || 'Item' };
    });

    const newSale: Sale = {
      id: `s_${Date.now()}`,
      bill_no: 1049 + mockSales.length,
      party_id: dto.party_id,
      party_name: party?.name || 'Customer',
      party_phone: party?.whatsapp_number,
      entry_at: new Date().toISOString(),
      due_date: dto.due_date,
      total_amount: total,
      outstanding_amount: total,
      allocated_amount: 0,
      status: 'OPEN',
      notes: dto.notes,
      created_by: 'u2',
      creator_name: 'Amit Verma',
      lines,
    };
    mockSales.unshift(newSale);
    return newSale;
  }
  return apiClient<Sale>('/sales', { method: 'POST', body: JSON.stringify(dto) });
}

export async function deleteSale(id: string): Promise<any> {
  if (USE_MOCK) {
    mockSales = mockSales.filter((s) => s.id !== id);
    return { success: true };
  }
  return apiClient(`/sales/${id}`, { method: 'DELETE' });
}

export async function listPurchases(): Promise<Purchase[]> {
  if (USE_MOCK) return mockPurchases;
  return apiClient<Purchase[]>('/purchases');
}

export async function createPurchase(dto: any): Promise<Purchase> {
  if (USE_MOCK) {
    const party = mockParties.find((p) => p.id === dto.party_id);
    let total = 0;
    dto.lines.forEach((l: any) => {
      total += l.amount || (l.weight_kg > 0 ? l.weight_kg * l.rate : l.pieces * l.rate);
    });

    const newP: Purchase = {
      id: `pr_${Date.now()}`,
      bill_no: 5002 + mockPurchases.length,
      party_id: dto.party_id,
      party_name: party?.name || 'Supplier',
      entry_at: new Date().toISOString(),
      due_date: dto.due_date,
      total_amount: total,
      status: 'OPEN',
      notes: dto.notes,
      created_by: 'u1',
      creator_name: 'Mihir Sharma',
      lines: dto.lines,
    };
    mockPurchases.unshift(newP);
    return newP;
  }
  return apiClient<Purchase>('/purchases', { method: 'POST', body: JSON.stringify(dto) });
}

export async function listJobWork(): Promise<JobWorkEntry[]> {
  if (USE_MOCK) return mockJobWork;
  return apiClient<JobWorkEntry[]>('/job-work');
}

export async function createJobWork(dto: any): Promise<JobWorkEntry> {
  if (USE_MOCK) {
    const party = mockParties.find((p) => p.id === dto.party_id);
    const item = mockItems.find((i) => i.id === dto.item_id);
    const newJw: JobWorkEntry = {
      id: `jw_${Date.now()}`,
      work_type: dto.work_type,
      party_id: dto.party_id,
      party_name: party?.name || 'Worker',
      item_id: dto.item_id,
      item_name: item?.name || 'Item',
      direction: dto.direction,
      weight_kg: dto.weight_kg,
      charge_amount: dto.charge_amount || 0,
      entry_at: new Date().toISOString(),
      notes: dto.notes,
      created_by: 'u2',
      creator_name: 'Amit Verma',
    };
    mockJobWork.unshift(newJw);
    return newJw;
  }
  return apiClient<JobWorkEntry>('/job-work', { method: 'POST', body: JSON.stringify(dto) });
}

export async function listVouchers(): Promise<MoneyVoucher[]> {
  if (USE_MOCK) return mockVouchers;
  return apiClient<MoneyVoucher[]>('/vouchers');
}

export async function createVoucher(dto: any): Promise<MoneyVoucher> {
  if (USE_MOCK) {
    const party = mockParties.find((p) => p.id === dto.party_id);
    const bank = mockBankAccounts.find((b) => b.id === dto.bank_account_id);
    const newV: MoneyVoucher = {
      id: `v_${Date.now()}`,
      voucher_no: 2002 + mockVouchers.length,
      kind: dto.kind,
      party_id: dto.party_id,
      party_name: party?.name || 'Party',
      mode: dto.mode,
      bank_account_id: dto.bank_account_id,
      bank_name: bank?.name,
      amount: dto.amount,
      reference_no: dto.reference_no,
      entry_at: new Date().toISOString(),
      created_by: 'u2',
      creator_name: 'Amit Verma',
    };
    mockVouchers.unshift(newV);

    // Apply allocations to mock sales
    if (dto.allocations && dto.allocations.length > 0) {
      dto.allocations.forEach((alloc: any) => {
        const s = mockSales.find((sale) => sale.id === alloc.sale_id);
        if (s) {
          s.allocated_amount = (s.allocated_amount || 0) + alloc.amount;
          s.outstanding_amount = Math.max(0, s.total_amount - s.allocated_amount);
          s.status = s.outstanding_amount === 0 ? 'PAID' : 'PARTIAL';
        }
      });
    }

    return newV;
  }
  return apiClient<MoneyVoucher>('/vouchers', { method: 'POST', body: JSON.stringify(dto) });
}

export async function listStaff(): Promise<User[]> {
  if (USE_MOCK) return mockUsers.filter((u) => u.role === 'STAFF');
  return apiClient<User[]>('/staff');
}

export async function createStaff(dto: { name: string; username: string; password?: string }): Promise<User> {
  if (USE_MOCK) {
    const newU: User = {
      id: `u_${Date.now()}`,
      name: dto.name,
      username: dto.username,
      role: 'STAFF',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    mockUsers.push(newU);
    return newU;
  }
  return apiClient<User>('/staff', { method: 'POST', body: JSON.stringify(dto) });
}

export async function toggleStaffActive(id: string, isActive: boolean): Promise<any> {
  if (USE_MOCK) {
    const user = mockUsers.find((u) => u.id === id);
    if (user) user.is_active = isActive;
    return { success: true };
  }
  return apiClient(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
}

export async function getReminderSettings(): Promise<ReminderSettings> {
  if (USE_MOCK) return mockSettings;
  return apiClient<ReminderSettings>('/reminders/settings');
}

export async function updateReminderSettings(dto: Partial<ReminderSettings>): Promise<ReminderSettings> {
  if (USE_MOCK) {
    mockSettings = { ...mockSettings, ...dto };
    return mockSettings;
  }
  return apiClient<ReminderSettings>('/reminders/settings', { method: 'PATCH', body: JSON.stringify(dto) });
}

export async function triggerDailyReminders(): Promise<any> {
  if (USE_MOCK) {
    return {
      success: true,
      overdueBillsFound: 1,
      customerMessagesSent: 1,
      customersCount: 1,
      grandTotalOverdue: 275000,
    };
  }
  return apiClient('/reminders/trigger', { method: 'POST' });
}

export async function listAuditLog(): Promise<AuditLogRow[]> {
  if (USE_MOCK) return mockAuditLogs;
  return apiClient<AuditLogRow[]>('/audit');
}

export async function sendBillOnWhatsApp(saleId: string): Promise<any> {
  if (USE_MOCK) {
    const s = mockSales.find((sale) => sale.id === saleId);
    return {
      success: true,
      bill_no: s?.bill_no || 1048,
      whatsapp: { status: 'DELIVERED', providerMsgId: `mock_${Date.now()}` },
    };
  }
  return apiClient(`/sales/${saleId}/bill`, { method: 'POST' });
}
