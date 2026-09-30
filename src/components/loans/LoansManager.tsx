import React, { useState } from 'react';
import { 
  HandCoins, 
  Plus, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  Percent, 
  Layers
} from 'lucide-react';
import { Loan, SummaryStats } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { AddLoanModal } from './AddLoanModal';
import { PaybackLoanModal } from './PaybackLoanModal';

interface LoansManagerProps {
  loans: Loan[];
  stats: SummaryStats;
  currency: string;
  onAddLoan: (data: any) => Promise<void>;
  onPaybackLoan: (loan: Loan, amount: number, date: string, notes?: string) => Promise<void>;
  onDeleteLoan: (id: string) => Promise<void>;
}

export const LoansManager: React.FC<LoansManagerProps> = ({
  loans,
  stats,
  currency,
  onAddLoan,
  onPaybackLoan,
  onDeleteLoan,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'borrowed' | 'lent'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Loan | null>(null);

  const filteredLoans = loans.filter((loan) => {
    if (filterType === 'all') return true;
    return loan.type === filterType;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Debt & Loan Overview Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Total Debt (Borrowed)
            </span>
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <HandCoins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black font-mono text-amber-400">
            {formatCurrency(stats.totalDebt, currency)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Active money you owe to lenders & institutions
          </p>
        </div>

        <div className="bg-slate-900 border border-teal-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Total Money Lent
            </span>
            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black font-mono text-teal-400">
            {formatCurrency(stats.totalLent, currency)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Money people or friends owe to you
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Loan Contracts
            </span>
            <div className="mt-2 text-2xl font-bold text-white">
              {loans.filter((l) => l.status === 'active').length} active / {loans.length} total
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-3 w-full py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-amber-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Loan</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'all'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Loans ({loans.length})
          </button>
          <button
            onClick={() => setFilterType('borrowed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'borrowed'
                ? 'bg-amber-600 text-white shadow'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            Borrowed / Debt
          </button>
          <button
            onClick={() => setFilterType('lent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'lent'
                ? 'bg-teal-600 text-white shadow'
                : 'text-teal-400 hover:text-teal-300'
            }`}
          >
            Lent Out
          </button>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-amber-600/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Loan or Debt</span>
        </button>
      </div>

      {/* Loans Cards Grid */}
      {filteredLoans.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          <Layers className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">No Loans Recorded Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You have not recorded any borrowed loans or money lent. Click the button below to add your first loan.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Loan Record</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLoans.map((loan) => {
            const isBorrowed = loan.type === 'borrowed';
            const isPaid = loan.status === 'paid' || loan.remainingAmount === 0;
            const paidAmount = Math.max(0, loan.principalAmount - loan.remainingAmount);
            const percentPaid = Math.min(100, Math.round((paidAmount / loan.principalAmount) * 100));

            return (
              <div
                key={loan.id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between ${
                  isPaid
                    ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-slate-900'
                    : isBorrowed
                    ? 'border-amber-500/30 hover:border-amber-500/50'
                    : 'border-teal-500/30 hover:border-teal-500/50'
                }`}
              >
                <div>
                  {/* Top Badges & Actions */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            isBorrowed
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          }`}
                        >
                          {isBorrowed ? 'Debt / Borrowed' : 'Money Lent'}
                        </span>
                        {isPaid && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Fully Settled</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-white mt-1.5">{loan.title}</h4>
                      <p className="text-xs text-slate-400 font-medium">
                        {isBorrowed ? `Lender: ${loan.lenderOrBorrower}` : `Borrower: ${loan.lenderOrBorrower}`}
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteLoan(loan.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      title="Delete loan record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Financial Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Principal</span>
                      <div className="text-sm font-bold font-mono text-slate-200">
                        {formatCurrency(loan.principalAmount, currency)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Remaining</span>
                      <div
                        className={`text-sm font-bold font-mono ${
                          isPaid ? 'text-emerald-400' : isBorrowed ? 'text-amber-400' : 'text-teal-400'
                        }`}
                      >
                        {formatCurrency(loan.remainingAmount, currency)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3.5 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>Repayment Progress</span>
                      <span className="font-bold text-slate-300">{percentPaid}% Paid</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isPaid ? 'bg-emerald-500' : isBorrowed ? 'bg-amber-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${percentPaid}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta Details */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    {loan.interestRate !== undefined && (
                      <span className="flex items-center space-x-1">
                        <Percent className="w-3.5 h-3.5 text-slate-500" />
                        <span>{loan.interestRate}% Interest</span>
                      </span>
                    )}
                    {loan.dueDate && (
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Due: {formatDate(loan.dueDate)}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Payback Action */}
                {!isPaid ? (
                  <div className="mt-5 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => setSelectedLoanForPayment(loan)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white shadow-md transition flex items-center justify-center space-x-2 ${
                        isBorrowed
                          ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                          : 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/20'
                      }`}
                    >
                      <HandCoins className="w-4 h-4" />
                      <span>{isBorrowed ? 'Pay Back Loan (Log Expense)' : 'Record Payment Collection'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 pt-3 border-t border-slate-800/80 text-center text-xs font-semibold text-emerald-400">
                    ✓ All loan installments paid in full
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Loan Modal */}
      <AddLoanModal
        isOpen={isAddModalOpen}
        currency={currency}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={onAddLoan}
      />

      {/* Payback Loan Modal */}
      <PaybackLoanModal
        isOpen={Boolean(selectedLoanForPayment)}
        loan={selectedLoanForPayment}
        currency={currency}
        onClose={() => setSelectedLoanForPayment(null)}
        onSubmit={onPaybackLoan}
      />
    </div>
  );
};
