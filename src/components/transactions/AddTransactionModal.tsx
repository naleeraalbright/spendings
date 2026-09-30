import React, { useState, useEffect } from 'react';
import { 
  X, 
  PlusCircle, 
  MinusCircle, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Calendar, 
  FileText
} from 'lucide-react';
import { TransactionType } from '../../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  initialType?: TransactionType;
  currency: string;
  onClose: () => void;
  onSubmit: (data: {
    type: TransactionType;
    title: string;
    amount: number;
    quantity: number;
    unitPrice?: number;
    category: string;
    date: string;
    time?: string;
    dateTime?: string;
    notes?: string;
  }) => Promise<void>;
}

import { useAuth } from '../../contexts/AuthContext';

const DEFAULT_EXPENSE_CATEGORIES = [
  'Food',
  'Snacks',
  'Transport',
];

const INCOME_CATEGORIES = [
  'Monthly Salary',
  'Freelance & Contract',
  'Business Profit',
  'Investment & Dividends',
  'Bonus & Awards',
  'Rental Income',
  'Gift & Allowance',
  'Other Income',
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  initialType = 'expense',
  currency,
  onClose,
  onSubmit,
}) => {
  const { userSettings } = useAuth();
  const expenseCategories = (userSettings?.categories && userSettings.categories.length > 0)
    ? userSettings.categories
    : DEFAULT_EXPENSE_CATEGORIES;

  const [type, setType] = useState<TransactionType>(initialType);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState<number>(1); // Default quantity is 1
  const [unitPrice, setUnitPrice] = useState('');
  const [useUnitCalculation, setUseUnitCalculation] = useState(false);
  const [category, setCategory] = useState(expenseCategories[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setCategory(initialType === 'expense' ? expenseCategories[0] : INCOME_CATEGORIES[0]);
      setTitle('');
      setAmount('');
      setQuantity(1);
      setUnitPrice('');
      setUseUnitCalculation(false);
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError(null);
    }
  }, [isOpen, initialType, expenseCategories]);

  // When type changes, switch category list default
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'expense' ? expenseCategories[0] : INCOME_CATEGORIES[0]);
  };

  // Sync unit price and quantity with total amount
  const handleQuantityChange = (newQty: number) => {
    const validQty = Math.max(1, newQty);
    setQuantity(validQty);
    if (useUnitCalculation && unitPrice) {
      const computed = validQty * parseFloat(unitPrice);
      if (!isNaN(computed)) {
        setAmount(computed.toFixed(2));
      }
    }
  };

  const handleUnitPriceChange = (priceStr: string) => {
    setUnitPrice(priceStr);
    const parsedPrice = parseFloat(priceStr);
    if (!isNaN(parsedPrice)) {
      setAmount((parsedPrice * quantity).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!title.trim()) {
      setError(type === 'expense' ? 'Please specify what was bought.' : 'Please specify the income source.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        type,
        title: title.trim(),
        amount: parsedAmount,
        quantity: type === 'expense' ? quantity : 1,
        unitPrice: useUnitCalculation && unitPrice ? parseFloat(unitPrice) : undefined,
        category,
        date,
        time: new Date().toTimeString().slice(0, 5),
        dateTime: `${date}T${new Date().toTimeString().slice(0, 8)}`,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            {type === 'expense' ? (
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                <MinusCircle className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <PlusCircle className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-white">
                {type === 'expense' ? 'Add Expenditure' : 'Add Income'}
              </h3>
              <p className="text-xs text-slate-400">
                {type === 'expense' ? 'Track what you bought with quantity' : 'Record your incoming cash or earnings'}
              </p>
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

          {/* Type Toggle Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MinusCircle className="w-4 h-4" />
              <span>Expenditure (Red)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Income (Green)</span>
            </button>
          </div>

          {/* What was bought / Income Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>{type === 'expense' ? 'What was bought? (Item Name)' : 'Income Source / Title'} *</span>
            </label>
            <div className="relative">
              <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder={type === 'expense' ? 'e.g., Organic Milk & Bread, New Monitor, Uber Ride' : 'e.g., Salary, Client Project A, Dividend'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quantity & Unit calculation (For Expenditures) */}
          {type === 'expense' && (
            <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <span>Quantity (Default: 1)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setUseUnitCalculation(!useUnitCalculation)}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  {useUnitCalculation ? 'Enter Total Amount Directly' : '+ Calculate by Unit Price'}
                </button>
              </div>

              <div className="flex items-center space-x-3">
                {/* Quantity Stepper */}
                <div className="flex items-center space-x-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-slate-200 font-bold hover:bg-slate-600 transition flex items-center justify-center text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-12 text-center bg-transparent font-bold text-sm text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-slate-200 font-bold hover:bg-slate-600 transition flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                </div>

                {/* Optional Unit Price input */}
                {useUnitCalculation && (
                  <div className="flex-1 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 select-none">
                      {currency}
                    </span>
                    <input
                      type="number"
                      step="any"
                      placeholder="Unit Price"
                      value={unitPrice}
                      onChange={(e) => handleUnitPriceChange(e.target.value)}
                      className="w-full pl-12 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Total Amount ({currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">
                {currency}
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-14 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-lg font-mono font-bold placeholder-slate-500 focus:outline-none ${
                  type === 'expense'
                    ? 'text-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'text-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                }`}
              />
            </div>
          </div>

          {/* Category & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {(type === 'expense' ? expenseCategories : INCOME_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Notes (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Receipt details, merchant or memo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg transition flex items-center justify-center space-x-2 ${
                type === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              } disabled:opacity-50`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {type === 'expense' ? <MinusCircle className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                  <span>Save {type === 'expense' ? 'Expenditure' : 'Income'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
