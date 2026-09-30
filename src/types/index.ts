export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  title: string;              // What was bought or income source
  amount: number;             // Total cost or income
  quantity: number;           // Defaults to 1 for expenditures
  unitPrice?: number;         // Amount per unit
  category: string;           // Category name e.g. Food, Salary
  date: string;               // ISO date YYYY-MM-DD
  time?: string;              // HH:MM (e.g. "14:30")
  dateTime?: string;          // ISO Full DateTime (e.g. "2026-09-30T02:35:00")
  notes?: string;
  loanId?: string;            // Reference if this is a loan repayment expense
  loanName?: string;          // Name of lender if loan repayment
  monthPeriod?: string;       // e.g. "2026-09"
  isArchived?: boolean;       // If archived as part of previous month
  createdAt: number;
  updatedAt: number;
}

export type LoanType = 'borrowed' | 'lent';

export interface Loan {
  id: string;
  userId: string;
  type: LoanType;             // 'borrowed' (I owe money) or 'lent' (someone owes me)
  title: string;              // Loan reason or name (e.g., "Car Loan", "Friend Loan")
  lenderOrBorrower: string;   // Name of person / bank
  principalAmount: number;    // Original amount
  remainingAmount: number;    // Remaining balance
  interestRate?: number;      // Annual or total interest rate %
  dueDate?: string;           // Due date YYYY-MM-DD
  status: 'active' | 'paid';
  createdAt: number;
  updatedAt: number;
}

export interface MonthArchive {
  id: string;
  userId: string;
  name: string;               // e.g. "September 2026"
  yearMonth: string;          // "2026-09"
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  transactionCount: number;
  archivedAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

export interface UserSettings {
  currency: string;
  biometricsEnabled: boolean;
  biometricCredentialId?: string;
  pinCode?: string;
  theme?: 'light' | 'dark' | 'system';
  categories?: string[];
}

export interface SummaryStats {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalDebt: number;          // Total remaining borrowed loans
  totalLent: number;          // Total remaining lent loans
  effectiveWorth: number;     // netBalance - totalDebt + totalLent
}

export type TabType = 'overview' | 'transactions' | 'loans' | 'analytics';
