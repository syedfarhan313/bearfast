import React from 'react';

const packages = [
  {
    name: 'Silver',
    base: 3000,
    charges: 800,
    accent: 'from-slate-900/80 via-slate-700 to-slate-900/80',
    image: '/WhatsApp Image 2026-02-20 at 2.52.04 PM.jpeg'
  },
  {
    name: 'Gold',
    base: 6500,
    charges: 800,
    accent: 'from-amber-500/80 via-amber-400 to-orange-500/80',
    image: '/WhatsApp Image 2026-02-20 at 2.52.05 PM.jpeg'
  },
  {
    name: 'Diamond',
    base: 9000,
    charges: 800,
    accent: 'from-sky-500/80 via-indigo-500 to-blue-700/80',
    image: '/WhatsApp Image 2026-02-20 at 2.52.05 PM (1).jpeg'
  },
  {
    name: 'Executive',
    base: 12000,
    charges: 800,
    accent: 'from-rose-500/80 via-pink-500 to-red-600/80',
    image: '/WhatsApp Image 2026-02-20 at 2.52.04 PM.jpeg'
  }
];

const WHATSAPP_NUMBER = '923341808510';
const WHATSAPP_MESSAGE = 'I want to open a COD account.';
const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export function CodAccount() {
  return (
    <main className="w-full pt-20 min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/70">
      <section className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Packages + Charges
            </p>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mt-3">
              COD Account
            </h1>
            <p className="text-base lg:text-lg text-slate-600 mt-4 max-w-2xl mx-auto">
              A COD account lets your customers pay cash at delivery while we
              collect, record, and settle payments with your business on time.
              It is designed for e-commerce sellers who want reliable cash flow
              and transparent delivery tracking.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {packages.map((pack) => {
              const total = pack.base + pack.charges;
              return (
                <div
                  key={pack.name}
                  className="bg-white rounded-3xl border border-slate-200 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.5)] overflow-hidden flex flex-col min-h-[560px]">
                  <div
                    className={`h-48 bg-gradient-to-br ${pack.accent} relative`}>
                    <img
                      src={pack.image}
                      alt={`${pack.name} COD card`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-white/10" />
                    <div className="absolute inset-0 flex items-end p-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/90 drop-shadow">
                        {pack.name} Card
                      </span>
                    </div>
                  </div>
                  <div className="p-7 flex-1 flex flex-col gap-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                        Package
                      </p>
                      <h2 className="text-2xl font-black text-slate-900 mt-1">
                        {pack.name}
                      </h2>
                    </div>
                    <div className="grid gap-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Package Fee</span>
                        <span className="font-semibold text-slate-800">
                          Rs. {pack.base}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">
                          Card + Form Charges
                        </span>
                        <span className="font-semibold text-slate-800">
                          Rs. {pack.charges}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                        <span className="text-slate-700 font-semibold">
                          Total
                        </span>
                        <span className="text-lg font-black text-slate-900">
                          Rs. {total}
                        </span>
                      </div>
                    </div>
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto w-full px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors text-center">
                      Open COD Account
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
