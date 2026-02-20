import React, { useEffect, useMemo, useState } from 'react';
import {
  Booking,
  BookingStatusKey,
  STATUS_OPTIONS,
  formatDate,
  formatTime,
  loadBookings,
  saveBookings,
  updateBookingStatus
} from '../utils/bookingStore';
import { SearchIcon, TrashIcon, ClipboardIcon } from 'lucide-react';

export function Admin() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string>('');
  const [rejectionTarget, setRejectionTarget] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');

  const statusDotClass: Record<string, string> = {
    pending: 'bg-amber-500',
    confirmed: 'bg-blue-500',
    in_transit: 'bg-indigo-500',
    out_for_delivery: 'bg-orange-500',
    delivered: 'bg-emerald-500',
    delivery_rejected: 'bg-rose-500',
    payment_received: 'bg-teal-500'
  };

  const serviceRates: Record<
    string,
    { baseHalf: number; baseOne: number; additionalPerKg: number }
  > = {
    'super-flash': { baseHalf: 400, baseOne: 560, additionalPerKg: 400 },
    overnight: { baseHalf: 320, baseOne: 460, additionalPerKg: 300 },
    '3-7-day': { baseHalf: 220, baseOne: 360, additionalPerKg: 200 },
    'next-day': { baseHalf: 150, baseOne: 260, additionalPerKg: 150 }
  };

  useEffect(() => {
    setBookings(loadBookings());
  }, []);

  const counts = useMemo(() => {
    const base: Record<string, number> = {
      all: bookings.length
    };
    STATUS_OPTIONS.forEach((status) => {
      base[status.key] = bookings.filter(
        (booking) => booking.status === status.key
      ).length;
    });
    return base;
  }, [bookings]);

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      const matchStatus =
        statusFilter === 'all' ? true : booking.status === statusFilter;
      const matchQuery = query.trim()
        ? booking.trackingId.toLowerCase().includes(query.trim().toLowerCase())
        : true;
      return matchStatus && matchQuery;
    });
  }, [bookings, statusFilter, query]);

  const handleStatusChange = (
    booking: Booking,
    nextStatus: BookingStatusKey
  ) => {
    if (nextStatus === 'delivery_rejected') {
      setRejectionTarget(booking.trackingId);
      setRejectionReason(booking.rejectionReason || '');
      setRejectionError('');
      return;
    }
    updateBookingStatus(booking.trackingId, nextStatus);
    setBookings(loadBookings());
  };

  const handleRejectSave = () => {
    if (!rejectionTarget) return;
    const reason = rejectionReason.trim();
    if (!reason) {
      setRejectionError('Please add a rejection reason.');
      return;
    }
    updateBookingStatus(rejectionTarget, 'delivery_rejected', reason);
    setBookings(loadBookings());
    setRejectionTarget(null);
    setRejectionReason('');
    setRejectionError('');
  };

  const handleRejectCancel = () => {
    setRejectionTarget(null);
    setRejectionReason('');
    setRejectionError('');
  };

  const handleClear = () => {
    saveBookings([]);
    setBookings([]);
  };

  const handleCopy = async (value: string) => {
    const doFallbackCopy = () => {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    };
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        doFallbackCopy();
      }
      setCopiedId(value);
      setTimeout(() => setCopiedId(''), 1500);
    } catch {
      doFallbackCopy();
      setCopiedId(value);
      setTimeout(() => setCopiedId(''), 1500);
    }
  };

  return (
    <main className="w-full pt-20 min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/60">
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Operations
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mt-2">
                Admin Dashboard
              </h1>
              <p className="text-slate-600 mt-2">
                Monitor bookings, keep statuses accurate, and respond fast.
              </p>
            </div>
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg shadow-slate-900/10">
              <TrashIcon className="w-4 h-4" />
              Clear Dashboard
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 mb-6">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-2xl border p-4 text-left transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10'
                  : 'bg-white/80 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}>
              <div className="text-xs uppercase tracking-wide opacity-70">
                All
              </div>
              <div className="text-2xl font-black">{counts.all}</div>
            </button>
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status.key}
                onClick={() => setStatusFilter(status.key)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  statusFilter === status.key
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10'
                    : 'bg-white/80 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide opacity-70">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${statusDotClass[status.key]}`}
                  />
                  {status.label}
                </div>
                <div className="text-2xl font-black">
                  {counts[status.key]}
                </div>
              </button>
            ))}
          </div>

          <div className="bg-white/90 rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                Filter
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                  <option value="all">All</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.key} value={status.key}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative w-full lg:max-w-sm lg:ml-auto">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tracking ID..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
                />
              </div>
            </div>
          </div>

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-slate-600">
              No bookings yet. New parcels will appear here.
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((booking) => {
              const statusConfig =
                STATUS_OPTIONS.find((s) => s.key === booking.status) ??
                STATUS_OPTIONS[0];
              const lastUpdate =
                booking.statusHistory[booking.statusHistory.length - 1]?.at ??
                booking.createdAt;
              const rate = serviceRates[booking.serviceType] ?? {
                baseHalf: 0,
                baseOne: 0,
                additionalPerKg: 0
              };
              const baseRate =
                booking.weightKg <= 0.5 ? rate.baseHalf : rate.baseOne;
              const extraKg =
                booking.weightKg > 1 ? Math.ceil(booking.weightKg - 1) : 0;
              const extraCharge = extraKg * rate.additionalPerKg;
              const outCityCharge = booking.outOfCity ? 200 : 0;
              const totalAmount = baseRate + extraCharge + outCityCharge;
              return (
                <div
                  key={booking.trackingId}
                  className="bg-white rounded-3xl border border-slate-200 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.5)] p-6 flex flex-col gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Tracking ID
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <p className="text-xl font-black text-slate-900 break-words">
                          {booking.trackingId}
                        </p>
                        <button
                          onClick={() => handleCopy(booking.trackingId)}
                          className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                          <ClipboardIcon className="w-4 h-4" />
                          {copiedId === booking.trackingId ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 break-words">
                        {booking.senderCity} → {booking.receiverCity}
                      </p>
                      <div className="mt-2 text-xs text-slate-500">
                        Created {formatDate(booking.createdAt)} •{' '}
                        {formatTime(booking.createdAt)}
                      </div>
                      <div className="text-xs text-slate-500">
                        Updated {formatDate(lastUpdate)} • {formatTime(lastUpdate)}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide ${statusConfig.badge}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/80">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">
                        Sender
                      </p>
                      <p className="text-base font-semibold text-slate-900 break-words">
                        {booking.senderName || '-'}
                      </p>
                      <p className="text-sm text-slate-600 break-words">
                        {booking.senderPhone || '-'}
                      </p>
                      <p className="text-sm text-slate-600 break-words">
                        {booking.senderCity}
                      </p>
                      <p className="text-sm text-slate-600 break-words">
                        {booking.senderAddress || '-'}
                      </p>
                    </div>
                    <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/80">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">
                        Receiver
                      </p>
                      <p className="text-base font-semibold text-slate-900 break-words">
                        {booking.receiverName || '-'}
                      </p>
                      <p className="text-sm text-slate-600 break-words">
                        {booking.receiverPhone || '-'}
                      </p>
                      <p className="text-sm text-slate-600 break-words">
                        {booking.receiverCity}
                      </p>
                      <p className="text-sm text-slate-600 break-words">
                        {booking.receiverAddress || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 grid-cols-2 md:grid-cols-4 text-sm">
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Service
                      </p>
                      <p className="text-base font-semibold text-slate-900">
                        {booking.serviceTitle}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Weight
                      </p>
                      <p className="text-base font-semibold text-slate-900">
                        {booking.weightKg.toFixed(3)} kg
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        COD
                      </p>
                      <p className="text-base font-semibold text-slate-900">
                        {booking.codAmount ? `Rs. ${booking.codAmount}` : 'Rs. 0'}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Company Amount
                      </p>
                      <p className="text-base font-semibold text-slate-900">
                        Rs. {totalAmount}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                    <div className="text-slate-700">
                      Delivery Code{' '}
                      <span className="text-base font-semibold text-slate-900">
                        {booking.deliveryCode}
                      </span>
                    </div>
                    <select
                      value={booking.status}
                      onChange={(e) =>
                        handleStatusChange(
                          booking,
                          e.target.value as BookingStatusKey
                        )
                      }
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.key} value={status.key}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {booking.status === 'delivery_rejected' &&
                    booking.rejectionReason && (
                      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-sm text-rose-700">
                        <p className="text-xs uppercase tracking-[0.18em] text-rose-400">
                          Rejection Reason
                        </p>
                        <p className="mt-1 font-semibold text-rose-800">
                          {booking.rejectionReason}
                        </p>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {rejectionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-black text-slate-900">
              Add Rejection Reason
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              This reason will be visible to the user on the tracking page.
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
                <p className="text-sm text-rose-600 mt-2">
                  {rejectionError}
                </p>
              )}
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={handleRejectCancel}
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
    </main>
  );
}
