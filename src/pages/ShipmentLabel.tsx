import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

type LabelParty = {
  name: string;
  phone: string;
  city: string;
  address: string;
  whatsapp?: string;
};

type LabelData = {
  trackingId: string;
  deliveryCode: string;
  service: string;
  weightKg: number;
  codAmount: string;
  outOfCity: boolean;
  bookedAt: string;
  sender: LabelParty;
  receiver: LabelParty;
};

const parseLabelData = (search: string): LabelData | null => {
  const params = new URLSearchParams(search);
  const raw = params.get('data');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LabelData;
  } catch {
    try {
      return JSON.parse(decodeURIComponent(raw)) as LabelData;
    } catch {
      return null;
    }
  }
};

export function ShipmentLabel() {
  const location = useLocation();
  const label = useMemo(() => parseLabelData(location.search), [location.search]);

  if (!label) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-orange-100 bg-white p-8 text-center shadow-xl">
          <img
            src="/WhatsApp Image 2026-02-20 at 3.09.46 PM.jpeg"
            alt="Bear Fast Couriers"
            className="mx-auto h-14 w-28 object-contain"
          />
          <h1 className="mt-6 text-xl font-bold text-slate-800">
            Shipment Details Not Found
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Please scan the QR code again or request a new one.
          </p>
        </div>
      </main>
    );
  }

  const bookedAtLabel = new Date(label.bookedAt).toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-orange-100 bg-white shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-8 py-6">
            <div className="flex items-center gap-4">
              <img
                src="/WhatsApp Image 2026-02-20 at 3.09.46 PM.jpeg"
                alt="Bear Fast Couriers"
                className="h-12 w-24 object-contain"
              />
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-500">
                  Bear Fast Couriers
                </div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Shipment Details
                </h1>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-xs text-slate-500">
              <div>Booked</div>
              <div className="text-sm font-semibold text-slate-700">
                {bookedAtLabel}
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-8 py-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                Tracking
              </div>
              <div className="mt-2 text-xl font-bold text-slate-800">
                {label.trackingId}
              </div>
              <div className="mt-4 text-[11px] uppercase tracking-wide text-slate-500">
                Delivery Code
              </div>
              <div className="mt-1 text-lg font-semibold text-orange-600">
                {label.deliveryCode}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  {label.service}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  {label.weightKg} KG
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  COD {label.codAmount}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Out of City: {label.outOfCity ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                Sender
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-800">
                {label.sender.name}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {label.sender.phone}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {label.sender.city}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {label.sender.address}
              </div>

              <div className="mt-5 text-[11px] uppercase tracking-wide text-slate-500">
                Receiver
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-800">
                {label.receiver.name}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {label.receiver.phone}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {label.receiver.city}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {label.receiver.address}
              </div>
              {label.receiver.whatsapp && label.receiver.whatsapp !== '-' && (
                <div className="mt-1 text-sm text-slate-600">
                  WhatsApp: {label.receiver.whatsapp}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 px-8 py-6 text-center text-xs text-slate-500">
            Keep this page for delivery confirmation and tracking reference.
          </div>
        </div>
      </div>
    </main>
  );
}
