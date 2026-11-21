import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { usePageSeo } from '../lib/seo.ts';

export const AuthPage: React.FC<{ initialMode?: 'login' | 'signup' }> = ({
  initialMode = 'login',
}) => {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/dashboard';

  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  usePageSeo({
    title: mode === 'signup' ? 'Create Account' : mode === 'reset' ? 'Reset Password' : 'Sign In',
    description: 'Sign in to Famral Navigator to save colleges, track counselling deadlines, and build choice lists.',
    noIndex: true,
  });

  if (user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-display font-bold text-[#0B1F3A]">You are signed in</h1>
        <p className="text-sm text-slate-600">{user.email}</p>
        <Link
          to="/dashboard"
          className="inline-flex px-5 py-2.5 rounded-md bg-[#0B1F3A] text-white text-xs font-semibold"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === 'signup' && !consentChecked) {
      setError('Please accept the Privacy Policy and data-use consent before creating an account.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
        navigate(redirectTo, { replace: true });
      } else if (mode === 'signup') {
        await signUpWithEmail(name, email, password);
        setInfo(
          'Account created. Please verify your email address via the link sent to your inbox, then sign in.'
        );
      } else {
        await sendPasswordReset(email);
        setInfo('Password reset link sent if an account exists for that email.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      if (msg.includes('operation-not-allowed')) {
        setError(
          'Email/Password sign-in is not yet enabled in this Firebase project. Use "Continue with Google" below (enabled now) or enable Email/Password in Firebase Console → Authentication → Sign-in method.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5 text-center">
          <Compass className="w-7 h-7 text-[#1D4ED8] mx-auto" aria-hidden="true" />
          <h1 className="text-2xl font-display font-bold text-[#0B1F3A]">
            {mode === 'signup'
              ? 'Create Your Navigator Account'
              : mode === 'reset'
                ? 'Reset Your Password'
                : 'Sign In to Famral Navigator'}
          </h1>
          <p className="text-xs text-slate-600">
            Save predictions, shortlist colleges, and build offline-ready counselling choice lists.
          </p>
        </div>

        {/* Primary Google Sign-In */}
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleGoogle()}
          className="w-full py-2.5 px-4 rounded-md bg-[#0B1F3A] hover:bg-[#132C50] text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          Continue with Google
        </button>

        <div className="relative flex items-center justify-center">
          <span className="w-full border-t border-slate-200" />
          <span className="px-3 text-[11px] text-slate-400 bg-white absolute">or with email</span>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-1.5 rounded-md font-medium ${mode === 'login' ? 'bg-white text-[#0B1F3A] shadow-sm' : 'text-slate-600'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`py-1.5 rounded-md font-medium ${mode === 'signup' ? 'bg-white text-[#0B1F3A] shadow-sm' : 'text-slate-600'}`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('reset');
              setError(null);
            }}
            className={`py-1.5 rounded-md font-medium ${mode === 'reset' ? 'bg-white text-[#0B1F3A] shadow-sm' : 'text-slate-600'}`}
          >
            Reset
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                id="auth-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label htmlFor="auth-password" className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          {mode === 'signup' && (
            <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#1D4ED8]"
              />
              <span>
                I accept the{' '}
                <Link to="/privacy" className="text-[#1D4ED8] underline">Privacy Policy</Link> and{' '}
                <Link to="/terms" className="text-[#1D4ED8] underline">Terms of Use</Link>. I understand Famral Navigator never sells student data and I can export or delete my account anytime.
              </span>
            </label>
          )}

          {error && <p className="text-xs text-red-700 leading-relaxed">{error}</p>}
          {info && <p className="text-xs text-teal-800 leading-relaxed">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-md bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold disabled:opacity-60"
          >
            {busy
              ? 'Please wait...'
              : mode === 'signup'
                ? 'Create Account'
                : mode === 'reset'
                  ? 'Send Password Reset Link'
                  : 'Sign In with Email'}
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Your rank, saved colleges, and preference lists are private to your account. We never sell or share student records with third-party advertisers.
          </span>
        </div>
      </div>
    </div>
  );
};
