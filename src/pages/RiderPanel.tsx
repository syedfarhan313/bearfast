import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  Booking,
  STATUS_OPTIONS,
  formatDate,
  formatTime,
  isCodBooking,
  subscribeBookingsByRider,
  updateBookingStatus
} from '../utils/bookingStore';
import { auth } from '../lib/firebase';
import {
  RiderApplication,
  getRiderByEmail,
  linkRiderAuth,
  subscribeRiderByAuthUid
} from '../utils/riderStore';

const RIDER_STATUS_KEYS = [
  'pending',
  'confirmed',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'delivery_rejected',
  'payment_received'
] as const;

export function RiderPanel() {
  const navigate = useNavigate();
  const [rider, setRider] = useState<RiderApplication | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadError, setLoadError] = useState('');
  const [rejectionTarget, setRejectionTarget] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');

  useEffect(() => {
    let unsubscribeRider = () => {};
    let unsubscribeBookings = () => {};
    let cancelled = false;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeRider();
      unsubscribeBookings();
      if (!user) {
        setRider(null);
        setBookings([]);
        return;
      }
      if (!user.isAnonymous) {
        unsubscribeRider = subscribeRiderByAuthUid(user.uid, setRider, (err) => {
          console.error('[Rider] profile error', err);
          setLoadError('Unable to load rider profile.');
        });
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
            .catch((err) => {
              console.error('[Rider] email lookup failed', err);
            });
        }
        unsubscribeBookings = subscribeBookingsByRider(
          user.uid,
          setBookings,
          (err) => {
            console.error('[Rider] bookings error', err);
            setLoadError('Unable to load assigned parcels.');
          }
        );
      }
    });
    return () => {
      cancelled = true;
      unsubscribeAuth();
      unsubscribeRider();
      unsubscribeBookings();
    };
  }, []);

  const stats = useMemo(() => {
    const total = bookings.length;
    const delivered = bookings.filter((b) => b.status === 'delivered').length;
    const pending = total - delivered;
    return { total, delivered, pending };
  }, [bookings]);

  const riderStatus = rider?.status || 'pending';
  const isApproved = riderStatus === 'approved';
  const isBlocked = riderStatus === 'rejected' || riderStatus === 'suspended';

  const handleStatusChange = async (
    booking: Booking,
    nextStatus: Booking['status']
  ) => {
    if (!isApproved) return;
    if (nextStatus === booking.status) return;
    if (nextStatus === 'delivery_rejected') {
      setRejectionTarget(booking);
      setRejectionReason('');
      setRejectionError('');
      return;
    }
    try {
      await updateBookingStatus(booking.trackingId, nextStatus);
    } catch (err) {
      console.error('[Rider] status update failed', err);
      setLoadError('Unable to update status. Try again.');
    }
  };

  const handleRejectSave = async () => {
    if (!rejectionTarget) return;
    if (!rejectionReason.trim()) {
      setRejectionError('Please add a rejection reason.');
      return;
    }
    try {
      await updateBookingStatus(
        rejectionTarget.trackingId,
        'delivery_rejected',
        rejectionReason
      );
      setRejectionTarget(null);
      setRejectionReason('');
      setRejectionError('');
    } catch (err) {
      console.error('[Rider] rejection update failed', err);
      setRejectionError('Unable to update rejection. Try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      navigate('/rider?tab=signin', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
              Rider Panel
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mt-1">
              {rider?.fullName || 'Rider Dashboard'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {rider?.city ? `City: ${rider.city}` : 'Assigned parcels overview'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {loadError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {loadError}
          </div>
        )}

        {!isApproved && (
          <section
            className={`rounded-2xl border px-5 py-4 text-sm shadow-sm ${
              isBlocked
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
            <p className="text-xs uppercase tracking-[0.2em]">
              Account Status
            </p>
            <p className="mt-2 text-lg font-semibold">
              {isBlocked ? 'Blocked' : 'Pending Approval'}
            </p>
            <p className="mt-2">
              {isBlocked
                ? 'Please contact admin to re-activate your rider account.'
                : 'Your application is under review. You will be able to manage parcels once approved.'}
            </p>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Assigned
            </p>
            <p className="text-2xl font-semibold text-slate-900 mt-2">
              {stats.total}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Delivered
            </p>
            <p className="text-2xl font-semibold text-slate-900 mt-2">
              {stats.delivered}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Pending
            </p>
            <p className="text-2xl font-semibold text-slate-900 mt-2">
              {stats.pending}
            </p>
          </div>
        </section>

        {!isApproved ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Rider dashboard is locked until approval.
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            No parcels assigned yet. Please check again later.
          </div>
        ) : (
          <section className="grid gap-6 md:grid-cols-2">
            {bookings.map((booking) => {
              const statusConfig =
                STATUS_OPTIONS.find((s) => s.key === booking.status) ??
                STATUS_OPTIONS[0];
              const availableStatuses = STATUS_OPTIONS.filter(
                (status) =>
                  RIDER_STATUS_KEYS.includes(
                    status.key as (typeof RIDER_STATUS_KEYS)[number]
                  ) || status.key === booking.status
              );
              return (
                <div
                  key={booking.trackingId}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Tracking ID
                      </p>
                      <p className="text-lg font-semibold text-slate-900 mt-2">
                        {booking.trackingId}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {booking.senderCity} → {booking.receiverCity}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(booking.createdAt)} {formatTime(booking.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.badge}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Receiver
                      </p>
                      <p className="text-sm font-semibold text-slate-900 mt-2">
                        {booking.receiverName || '-'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {booking.receiverPhone || '-'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {booking.receiverAddress || '-'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Parcel
                      </p>
                      <p className="text-sm font-semibold text-slate-900 mt-2">
                        {booking.itemDetail || 'Parcel'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Weight: {booking.weightKg.toFixed(3)} kg
                      </p>
                      {isCodBooking(booking) && (
                        <p className="text-xs text-emerald-700 mt-1">
                          COD: Rs. {booking.codAmount || '0'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                    <div className="text-slate-700">
                      Delivery Code{' '}
                      <span className="font-semibold text-slate-900">
                        {booking.deliveryCode}
                      </span>
                    </div>
                    <select
                      value={booking.status}
                      onChange={(e) =>
                        handleStatusChange(
                          booking,
                          e.target.value as Booking['status']
                        )
                      }
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                      {availableStatuses.map((status) => (
                        <option key={status.key} value={status.key}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {booking.status === 'delivery_rejected' &&
                    booking.rejectionReason && (
                      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                        <p className="text-xs uppercase tracking-[0.2em] text-rose-400">
                          Rejection Reason
                        </p>
                        <p className="mt-2 font-semibold text-rose-800">
                          {booking.rejectionReason}
                        </p>
                      </div>
                    )}
                </div>
              );
            })}
          </section>
        )}
      </main>

      {rejectionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-black text-slate-900">
              Add Rejection Reason
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              This reason will be shown for this parcel.
            </p>
            <div className="mt-4">
              <textarea
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setRejectionError('');
                }}
                rows={4}
                placeholder="Write the reason for rejection..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
              />
              {rejectionError && (
                <p className="text-sm text-rose-600 mt-2">{rejectionError}</p>
              )}
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setRejectionTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={handleRejectSave}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700">
                Save Reason
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
