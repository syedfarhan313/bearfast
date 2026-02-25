import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Building2, Package, Wallet } from 'lucide-react';
import {
  Booking,
  STATUS_OPTIONS,
  formatDate,
  formatTime,
  isCodBooking,
  loadBookings
} from '../utils/bookingStore';
import {
  CodAccountRequest,
  loadCodAccounts,
  loadCodSession
} from '../utils/codAccountStore';
import { FundRequest, loadFundRequests } from '../utils/fundRequestStore';

type Scope = 'admin' | 'user';

const formatMoney = (value: number) =>
  value.toLocaleString('en-PK', { maximumFractionDigits: 0 });

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return `${formatDate(iso)} • ${formatTime(iso)}`;
};

export function Alerts() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const scope = (params.get('scope') || 'user') as Scope;
  const isAdmin = scope === 'admin';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
  const [codAccounts, setCodAccounts] = useState<CodAccountRequest[]>([]);
  const [sessionAccount, setSessionAccount] =
    useState<CodAccountRequest | null>(null);

  useEffect(() => {
    setBookings(loadBookings());
    setFundRequests(loadFundRequests());
    if (isAdmin) {
      setCodAccounts(loadCodAccounts());
    } else {
      setSessionAccount(loadCodSession());
    }
  }, [isAdmin]);

  const adminPendingFunds = useMemo(
    () => fundRequests.filter((request) => request.status === 'pending'),
    [fundRequests]
  );
  const adminPendingAccounts = useMemo(
    () => codAccounts.filter((account) => account.status === 'pending'),
    [codAccounts]
  );
  const adminPendingParcels = useMemo(
    () => bookings.filter((booking) => booking.status === 'pending'),
    [bookings]
  );

  const userFundRequests = useMemo(() => {
    if (!sessionAccount) return [];
    return fundRequests.filter(
      (request) => request.accountId === sessionAccount.id
    );
  }, [fundRequests, sessionAccount]);

  const userBookings = useMemo(() => {
    if (!sessionAccount) return [];
    return bookings.filter((booking) => {
      if (booking.merchantId && booking.merchantId === sessionAccount.id) {
        return true;
      }
      if (
        sessionAccount.email &&
        booking.merchantEmail &&
        booking.merchantEmail.toLowerCase() === sessionAccount.email.toLowerCase()
      ) {
        return true;
      }
      return false;
    });
  }, [bookings, sessionAccount]);

  const recentUserBookings = userBookings.slice(0, 8);
  const recentAdminBookings = adminPendingParcels.slice(0, 8);

  return (
    <main className="min-h-screen bg-slate-50 pt-20 pb-12">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Alerts Center
            </p>
            <h1 className="text-3xl lg:text-4xl font-semibold text-slate-900 mt-2">
              {isAdmin ? 'Admin Alerts' : 'Merchant Alerts'}
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {isAdmin
                ? 'Review pending requests, approvals, and new bookings.'
                : 'Track approvals, wallet requests, and shipment updates.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(isAdmin ? '/admin?tab=cod' : '/cod-registration');
              }
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {isAdmin ? (
          <div className="mt-8 space-y-6">
            <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Fund Requests
                    </h2>
                    <p className="text-sm text-slate-600">
                      Pending wallet top-ups
                    </p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-rose-600">
                  {adminPendingFunds.length} pending
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {adminPendingFunds.length === 0 ? (
                  <div className="text-sm text-slate-600">
                    No pending fund requests.
                  </div>
                ) : (
                  adminPendingFunds.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm text-slate-700">
                      <span className="font-semibold">
                        {request.companyName || 'Merchant'}
                      </span>{' '}
                      (ID: {request.accountId}) requested{' '}
                      <span className="font-semibold">
                        Rs. {formatMoney(request.amount)}
                      </span>{' '}
                      • {formatDateTime(request.createdAt)}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      COD Account Requests
                    </h2>
                    <p className="text-sm text-slate-600">Pending approvals</p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-amber-700">
                  {adminPendingAccounts.length} pending
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {adminPendingAccounts.length === 0 ? (
                  <div className="text-sm text-slate-600">
                    No pending COD accounts.
                  </div>
                ) : (
                  adminPendingAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm text-slate-700">
                      <span className="font-semibold">
                        {account.companyName || 'Merchant'}
                      </span>{' '}
                      (ID: {account.id}) • {account.city || 'City -'} •{' '}
                      {formatDateTime(account.createdAt)}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      New Parcel Bookings
                    </h2>
                    <p className="text-sm text-slate-600">Pending approvals</p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-indigo-700">
                  {adminPendingParcels.length} pending
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {adminPendingParcels.length === 0 ? (
                  <div className="text-sm text-slate-600">
                    No pending parcels.
                  </div>
                ) : (
                  recentAdminBookings.map((booking) => {
                    const badge =
                      STATUS_OPTIONS.find((status) => status.key === booking.status)
                        ?.label || booking.status;
                    return (
                      <div
                        key={booking.trackingId}
                        className="rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm text-slate-700">
                        <span className="font-semibold">
                          {booking.trackingId}
                        </span>{' '}
                        • {booking.senderCity} → {booking.receiverCity} •{' '}
                        {isCodBooking(booking) ? 'COD' : 'Non COD'} • {badge}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Wallet Requests
                    </h2>
                    <p className="text-sm text-slate-600">
                      Your fund request updates
                    </p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-emerald-700">
                  {userFundRequests.length} total
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {userFundRequests.length === 0 ? (
                  <div className="text-sm text-slate-600">
                    No fund requests yet.
                  </div>
                ) : (
                  userFundRequests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-700">
                      Rs. {formatMoney(request.amount)} •{' '}
                      {formatDateTime(request.createdAt)} •{' '}
                      <span className="font-semibold uppercase">
                        {request.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-slate-900/10 text-slate-900 flex items-center justify-center">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Parcel Updates
                    </h2>
                    <p className="text-sm text-slate-600">
                      Latest shipment status updates
                    </p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-700">
                  {recentUserBookings.length} latest
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {recentUserBookings.length === 0 ? (
                  <div className="text-sm text-slate-600">
                    No parcels booked yet.
                  </div>
                ) : (
                  recentUserBookings.map((booking) => {
                    const badge =
                      STATUS_OPTIONS.find((status) => status.key === booking.status)
                        ?.label || booking.status;
                    return (
                      <div
                        key={booking.trackingId}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <span className="font-semibold">
                          {booking.trackingId}
                        </span>{' '}
                        • {booking.senderCity} → {booking.receiverCity} • {badge}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
