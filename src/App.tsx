import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
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
import { AdminLogin } from './pages/AdminLogin';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import { CodAccount } from './pages/CodAccount';
import { CodRegistration } from './pages/CodRegistration';
import { ShipmentLabel } from './pages/ShipmentLabel';
import { Alerts } from './pages/Alerts';
import { auth } from './lib/firebase';
import { isAdminEmail } from './utils/adminAuth';

function AppLayout() {
  const location = useLocation();
  const hideChrome = location.pathname === '/label';
  const [authUser, setAuthUser] = useState<User | null>(null);

  const isAdminArea = useMemo(() => {
    if (location.pathname.startsWith('/admin')) return true;
    if (location.pathname === '/alerts') {
      const params = new URLSearchParams(location.search);
      return params.get('scope') === 'admin';
    }
    return false;
  }, [location.pathname, location.search]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    if (!isAdminEmail(authUser.email)) return;
    if (isAdminArea) return;
    signOut(auth).catch(() => undefined);
  }, [authUser, isAdminArea]);

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
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route element={<ProtectedAdminRoute />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
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
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <AppLayout />
    </BrowserRouter>);

}
