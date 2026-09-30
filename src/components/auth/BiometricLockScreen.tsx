import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, KeyRound, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const BiometricLockScreen: React.FC = () => {
  const { isLocked, unlockWithBiometrics, unlockWithPin, logout, userSettings, currentUser } = useAuth();
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPinInput, setShowPinInput] = useState(!userSettings.biometricsEnabled);

  // Auto trigger biometrics prompt when screen appears
  useEffect(() => {
    if (isLocked && userSettings.biometricsEnabled) {
      handleBiometricUnlock();
    }
  }, [isLocked, userSettings.biometricsEnabled]);

  const handleBiometricUnlock = async () => {
    setError(null);
    setIsVerifying(true);
    try {
      const success = await unlockWithBiometrics();
      if (!success) {
        setError('Biometric verification cancelled or failed. You can use your PIN code.');
        setShowPinInput(true);
      }
    } catch {
      setError('Biometric verification failed. Please enter your PIN.');
      setShowPinInput(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pinInput.trim()) return;

    const success = await unlockWithPin(pinInput);
    if (success) {
      setPinInput('');
    } else {
      setError('Incorrect security PIN. Please try again.');
    }
  };

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl space-y-6">
        
        {/* Lock Animation Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-full bg-slate-800 border-2 border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-500/10">
          {userSettings.biometricsEnabled ? (
            <Fingerprint className="w-10 h-10 text-emerald-400 animate-pulse" />
          ) : (
            <Lock className="w-10 h-10 text-amber-400" />
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">SpendWise Protected</h2>
          <p className="text-xs text-slate-400 mt-1">
            {currentUser?.displayName || currentUser?.email || 'User session'} locked
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center justify-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Biometrics Action Button */}
        {userSettings.biometricsEnabled && (
          <button
            onClick={handleBiometricUnlock}
            disabled={isVerifying}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Fingerprint className="w-5 h-5" />
            <span>{isVerifying ? 'Scanning Biometrics...' : 'Unlock with Biometrics'}</span>
          </button>
        )}

        {/* PIN Fallback Form */}
        {(showPinInput || !userSettings.biometricsEnabled) && (
          <form onSubmit={handlePinSubmit} className="space-y-3 pt-2">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Enter PIN Code"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-center text-lg tracking-widest text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition"
            >
              Unlock with PIN
            </button>
          </form>
        )}

        {userSettings.biometricsEnabled && !showPinInput && (
          <button
            type="button"
            onClick={() => setShowPinInput(true)}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Use Security PIN instead
          </button>
        )}

        {/* Sign Out Fallback */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="text-xs text-slate-500 hover:text-rose-400 flex items-center justify-center space-x-1.5 mx-auto transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Current Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
