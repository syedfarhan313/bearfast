import React from 'react';

export function About() {
  return (
    <main className="w-full pt-20">
      {/* Hero */}
      <section className="bg-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 bg-orange-500/20 text-orange-400 text-sm font-semibold rounded-full mb-4">
              COVERAGE
            </span>
            <h1 className="text-4xl lg:text-6xl font-black text-white mb-4">
              Coverage
            </h1>
            <p className="text-xl text-slate-400">
              See where we deliver across Pakistan.
            </p>
          </div>
        </div>
      </section>

      {/* Coverage Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-black text-slate-800 mb-4">
                Our Coverage
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Connecting Pakistan from coast to capital.
              </p>
              <p className="text-lg text-slate-600 mb-10">
                With over 200 service points and a dedicated fleet, we ensure
                your packages reach the remotest corners of the country. From
                the bustling streets of Karachi to the mountains of the north.
              </p>
              <div className="grid grid-cols-2 gap-6 max-w-md">
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="text-4xl font-black text-orange-500 mb-2">
                    50+
                  </div>
                  <div className="text-slate-700 font-semibold">
                    Major Cities
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="text-4xl font-black text-orange-500 mb-2">
                    200+
                  </div>
                  <div className="text-slate-700 font-semibold">
                    Service Points
                  </div>
                </div>
              </div>
            </div>

            {/* 3D Live Map */}
            <div className="relative">
              <div className="absolute -top-10 -right-8 w-32 h-32 bg-orange-500/15 rounded-full blur-3xl" />
              <div className="absolute -bottom-12 -left-10 w-40 h-40 bg-slate-900/20 rounded-full blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.06),transparent_45%)]" />

              <div className="relative rounded-[28px] p-[1px] bg-gradient-to-br from-orange-500/40 via-orange-500/10 to-slate-700/40 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)]">
                <div className="bg-slate-950/95 rounded-[27px] p-6 border border-white/5 backdrop-blur">
                  <div
                    className="relative h-80 rounded-2xl overflow-hidden border border-white/5 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]"
                    style={{
                      transform: 'perspective(1000px) rotateX(8deg) rotateZ(-0.8deg)',
                      transformStyle: 'preserve-3d'
                    }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
                    <div
                      className="absolute inset-0 opacity-35"
                      style={{
                        backgroundImage:
                          'linear-gradient(0deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
                        backgroundSize: '70px 70px'
                      }}
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(249,115,22,0.25),transparent_50%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_70%,rgba(14,165,233,0.18),transparent_45%)]" />
                    <div
                      className="absolute -left-1/2 top-0 h-full w-1/2 opacity-40 blur-xl"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                        transform: 'skewX(-15deg)'
                      }}
                    />

                    {/* City Nodes */}
                    <div className="absolute inset-0">
                      <div className="absolute left-[18%] top-[30%] flex flex-col items-start">
                        <span className="relative flex h-3 w-3 drop-shadow-[0_0_8px_rgba(249,115,22,0.7)]">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
                        </span>
                        <span className="mt-2 inline-flex rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-200 border border-white/10 backdrop-blur-sm">
                          Peshawar
                        </span>
                      </div>
                      <div className="absolute left-[24%] top-[38%] flex flex-col items-start">
                        <span className="relative flex h-3 w-3 drop-shadow-[0_0_8px_rgba(249,115,22,0.7)]">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
                        </span>
                        <span className="mt-2 inline-flex rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-200 border border-white/10 backdrop-blur-sm">
                          Swabi
                        </span>
                      </div>
                      <div className="absolute left-[14%] top-[48%] flex flex-col items-start">
                        <span className="relative flex h-3 w-3 drop-shadow-[0_0_8px_rgba(249,115,22,0.7)]">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
                        </span>
                        <span className="mt-2 inline-flex rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-200 border border-white/10 backdrop-blur-sm">
                          Bannu
                        </span>
                      </div>
                      <div className="absolute left-[46%] top-[42%] flex flex-col items-start">
                        <span className="relative flex h-3 w-3 drop-shadow-[0_0_8px_rgba(249,115,22,0.7)]">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
                        </span>
                        <span className="mt-2 inline-flex rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-200 border border-white/10 backdrop-blur-sm">
                          Islamabad
                        </span>
                      </div>
                      <div className="absolute left-[50%] top-[48%] flex flex-col items-start">
                        <span className="relative flex h-3 w-3 drop-shadow-[0_0_8px_rgba(249,115,22,0.7)]">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
                        </span>
                        <span className="mt-2 inline-flex rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-200 border border-white/10 backdrop-blur-sm">
                          Rawalpindi
                        </span>
                      </div>
                      <div className="absolute left-[56%] top-[58%] flex flex-col items-start">
                        <span className="relative flex h-3 w-3 drop-shadow-[0_0_8px_rgba(249,115,22,0.7)]">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
                        </span>
                        <span className="mt-2 inline-flex rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-200 border border-white/10 backdrop-blur-sm">
                          Lahore
                        </span>
                      </div>
                      <div className="absolute left-[62%] top-[70%] flex flex-col items-start">
                        <span className="relative flex h-3 w-3 drop-shadow-[0_0_8px_rgba(249,115,22,0.7)]">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
                        </span>
                        <span className="mt-2 inline-flex rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-200 border border-white/10 backdrop-blur-sm">
                          Multan
                        </span>
                      </div>
                      <div className="absolute left-[58%] top-[86%] flex flex-col items-start">
                        <span className="relative flex h-3 w-3 drop-shadow-[0_0_8px_rgba(249,115,22,0.7)]">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
                        </span>
                        <span className="mt-2 inline-flex rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-200 border border-white/10 backdrop-blur-sm">
                          Karachi
                        </span>
                      </div>
                    </div>

                    {/* Route Lines */}
                    <svg
                      className="absolute inset-0 w-full h-full opacity-60"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none">
                      <path
                        d="M18 30 L46 42 L58 58 L62 70 L58 86"
                        fill="none"
                        stroke="rgba(249,115,22,0.6)"
                        strokeWidth="0.7"
                        strokeDasharray="2 2"
                      />
                      <path
                        d="M14 48 L24 38 L46 42"
                        fill="none"
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth="0.5"
                        strokeDasharray="1.5 2"
                      />
                    </svg>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-300">
                    <span className="px-3 py-1 rounded-full bg-white/8 border border-white/10">
                      Live Network
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/8 border border-white/10">
                      200+ Points
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/8 border border-white/10">
                      Nationwide Reach
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
