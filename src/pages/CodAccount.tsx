import React from 'react';

const packages = [
  {
    name: 'Silver',
    code: 'SC',
    base: 3000,
    charges: 800,
    accent: 'from-slate-900/90 via-slate-700 to-slate-900/90'
  },
  {
    name: 'Gold',
    code: 'GC',
    base: 6500,
    charges: 800,
    accent: 'from-amber-500/90 via-amber-400 to-orange-500/90'
  },
  {
    name: 'Diamond',
    code: 'DC',
    base: 9000,
    charges: 800,
    accent: 'from-sky-500/90 via-indigo-500 to-blue-700/90'
  },
  {
    name: 'Executive',
    code: 'EC',
    base: 12000,
    charges: 800,
    accent: 'from-rose-500/90 via-pink-500 to-red-600/90'
  }
];

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
              COD Account Plans
            </h1>
            <p className="text-base lg:text-lg text-slate-600 mt-4 max-w-2xl mx-auto">
              Explore the COD account packages and charges below.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {packages.map((pack) => {
              const total = pack.base + pack.charges;
              return (
                <div
                  key={pack.name}
                  className="group relative bg-white rounded-3xl border border-slate-200 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.55)] overflow-hidden flex flex-col transform-gpu transition duration-300 hover:-translate-y-2 hover:shadow-[0_30px_70px_-40px_rgba(15,23,42,0.7)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div
                    className={`relative h-44 bg-gradient-to-br ${pack.accent} overflow-hidden`}>
                    <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute -bottom-12 -right-8 h-40 w-40 rounded-full bg-black/30 blur-3xl" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_55%)]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative h-20 w-20">
                        <div className="absolute inset-0 rounded-full border border-white/45 animate-pulse-ring" />
                        <div className="absolute -inset-3 rounded-full border border-white/25 border-dashed animate-spin [animation-duration:18s]" />
                        <div className="relative h-20 w-20 rounded-full bg-white/20 backdrop-blur border border-white/50 shadow-[inset_0_0_22px_rgba(255,255,255,0.35)] flex items-center justify-center">
                          <span className="text-white text-lg font-black tracking-[0.35em] ml-1">
                            {pack.code}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-3 flex items-center justify-center">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/90 drop-shadow">
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
                        <span className="text-slate-500">Card + Form Charges</span>
                        <span className="font-semibold text-slate-800">
                          Rs. {pack.charges}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                        <span className="text-slate-700 font-semibold">Total</span>
                        <span className="text-lg font-black text-slate-900">
                          Rs. {total}
                        </span>
                      </div>
                    </div>
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
