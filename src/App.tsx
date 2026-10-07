import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowRight,
  TrendingUp,
  ReceiptText,
  HandCoins,
  Archive
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { TransactionService } from './services/transactionService';
import { LoanService } from './services/loanService';
import { Transaction, Loan, SummaryStats, TabType, TransactionType, MonthArchive } from './types';
import { Header } from './components/common/Header';
import { BalanceBanner } from './components/common/BalanceBanner';
import { TransactionTable } from './components/transactions/TransactionTable';
import { AddTransactionModal } from './components/transactions/AddTransactionModal';
import { LoansManager } from './components/loans/LoansManager';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { AuthModal } from './components/auth/AuthModal';
import { BiometricLockScreen } from './components/auth/BiometricLockScreen';
import { SettingsModal } from './components/settings/SettingsModal';
import { AddLoanModal } from './components/loans/AddLoanModal';

export const AppContent: React.FC = () => {
  const { currentUser, userSettings, isFirebaseConfigured } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [archives, setArchives] = useState<MonthArchive[]>([]);
  
  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('expense');
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

  // Subscribe to real-time transactions, loans & month archives for the current authenticated user
  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      setLoans([]);
      setArchives([]);
      return;
    }

    const unsubTx = TransactionService.subscribeTransactions(
      currentUser.uid,
      (data) => setTransactions(data),
      (err) => console.error('Transaction sync error:', err)
    );

    const unsubLoans = LoanService.subscribeLoans(
      currentUser.uid,
      (data) => setLoans(data),
      (err) => console.error('Loans sync error:', err)
    );

    const unsubArchives = TransactionService.subscribeMonthArchives(
      currentUser.uid,
      (data) => setArchives(data)
    );

    return () => {
      unsubTx();
      unsubLoans();
      unsubArchives();
    };
  }, [currentUser?.uid]);

  // Active (non-archived) transactions for current month balance metrics
  const activeTransactions = useMemo(() => {
    return transactions.filter((t) => !t.isArchived);
  }, [transactions]);

  // Compute live financial metrics
  const stats: SummaryStats = useMemo(() => {
    let income = 0;
    let expense = 0;

    // By default, compute stats across active period (or all transactions if no active)
    const targetTransactions = activeTransactions.length > 0 ? activeTransactions : transactions;

    targetTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        income += amt;
      } else {
        expense += amt;
      }
    });

    let debt = 0;
    let lent = 0;
    loans.forEach((loan) => {
      if (loan.status === 'active') {
        const remaining = Number(loan.remainingAmount) || 0;
        if (loan.type === 'borrowed') {
          debt += remaining;
        } else {
          lent += remaining;
        }
      }
    });

    const net = income - expense;

    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: net,
      totalDebt: debt,
      totalLent: lent,
      effectiveWorth: net - debt + lent,
    };
  }, [transactions, activeTransactions, loans]);

  // Handler functions
  const handleOpenAddTx = (type: TransactionType) => {
    setTxToEdit(null);
    setTxModalType(type);
    setIsTxModalOpen(true);
  };

  const handleOpenEditTx = (tx: Transaction) => {
    setTxToEdit(tx);
    setTxModalType(tx.type);
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = async (data: any) => {
    if (!currentUser) return;
    if (txToEdit) {
      await TransactionService.updateTransaction(currentUser.uid, txToEdit.id, data);
    } else {
      await TransactionService.addTransaction(currentUser.uid, data);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!currentUser) return;
    await TransactionService.deleteTransaction(currentUser.uid, id);
  };

  const handleAddLoan = async (data: any) => {
    if (!currentUser) return;
    await LoanService.addLoan(currentUser.uid, data);
  };

  const handlePaybackLoan = async (loan: Loan, amount: number, date: string, notes?: string) => {
    if (!currentUser) return;
    await LoanService.recordLoanPayment(currentUser.uid, loan, amount, date, notes);
  };

  const handleDeleteLoan = async (id: string) => {
    if (!currentUser) return;
    await LoanService.deleteLoan(currentUser.uid, id);
  };

  const handleArchiveMonth = async (yearMonth: string, monthName: string, netAfterDebt = 0) => {
    if (!currentUser) return;
    await TransactionService.archiveCurrentMonth(currentUser.uid, yearMonth, monthName, transactions, netAfterDebt);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Biometric Security Lock Guard */}
      <BiometricLockScreen />

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {!isFirebaseConfigured && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm text-center">
            <strong>⚠️ Firebase Environment Variables Missing:</strong> Add your <code>VITE_FIREBASE_*</code> environment variables in Vercel Project Settings for user sign-in and data storage to work.
          </div>
        )}

        {/* If user is not logged in */}
        {!currentUser ? (
          <div className="py-16 text-center max-w-2xl mx-auto space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/20">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Smart Income, Expense & Loan Tracker
            </h1>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Track your expenditures in red and income in green, calculate real-time net debt and surplus balances in UGX, archive months cleanly, and protect your finances with biometric security.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
              >
                <span>Get Started / Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Dynamic Status Banner: Green for Net >= 0, Red for Net < 0 */}
            <BalanceBanner
              stats={stats}
              currency={userSettings.currency}
              onAddIncome={() => handleOpenAddTx('income')}
              onAddExpense={() => handleOpenAddTx('expense')}
              onAddLoan={() => setIsLoanModalOpen(true)}
            />

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Recent Tabular Transactions Preview */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                      <ReceiptText className="w-5 h-5 text-emerald-400" />
                      <span>Ledger Entries</span>
                    </h3>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center space-x-1"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>New Month</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('transactions')}
                        className="text-xs font-semibold text-emerald-400 hover:underline flex items-center space-x-1"
                      >
                        <span>Full Table</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <TransactionTable
                    transactions={transactions}
                    archives={archives}
                    currency={userSettings.currency}
                    onDelete={handleDeleteTransaction}
                    onEdit={handleOpenEditTx}
                    onAddIncome={() => handleOpenAddTx('income')}
                    onAddExpense={() => handleOpenAddTx('expense')}
                    onOpenNewMonth={() => setIsSettingsModalOpen(true)}
                  />
                </div>

                {/* Loans & Debts Snapshot */}
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                      <HandCoins className="w-5 h-5 text-amber-400" />
                      <span>Loans & Liabilities</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('loans')}
                      className="text-xs font-semibold text-amber-400 hover:underline flex items-center space-x-1"
                    >
                      <span>Manage Loans</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <LoansManager
                    loans={loans}
                    stats={stats}
                    currency={userSettings.currency}
                    onAddLoan={handleAddLoan}
                    onPaybackLoan={handlePaybackLoan}
                    onDeleteLoan={handleDeleteLoan}
                  />
                </div>

                {/* Quick Charts Preview */}
                <div className="space-y-3 pt-4">
                  <AnalyticsView
                    transactions={transactions}
                    loans={loans}
                    stats={stats}
                    currency={userSettings.currency}
                  />
                </div>
              </div>
            )}

            {/* Tab: Tabular Ledger */}
            {activeTab === 'transactions' && (
              <TransactionTable
                transactions={transactions}
                archives={archives}
                currency={userSettings.currency}
                onDelete={handleDeleteTransaction}
                onEdit={handleOpenEditTx}
                onAddIncome={() => handleOpenAddTx('income')}
                onAddExpense={() => handleOpenAddTx('expense')}
                onOpenNewMonth={() => setIsSettingsModalOpen(true)}
              />
            )}

            {/* Tab: Loans & Debt */}
            {activeTab === 'loans' && (
              <LoansManager
                loans={loans}
                stats={stats}
                currency={userSettings.currency}
                onAddLoan={handleAddLoan}
                onPaybackLoan={handlePaybackLoan}
                onDeleteLoan={handleDeleteLoan}
              />
            )}

            {/* Tab: Analytics */}
            {activeTab === 'analytics' && (
              <AnalyticsView
                transactions={transactions}
                loans={loans}
                stats={stats}
                currency={userSettings.currency}
              />
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        activeTransactions={activeTransactions}
        archives={archives}
        netAfterDebt={stats.effectiveWorth}
        onArchiveMonth={handleArchiveMonth}
      />

      <AddTransactionModal
        isOpen={isTxModalOpen}
        initialType={txModalType}
        transactionToEdit={txToEdit}
        currency={userSettings.currency}
        onClose={() => {
          setIsTxModalOpen(false);
          setTxToEdit(null);
        }}
        onSubmit={handleSaveTransaction}
      />

      <AddLoanModal
        isOpen={isLoanModalOpen}
        currency={userSettings.currency}
        onClose={() => setIsLoanModalOpen(false)}
        onSubmit={handleAddLoan}
      />
    </div>
  );
};
