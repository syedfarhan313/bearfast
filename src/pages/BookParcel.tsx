import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { addBooking, loadBookings } from '../utils/bookingStore';
import {
  CodAccountRequest,
  adjustCodAccountWallet,
  loadCodSession
} from '../utils/codAccountStore';

export function BookParcel() {
  const [serviceType, setServiceType] = useState('overnight');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [deliveryCode, setDeliveryCode] = useState('');
  const [copiedTrackingId, setCopiedTrackingId] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [labelPayload, setLabelPayload] = useState('');
  const [autoDownloadDone, setAutoDownloadDone] = useState(false);
  const [sessionAccount, setSessionAccount] =
    useState<CodAccountRequest | null>(null);
  const [bookingError, setBookingError] = useState('');
  const [formData, setFormData] = useState({
    senderName: '',
    senderPhone: '',
    senderCity: 'Islamabad',
    senderAddress: '',
    receiverName: '',
    receiverPhone: '',
    receiverWhatsapp: '',
    receiverCity: 'Karachi',
    receiverAddress: '',
    packageWeight: '0',
    packageWeightGrams: '500',
    outOfCity: false,
    codAmount: ''
  });

  useEffect(() => {
    const session = loadCodSession();
    if (session) {
      setSessionAccount(session);
      setFormData((prev) => ({
        ...prev,
        senderName: prev.senderName || session.contactName || session.companyName,
        senderPhone: prev.senderPhone || session.phone,
        senderCity: prev.senderCity || session.city || 'Islamabad',
        senderAddress: prev.senderAddress || session.address
      }));
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value
    }));
  };

  const handleKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      packageWeight: value,
      packageWeightGrams:
        Number(value) > 0 ? '0' : prev.packageWeightGrams
    }));
  };

  const handleGramsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      packageWeightGrams: value,
      packageWeight: Number(value) > 0 ? '0' : prev.packageWeight
    }));
  };

  const CITY_CODE_MAP: Record<string, string> = {
    islamabad: 'ISB',
    rawalpindi: 'RWP',
    lahore: 'LHR',
    karachi: 'KHI',
    multan: 'MUX',
    peshawar: 'PEW',
    swabi: 'SWB',
    bannu: 'BNP'
  };

  const getCityCode = (city: string) => {
    const normalized = city.trim().toLowerCase();
    if (CITY_CODE_MAP[normalized]) return CITY_CODE_MAP[normalized];
    const lettersOnly = normalized.replace(/[^a-z]/g, '');
    if (lettersOnly.length >= 3) return lettersOnly.slice(0, 3).toUpperCase();
    if (lettersOnly.length > 0) return lettersOnly.toUpperCase();
    return 'PKG';
  };

  const generateTrackingId = (city: string) => {
    const code = getCityCode(city);
    const bookings = loadBookings();
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const num = Math.floor(Math.random() * 10000);
      const suffix = String(num).padStart(4, '0');
      const candidate = `${code}-${suffix}`;
      if (!bookings.some((booking) => booking.trackingId === candidate)) {
        return candidate;
      }
    }
    const fallback = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `${code}-${fallback}`;
  };

  const generateDeliveryCode = () =>
    String(Math.floor(100000 + Math.random() * 900000));

  const buildWhatsappLink = (code: string) => {
    const number = formData.receiverWhatsapp.replace(/\D/g, '');
    if (number.length <= 5) return '';
    const message = encodeURIComponent(
      `Delivery Code: ${code}\nPlease remember this delivery code. It will be asked at delivery.\nبراہِ کرم یہ ڈیلیوری کوڈ یاد رکھیں، ڈیلیوری کے وقت آپ سے یہ کوڈ پوچھا جائے گا۔`
    );
    return `https://wa.me/${number}?text=${message}`;
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !trackingId) return;
    const link = document.createElement('a');
    link.download = `bearfast-qr-${trackingId}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  useEffect(() => {
    if (!isModalOpen || !labelPayload) return;
    let isActive = true;
    QRCode.toDataURL(labelPayload, { margin: 1, width: 220 })
      .then((url) => {
        if (isActive) setQrDataUrl(url);
      })
      .catch(() => {
        if (isActive) setQrDataUrl('');
      });
    return () => {
      isActive = false;
    };
  }, [isModalOpen, labelPayload]);

  useEffect(() => {
    if (!isModalOpen || autoDownloadDone) return;
    if (!qrDataUrl || !trackingId) return;
    const timer = window.setTimeout(() => {
      handleDownloadQr();
      setAutoDownloadDone(true);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [isModalOpen, qrDataUrl, trackingId, autoDownloadDone]);

  const handleConfirmBooking = () => {
    if (sessionAccount && sessionAccount.status !== 'approved') {
      setBookingError(
        'Your COD account is not approved yet. Booking is locked until approval.'
      );
      return;
    }
    setBookingError('');
    const newTrackingId = generateTrackingId(formData.receiverCity);
    const newDeliveryCode = generateDeliveryCode();
    const nowIso = new Date().toISOString();
    const payloadObject = {
      trackingId: newTrackingId,
      deliveryCode: newDeliveryCode,
      service: selectedService.title,
      weightKg: Number(weightKg.toFixed(3)),
      codAmount: formData.codAmount || '0',
      outOfCity: formData.outOfCity,
      bookedAt: nowIso,
      sender: {
        name: formData.senderName || '-',
        phone: formData.senderPhone || '-',
        city: formData.senderCity || '-',
        address: formData.senderAddress || '-'
      },
      receiver: {
        name: formData.receiverName || '-',
        phone: formData.receiverPhone || '-',
        whatsapp: formData.receiverWhatsapp || '-',
        city: formData.receiverCity || '-',
        address: formData.receiverAddress || '-'
      }
    };
    const encodedPayload = encodeURIComponent(JSON.stringify(payloadObject));
    const envBase = (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined) || '';
    const baseUrl = envBase.trim()
      ? envBase.trim().replace(/\/+$/, '')
      : window.location.origin;
    const payload = `${baseUrl}/label?data=${encodedPayload}`;
    if (sessionAccount) {
      const updated = adjustCodAccountWallet(sessionAccount.id, -totalCharge);
      if (updated) {
        setSessionAccount(updated);
      }
    }
    addBooking({
      trackingId: newTrackingId,
      deliveryCode: newDeliveryCode,
      status: 'pending',
      statusHistory: [{ status: 'pending', at: nowIso }],
      isCod: Boolean(sessionAccount),
      merchantId: sessionAccount?.id,
      merchantEmail: sessionAccount?.email,
      merchantName: sessionAccount?.companyName,
      merchantPlan: sessionAccount?.planName,
      merchantCity: sessionAccount?.city,
      shippingCharge: totalCharge,
      senderName: formData.senderName,
      senderPhone: formData.senderPhone,
      senderCity: formData.senderCity,
      senderAddress: formData.senderAddress,
      receiverName: formData.receiverName,
      receiverPhone: formData.receiverPhone,
      receiverWhatsapp: formData.receiverWhatsapp,
      receiverCity: formData.receiverCity,
      receiverAddress: formData.receiverAddress,
      weightKg: Number(weightKg.toFixed(3)),
      serviceType: selectedService.id,
      serviceTitle: selectedService.title,
      codAmount: formData.codAmount,
      outOfCity: formData.outOfCity,
      createdAt: nowIso
    });
    setTrackingId(newTrackingId);
    setDeliveryCode(newDeliveryCode);
    setQrDataUrl('');
    setAutoDownloadDone(false);
    setLabelPayload(payload);
    setIsModalOpen(true);
  };

  const handleCopyTrackingId = async () => {
    if (!trackingId) return;
    const doFallbackCopy = () => {
      const textarea = document.createElement('textarea');
      textarea.value = trackingId;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    };
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(trackingId);
      } else {
        doFallbackCopy();
      }
      setCopiedTrackingId(true);
      setTimeout(() => setCopiedTrackingId(false), 1500);
    } catch {
      doFallbackCopy();
      setCopiedTrackingId(true);
      setTimeout(() => setCopiedTrackingId(false), 1500);
    }
  };

  const resetForm = () => {
    setServiceType('overnight');
    setFormData({
      senderName: '',
      senderPhone: '',
      senderCity: 'Islamabad',
      senderAddress: '',
      receiverName: '',
      receiverPhone: '',
      receiverWhatsapp: '',
      receiverCity: 'Karachi',
      receiverAddress: '',
      packageWeight: '0',
      packageWeightGrams: '500',
      outOfCity: false,
      codAmount: ''
    });
  };

  const serviceOptions = [
    {
      id: 'super-flash',
      title: 'Super Flash',
      time: 'Same Day / Fastest',
      baseHalf: 400,
      baseOne: 560,
      additionalPerKg: 400
    },
    {
      id: 'overnight',
      title: 'Overnight',
      time: 'Nest Day',
      baseHalf: 320,
      baseOne: 460,
      additionalPerKg: 300
    },
    {
      id: '3-7-day',
      title: '3-7 Day Delivery',
      time: 'Normal',
      baseHalf: 220,
      baseOne: 360,
      additionalPerKg: 200
    },
    {
      id: 'next-day',
      title: 'Nest Day Delivery',
      time: 'Nest Day',
      baseHalf: 150,
      baseOne: 260,
      additionalPerKg: 150
    }
  ];

  const selectedService =
    serviceOptions.find((option) => option.id === serviceType) ??
    serviceOptions[1];

  const kgValue = Number(formData.packageWeight) || 0;
  const gramsValue = Number(formData.packageWeightGrams) || 0;
  const weightKg = kgValue + gramsValue / 1000;
  const isHalfKgOrLess = !Number.isNaN(weightKg) && weightKg <= 0.5;

  const showHalfKgRates = isHalfKgOrLess;
  const showOneKgRates = !isHalfKgOrLess;

  const baseRate = isHalfKgOrLess
    ? selectedService.baseHalf
    : selectedService.baseOne;

  const extraKg =
    !Number.isNaN(weightKg) && weightKg > 1
      ? Math.ceil(weightKg - 1)
      : 0;
  const extraCharge = extraKg * selectedService.additionalPerKg;
  const outOfCityCharge = formData.outOfCity ? 200 : 0;
  const totalCharge = baseRate + extraCharge + outOfCityCharge;

  const weightLabel =
    !Number.isNaN(weightKg) && weightKg > 0
      ? `${weightKg.toFixed(3)} KG`
      : '-';
  const codLabel = formData.codAmount ? `Rs. ${formData.codAmount}` : 'Rs. 0';
  const baseLabel = `Rs. ${baseRate}`;
  const extraLabel = extraCharge ? `Rs. ${extraCharge}` : 'Rs. 0';
  const outOfCityLabel = outOfCityCharge
    ? `Rs. ${outOfCityCharge}`
    : 'Rs. 0';
  const totalLabel = `Rs. ${totalCharge}`;
  const walletBalance = sessionAccount
    ? sessionAccount.walletBalance ?? sessionAccount.planTotal ?? 0
    : null;
  const balanceAfter =
    walletBalance !== null ? walletBalance - totalCharge : null;
  const walletLabel =
    walletBalance !== null
      ? `Rs. ${walletBalance.toLocaleString('en-PK', {
          maximumFractionDigits: 0
        })}`
      : '';
  const balanceAfterLabel =
    balanceAfter !== null
      ? `Rs. ${balanceAfter.toLocaleString('en-PK', {
          maximumFractionDigits: 0
        })}`
      : '';
  const whatsappLink = buildWhatsappLink(deliveryCode);
  return (
    <main className="w-full pt-20 min-h-screen bg-slate-50">
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left Form Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Sender Details */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">
                  Sender Details
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="senderName"
                      value={formData.senderName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="senderPhone"
                      value={formData.senderPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="+92 300 1234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      City
                    </label>
                    <select
                      name="senderCity"
                      value={formData.senderCity}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option>Islamabad</option>
                      <option>Lahore</option>
                      <option>Karachi</option>
                      <option>Rawalpindi</option>
                      <option>Multan</option>
                      <option>Peshawar</option>
                      <option>Swabi</option>
                      <option>Bannu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Pickup Address
                    </label>
                    <input
                      type="text"
                      name="senderAddress"
                      value={formData.senderAddress}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="House & Street, Area"
                    />
                  </div>
                </div>
              </div>

              {/* Receiver Details */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">
                  Receiver Details
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="receiverName"
                      value={formData.receiverName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Receiver name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="receiverPhone"
                      value={formData.receiverPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="+92 300 7654321"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      WhatsApp Number (Optional)
                    </label>
                    <input
                      type="tel"
                      name="receiverWhatsapp"
                      value={formData.receiverWhatsapp}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="+92 300 7654321"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      City
                    </label>
                    <select
                      name="receiverCity"
                      value={formData.receiverCity}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option>Karachi</option>
                      <option>Lahore</option>
                      <option>Islamabad</option>
                      <option>Rawalpindi</option>
                      <option>Multan</option>
                      <option>Peshawar</option>
                      <option>Swabi</option>
                      <option>Bannu</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      name="receiverAddress"
                      value={formData.receiverAddress}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="House & Street, Area"
                    />
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">
                  Package Details
                </h2>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      name="packageWeight"
                      value={formData.packageWeight}
                      onChange={handleKgChange}
                      disabled={gramsValue > 0}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Weight (grams)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="packageWeightGrams"
                      value={formData.packageWeightGrams}
                      onChange={handleGramsChange}
                      disabled={kgValue > 0}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Service Type
                  </label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {serviceOptions.map((option) => {
                      const displayRate = isHalfKgOrLess
                        ? option.baseHalf
                        : option.baseOne;
                      return (
                        <label
                          key={option.id}
                          className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                            serviceType === option.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}>
                          <input
                            type="radio"
                            name="serviceType"
                            value={option.id}
                            className="sr-only"
                            checked={serviceType === option.id}
                            onChange={() => setServiceType(option.id)}
                          />
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-slate-800">
                                {option.title}
                              </div>
                              <div className="text-xs text-slate-500">
                                {option.time}
                              </div>
                            </div>
                            <div className="text-sm font-bold text-slate-800">
                              Rs. {displayRate}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="outOfCity"
                      name="outOfCity"
                      checked={formData.outOfCity}
                      onChange={handleChange}
                      className="w-5 h-5 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="outOfCity" className="text-slate-700">
                      OSA
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      COD Amount (Shop)
                    </label>
                    <input
                      type="number"
                      name="codAmount"
                      value={formData.codAmount}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Intercity Rate List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">
                  Intercity Rate List
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  Rates are shown based on your weight selection.
                </p>

                {showHalfKgRates && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {serviceOptions.map((option) => (
                      <div
                        key={`half-${option.id}`}
                        className="border border-slate-200 rounded-xl p-4">
                        <div className="text-sm font-semibold text-slate-800">
                          {option.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {option.time}
                        </div>
                        <div className="text-xl font-bold text-slate-800 mt-2">
                          Rs. {option.baseHalf}/-
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showOneKgRates && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {serviceOptions.map((option) => (
                      <div
                        key={`one-${option.id}`}
                        className="border border-slate-200 rounded-xl p-4">
                        <div className="text-sm font-semibold text-slate-800">
                          {option.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {option.time}
                        </div>
                        <div className="text-xs text-slate-500 mt-2">
                          Base Rate (1 KG)
                        </div>
                        <div className="text-xl font-bold text-slate-800 mt-2">
                          Rs. {option.baseOne}/-
                        </div>
                        <div className="text-xs text-slate-500 mt-2">
                          Additional Charges per KG
                        </div>
                        <div className="text-sm text-slate-700">
                          +{option.additionalPerKg}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-4">
                  Out of city charges: Rs. 200
                </p>
              </div>
            </div>

            {/* Right Summary Column */}
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl">
                  <h3 className="text-lg font-bold mb-4">Order Summary</h3>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Sender Name</span>
                    <span className="text-white">
                      {formData.senderName || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sender Phone</span>
                    <span className="text-white">
                      {formData.senderPhone || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pickup City</span>
                    <span className="text-white">
                      {formData.senderCity || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pickup Address</span>
                    <span className="text-white">
                      {formData.senderAddress || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Receiver Name</span>
                    <span className="text-white">
                      {formData.receiverName || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Receiver Phone</span>
                    <span className="text-white">
                      {formData.receiverPhone || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>WhatsApp</span>
                    <span className="text-white">
                      {formData.receiverWhatsapp || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Destination City</span>
                    <span className="text-white">{formData.receiverCity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delivery Address</span>
                    <span className="text-white">
                      {formData.receiverAddress || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Service</span>
                    <span className="text-white">{selectedService.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Weight</span>
                    <span className="text-white">{weightLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Base</span>
                    <span className="text-white">{baseLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Additional Charges</span>
                    <span className="text-white">{extraLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Out of City</span>
                    <span className="text-white">{outOfCityLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>COD Amount</span>
                    <span className="text-orange-300 font-semibold">
                      {codLabel}
                    </span>
                  </div>
                </div>
                <div className="border-t border-white/10 my-4" />
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-orange-400">{totalLabel}</span>
                </div>
                {walletBalance !== null && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between">
                      <span>Wallet Balance</span>
                      <span className="text-white font-semibold">
                        {walletLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span>After Booking</span>
                      <span className="text-white font-semibold">
                        {balanceAfterLabel}
                      </span>
                    </div>
                  </div>
                )}
                  {bookingError && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                      {bookingError}
                    </div>
                  )}
                  <button
                    onClick={handleConfirmBooking}
                    disabled={Boolean(sessionAccount && sessionAccount.status !== 'approved')}
                    className={`w-full mt-6 px-4 py-3 rounded-xl font-semibold transition-colors ${
                      sessionAccount && sessionAccount.status !== 'approved'
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-orange-500 hover:bg-orange-600'
                    }`}>
                    Confirm Booking
                  </button>
                  <p className="mt-3 text-xs text-slate-400">
                    Final price varies by weight and out-of-city delivery.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">
                Tracking ID
              </h3>
              <p className="text-sm text-slate-600">
                Share this ID to track your shipment.
              </p>
              <div className="mt-4 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-slate-800 font-semibold truncate">
                  {trackingId}
                </span>
                <button
                  onClick={handleCopyTrackingId}
                  className="ml-auto px-3 py-1.5 text-sm font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors">
                  {copiedTrackingId ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Status</span>
                <span className="font-semibold text-orange-600">
                  Pending Approval
                </span>
              </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-sm text-slate-600">Delivery Code</div>
                  <div className="text-2xl font-black text-slate-800">
                    {deliveryCode}
                  </div>
                <p className="text-sm text-slate-600 mt-2">
                  Please remember this delivery code. It will be asked at
                  delivery.
                </p>
                <p className="text-sm text-slate-600">
                  براہِ کرم یہ ڈیلیوری کوڈ یاد رکھیں، ڈیلیوری کے وقت آپ سے
                  یہ کوڈ پوچھا جائے گا۔
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={whatsappLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!whatsappLink) e.preventDefault();
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      whatsappLink
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}>
                    Send Delivery Code
                  </a>
                  <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                    WhatsApp
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  WhatsApp will open with the message pre-filled. Tap Send to
                  deliver the code.
                </p>
                <p className="text-xs text-slate-500">
                  Delivery code is required to mark the parcel as delivered or
                  rejected.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      Shipment QR
                    </div>
                    <p className="text-xs text-slate-500">
                      Scan with mobile to view parcel details.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadQr}
                    disabled={!qrDataUrl}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      qrDataUrl
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}>
                    Download QR
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Auto-download starts when the QR is ready.
                </p>
                <div className="mt-4 flex items-center justify-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Shipment QR"
                      className="h-56 w-56 object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-500">
                      Generating QR...
                    </span>
                  )}
                </div>
                <div className="mt-3 text-[10px] text-slate-500">
                  QR includes sender, receiver, tracking ID, delivery code, and
                  booking details.
                </div>
              </div>

              <p className="text-sm text-slate-600">
                Your order is pending admin approval. Once approved, tracking
                will update automatically.
              </p>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                  setTrackingId('');
                  setDeliveryCode('');
                  setQrDataUrl('');
                  setLabelPayload('');
                  setAutoDownloadDone(false);
                }}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors font-semibold">
                Book Another Parcel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
