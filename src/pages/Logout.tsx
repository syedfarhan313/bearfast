import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

type LogoutStatus = 'loading' | 'done' | 'error';

export function Logout() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<LogoutStatus>('loading');

  useEffect(() => {
    let isMounted = true;
    let redirectTimer: number | undefined;
    signOut(auth)
      .then(() => {
        if (!isMounted) return;
        setStatus('done');
        redirectTimer = window.setTimeout(() => {
          navigate('/cod-registration?signin=1', { replace: true });
        }, 1400);
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus('error');
      });
    return () => {
      isMounted = false;
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex items-center justify-center px-4 py-14">
      <div className="w-full max-w-xl rounded-[28px] border border-slate-200/70 bg-white/90 p-6 sm:p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Logout
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 mt-2">
              {status === 'loading' && 'Signing you out...'}
              {status === 'done' && 'You have been logged out'}
              {status === 'error' && 'Logout failed'}
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {status === 'loading' &&
                'Closing your session and securing your account.'}
              {status === 'done' &&
                'Redirecting to sign in so you can access your dashboard again.'}
              {status === 'error' &&
                'Please try again or return to the sign-in page.'}
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            {status === 'error' ? (
              <AlertTriangle className="h-5 w-5" />
            ) : status === 'done' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm text-slate-600">
          For security, always log out after finishing your work on shared
          devices.
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigate('/cod-registration?signin=1')}
            className="btn-ripple w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800">
            Go to Sign In
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50">
            Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}
