import React from 'react';
import { MessageCircleIcon } from 'lucide-react';
export function FloatingWhatsApp() {
  return (
    <div className="floating-whatsapp fixed bottom-6 right-6 z-50 group">
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Chat with us on WhatsApp
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
      </div>

      {/* Pulse Ring */}
      <div className="absolute inset-0 bg-orange-500 rounded-full animate-pulse-ring" />

      {/* Button */}
      <a
        href="https://wa.me/923341808510"
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center justify-center w-14 h-14 bg-green-500 rounded-full shadow-lg hover:bg-green-600 transition-colors"
        aria-label="Chat on WhatsApp">

        <MessageCircleIcon className="w-6 h-6 text-white" />
      </a>
    </div>);

}
