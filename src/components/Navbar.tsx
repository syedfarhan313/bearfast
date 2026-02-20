import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ZapIcon, MenuIcon, XIcon } from 'lucide-react';
export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const navLinks = [
  {
    name: 'Home',
    path: '/'
  },
  {
    name: 'Services',
    path: '/services'
  },
  {
    name: 'COD Account',
    path: '/cod-account'
  },
  {
    name: 'Tracking',
    path: '/tracking'
  },
  {
    name: 'Coverage',
    path: '/about'
  },
  {
    name: 'Contact',
    path: '/contact'
  }];

  const isActive = (path: string) => location.pathname === path;
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-white/95'}`}>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="h-12 w-24 md:h-16 md:w-32">
              <img
                src="/WhatsApp Image 2026-02-20 at 3.09.46 PM.jpeg"
                alt="Bear Fast Couriers"
                className="h-full w-full object-contain"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) =>
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors ${isActive(link.path) ? 'text-orange-500' : 'text-slate-600 hover:text-orange-500'}`}>

                {link.name}
              </Link>
            )}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Link
              to="/book"
              className="inline-flex items-center px-5 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-full hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">

              Book a Parcel
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-orange-500 transition-colors"
            aria-label="Toggle menu">

            {isMobileMenuOpen ?
            <XIcon className="w-6 h-6" /> :

            <MenuIcon className="w-6 h-6" />
            }
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'}`}>

          <div className="flex flex-col gap-2 pt-2">
            {navLinks.map((link) =>
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.path) ? 'bg-orange-50 text-orange-500' : 'text-slate-600 hover:bg-slate-50'}`}>

                {link.name}
              </Link>
            )}
            <Link
              to="/book"
              onClick={() => setIsMobileMenuOpen(false)}
              className="mx-4 mt-2 text-center px-5 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-full hover:bg-orange-600 transition-colors">

              Book a Parcel
            </Link>
          </div>
        </div>
      </div>
    </nav>);

}
