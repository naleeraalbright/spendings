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
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction, MonthArchive } from '../types';

/**
 * Strips all keys with undefined values because Firestore rejects undefined values
 */
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

export class TransactionService {
  /**
   * Subscribe to real-time transactions with offline persistence
   */
  static subscribeTransactions(
    userId: string,
    onData: (transactions: Transaction[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (!userId || !db) {
      onData([]);
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId)
      );

      return onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snapshot: any) => {
          const items: Transaction[] = [];
          snapshot.forEach((docSnap: any) => {
            const d = docSnap.data();
            items.push({
              id: docSnap.id,
              ...d,
              amount: Number(d.amount) || 0,
              quantity: Number(d.quantity) || 1,
              isArchived: d.isArchived === true,
            } as Transaction);
          });

          // Sort by DateTime in descending order (newest first)
          const sorted = this.sortByDateTimeDesc(items);
          onData(sorted);
        },
        (error: any) => {
          console.error('Firestore transaction subscription error:', error);
          if (onError) onError(error);
        }
      );
    } catch (e: any) {
      console.error('Firestore transaction query exception:', e);
      if (onError) onError(e);
      return () => {};
    }
  }

  /**
   * Helper to sort transactions by dateTime in descending order (newest first)
   */
  static sortByDateTimeDesc(txs: Transaction[]): Transaction[] {
    return [...txs].sort((a, b) => {
      const timeA = a.createdAt || new Date(a.dateTime || a.date).getTime();
      const timeB = b.createdAt || new Date(b.dateTime || b.date).getTime();
      return timeB - timeA;
    });
  }

  /**
   * Add a new transaction (Expenditure or Income)
   */
  static async addTransaction(
    userId: string,
    data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = Date.now();
    const currentDateStr = data.date || new Date().toISOString().split('T')[0];
    const monthPeriod = data.monthPeriod || currentDateStr.slice(0, 7);

    const rawTx = {
      ...data,
      id,
      userId,
      date: currentDateStr,
      time: data.time || new Date().toTimeString().slice(0, 5),
      dateTime: data.dateTime || new Date().toISOString(),
      monthPeriod,
      isArchived: Boolean(data.isArchived),
      createdAt: now,
      updatedAt: now,
    };

    // Sanitize to remove any undefined fields before writing to Firestore
    const newTx = sanitizeForFirestore(rawTx);

    const docRef = doc(db, 'transactions', id);
    await setDoc(docRef, newTx);
    return id;
  }

  /**
   * Update an existing transaction
   */
  static async updateTransaction(
    userId: string,
    id: string,
    updates: Partial<Transaction>
  ): Promise<void> {
    const now = Date.now();
    const updatedData = sanitizeForFirestore({ ...updates, updatedAt: now });
    const docRef = doc(db, 'transactions', id);
    await updateDoc(docRef, updatedData);
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(userId: string, id: string): Promise<void> {
    const docRef = doc(db, 'transactions', id);
    await deleteDoc(docRef);
  }

  /**
   * Start New Month / Archive current transactions and automatically generate
   * the first entry as a Carry Forward (positive or negative net after debt).
   */
  static async archiveCurrentMonth(
    userId: string,
    yearMonth: string,
    monthName: string,
    currentTransactions: Transaction[],
    netAfterDebt = 0
  ): Promise<void> {
    const now = Date.now();
    const activeTxs = currentTransactions.filter((tx) => !tx.isArchived);
    
    let totalIncome = 0;
    let totalExpense = 0;
    activeTxs.forEach((t) => {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;
    });

    const archiveRecord: MonthArchive = {
      id: `archive_${yearMonth}_${now}`,
      userId,
      name: monthName,
      yearMonth,
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      transactionCount: activeTxs.length,
      archivedAt: now,
    };

    // Firestore batch update for atomic archival and carry forward creation
    const batch = writeBatch(db);

    // 1. Save archive metadata document
    const archiveDoc = doc(db, 'month_archives', archiveRecord.id);
    batch.set(archiveDoc, sanitizeForFirestore(archiveRecord));

    // 2. Mark active transactions as archived
    activeTxs.forEach((tx) => {
      const txDoc = doc(db, 'transactions', tx.id);
      batch.update(txDoc, {
        isArchived: true,
        monthPeriod: yearMonth,
        updatedAt: now,
      });
    });

    // 3. Create the first entry of the new month as a Carry Forward (Surplus / Deficit)
    const isPositive = netAfterDebt >= 0;
    const carryForwardId = `tx_carry_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const carryForwardTx: Transaction = {
      id: carryForwardId,
      userId,
      type: isPositive ? 'income' : 'expense',
      title: isPositive
        ? `Carry Forward: Surplus from ${monthName}`
        : `Carry Forward: Deficit / Debt from ${monthName}`,
      amount: Math.abs(netAfterDebt),
      quantity: 1,
      category: 'Balance Brought Forward',
      date: todayStr,
      time: '00:01',
      dateTime: `${todayStr}T00:01:00.000Z`,
      monthPeriod: todayStr.slice(0, 7),
      isArchived: false,
      notes: `Opening balance brought forward (${isPositive ? 'Surplus' : 'Deficit / Net after debt'} of ${netAfterDebt.toFixed(2)}) from ${monthName}`,
      createdAt: now + 100, // Ensure timestamp positions it as the starting entry
      updatedAt: now + 100,
    };

    const carryForwardDoc = doc(db, 'transactions', carryForwardId);
    batch.set(carryForwardDoc, sanitizeForFirestore(carryForwardTx));

    await batch.commit();
  }

  /**
   * Subscribe to month archives
   */
  static subscribeMonthArchives(
    userId: string,
    onData: (archives: MonthArchive[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (!userId || !db) {
      onData([]);
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'month_archives'),
        where('userId', '==', userId)
      );

      return onSnapshot(
        q,
        (snapshot: any) => {
          const items: MonthArchive[] = [];
          snapshot.forEach((docSnap: any) => {
            items.push({
              id: docSnap.id,
              ...docSnap.data(),
            } as MonthArchive);
          });

          items.sort((a, b) => b.archivedAt - a.archivedAt);
          onData(items);
        },
        (error: any) => {
          console.error('Firestore month archives subscription error:', error);
          if (onError) onError(error);
        }
      );
    } catch (e: any) {
      console.error('Firestore month archives exception:', e);
      if (onError) onError(e);
      return () => {};
    }
  }
}
