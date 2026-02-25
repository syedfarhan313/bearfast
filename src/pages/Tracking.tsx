import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  SearchIcon,
  PackageIcon,
  CheckCircleIcon,
  TruckIcon,
  PackageCheckIcon,
  DollarSignIcon,
  XCircleIcon } from
'lucide-react';
import {
  Booking,
  STATUS_OPTIONS,
  formatDate,
  formatTime,
  getBooking
} from '../utils/bookingStore';
export function Tracking() {
  const location = useLocation();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [notFound, setNotFound] = useState(false);

  const trackNumber = (value: string) => {
    if (!value.trim()) return;
    setIsTracking(true);
    setTimeout(() => {
      const found = getBooking(value.trim());
      setIsTracking(false);
      if (found) {
        setBooking(found);
        setNotFound(false);
      } else {
        setBooking(null);
        setNotFound(true);
      }
    }, 700);
  };

  const handleTrack = () => {
    trackNumber(trackingNumber);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const param = params.get('tracking');
    if (param) {
      setTrackingNumber(param);
      trackNumber(param);
    }
  }, [location.search]);
  return (
    <main className="w-full pt-20 min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-slate-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">
            Track Your <span className="text-orange-500">Parcel</span>
          </h1>
          <p className="text-lg text-slate-400 mb-8">
            Enter your tracking number to see real-time delivery status
          </p>

          {/* Tracking Input */}
          <div className="flex flex-col sm:flex-row gap-0 max-w-2xl mx-auto">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              placeholder="Enter tracking number (e.g., PEW-0427)"
              className="flex-1 px-6 py-4 text-lg rounded-xl sm:rounded-r-none border-2 border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors" />

            <button
              onClick={handleTrack}
              disabled={isTracking}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold rounded-xl sm:rounded-l-none hover:bg-orange-600 transition-colors disabled:opacity-70">

              {isTracking ?
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> :

              <>
                  <SearchIcon className="w-5 h-5" />
                  Track
                </>
              }
            </button>
          </div>
        </div>
      </section>

      {booking && (
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {(() => {
              const statusConfig =
                STATUS_OPTIONS.find((s) => s.key === booking.status) ??
                STATUS_OPTIONS[0];
              const lastUpdate =
                booking.statusHistory[booking.statusHistory.length - 1]?.at ||
                booking.createdAt;
              return (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-500">
                          Tracking Number
                        </p>
                        <p className="text-lg sm:text-xl font-black text-slate-800 break-words">
                          {booking.trackingId}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${statusConfig.badge}`}>
                        <span className="w-2 h-2 rounded-full bg-current" />
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 px-6 py-4 text-sm">
                    <div>
                      <p className="text-slate-500">From</p>
                      <p className="font-semibold text-slate-800 break-words">
                        {booking.senderCity}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">To</p>
                      <p className="font-semibold text-slate-800 break-words">
                        {booking.receiverCity}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Weight</p>
                      <p className="font-semibold text-slate-800">
                        {booking.weightKg.toFixed(3)} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Payment</p>
                      <p className="font-semibold text-slate-800">
                        {booking.codAmount ? 'COD' : 'Prepaid'}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6">
                  <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                    <p className="text-sm text-slate-600">Delivery Code</p>
                    <p className="text-2xl font-black text-slate-800">
                      {booking.deliveryCode}
                    </p>
                    <p className="text-sm text-slate-600 mt-2">
                      Please remember this delivery code. It will be asked at
                      delivery.
                    </p>
                    <p className="text-sm text-slate-600">
                      براہِ کرم یہ ڈیلیوری کوڈ یاد رکھیں، ڈیلیوری کے وقت آپ
                      سے یہ کوڈ پوچھا جائے گا۔
                    </p>
                  </div>
                  {booking.status === 'delivery_rejected' &&
                    booking.rejectionReason && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mt-4">
                        <p className="text-sm font-semibold text-rose-700">
                          Delivery Rejected
                        </p>
                        <p className="text-sm text-rose-600 mt-1">
                          Reason: {booking.rejectionReason}
                        </p>
                      </div>
                    )}
                    <div className="text-xs text-slate-500 mt-3">
                      Created: {formatDate(booking.createdAt)} •{' '}
                      {formatTime(booking.createdAt)} | Last Update:{' '}
                      {formatDate(lastUpdate)} • {formatTime(lastUpdate)}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mt-6 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-6">
                Shipment Progress
              </h2>
              {(() => {
                const normalSteps = [
                  { key: 'pending', icon: PackageIcon },
                  { key: 'confirmed', icon: CheckCircleIcon },
                  { key: 'in_transit', icon: TruckIcon },
                  { key: 'out_for_delivery', icon: TruckIcon },
                  { key: 'delivered', icon: PackageCheckIcon },
                  { key: 'payment_received', icon: DollarSignIcon }
                ] as const;
                const rejectedSteps = [
                  { key: 'pending', icon: PackageIcon },
                  { key: 'confirmed', icon: CheckCircleIcon },
                  { key: 'in_transit', icon: TruckIcon },
                  { key: 'out_for_delivery', icon: TruckIcon },
                  { key: 'delivery_rejected', icon: XCircleIcon }
                ] as const;
                const steps =
                  booking.status === 'delivery_rejected'
                    ? rejectedSteps
                    : normalSteps;
                const currentIndex = Math.max(
                  0,
                  steps.findIndex((step) => step.key === booking.status)
                );
                const isRejected = booking.status === 'delivery_rejected';
                return (
                  <div className="relative">
                  <div
                    className={`grid grid-cols-2 ${
                      steps.length === 5 ? 'md:grid-cols-5' : 'md:grid-cols-6'
                    } gap-6`}>
                    {steps.map((step, index) => {
                      const status =
                        STATUS_OPTIONS.find((s) => s.key === step.key) ??
                        STATUS_OPTIONS[0];
                      const entry = booking.statusHistory.find(
                        (item) => item.status === step.key
                      );
                      const isActive = index === currentIndex;
                      const isDone = index < currentIndex;
                      const Icon = step.icon;
                      return (
                        <div
                          key={step.key}
                          className="flex flex-col items-center text-center">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                              isActive
                                ? isRejected
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200'
                                  : 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                                : isDone
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'bg-slate-100 border-slate-200 text-slate-400'
                              }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                            <div className="mt-3 text-sm font-semibold text-slate-800">
                              {status.label}
                            </div>
                            <div className="text-xs text-slate-500">
                              {entry ? formatDate(entry.at) : '-'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {entry ? formatTime(entry.at) : '-'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => {
                  setBooking(null);
                  setTrackingNumber('');
                  setNotFound(false);
                }}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-colors">
                Track Another Shipment
              </button>
            </div>
          </div>
        </section>
      )}

      {!booking && !notFound && (
        <section className="py-20">
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <PackageIcon className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Enter Your Tracking Number
            </h2>
            <p className="text-slate-500">
              Your tracking number can be found in your confirmation receipt.
            </p>
          </div>
        </section>
      )}

      {notFound && (
        <section className="py-16">
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PackageIcon className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              Tracking ID not found
            </h2>
            <p className="text-slate-500">
              Please check the tracking number and try again.
            </p>
          </div>
        </section>
      )}
    </main>);

}
