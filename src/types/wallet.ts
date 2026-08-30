export type LedgerEntryType = 'EARNING' | 'REIMBURSEMENT' | 'WITHDRAWAL';

export interface LedgerEntry {
  id: string;
  type: LedgerEntryType;
  amount: number;
  note: string;
  jobId?: string;
  createdAt: string;
}
