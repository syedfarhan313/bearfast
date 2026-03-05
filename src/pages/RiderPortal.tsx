import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  addRiderApplication,
  getRiderByAuthUid,
  getRiderByEmail,
  linkRiderAuth
} from '../utils/riderStore';
import { auth } from '../lib/firebase';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

const STEPS = ['Personal', 'Address & Vehicle', 'Emergency', 'Account'];

type RiderForm = {
  fullName: string;
  fatherName: string;
  dob: string;
  cnic: string;
  mobile: string;
  email: string;
  city: string;
  area: string;
  fullAddress: string;
  postalCode: string;
  vehicleType: 'Bike' | 'Car' | '';
  vehicleNumber: string;
  vehicleModel: string;
  vehicleColor: string;
  vehicleRegistrationNumber: string;
  drivingLicenseNumber: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  password: string;
  confirmPassword: string;
};

const initialForm: RiderForm = {
  fullName: '',
  fatherName: '',
  dob: '',
  cnic: '',
  mobile: '',
  email: '',
  city: '',
  area: '',
  fullAddress: '',
  postalCode: '',
  vehicleType: '',
  vehicleNumber: '',
  vehicleModel: '',
  vehicleColor: '',
  vehicleRegistrationNumber: '',
  drivingLicenseNumber: '',
  emergencyName: '',
  emergencyRelation: '',
  emergencyPhone: '',
  password: '',
  confirmPassword: ''
};

const isEmailValid = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function RiderPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<RiderForm>(initialForm);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const viewState = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const reason = params.get('reason');
    const activeTab =
      tab === 'signup' || tab === 'signin'
        ? tab
        : reason
          ? 'signin'
          : 'choose';
    return { reason, activeTab };
  }, [location.search]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || user.isAnonymous) return;
      try {
        const rider = await getRiderByAuthUid(user.uid);
        if (rider) {
          navigate('/rider-panel', { replace: true });
        }
      } catch {
        // ignore lookup errors here
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!viewState.reason) return;
    if (viewState.reason === 'profile-missing') {
      setLoginError('Rider profile not found. Please contact admin.');
    }
    if (viewState.reason === 'blocked') {
      setLoginError('Your rider account is blocked. Please contact admin.');
    }
  }, [viewState.reason]);

  const openSignup = () => {
    setLoginError('');
    setSubmitError('');
    setSubmitSuccess('');
    navigate('/rider?tab=signup', { replace: true });
  };

  const openSignin = () => {
    setSubmitError('');
    setSubmitSuccess('');
    navigate('/rider?tab=signin', { replace: true });
  };

  const updateField = (
    name: keyof RiderForm,
    value: RiderForm[keyof RiderForm]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    updateField(name as keyof RiderForm, value);
  };

  const handleNext = () => {
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    const email = formData.email.trim().toLowerCase();
    if (!email || !isEmailValid(email)) {
      setSubmitError('Please enter a valid email to continue.');
      return;
    }
    if (!formData.password.trim()) {
      setSubmitError('Please complete the account details to continue.');
      return;
    }
    if (formData.password.length < 8) {
      setSubmitError('Please complete the account details to continue.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      let authUid = auth.currentUser?.uid || '';
      let authEmail = auth.currentUser?.email || '';
      if (!authUid || auth.currentUser?.isAnonymous) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          formData.password
        );
        authUid = credential.user.uid;
        authEmail = credential.user.email || email;
      }
      const nowIso = new Date().toISOString();
      await addRiderApplication({
        status: 'pending',
        createdAt: nowIso,
        authUid,
        authEmail: authEmail || email,
        fullName: formData.fullName.trim(),
        fatherName: formData.fatherName.trim(),
        dob: formData.dob,
        cnic: formData.cnic.trim(),
        mobile: formData.mobile.trim(),
        email,
        city: formData.city.trim(),
        area: formData.area.trim(),
        fullAddress: formData.fullAddress.trim(),
        postalCode: formData.postalCode.trim(),
        vehicleType: (formData.vehicleType || 'Bike') as 'Bike' | 'Car',
        vehicleNumber: formData.vehicleNumber.trim(),
        vehicleModel: formData.vehicleModel.trim(),
        vehicleColor: formData.vehicleColor.trim(),
        vehicleRegistrationNumber: formData.vehicleRegistrationNumber.trim(),
        drivingLicenseNumber: formData.drivingLicenseNumber.trim(),
        emergencyName: formData.emergencyName.trim(),
        emergencyRelation: formData.emergencyRelation.trim(),
        emergencyPhone: formData.emergencyPhone.trim()
      });
      setSubmitSuccess('Application submitted. Redirecting to rider panel...');
      setFormData(initialForm);
      setStep(0);
      setTimeout(() => {
        navigate('/rider-panel');
      }, 800);
    } catch (err) {
      console.error('[Rider] application failed', err);
      setSubmitError('Unable to submit application. Please try again.');
      try {
        if (auth.currentUser) {
          await auth.currentUser.delete();
        }
      } catch {
        // ignore cleanup error
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');
    const email = loginEmail.trim().toLowerCase();
    if (!email || !isEmailValid(email)) {
      setLoginError('Enter a valid email address.');
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError('Password is required.');
      return;
    }
    setLoginLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        loginPassword
      );
      let rider = await getRiderByAuthUid(credential.user.uid);
      if (!rider) {
        const emailMatch = await getRiderByEmail(email);
        if (!emailMatch) {
          setLoginError('Rider account not found.');
          await signOut(auth);
          return;
        }
        if (emailMatch.authUid && emailMatch.authUid !== credential.user.uid) {
          setLoginError('This rider account is linked to another login.');
          await signOut(auth);
          return;
        }
        await linkRiderAuth(
          emailMatch.id,
          credential.user.uid,
          credential.user.email || email
        );
        rider = { ...emailMatch, authUid: credential.user.uid };
      }
      if (rider.status === 'rejected' || rider.status === 'suspended') {
        setLoginError('Your rider account is blocked. Please contact admin.');
        await signOut(auth);
        return;
      }
      navigate('/rider-panel');
    } catch (err) {
      console.error('[Rider] login failed', err);
      setLoginError('Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900">
      <section className="pt-16 sm:pt-24 pb-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-10 shadow-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-center lg:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                  Rider Portal
                </p>
                <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 mt-2">
                  Join Bear Fast Riders
                </h1>
                <p className="text-sm text-slate-500 mt-3 max-w-xl">
                  If your account is approved, click Sign In. If you do not have
                  an account yet, click Sign Up.
                </p>
              </div>
              <div className="grid w-full max-w-md grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 mx-auto lg:mx-0">
                <button
                  onClick={openSignup}
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-colors ${
                    viewState.activeTab === 'signup'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}>
                  Sign Up
                </button>
                <button
                  onClick={openSignin}
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-colors ${
                    viewState.activeTab === 'signin'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}>
                  Sign In
                </button>
              </div>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition w-full sm:w-auto mx-auto lg:mx-0">
                Back to Home
              </Link>
            </div>

            {viewState.activeTab === 'choose' ? (
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                <button
                  onClick={openSignin}
                  className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-left shadow-sm hover:shadow-md transition">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Existing Rider
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-900 mt-2">
                    Sign In
                  </h2>
                  <p className="text-sm text-slate-500 mt-3">
                    Open your rider dashboard and update delivery status.
                  </p>
                </button>
                <button
                  onClick={openSignup}
                  className="rounded-3xl border border-slate-200 bg-slate-900 p-6 sm:p-8 text-left text-white shadow-sm hover:shadow-md transition">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
                    New Rider
                  </p>
                  <h2 className="text-2xl font-semibold mt-2">Sign Up</h2>
                  <p className="text-sm text-slate-200 mt-3">
                    Fill the rider form and get instant dashboard access.
                  </p>
                </button>
              </div>
            ) : viewState.activeTab === 'signup' ? (
              <div className="mt-10">
                <form
                  onSubmit={handleSubmit}
                  className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6 max-w-5xl mx-auto">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Step {step + 1} of {STEPS.length}
                      </p>
                      <h2 className="text-2xl font-semibold text-slate-900 mt-2">
                        {STEPS[step]}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {STEPS.map((_, index) => (
                        <div
                          key={index}
                          className={`h-2.5 w-10 rounded-full ${
                            index <= step ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="min-h-[52px]">
                    {submitError && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {submitError}
                      </div>
                    )}
                    {submitSuccess && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {submitSuccess}
                      </div>
                    )}
                  </div>

                  {step === 0 && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Full Name
                        </label>
                        <input
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Father Name
                        </label>
                        <input
                          name="fatherName"
                          value={formData.fatherName}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="Father name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          name="dob"
                          value={formData.dob}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          CNIC Number
                        </label>
                        <input
                          name="cnic"
                          value={formData.cnic}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="12345-1234567-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Mobile Number
                        </label>
                        <input
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="03xx-xxxxxxx"
                        />
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          City
                        </label>
                        <input
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Area
                        </label>
                        <input
                          name="area"
                          value={formData.area}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="Area"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">
                          Full Address
                        </label>
                        <textarea
                          name="fullAddress"
                          value={formData.fullAddress}
                          onChange={handleChange}
                          rows={3}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="Complete address"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Postal Code
                        </label>
                        <input
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="Postal code"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Vehicle Type
                        </label>
                        <select
                          name="vehicleType"
                          value={formData.vehicleType}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                          <option value="">Select</option>
                          <option value="Bike">Bike</option>
                          <option value="Car">Car</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Vehicle Number
                        </label>
                        <input
                          name="vehicleNumber"
                          value={formData.vehicleNumber}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="Vehicle number"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Vehicle Model
                        </label>
                        <input
                          name="vehicleModel"
                          value={formData.vehicleModel}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="Model"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Vehicle Color
                        </label>
                        <input
                          name="vehicleColor"
                          value={formData.vehicleColor}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="Color"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">
                          Vehicle Registration Number
                        </label>
                        <input
                          name="vehicleRegistrationNumber"
                          value={formData.vehicleRegistrationNumber}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="Registration number"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">
                          Driving License Number
                        </label>
                        <input
                          name="drivingLicenseNumber"
                          value={formData.drivingLicenseNumber}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="License number"
                        />
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Emergency Contact Name
                        </label>
                        <input
                          name="emergencyName"
                          value={formData.emergencyName}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="Name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Relationship
                        </label>
                        <input
                          name="emergencyRelation"
                          value={formData.emergencyRelation}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="Relationship"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">
                          Emergency Phone Number
                        </label>
                        <input
                          name="emergencyPhone"
                          value={formData.emergencyPhone}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="03xx-xxxxxxx"
                        />
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">
                          Email
                        </label>
                        <input
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="name@email.com"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Password
                        </label>
                        <div className="relative mt-2">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-20 text-sm"
                            placeholder="Create password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-700">
                            {showPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Confirm Password
                        </label>
                        <div className="relative mt-2">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-20 text-sm"
                            placeholder="Confirm password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword((prev) => !prev)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-700">
                            {showConfirmPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={step === 0}
                      className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60">
                      Back
                    </button>
                    {step < STEPS.length - 1 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="px-6 py-2.5 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition">
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 transition">
                        {submitting ? 'Submitting...' : 'Submit Application'}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              <div className="mt-10 max-w-xl">
                <form
                  onSubmit={handleLogin}
                  className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Rider Access
                    </p>
                    <h2 className="text-2xl font-semibold text-slate-900 mt-2">
                      Sign In
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">
                      Sign in to open your rider panel and manage deliveries.
                    </p>
                  </div>
                  <div className="min-h-[52px]">
                    {loginError && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {loginError}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Email*
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      placeholder="you@email.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Password*
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      placeholder="Your password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
                    {loginLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
