import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  ChevronDown,
  CheckCircle2,
  Clock,
  LogOut,
  MapPin,
  Package,
  Truck,
  UserCircle2
} from 'lucide-react';
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

  const riderInitials = useMemo(() => {
    if (!rider?.fullName) return 'R';
    const tokens = rider.fullName.trim().split(' ').filter(Boolean);
    const initials = tokens.slice(0, 2).map((token) => token[0]?.toUpperCase());
    return initials.join('') || 'R';
  }, [rider?.fullName]);

  const riderStatus = rider?.status || 'pending';
  const isApproved = riderStatus === 'approved';
  const isBlocked = riderStatus === 'rejected' || riderStatus === 'suspended';
  const riderStatusBadge: Partial<Record<Booking['status'], string>> = {
    pending: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/70',
    confirmed: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/70',
    in_transit: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/70',
    out_for_delivery: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/70',
    delivered: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70',
    payment_received: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/70',
    delivery_rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/70'
  };

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
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900"
      style={{ fontFamily: "'Poppins', 'Inter', system-ui, sans-serif" }}>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white flex items-center justify-center text-sm font-semibold shadow-lg shadow-slate-900/20">
                {riderInitials}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                  Rider Dashboard
                </p>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mt-1">
                  {rider?.fullName || 'Rider Dashboard'}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {rider?.city
                      ? `City: ${rider.city}`
                      : 'Assigned parcels overview'}
                  </span>
                  <span className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-slate-300" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {isApproved ? 'Active' : isBlocked ? 'Blocked' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 shadow-sm">
                <UserCircle2 className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-400">Profile</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {rider?.email || 'Rider Account'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {loadError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {loadError}
          </div>
        )}

        {!isApproved && (
          <section
            className={`rounded-3xl border px-5 py-4 text-sm shadow-sm ${
              isBlocked
                ? 'border-rose-200 bg-gradient-to-br from-rose-50 via-rose-50 to-white text-rose-700'
                : 'border-amber-200 bg-gradient-to-br from-amber-50 via-amber-50 to-white text-amber-700'
            }`}>
            <p className="text-xs uppercase tracking-[0.3em]">
              Account Status
            </p>
            <p className="mt-2 text-xl font-semibold">
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
          <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-white opacity-0 transition group-hover:opacity-100" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Assigned
                </p>
                <p className="text-3xl font-semibold text-slate-900 mt-2">
                  {stats.total}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Total parcels assigned
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-white opacity-0 transition group-hover:opacity-100" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Delivered
                </p>
                <p className="text-3xl font-semibold text-slate-900 mt-2">
                  {stats.delivered}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Successfully completed
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-white opacity-0 transition group-hover:opacity-100" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Pending
                </p>
                <p className="text-3xl font-semibold text-slate-900 mt-2">
                  {stats.pending}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Active deliveries
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        {!isApproved ? (
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-10 text-center text-slate-500 shadow-sm">
            Rider dashboard is locked until approval.
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-10 text-center text-slate-500 shadow-sm">
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
                  className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Tracking ID
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xl font-semibold text-slate-900">
                          {booking.trackingId}
                        </p>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            riderStatusBadge[booking.status] || statusConfig.badge
                          }`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <Truck className="h-4 w-4 text-slate-400" />
                        <span>
                          {booking.senderCity} → {booking.receiverCity}
                        </span>
                        <span className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-slate-300" />
                        <span>
                          {formatDate(booking.createdAt)} {formatTime(booking.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Delivery Code
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {booking.deliveryCode}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3 text-sm">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Sender
                      </p>
                      <p className="text-sm font-semibold text-slate-900 mt-2">
                        {booking.senderName || '-'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {booking.senderPhone || '-'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {booking.senderAddress || '-'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
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
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
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
                    <div className="text-slate-600">
                      Update status for this parcel.
                    </div>
                    <div className="relative w-full sm:w-auto">
                      <select
                        value={booking.status}
                        onChange={(e) =>
                          handleStatusChange(
                            booking,
                            e.target.value as Booking['status']
                          )
                        }
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {availableStatuses.map((status) => (
                          <option key={status.key} value={status.key}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
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
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
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
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold shadow-lg shadow-rose-600/20 transition hover:-translate-y-0.5 hover:bg-rose-700">
                Save Reason
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
