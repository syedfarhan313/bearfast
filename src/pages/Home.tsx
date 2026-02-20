import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ZapIcon,
  TruckIcon,
  GlobeIcon,
  PackageIcon,
  ShieldCheckIcon,
  RotateCcwIcon,
  BoxesIcon,
  SearchIcon,
  ArrowRightIcon,
  StarIcon,
  CheckCircleIcon,
  ClockIcon,
  HeadphonesIcon,
  MapPinIcon } from
'lucide-react';
export function Home() {
  const [trackingNumber, setTrackingNumber] = useState('');
  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Mobile Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-slate-200 lg:hidden" />
        {/* Diagonal Background */}
        <div
          className="absolute inset-0 bg-white hidden lg:block"
          style={{
            clipPath: 'polygon(0 0, 65% 0, 55% 100%, 0 100%)'
          }} />

        <div
          className="absolute inset-0 bg-slate-800 hidden lg:block"
          style={{
            clipPath: 'polygon(65% 0, 100% 0, 100% 100%, 55% 100%)'
          }} />


        {/* Speed Lines Decoration */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:block">
          <svg
            width="400"
            height="400"
            viewBox="0 0 400 400"
            className="opacity-20">

            <line
              x1="50"
              y1="100"
              x2="350"
              y2="100"
              stroke="#F97316"
              strokeWidth="3" />

            <line
              x1="100"
              y1="150"
              x2="380"
              y2="150"
              stroke="#F97316"
              strokeWidth="2" />

            <line
              x1="80"
              y1="200"
              x2="360"
              y2="200"
              stroke="#F97316"
              strokeWidth="4" />

            <line
              x1="120"
              y1="250"
              x2="390"
              y2="250"
              stroke="#F97316"
              strokeWidth="2" />

            <line
              x1="60"
              y1="300"
              x2="340"
              y2="300"
              stroke="#F97316"
              strokeWidth="3" />

          </svg>
        </div>

        {/* 24HR Badge */}
        <div className="absolute right-20 top-1/3 hidden lg:block z-10">
          <div className="text-center">
            <div className="text-8xl font-black text-orange-500">24</div>
            <div className="text-3xl font-black text-orange-500 -mt-2">HR</div>
            <div className="text-white text-sm font-medium mt-2">
              Express Delivery
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="max-w-2xl text-center lg:text-left">
            {/* Heading */}
            <h1 className="mb-6">
              <span className="block text-4xl sm:text-5xl lg:text-8xl font-black text-slate-800 leading-none">
                Delivering Excellence
              </span>
              <span className="block text-4xl sm:text-5xl lg:text-8xl font-black text-orange-500 leading-none">
                Across Pakistan
              </span>
            </h1>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-10">
              <Link
                to="/book"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">

                Book a Parcel
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link
                to="/tracking"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-transparent text-slate-800 font-bold rounded-full border-2 border-slate-800 hover:bg-slate-800 hover:text-white transition-colors">

                Track Your Parcel
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 text-sm font-semibold rounded-full mb-4">
              OUR SERVICES
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-800 mb-4">
              Our Services
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Comprehensive logistics solutions tailored for the unique needs
              of Pakistan&apos;s growing economy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Service Card 1 */}
            <div className="relative bg-white rounded-xl shadow-md p-6 overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="relative z-10">
                <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <ZapIcon className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Express Delivery
                </h3>
                <p className="text-slate-500 text-sm mb-4">
                  Lightning-fast delivery to all major cities within 24 hours
                  guaranteed.
                </p>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-1 text-orange-500 font-semibold text-sm hover:gap-2 transition-all">

                  Learn More <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Service Card 2 */}
            <div className="relative bg-white rounded-xl shadow-md p-6 overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="relative z-10">
                <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <TruckIcon className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Same Day Delivery
                </h3>
                <p className="text-slate-500 text-sm mb-4">
                  Urgent shipments delivered within the same day in select
                  metropolitan areas.
                </p>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-1 text-orange-500 font-semibold text-sm hover:gap-2 transition-all">

                  Learn More <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Service Card 3 */}
            <div className="relative bg-white rounded-xl shadow-md p-6 overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="relative z-10">
                <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <GlobeIcon className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  E-Commerce Logistics
                </h3>
                <p className="text-slate-500 text-sm mb-4">
                  End-to-end fulfillment solutions integrated with Shopify,
                  WooCommerce, and Daraz.
                </p>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-1 text-orange-500 font-semibold text-sm hover:gap-2 transition-all">

                  Learn More <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Service Card 4 */}
            <div className="relative bg-white rounded-xl shadow-md p-6 overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="relative z-10">
                <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <ShieldCheckIcon className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Corporate Solutions
                </h3>
                <p className="text-slate-500 text-sm mb-4">
                  Tailored logistics management for businesses with high-volume
                  shipping needs.
                </p>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-1 text-orange-500 font-semibold text-sm hover:gap-2 transition-all">

                  Learn More <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Service Card 5 */}
            <div className="relative bg-white rounded-xl shadow-md p-6 overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="relative z-10">
                <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <BoxesIcon className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Fragile Handling
                </h3>
                <p className="text-slate-500 text-sm mb-4">
                  Specialized care and packaging for delicate, high-value, or
                  sensitive items.
                </p>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-1 text-orange-500 font-semibold text-sm hover:gap-2 transition-all">

                  Learn More <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Service Card 6 */}
            <div className="relative bg-white rounded-xl shadow-md p-6 overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="relative z-10">
                <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <RotateCcwIcon className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Cash on Delivery
                </h3>
                <p className="text-slate-500 text-sm mb-4">
                  Secure and prompt cash collection services with weekly
                  settlements.
                </p>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-1 text-orange-500 font-semibold text-sm hover:gap-2 transition-all">

                  Learn More <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center relative">
              <div className="text-5xl font-black text-white mb-2">
                10,000<span className="text-orange-500">+</span>
              </div>
              <div className="text-slate-400 font-medium">
                Deliveries Completed
              </div>
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-16 bg-slate-700" />
            </div>
            <div className="text-center relative">
              <div className="text-5xl font-black text-white mb-2">
                99.2<span className="text-orange-500">%</span>
              </div>
              <div className="text-slate-400 font-medium">On-Time Rate</div>
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-16 bg-slate-700" />
            </div>
            <div className="text-center relative">
              <div className="text-5xl font-black text-white mb-2">
                50<span className="text-orange-500">+</span>
              </div>
              <div className="text-slate-400 font-medium">Cities Covered</div>
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-16 bg-slate-700" />
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-white mb-2">
                24<span className="text-orange-500">/7</span>
              </div>
              <div className="text-slate-400 font-medium">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tracking Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800 rounded-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl lg:text-4xl font-black text-white mb-3">
                Track Your Parcel
              </h2>
              <p className="text-slate-400">
                Enter your tracking number to see real-time delivery status
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-0">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number..."
                className="flex-1 px-6 py-4 text-lg rounded-xl sm:rounded-r-none border-2 border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors" />

              <button className="flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold rounded-xl sm:rounded-l-none hover:bg-orange-600 transition-colors">
                <SearchIcon className="w-5 h-5" />
                Track
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 text-sm font-semibold rounded-full mb-4">
              TESTIMONIALS
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-800 mb-4">
              What Our Customers Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="flex gap-1 mb-4">
                <StarIcon className="w-5 h-5 text-orange-500 fill-orange-500" />
                <StarIcon className="w-5 h-5 text-orange-500 fill-orange-500" />
                <StarIcon className="w-5 h-5 text-orange-500 fill-orange-500" />
                <StarIcon className="w-5 h-5 text-orange-500 fill-orange-500" />
                <StarIcon className="w-5 h-5 text-orange-500 fill-orange-500" />
              </div>
              <p className="text-slate-600 mb-6">
                "Absolutely fantastic service! My package arrived within 3 hours
                of booking. The tracking was spot-on and the driver was very
                professional."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">JD</span>
                </div>
                <div>
                  <div className="font-bold text-slate-800">James Davidson</div>
                  <div className="text-sm text-slate-500">Business Owner</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="flex gap-1 mb-4">
                <StarIcon className="w-5 h-5 text-orange-500 fill-orange-500" />
                <StarIcon className="w-5 h-5 text-orange-500 fill-orange-500" />
                <StarIcon className="w-5 h-5 text-orange-500 fill-orange-500" />
                <StarIcon className="w-5 h-5 text-orange-500 fill-orange-500" />
                <StarIcon className="w-5 h-5 text-orange-500 fill-orange-500" />
              </div>
              <p className="text-slate-600 mb-6">
                "We use BearFast for all our e-commerce deliveries. Their bulk
                pricing is great and the reliability is unmatched. Highly
                recommend!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">SM</span>
                </div>
                <div>
                  <div className="font-bold text-slate-800">Sarah Mitchell</div>
                  <div className="text-sm text-slate-500">
                    E-commerce Manager
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-xl p-8 shadow-md">
              <div className="flex gap-1 mb-4">
                <StarIcon className="w-5 h-5 text-orange-500 fill-orange-500" />
                <StarIcon className="w-5 h-5 text-orange-500 fill-orange-500" />
                <StarIcon className="w-5 h-5 text-orange-500 fill-orange-500" />
                <StarIcon className="w-5 h-5 text-orange-500 fill-orange-500" />
                <StarIcon className="w-5 h-5 text-orange-500 fill-orange-500" />
              </div>
              <p className="text-slate-600 mb-6">
                "Had to send fragile artwork internationally. BearFast handled
                it with extreme care and it arrived in perfect condition.
                Amazing service!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">RT</span>
                </div>
                <div>
                  <div className="font-bold text-slate-800">
                    Robert Thompson
                  </div>
                  <div className="text-sm text-slate-500">Art Collector</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-orange-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
            Ready to Ship?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Get your parcel delivered fast with our reliable courier service.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-orange-500 font-bold rounded-full hover:bg-slate-100 transition-colors shadow-lg">

              Book Now
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>);

}
