import React from 'react';
import { Link } from 'react-router-dom';
import { ZapIcon, MailIcon, PhoneIcon, MapPinIcon, MusicIcon } from 'lucide-react';
export function Footer() {
  return (
    <footer className="bg-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-1.5 mb-4">
              <ZapIcon className="w-6 h-6 text-orange-500" />
              <span className="text-xl font-black">
                <span className="text-white">BearFast</span>
                <span className="text-orange-500">Couriers</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Your trusted partner for fast, reliable courier services across
              the UK. Same-day and next-day delivery guaranteed.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.tiktok.com/@bearfastcouriers2025?_r=1&_t=ZS-9484wxNCb9F"
                className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors"
                aria-label="TikTok"
                target="_blank"
                rel="noreferrer">

                <MusicIcon className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/@BEARFASTCOURIERS"
                className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors"
                aria-label="YouTube"
                target="_blank"
                rel="noreferrer">

                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24">

                  <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 00.5 6.2 31.3 31.3 0 000 12a31.3 31.3 0 00.5 5.8 3 3 0 002.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 002.1-2.1A31.3 31.3 0 0024 12a31.3 31.3 0 00-.5-5.8zM9.6 15.6V8.4l6.4 3.6-6.4 3.6z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/BEARFASTCOURIERS"
                className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors"
                aria-label="Facebook">

                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24">

                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors"
                aria-label="Twitter">

                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24">

                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors"
                aria-label="Instagram">

                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24">

                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/services"
                  className="text-slate-400 hover:text-orange-500 transition-colors text-sm">

                  Our Services
                </Link>
              </li>
              <li>
                <Link
                  to="/tracking"
                  className="text-slate-400 hover:text-orange-500 transition-colors text-sm">

                  Track Parcel
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-slate-400 hover:text-orange-500 transition-colors text-sm">

                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-slate-400 hover:text-orange-500 transition-colors text-sm">

                  Coverage
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-4">Services</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-slate-400 text-sm">Same Delivery</span>
              </li>
              <li>
                <span className="text-slate-400 text-sm">Nest Delivery</span>
              </li>
              <li>
                <span className="text-slate-400 text-sm">
                  International Shipping
                </span>
              </li>
              <li>
                <span className="text-slate-400 text-sm">Fragile Items</span>
              </li>
              <li>
                <span className="text-slate-400 text-sm">Bulk Orders</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-400 text-sm">
                  123 Courier Street, London, EC1A 1BB
                </span>
              </li>
              <li className="flex items-center gap-3">
                <PhoneIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <a
                  href="tel:+441234567890"
                  className="text-slate-400 hover:text-orange-500 transition-colors text-sm">

                  +44 123 456 7890
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MailIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <a
                  href="mailto:hello@bearfast.co.uk"
                  className="text-slate-400 hover:text-orange-500 transition-colors text-sm">

                  hello@bearfast.co.uk
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © 2024 BearFast Couriers. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-slate-400 hover:text-orange-500 transition-colors text-sm">

              Privacy Policy
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-orange-500 transition-colors text-sm">

              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>);

}
