import React from 'react';

export function Services() {
  return (
    <main className="w-full pt-20">
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h1 className="text-4xl lg:text-6xl font-black text-slate-800 mb-4">
              Our Services
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Comprehensive logistics solutions tailored for the unique needs
              of Pakistan&apos;s growing economy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Express Delivery
              </h2>
              <p className="text-slate-600">
                Lightning-fast delivery to all major cities within 24 hours
                guaranteed.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Same Day Delivery
              </h2>
              <p className="text-slate-600">
                Urgent shipments delivered within the same day in select
                metropolitan areas.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                E-Commerce Logistics
              </h2>
              <p className="text-slate-600">
                End-to-end fulfillment solutions integrated with Shopify,
                WooCommerce, and Daraz.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Corporate Solutions
              </h2>
              <p className="text-slate-600">
                Tailored logistics management for businesses with high-volume
                shipping needs.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Fragile Handling
              </h2>
              <p className="text-slate-600">
                Specialized care and packaging for delicate, high-value, or
                sensitive items.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Cash on Delivery
              </h2>
              <p className="text-slate-600">
                Secure and prompt cash collection services with weekly
                settlements.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
