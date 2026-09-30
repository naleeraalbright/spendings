import React, { useState, useEffect } from 'react';
import { 
  X, 
  Fingerprint, 
  KeyRound, 
  Coins, 
  ShieldCheck, 
  Trash2, 
  Check, 
  Cloud, 
  AlertTriangle, 
  Archive, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  FolderArchive,
  ArrowRight,
  Tag,
  Plus
} from 'lucide-react';
import { useAuth, DEFAULT_CATEGORIES } from '../../contexts/AuthContext';
import { BiometricService } from '../../services/biometricService';
import { Transaction, MonthArchive } from '../../types';
import { formatCurrency, formatMonthName, formatDate } from '../../utils/formatters';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTransactions?: Transaction[];
  archives?: MonthArchive[];
  netAfterDebt?: number;
  onArchiveMonth?: (yearMonth: string, monthName: string, netAfterDebt: number) => Promise<void>;
}

const CURRENCIES = [
  { symbol: 'UGX', label: 'UGX - Ugandan Shilling (Default)' },
  { symbol: '$', label: 'USD ($) - US Dollar' },
  { symbol: '€', label: 'EUR (€) - Euro' },
  { symbol: '£', label: 'GBP (£) - British Pound' },
  { symbol: 'KES', label: 'KES - Kenyan Shilling' },
  { symbol: 'TZS', label: 'TZS - Tanzanian Shilling' },
  { symbol: 'RWF', label: 'RWF - Rwandan Franc' },
  { symbol: '₦', label: 'NGN (₦) - Nigerian Naira' },
  { symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { symbol: '¥', label: 'JPY/CNY (¥) - Yen/Yuan' },
  { symbol: 'C$', label: 'CAD (C$) - Canadian Dollar' },
  { symbol: 'A$', label: 'AUD (A$) - Australian Dollar' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  activeTransactions = [],
  archives = [],
  netAfterDebt = 0,
  onArchiveMonth,
}) => {
  const { userSettings, updateUserSettings, setupBiometrics, setupPin, removeBiometrics } = useAuth();
  const [isBioSupported, setIsBioSupported] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [bioLoading, setBioLoading] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // New month archive state
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const [archiveYearMonth, setArchiveYearMonth] = useState(currentYearMonth);
  const [archiveMonthTitle, setArchiveMonthTitle] = useState(formatMonthName(currentYearMonth));
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  useEffect(() => {
    BiometricService.isAvailable().then(setIsBioSupported);
  }, []);

  // Compute active month summary
  const { activeIncome, activeExpense, activeNet, activeCount } = React.useMemo(() => {
    let income = 0;
    let expense = 0;
    activeTransactions.forEach((tx) => {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    });
    return {
      activeIncome: income,
      activeExpense: expense,
      activeNet: income - expense,
      activeCount: activeTransactions.length,
    };
  }, [activeTransactions]);

  if (!isOpen) return null;

  const handleToggleBiometrics = async () => {
    setBioError(null);
    if (userSettings.biometricsEnabled) {
      removeBiometrics();
    } else {
      setBioLoading(true);
      try {
        await setupBiometrics();
      } catch (err: any) {
        setBioError(err.message || 'Failed to register biometrics on this device.');
      } finally {
        setBioLoading(false);
      }
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage(null);

    if (newPin.length < 4) {
      setPinMessage({ type: 'error', text: 'PIN must be at least 4 digits.' });
      return;
    }

    if (newPin !== confirmPin) {
      setPinMessage({ type: 'error', text: 'PIN codes do not match.' });
      return;
    }

    await setupPin(newPin);
    setNewPin('');
    setConfirmPin('');
    setPinMessage({ type: 'success', text: 'Security PIN set successfully!' });
  };

  const categoriesList = userSettings.categories || DEFAULT_CATEGORIES;

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCategoryName.trim();
    if (!clean) return;
    setCategoryError(null);

    if (categoriesList.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      setCategoryError(`Category "${clean}" already exists.`);
      return;
    }

    const updated = [...categoriesList, clean];
    await updateUserSettings({ categories: updated });
    setNewCategoryName('');
  };

  const handleRemoveCategory = async (catToRemove: string) => {
    const updated = categoriesList.filter((c) => c !== catToRemove);
    await updateUserSettings({ categories: updated });
  };

  const handleExecuteArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onArchiveMonth) return;
    setArchiveError(null);
    setArchiveSuccess(null);
    setArchiveLoading(true);

    try {
      await onArchiveMonth(
        archiveYearMonth,
        archiveMonthTitle.trim() || formatMonthName(archiveYearMonth),
        netAfterDebt
      );
      setArchiveSuccess(
        `Archived "${archiveMonthTitle}" and created Carry Forward entry (${formatCurrency(netAfterDebt, userSettings.currency)}) in new month!`
      );
      setShowArchiveConfirm(false);
    } catch (err: any) {
      setArchiveError(err.message || 'Failed to archive month.');
    } finally {
      setArchiveLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">App Settings & Archives</h3>
              <p className="text-xs text-slate-400">Manage monthly carry forwards, biometrics & currency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* ========================================================= */}
          {/* 1. Monthly Archiving & Carry Forward Feature */}
          {/* ========================================================= */}
          <div className="p-5 bg-slate-950/70 rounded-2xl border border-teal-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">New Month & Carry Forward</h4>
                  <p className="text-xs text-slate-400">Archive old month and carry forward net after debt</p>
                </div>
              </div>
            </div>

            {archiveSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{archiveSuccess}</span>
              </div>
            )}

            {archiveError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{archiveError}</span>
              </div>
            )}

            {/* Active Period Snapshot */}
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Active Month Ledger Snapshot</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                  {activeCount} items
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
                  <div className="text-[10px] text-emerald-400 font-sans font-bold flex items-center justify-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Income</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">
                    +{formatCurrency(activeIncome, userSettings.currency)}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/20">
                  <div className="text-[10px] text-rose-400 font-sans font-bold flex items-center justify-center space-x-1">
                    <TrendingDown className="w-3 h-3" />
                    <span>Spent</span>
                  </div>
                  <div className="text-xs font-bold text-rose-400 mt-0.5">
                    -{formatCurrency(activeExpense, userSettings.currency)}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                  <div className="text-[10px] text-slate-300 font-sans font-bold">Period Net</div>
                  <div
                    className={`text-xs font-bold mt-0.5 ${
                      activeNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatCurrency(activeNet, userSettings.currency)}
                  </div>
                </div>
              </div>

              {/* Carry Forward Opening Balance Notice */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-700/60 flex items-center justify-between">
                <div className="text-xs">
                  <div className="font-bold text-slate-200">First Entry in New Month (Carry Forward):</div>
                  <div className="text-[10px] text-slate-400">Net balance after all active borrowed debts</div>
                </div>
                <div
                  className={`text-sm font-black font-mono px-2.5 py-1 rounded-lg ${
                    netAfterDebt >= 0
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {formatCurrency(netAfterDebt, userSettings.currency)}
                </div>
              </div>
            </div>

            {/* Start New Month Trigger */}
            {!showArchiveConfirm ? (
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(true)}
                disabled={activeCount === 0}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Archive className="w-4 h-4" />
                <span>Archive Month & Start New Month with Carry Forward</span>
              </button>
            ) : (
              <form onSubmit={handleExecuteArchive} className="p-3.5 bg-slate-900 rounded-xl border border-teal-500/40 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Archive Month Period</span>
                    </label>
                    <input
                      type="month"
                      required
                      value={archiveYearMonth}
                      onChange={(e) => {
                        setArchiveYearMonth(e.target.value);
                        setArchiveMonthTitle(formatMonthName(e.target.value));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Archive Title
                    </label>
                    <input
                      type="text"
                      required
                      value={archiveMonthTitle}
                      onChange={(e) => setArchiveMonthTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-teal-950/40 border border-teal-500/30 text-[11px] text-teal-300 flex items-center space-x-2">
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-teal-400" />
                  <span>
                    Will create the 1st entry in the new month as <strong>{netAfterDebt >= 0 ? 'Surplus Income' : 'Deficit Expense'} ({formatCurrency(netAfterDebt, userSettings.currency)})</strong>.
                  </span>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="submit"
                    disabled={archiveLoading}
                    className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg shadow transition disabled:opacity-50"
                  >
                    {archiveLoading ? 'Creating New Month...' : 'Confirm & Carry Forward'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowArchiveConfirm(false)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* List of Previously Archived Months */}
            {archives.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <FolderArchive className="w-3.5 h-3.5 text-teal-400" />
                  <span>Archived Month Records ({archives.length})</span>
                </span>

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {archives.map((arch) => (
                    <div
                      key={arch.id}
                      className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-200">{arch.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">
                          ({arch.transactionCount} items • Saved {formatDate(new Date(arch.archivedAt).toISOString().split('T')[0])})
                        </span>
                      </div>
                      <span
                        className={`font-mono font-bold ${
                          arch.netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(arch.netSavings, userSettings.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 2. Currency Selection */}
          {/* ========================================================= */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Preferred Currency</span>
            </label>
            <select
              value={userSettings.currency}
              onChange={(e) => updateUserSettings({ currency: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              {CURRENCIES.map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* ========================================================= */}
          {/* 3. Expenditure Categories */}
          {/* ========================================================= */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Expenditure Categories</h4>
                  <p className="text-xs text-slate-400">
                    Default: Food, Snacks, Transport. Add your custom categories.
                  </p>
                </div>
              </div>
            </div>

            {categoryError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                {categoryError}
              </p>
            )}

            {/* Existing Categories Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {categoriesList.map((cat) => {
                const isDefault = DEFAULT_CATEGORIES.includes(cat);
                return (
                  <span
                    key={cat}
                    className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold ${
                      isDefault
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <span>{cat}</span>
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        className="ml-1.5 text-slate-400 hover:text-rose-400"
                        title={`Remove ${cat}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>

            {/* Add Custom Category Form */}
            <form onSubmit={handleAddCategory} className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="New Category (e.g. Utilities, Gym)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!newCategoryName.trim()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* ========================================================= */}
          {/* 3. Biometrics Protection */}
          {/* ========================================================= */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Biometric Lock (WebAuthn)</h4>
                  <p className="text-xs text-slate-400">
                    Use Fingerprint, Face ID, or Windows Hello to lock app
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleBiometrics}
                disabled={bioLoading}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  userSettings.biometricsEnabled
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                {bioLoading ? (
                  <span>Registering...</span>
                ) : userSettings.biometricsEnabled ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Enabled</span>
                  </>
                ) : (
                  <span>Enable</span>
                )}
              </button>
            </div>

            {bioError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                {bioError}
              </p>
            )}

            {!isBioSupported && (
              <p className="text-[11px] text-amber-400/80 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Hardware biometrics not detected in current browser. You can use PIN lock below.</span>
              </p>
            )}
          </div>

          {/* ========================================================= */}
          {/* 4. Security PIN Setup */}
          {/* ========================================================= */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Security PIN Code</h4>
                <p className="text-xs text-slate-400">
                  {userSettings.pinCode ? 'PIN is configured as fallback unlock' : 'Set a 4-6 digit unlock code'}
                </p>
              </div>
            </div>

            {pinMessage && (
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold ${
                  pinMessage.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {pinMessage.text}
              </div>
            )}

            <form onSubmit={handleSavePin} className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="New PIN (4-6 digits)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Confirm PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  {userSettings.pinCode ? 'Update PIN' : 'Save PIN'}
                </button>

                {userSettings.pinCode && (
                  <button
                    type="button"
                    onClick={() => updateUserSettings({ pinCode: undefined })}
                    className="text-xs text-slate-500 hover:text-rose-400 flex items-center space-x-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove PIN</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Cloud Sync Backend Status */}
          <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-slate-300">Firebase Cloud Backend:</span>{' '}
                <span className="text-emerald-400 font-semibold">
                  Multi-User Isolated (IndexedDB Offline Persistent)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
