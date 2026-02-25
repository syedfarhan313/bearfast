import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Home } from './pages/Home';
import { Services } from './pages/Services';
import { Tracking } from './pages/Tracking';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { FAQ } from './pages/FAQ';
import { BookParcel } from './pages/BookParcel';
import { Admin } from './pages/Admin';
import { CodAccount } from './pages/CodAccount';
import { CodRegistration } from './pages/CodRegistration';
import { ShipmentLabel } from './pages/ShipmentLabel';
import { Alerts } from './pages/Alerts';

function AppLayout() {
  const location = useLocation();
  const hideChrome = location.pathname === '/label';

  return (
    <div className="min-h-screen flex flex-col">
      {!hideChrome && <Navbar />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/book" element={<BookParcel />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/cod-account" element={<CodAccount />} />
          <Route path="/cod-registration" element={<CodRegistration />} />
          <Route path="/label" element={<ShipmentLabel />} />
          <Route path="/alerts" element={<Alerts />} />
        </Routes>
      </div>
      {!hideChrome && <Footer />}
      {!hideChrome && <FloatingWhatsApp />}
    </div>
  );
}
export function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>);

}
