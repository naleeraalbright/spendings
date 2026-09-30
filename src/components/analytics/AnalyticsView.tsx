import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon, 
  BarChart3, 
  Activity, 
  ShoppingBag 
} from 'lucide-react';
import { Transaction, Loan, SummaryStats } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AnalyticsViewProps {
  transactions: Transaction[];
  loans: Loan[];
  stats: SummaryStats;
  currency: string;
}

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6',
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  loans,
  stats,
  currency,
}) => {
  // 1. Group transactions by month for Bar & Area charts
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expense: number; net: number }>();

    transactions.forEach((tx) => {
      const monthKey = tx.date.slice(0, 7); // 'YYYY-MM'
      if (!map.has(monthKey)) {
        map.set(monthKey, { month: monthKey, income: 0, expense: 0, net: 0 });
      }
      const entry = map.get(monthKey)!;
      if (tx.type === 'income') {
        entry.income += tx.amount;
      } else {
        entry.expense += tx.amount;
      }
      entry.net = entry.income - entry.expense;
    });

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  // 2. Spending by category breakdown for Donut chart
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();

    transactions
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => {
        const cat = tx.category || 'Other';
        map.set(cat, (map.get(cat) || 0) + tx.amount);
      });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // 3. Top 5 Largest Expenditures
  const topExpenses = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
          <p className="font-bold text-white mb-1.5">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} style={{ color: p.color }} className="font-semibold font-mono">
              {p.name}: {formatCurrency(p.value, currency)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase">
            <span>Income Growth Rate</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            +{formatCurrency(stats.totalIncome, currency)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Total inflow across {transactions.filter((t) => t.type === 'income').length} income records
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-rose-400 uppercase">
            <span>Expenditure Rate</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400">
            -{formatCurrency(stats.totalExpense, currency)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Total outflow across {transactions.filter((t) => t.type === 'expense').length} expense items
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase">
            <span>Active Debt Ratio</span>
            <Activity className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {formatCurrency(stats.totalDebt, currency)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {loans.filter((l) => l.type === 'borrowed' && l.status === 'active').length} active unpaid loans
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Monthly Inflow (Green) vs Outflow (Red) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Monthly Income vs Expenditures</h3>
          </div>

          {monthlyData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
              No monthly data available yet.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="income" name="Income (Green)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expenditure (Red)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 2. Spending by Category Donut Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center space-x-2 mb-4">
            <PieIcon className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-white">Expenditure by Category</h3>
          </div>

          {categoryData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
              No expenditure categories recorded yet.
            </div>
          ) : (
            <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-between">
              <div className="w-full sm:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val, currency), 'Spent']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Legend List */}
              <div className="w-full sm:w-1/2 max-h-56 overflow-y-auto space-y-2 pr-2 text-xs">
                {categoryData.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 truncate">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                      />
                      <span className="text-slate-300 truncate">{cat.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-200">
                      {formatCurrency(cat.value, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Net Cash Flow Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl lg:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">Net Cash Flow Progression</h3>
          </div>

          {monthlyData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
              No trend data available yet.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="net"
                    name="Net Balance"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#netGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Top 5 Purchases List */}
      {topExpenses.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-rose-400" />
            <span>Top Highest Value Expenditures</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {topExpenses.map((tx, idx) => (
              <div
                key={tx.id}
                className="bg-slate-950/60 border border-rose-500/20 rounded-xl p-3.5 space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold">#{idx + 1} Purchase</span>
                  <span>Qty: {tx.quantity || 1}</span>
                </div>
                <div className="text-sm font-bold text-rose-200 truncate" title={tx.title}>
                  {tx.title}
                </div>
                <div className="text-lg font-mono font-bold text-rose-400">
                  -{formatCurrency(tx.amount, currency)}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{tx.category} • {tx.date}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
