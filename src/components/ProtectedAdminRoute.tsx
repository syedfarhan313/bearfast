import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { isAdminEmail } from '../utils/adminAuth';

export function ProtectedAdminRoute() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!checking && user && !isAdminEmail(user.email)) {
      setIsUnauthorized(true);
      signOut(auth).catch(() => undefined);
    }
  }, [checking, user]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Loading admin session...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  if (isUnauthorized || !isAdminEmail(user.email)) {
    return <Navigate to="/admin-login?reason=not-authorized" replace />;
  }

  return <Outlet />;
}
