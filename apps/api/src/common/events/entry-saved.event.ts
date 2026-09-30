export interface EntrySavedPayload {
  type: 'SALE' | 'PURCHASE' | 'JOB_WORK' | 'VOUCHER';
  id: string;
  partyId: string;
  partyName?: string;
  partyPhone?: string;
  amount?: number;
  weightKg?: number;
  staffId: string;
  staffName: string;
  billNo?: number;
  timestamp: string;
}

export class EntrySavedEvent {
  constructor(public readonly payload: EntrySavedPayload) {}
}
