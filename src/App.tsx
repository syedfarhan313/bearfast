import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import { auth } from './lib/firebase';
import { isAdminEmail } from './utils/adminAuth';

const Home = React.lazy(() =>
  import('./pages/Home').then((mod) => ({ default: mod.Home }))
);
const Services = React.lazy(() =>
  import('./pages/Services').then((mod) => ({ default: mod.Services }))
);
const Tracking = React.lazy(() =>
  import('./pages/Tracking').then((mod) => ({ default: mod.Tracking }))
);
const About = React.lazy(() =>
  import('./pages/About').then((mod) => ({ default: mod.About }))
);
const Contact = React.lazy(() =>
  import('./pages/Contact').then((mod) => ({ default: mod.Contact }))
);
const FAQ = React.lazy(() =>
  import('./pages/FAQ').then((mod) => ({ default: mod.FAQ }))
);
const BookParcel = React.lazy(() =>
  import('./pages/BookParcel').then((mod) => ({ default: mod.BookParcel }))
);
const Admin = React.lazy(() =>
  import('./pages/Admin').then((mod) => ({ default: mod.Admin }))
);
const AdminLogin = React.lazy(() =>
  import('./pages/AdminLogin').then((mod) => ({ default: mod.AdminLogin }))
);
const CodAccount = React.lazy(() =>
  import('./pages/CodAccount').then((mod) => ({ default: mod.CodAccount }))
);
const CodRegistration = React.lazy(() =>
  import('./pages/CodRegistration').then((mod) => ({
    default: mod.CodRegistration
  }))
);
const ShipmentLabel = React.lazy(() =>
  import('./pages/ShipmentLabel').then((mod) => ({
    default: mod.ShipmentLabel
  }))
);
const Alerts = React.lazy(() =>
  import('./pages/Alerts').then((mod) => ({ default: mod.Alerts }))
);

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
        <Suspense
          fallback={
            <div className="min-h-[50vh] flex items-center justify-center text-slate-500 text-sm">
              Loading...
            </div>
          }>
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
        </Suspense>
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
