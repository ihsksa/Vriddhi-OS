import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import { AuthSession, SubscriptionTier, UserRole } from '../types';
import {
  ShieldCheck,
  Building,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  Sparkles,
  Gift,
} from 'lucide-react';

interface AuthPortalProps {
  onAuthenticated: (session: AuthSession) => void;
  onGoHome?: () => void;
  initialMode?: 'user_login' | 'user_register' | 'admin_login';
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  onAuthenticated,
  onGoHome,
  initialMode = 'user_login',
}) => {
  const [mode, setMode] = useState<'user_login' | 'user_register' | 'admin_login'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State (Instant 1-Month ₹0 Trial)
  const [bizName, setBizName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('Maharashtra');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const requiredRole: UserRole | undefined = mode === 'admin_login' ? 'super_admin' : 'business_owner';
    const result = AuthService.login(loginEmail, loginPassword, requiredRole);

    setIsLoading(false);
    if (result.success && result.session) {
      onAuthenticated(result.session);
    } else {
      setErrorMsg(result.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName.trim() || !ownerName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMsg('Please fill in all required registration fields.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    // Creates tenant with ₹0 Trial for 1 month!
    const result = AuthService.registerMerchant({
      businessName: bizName.trim(),
      ownerName: ownerName.trim(),
      email: regEmail.trim(),
      password: regPassword.trim(),
      phone: regPhone.trim() || '+91 98000 00000',
      city: regCity.trim() || 'Mumbai',
      state: regState,
      plan: 'trial',
      upiTxnRef: 'FREE-TRIAL-30D',
    });

    setIsLoading(false);
    if (result.success && result.session) {
      onAuthenticated(result.session);
    } else {
      setErrorMsg(result.message || 'Could not complete registration.');
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Back to Home Button */}
      {onGoHome && (
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-3">
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-emerald-200 shadow-md">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-2">
            <path d="M4 18L10 12L14 16L20 6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="20" cy="6" r="2" fill="currentColor" />
            <path d="M4 6V18H20" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-emerald-950">
          {mode === 'admin_login'
            ? 'Super Admin Control Portal'
            : mode === 'user_register'
            ? 'Activate 1-Month Free Trial (₹0)'
            : 'Merchant Business Sign In'}
        </h2>
        <p className="text-xs text-gray-500">
          {mode === 'admin_login'
            ? 'Restricted platform governance and merchant tenant management'
            : mode === 'user_register'
            ? 'Full access to Wilson EOQ, ABC Pareto, & predictive forecasts for 30 days — ₹0 upfront.'
            : 'Sign in to access your sandboxed inventory and customer intelligence'}
        </p>

        {/* Portal Switcher Tabs */}
        <div className="mt-4 flex rounded-xl bg-gray-100 p-1 border border-gray-200 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('user_login');
              setLoginEmail('');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
              mode === 'user_login'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-gray-500 hover:text-emerald-900'
            }`}
          >
            Merchant Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('user_register');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
              mode === 'user_register'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-gray-500 hover:text-emerald-900'
            }`}
          >
            1-Month ₹0 Trial
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('admin_login');
              setLoginEmail('');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition flex items-center justify-center gap-1 ${
              mode === 'admin_login'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-gray-500 hover:text-emerald-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-emerald-100">
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* MODE 1: MERCHANT SIGN IN */}
          {mode === 'user_login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Business Owner Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@business.in"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-gray-300 focus:border-emerald-600 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 rounded-xl bg-emerald-800 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 transition"
              >
                {isLoading ? 'Verifying Credentials...' : 'Sign In to Merchant Cell'}
              </button>

              <div className="text-center pt-2 text-xs text-gray-500">
                New merchant?{' '}
                <button
                  type="button"
                  onClick={() => setMode('user_register')}
                  className="font-bold text-emerald-800 hover:underline"
                >
                  Activate ₹0 Trial for 1 Month &rarr;
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: MASTER ADMIN PORTAL */}
          {mode === 'admin_login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>Master Super Admin Access:</strong> Restricted to platform owner for onboarding approval and tenant management.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Admin Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Enter admin email address"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 focus:border-emerald-600 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Master Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter master password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-gray-300 focus:border-emerald-600 focus:outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 rounded-xl bg-emerald-900 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-60 transition"
              >
                {isLoading ? 'Authenticating Admin...' : 'Enter Master Operations Portal'}
              </button>
            </form>
          )}

          {/* MODE 3: 1-MONTH ₹0 TRIAL SIGN UP */}
          {mode === 'user_register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-bold">₹0 Trial Activated for 1 Month:</span> Full feature suite with Wilson EOQ, RFM cohorts, and predictive forecasting for 30 days.
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Business / Store Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Spices & Agro Trading"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arvind Mehta"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98000 00000"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="arvind@mehta.co.in"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Choose password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Mumbai"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Maharashtra"
                    value={regState}
                    onChange={(e) => setRegState(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 rounded-xl bg-emerald-800 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 transition flex items-center justify-center gap-1.5"
              >
                <span>{isLoading ? 'Creating Cell...' : 'Start 1-Month ₹0 Trial Instantly'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2 text-xs text-gray-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('user_login')}
                  className="font-bold text-emerald-800 hover:underline"
                >
                  Sign In &rarr;
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
