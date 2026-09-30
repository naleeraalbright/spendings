import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  PlusCircle, 
  MinusCircle, 
  HandCoins, 
  CreditCard
} from 'lucide-react';
import { SummaryStats } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface BalanceBannerProps {
  stats: SummaryStats;
  currency: string;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddLoan: () => void;
}

export const BalanceBanner: React.FC<BalanceBannerProps> = ({
  stats,
  currency,
  onAddIncome,
  onAddExpense,
  onAddLoan,
}) => {
  const isPositive = stats.netBalance >= 0;
  const hasDebt = stats.totalDebt > 0;

  return (
    <div className="w-full mb-8">
      {/* Dynamic Main Balance Banner (Green for positive, Red for negative) */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 transition-all duration-500 shadow-2xl ${
          isPositive
            ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-emerald-900/40 border-emerald-500/30 text-emerald-100 glow-green'
            : 'bg-gradient-to-br from-rose-950/90 via-slate-900 to-red-950/50 border-rose-500/40 text-rose-100 glow-red'
        }`}
      >
        {/* Background Ambient Glow */}
        <div
          className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 ${
            isPositive ? 'bg-emerald-400' : 'bg-rose-500'
          }`}
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Main Balance Display */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span
                className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isPositive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {isPositive ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Net Surplus / Available Funds</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Net Deficit / In Debt</span>
                  </>
                )}
              </span>

              {hasDebt && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <CreditCard className="w-3 h-3" />
                  <span>Active Loan: {formatCurrency(stats.totalDebt, currency)}</span>
                </span>
              )}
            </div>

            <div className="mt-3 flex items-baseline space-x-3">
              <h1
                className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatCurrency(stats.netBalance, currency)}
              </h1>
              <span className="text-sm font-medium text-slate-400">
                (Income - Spent)
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-300 max-w-xl">
              {isPositive
                ? 'Your income exceeds your expenditures. Keep maintaining this healthy surplus!'
                : 'Caution: Your expenditures exceed your income. Consider reducing expenses or planning loan repayments.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={onAddIncome}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Income</span>
            </button>

            <button
              onClick={onAddExpense}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <MinusCircle className="w-4 h-4" />
              <span>Add Expense</span>
            </button>

            <button
              onClick={onAddLoan}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <HandCoins className="w-4 h-4 text-amber-400" />
              <span>New Loan</span>
            </button>
          </div>
        </div>

        {/* Breakdown Sub-Cards */}
        <div className="mt-6 pt-6 border-t border-slate-700/50 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Income */}
          <div className="bg-slate-900/60 backdrop-blur rounded-xl p-3.5 border border-emerald-500/20">
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Total Income</span>
            </div>
            <div className="text-xl font-bold text-emerald-400">
              +{formatCurrency(stats.totalIncome, currency)}
            </div>
          </div>

          {/* Total Expenditures */}
          <div className="bg-slate-900/60 backdrop-blur rounded-xl p-3.5 border border-rose-500/20">
            <div className="flex items-center space-x-2 text-xs font-semibold text-rose-400 mb-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Total Spent</span>
            </div>
            <div className="text-xl font-bold text-rose-400">
              -{formatCurrency(stats.totalExpense, currency)}
            </div>
          </div>

          {/* Active Debt / Loans */}
          <div className="bg-slate-900/60 backdrop-blur rounded-xl p-3.5 border border-amber-500/20">
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 mb-1">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Outstanding Debt</span>
            </div>
            <div className="text-xl font-bold text-amber-400">
              {formatCurrency(stats.totalDebt, currency)}
            </div>
          </div>

          {/* Net Financial Worth */}
          <div className="bg-slate-900/60 backdrop-blur rounded-xl p-3.5 border border-slate-700">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Net After Debt</span>
            </div>
            <div
              className={`text-xl font-bold ${
                stats.effectiveWorth >= 0 ? 'text-teal-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(stats.effectiveWorth, currency)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
