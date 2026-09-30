import React, { useState } from 'react';
import { X, DollarSign, Calendar, Info, CheckCircle2 } from 'lucide-react';
import { Loan } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface PaybackLoanModalProps {
  isOpen: boolean;
  loan: Loan | null;
  currency: string;
  onClose: () => void;
  onSubmit: (loan: Loan, amount: number, date: string, notes?: string) => Promise<void>;
}

export const PaybackLoanModal: React.FC<PaybackLoanModalProps> = ({
  isOpen,
  loan,
  currency,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !loan) return null;

  const isBorrowed = loan.type === 'borrowed';
  const [paymentAmount, setPaymentAmount] = useState(loan.remainingAmount.toString());
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    if (amount > loan.remainingAmount) {
      setError(`Payment cannot exceed the remaining balance of ${formatCurrency(loan.remainingAmount, currency)}.`);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(loan, amount, paymentDate, notes.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isBorrowed ? 'Make Loan Repayment' : 'Record Loan Collection'}
            </h3>
            <p className="text-xs text-slate-400">
              {loan.title} • {loan.lenderOrBorrower}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Current Loan Summary Card */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Principal Amount:</span>
              <span className="font-semibold text-slate-200">
                {formatCurrency(loan.principalAmount, currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300 font-medium">Remaining Debt:</span>
              <span className="font-bold text-amber-400 font-mono">
                {formatCurrency(loan.remainingAmount, currency)}
              </span>
            </div>
          </div>

          {/* Info Notice */}
          <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
            <span>
              {isBorrowed
                ? 'This repayment will automatically log an Expenditure (Red) in your transaction ledger and deduct from your outstanding debt balance.'
                : 'This collection will automatically log an Income (Green) in your transaction ledger and reduce the outstanding balance.'}
            </span>
          </div>

          {/* Payment Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Payment Amount ({currency}) *
              </label>
              <button
                type="button"
                onClick={() => setPaymentAmount(loan.remainingAmount.toString())}
                className="text-[11px] text-emerald-400 hover:underline font-semibold"
              >
                Pay Full Balance
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400 select-none">
                {currency}
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                max={loan.remainingAmount}
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full pl-14 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-base font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Payment Date</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Memo / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Bank transfer ref #4928"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Payment & Log Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
