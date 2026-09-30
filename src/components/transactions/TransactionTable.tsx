import React, { useState, useMemo } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Trash2, 
  Download, 
  Package, 
  Calendar,
  Layers,
  CalendarDays,
  Clock,
  Archive,
  Filter
} from 'lucide-react';
import { Transaction, MonthArchive } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

interface TransactionTableProps {
  transactions: Transaction[];
  archives?: MonthArchive[];
  currency: string;
  onDelete: (id: string) => Promise<void>;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onOpenNewMonth: () => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  archives = [],
  currency,
  onDelete,
  onAddIncome,
  onAddExpense,
  onOpenNewMonth,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('active'); // 'active' | 'all' | yearMonth
  const [sortBy, setSortBy] = useState<'dateTime' | 'amount'>('dateTime'); // Default is dateTime
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // Default is descending

  // Unique categories list for filter dropdown
  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.category) set.add(tx.category);
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Filtered & Sorted transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Month Filter
        if (selectedMonthFilter === 'active') {
          if (tx.isArchived) return false;
        } else if (selectedMonthFilter !== 'all') {
          if (tx.monthPeriod !== selectedMonthFilter) return false;
        }

        // Type filter
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;

        // Search term
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchTitle = tx.title.toLowerCase().includes(term);
          const matchCategory = tx.category.toLowerCase().includes(term);
          const matchNotes = tx.notes ? tx.notes.toLowerCase().includes(term) : false;
          if (!matchTitle && !matchCategory && !matchNotes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'dateTime') {
          const timeA = a.createdAt || new Date(a.dateTime || a.date).getTime();
          const timeB = b.createdAt || new Date(b.dateTime || b.date).getTime();
          return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        } else {
          const amtDiff = b.amount - a.amount;
          return sortOrder === 'desc' ? amtDiff : -amtDiff;
        }
      });
  }, [transactions, selectedMonthFilter, typeFilter, categoryFilter, searchTerm, sortBy, sortOrder]);

  // Totals for filtered view
  const { filteredIncome, filteredExpense, filteredNet } = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') income += amt;
      else expense += amt;
    });
    return {
      filteredIncome: income,
      filteredExpense: expense,
      filteredNet: income - expense,
    };
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Type', 'Title / Item Bought', 'Quantity', 'Amount', 'Currency', 'Category', 'Date', 'Time', 'Notes'];
    const rows = filteredTransactions.map((tx) => [
      tx.type.toUpperCase(),
      `"${tx.title.replace(/"/g, '""')}"`,
      tx.type === 'expense' ? tx.quantity : '1',
      tx.amount,
      currency,
      `"${tx.category}"`,
      tx.date,
      tx.time || '',
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `spendwise_ledger_${selectedMonthFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
      
      {/* Top Header & Month Selector Toolbar */}
      <div className="p-4 sm:p-6 border-b border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-bold text-white">Financial Ledger</h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {filteredTransactions.length} records
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Green denotes Incomes • Red denotes Expenditures & Item Purchases • Sorted by DateTime (Newest first)
            </p>
          </div>

          {/* Action Buttons: New Month, Add Income, Add Expense, Export */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenNewMonth}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md shadow-emerald-600/20 transition"
              title="Archive current transactions and start a new month"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>New Month</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={onAddIncome}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition"
            >
              + Income
            </button>

            <button
              onClick={onAddExpense}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition"
            >
              - Expense
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          
          {/* Month Period Selector */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <CalendarDays className="w-3.5 h-3.5" />
            </div>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-emerald-400 focus:outline-none focus:border-emerald-500"
            >
              <option value="active">Active Month (Current)</option>
              <option value="all">All Transactions (All Time)</option>
              {archives.map((arch) => (
                <option key={arch.id} value={arch.yearMonth}>
                  📁 {arch.name} ({arch.transactionCount} items)
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search item, category, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition ${
                typeFilter === 'all'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition ${
                typeFilter === 'income'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition ${
                typeFilter === 'expense'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              Expense
            </button>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Selector (Default: DateTime Descending) */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'dateTime' | 'amount')}
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="dateTime">Sort by DateTime</option>
              <option value="amount">Sort by Amount</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white"
              title={`Sorting: ${sortOrder === 'desc' ? 'Descending (Newest first)' : 'Ascending (Oldest first)'}`}
            >
              {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📱 1. MOBILE RESPONSIVE VIEW (<640px): Highly readable card ledger items */}
      {/* ========================================================================= */}
      <div className="block sm:hidden divide-y divide-slate-800/80">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-500">
            <Layers className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-semibold text-slate-400">No transactions recorded</p>
            <p className="text-xs text-slate-500 mt-1">Tap &quot;+ Income&quot; or &quot;- Expense&quot; to add a transaction.</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className={`p-4 transition-colors ${
                  isIncome
                    ? 'bg-emerald-950/10 hover:bg-emerald-950/20'
                    : 'bg-rose-950/10 hover:bg-rose-950/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  
                  {/* Left: Indicator Icon + Title + Major Meta */}
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isIncome
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title / What was bought */}
                      <h4
                        className={`text-sm font-bold truncate ${
                          isIncome ? 'text-emerald-200' : 'text-rose-200'
                        }`}
                      >
                        {tx.title}
                      </h4>

                      {/* Major Badges Row: Quantity + Category + Date */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {!isIncome && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 text-[11px] font-mono font-bold border border-slate-700">
                            <Package className="w-3 h-3 text-slate-400" />
                            <span>Qty: {tx.quantity || 1}</span>
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 text-[11px] font-medium border border-slate-700/60">
                          {tx.category}
                        </span>

                        <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{formatDateTime(tx.date, tx.time, tx.createdAt)}</span>
                        </span>
                      </div>

                      {/* Optional Notes or Loan linkage */}
                      {tx.notes && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
                          &quot;{tx.notes}&quot;
                        </p>
                      )}
                      {tx.loanId && (
                        <span className="inline-block text-[10px] text-amber-400 font-semibold mt-1">
                          🔗 Loan: {tx.loanName || 'Repayment'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Big Bold Amount + Delete Action */}
                  <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                    <span
                      className={`text-base font-black font-mono tracking-tight ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </span>

                    <button
                      onClick={() => onDelete(tx.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 💻 2. DESKTOP TABULAR VIEW (>=640px): Detailed wide ledger table */}
      {/* ========================================================================= */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-6">Type</th>
              <th className="py-3.5 px-4">Item / Description</th>
              <th className="py-3.5 px-4 text-center">Qty</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Date & Time</th>
              <th className="py-3.5 px-4 text-right">Amount</th>
              <th className="py-3.5 px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Layers className="w-8 h-8 text-slate-600" />
                    <span>No transactions found matching criteria.</span>
                    <span className="text-xs text-slate-600">
                      Click &quot;+ Income&quot; or &quot;- Expense&quot; above to record a new transaction.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'income';

                return (
                  <tr
                    key={tx.id}
                    className={`transition-colors duration-150 ${
                      isIncome
                        ? 'hover:bg-emerald-950/20 bg-slate-900/40'
                        : 'hover:bg-rose-950/20 bg-slate-900/40'
                    }`}
                  >
                    {/* Type Badge */}
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isIncome
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span>{isIncome ? 'Income' : 'Expense'}</span>
                      </span>
                    </td>

                    {/* What was bought / Source Description */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-bold ${
                            isIncome ? 'text-emerald-100' : 'text-rose-100'
                          }`}
                        >
                          {tx.title}
                        </span>
                        {tx.notes && (
                          <span className="text-xs text-slate-400 line-clamp-1">
                            {tx.notes}
                          </span>
                        )}
                        {tx.loanId && (
                          <span className="text-[10px] text-amber-400 font-semibold mt-0.5">
                            Linked Loan: {tx.loanName || 'Active Debt'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Quantity (Defaults to 1 for expenditures) */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {!isIncome ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-200 text-xs font-mono font-bold border border-slate-700">
                          <Package className="w-3 h-3 text-slate-400" />
                          <span>{tx.quantity || 1}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60">
                        {tx.category}
                      </span>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-300 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatDateTime(tx.date, tx.time, tx.createdAt)}</span>
                      </div>
                    </td>

                    {/* Amount (Green for Income, Red for Expense) */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span
                        className={`text-sm font-bold font-mono ${
                          isIncome ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount, currency)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-6 text-center whitespace-nowrap">
                      <button
                        onClick={() => onDelete(tx.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Tabular Summary Footer */}
      {filteredTransactions.length > 0 && (
        <div className="p-4 sm:p-6 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-slate-400">
            Showing <strong className="text-slate-200">{filteredTransactions.length}</strong> transactions in{' '}
            <span className="text-emerald-400 font-semibold">{selectedMonthFilter === 'active' ? 'Current Active Month' : selectedMonthFilter === 'all' ? 'All Time' : selectedMonthFilter}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono font-bold">
            <span className="text-emerald-400">
              +{formatCurrency(filteredIncome, currency)}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400">
              -{formatCurrency(filteredExpense, currency)}
            </span>
            <span className="text-slate-600">|</span>
            <span
              className={`px-2.5 py-1 rounded-lg ${
                filteredNet >= 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              Net: {formatCurrency(filteredNet, currency)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
