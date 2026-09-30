import React from 'react';
import { 
  Wallet, 
  ReceiptText, 
  HandCoins, 
  PieChart, 
  Lock, 
  Settings, 
  LogOut, 
  Wifi, 
  WifiOff, 
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { TabType } from '../../types';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenAuth,
}) => {
  const { currentUser, logout, lockApp, userSettings } = useAuth();
  const { isOnline } = useNetworkStatus();

  const navItems: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: Wallet },
    { id: 'transactions', label: 'Tabular Ledger', icon: ReceiptText },
    { id: 'loans', label: 'Loans & Debt', icon: HandCoins },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                SpendWise
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Multi-User
              </span>
            </div>
          </div>

          {/* Navigation tabs */}
          {currentUser && (
            <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Online/Offline Status Indicator */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isOnline
                  ? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400'
                  : 'bg-amber-950/60 border-amber-800/50 text-amber-400 animate-pulse'
              }`}
              title={isOnline ? 'Connected to Firebase (Real-time sync)' : 'Offline mode: saving locally to IndexedDB, will auto-sync when online'}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isOnline ? 'Online (Synced)' : 'Offline (Local)'}</span>
            </div>

            {currentUser ? (
              <>
                {/* Lock App Button (if biometrics or PIN enabled) */}
                {(userSettings.biometricsEnabled || userSettings.pinCode) && (
                  <button
                    onClick={lockApp}
                    className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                    title="Lock App (Biometrics/PIN)"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                )}

                {/* Settings */}
                <button
                  onClick={onOpenSettings}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Settings & Biometrics"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* User Profile Badge */}
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-8 h-8 rounded-full border border-emerald-500/50 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 border border-slate-600">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                  <span className="hidden lg:inline-block text-xs font-medium text-slate-200 max-w-[120px] truncate">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/25 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        {currentUser && (
          <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition ${
                    isActive ? 'text-emerald-400 bg-slate-800' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
