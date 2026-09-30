import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loan } from '../types';
import { TransactionService } from './transactionService';

function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

export class LoanService {
  /**
   * Subscribe to real-time loans with offline support
   */
  static subscribeLoans(
    userId: string,
    onData: (loans: Loan[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (!userId) {
      onData([]);
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'loans'),
        where('userId', '==', userId)
      );

      return onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snapshot) => {
          const items: Loan[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            items.push({
              id: docSnap.id,
              ...d,
              principalAmount: Number(d.principalAmount) || 0,
              remainingAmount: Number(d.remainingAmount) || 0,
              paidAmount: Number(d.paidAmount) || 0,
              createdAt: Number(d.createdAt) || Date.now(),
              updatedAt: Number(d.updatedAt) || Date.now(),
            } as Loan);
          });

          items.sort((a, b) => b.createdAt - a.createdAt);
          onData(items);
        },
        (error) => {
          console.error('Firestore loans subscription error:', error);
          if (onError) onError(error);
        }
      );
    } catch (e: any) {
      console.error('Firestore loans query exception:', e);
      if (onError) onError(e);
      return () => {};
    }
  }

  /**
   * Add a new loan record (borrowed or lent)
   */
  static async addLoan(
    userId: string,
    data: Omit<Loan, 'id' | 'userId' | 'remainingAmount' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const id = `loan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = Date.now();

    const rawLoan = {
      ...data,
      id,
      userId,
      remainingAmount: data.principalAmount,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const newLoan = sanitizeForFirestore(rawLoan);
    const docRef = doc(db, 'loans', id);
    await setDoc(docRef, newLoan);
    return id;
  }

  /**
   * Pay back a loan: updates remaining loan amount and records an expense transaction
   */
  static async recordLoanPayment(
    userId: string,
    loan: Loan,
    paymentAmount: number,
    paymentDate: string,
    notes?: string
  ): Promise<void> {
    const newRemaining = Math.max(0, loan.remainingAmount - paymentAmount);
    const newStatus = newRemaining === 0 ? 'paid' : 'active';
    const now = Date.now();

    // 1. Update loan in database
    const docRef = doc(db, 'loans', loan.id);
    await updateDoc(docRef, sanitizeForFirestore({
      remainingAmount: newRemaining,
      status: newStatus,
      updatedAt: now,
    }));

    // 2. Automatically log the repayment as an Expenditure
    const isBorrowed = loan.type === 'borrowed';
    await TransactionService.addTransaction(userId, {
      type: isBorrowed ? 'expense' : 'income',
      title: isBorrowed 
        ? `Loan Repayment: ${loan.title} (${loan.lenderOrBorrower})` 
        : `Loan Collection: ${loan.title} (${loan.lenderOrBorrower})`,
      amount: paymentAmount,
      quantity: 1,
      category: isBorrowed ? 'Loan Repayment' : 'Debt Collected',
      date: paymentDate || new Date().toISOString().split('T')[0],
      notes: notes || `Payment towards ${loan.title} (Remaining: ${newRemaining.toFixed(2)})`,
      loanId: loan.id,
      loanName: loan.lenderOrBorrower,
    });
  }

  /**
   * Delete a loan
   */
  static async deleteLoan(userId: string, id: string): Promise<void> {
    const docRef = doc(db, 'loans', id);
    await deleteDoc(docRef);
  }
}
