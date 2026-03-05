import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  RiderApplication,
  getRiderByEmail,
  linkRiderAuth,
  subscribeRiderByAuthUid
} from '../utils/riderStore';

export function ProtectedRiderRoute() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [rider, setRider] = useState<RiderApplication | null>(null);
  const [authLookupDone, setAuthLookupDone] = useState(false);
  const [emailLookupDone, setEmailLookupDone] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setChecking(false);
      setAuthLookupDone(false);
      setEmailLookupDone(false);
      setRider(null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || user.isAnonymous) {
      setRider(null);
      setAuthLookupDone(true);
      setEmailLookupDone(true);
      return;
    }
    let unsubscribeRider = () => {};
    let cancelled = false;
    unsubscribeRider = subscribeRiderByAuthUid(
      user.uid,
      (profile) => {
        setRider(profile);
        setAuthLookupDone(true);
      },
      () => {
        setRider(null);
        setAuthLookupDone(true);
      }
    );
    if (user.email) {
      getRiderByEmail(user.email)
        .then(async (profile) => {
          if (cancelled || !profile) return;
          if (profile.authUid && profile.authUid !== user.uid) return;
          if (!profile.authUid && profile.status === 'approved') {
            await linkRiderAuth(
              profile.id,
              user.uid,
              user.email || ''
            );
          }
          setRider((prev) => prev ?? { ...profile, authUid: user.uid });
        })
        .catch(() => {
          // ignore fallback errors
        })
        .finally(() => {
          if (!cancelled) setEmailLookupDone(true);
        });
    } else {
      setEmailLookupDone(true);
    }
    return () => {
      cancelled = true;
      unsubscribeRider();
    };
  }, [user]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Loading rider session...
        </div>
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    return <Navigate to="/rider?tab=signin" replace />;
  }

  if (!authLookupDone || !emailLookupDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Loading rider profile...
        </div>
      </div>
    );
  }

  if (!rider) {
    return <Navigate to="/rider?reason=profile-missing" replace />;
  }

  if (rider.status === 'rejected' || rider.status === 'suspended') {
    return <Navigate to="/rider?reason=blocked" replace />;
  }

  return <Outlet />;
}
