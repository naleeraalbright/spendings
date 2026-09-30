import React, { useState } from 'react';
import { X, HandCoins, DollarSign, UserCheck, Calendar, Percent } from 'lucide-react';
import { LoanType } from '../../types';

interface AddLoanModalProps {
  isOpen: boolean;
  currency: string;
  onClose: () => void;
  onSubmit: (data: {
    type: LoanType;
    title: string;
    lenderOrBorrower: string;
    principalAmount: number;
    interestRate?: number;
    dueDate?: string;
  }) => Promise<void>;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({
  isOpen,
  currency,
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<LoanType>('borrowed');
  const [title, setTitle] = useState('');
  const [lenderOrBorrower, setLenderOrBorrower] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(principalAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid loan amount.');
      return;
    }

    if (!title.trim() || !lenderOrBorrower.trim()) {
      setError('Please provide a title and the person/bank name.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        type,
        title: title.trim(),
        lenderOrBorrower: lenderOrBorrower.trim(),
        principalAmount: amount,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        dueDate: dueDate || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create loan.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create Loan & Debt Record</h3>
              <p className="text-xs text-slate-400">Track money borrowed or lent to others</p>
            </div>
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

          {/* Type Toggle: Borrowed (Liability) vs Lent (Asset) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setType('borrowed')}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                type === 'borrowed'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Borrowed (I Owe Money)
            </button>
            <button
              type="button"
              onClick={() => setType('lent')}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                type === 'lent'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lent (Someone Owes Me)
            </button>
          </div>

          {/* Loan Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Loan Title / Purpose *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Bank Personal Loan, Car Loan, Friend Rent Help"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Lender / Borrower Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>{type === 'borrowed' ? 'Lender / Bank Name' : 'Borrower / Friend Name'} *</span>
            </label>
            <input
              type="text"
              required
              placeholder={type === 'borrowed' ? 'e.g., Chase Bank, John Doe' : 'e.g., Michael Smith'}
              value={lenderOrBorrower}
              onChange={(e) => setLenderOrBorrower(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Principal Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Principal Loan Amount ({currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400 select-none">
                {currency}
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="0"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                className="w-full pl-14 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-base font-mono font-bold text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Interest Rate & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
                <Percent className="w-3.5 h-3.5 text-slate-400" />
                <span>Interest Rate % (Optional)</span>
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g., 5.5"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Due Date (Optional)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-600/30 transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <HandCoins className="w-4 h-4" />
                  <span>Record Loan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
