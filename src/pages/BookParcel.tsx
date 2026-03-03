import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { addBooking, getBooking } from '../utils/bookingStore';
import {
  CodAccountRequest,
  adjustCodAccountWallet,
  subscribeCodAccount
} from '../utils/codAccountStore';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

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
  const generatedTrackingRef = useRef<string>('');
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
    itemDetail: '',
    specialInstruction: '',
    referenceNo: '',
    orderId: '',
    pieces: '1',
    packageWeight: '0',
    packageWeightGrams: '500',
    outOfCity: false,
    codAmount: ''
  });

  useEffect(() => {
    let unsubscribeAccount = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeAccount();
      if (!user) {
        setSessionAccount(null);
        return;
      }
      unsubscribeAccount = subscribeCodAccount(user.uid, (account) => {
        if (account) {
          setSessionAccount(account);
          setFormData((prev) => ({
            ...prev,
            senderName:
              prev.senderName || account.contactName || account.companyName,
            senderPhone: prev.senderPhone || account.phone,
            senderCity: prev.senderCity || account.city || 'Islamabad',
            senderAddress: prev.senderAddress || account.address
          }));
        } else {
          setSessionAccount(null);
        }
      });
    });
    return () => {
      unsubscribeAccount();
      unsubscribeAuth();
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    const isCheckbox = (e.target as HTMLInputElement).type === 'checkbox';
    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value
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

  useEffect(() => {
    if (trackingId || formData.orderId || formData.referenceNo) return;
    generatedTrackingRef.current = `${getCityCode(formData.receiverCity)}-${String(
      Date.now()
    ).slice(-6)}`;
  }, [trackingId, formData.orderId, formData.referenceNo, formData.receiverCity]);

  const generateTrackingId = async (city: string) => {
    const code = getCityCode(city);
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const num = Math.floor(Math.random() * 10000);
      const suffix = String(num).padStart(4, '0');
      const candidate = `${code}-${suffix}`;
      const existing = await getBooking(candidate);
      if (!existing) {
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

  const handleConfirmBooking = async () => {
    let currentUser = auth.currentUser;
    if (!currentUser) {
      try {
        const credential = await signInAnonymously(auth);
        currentUser = credential.user;
      } catch {
        setBookingError('Please sign in to confirm booking.');
        return;
      }
    }
    if (sessionAccount && sessionAccount.status !== 'approved') {
      setBookingError(
        'Your COD account is not approved yet. Booking is locked until approval.'
      );
      return;
    }
    setBookingError('');
    const trimmedItemDetail = formData.itemDetail.trim();
    const piecesCount = Number.parseInt(formData.pieces, 10);
    if (!trimmedItemDetail) {
      setBookingError('Item detail is required.');
      return;
    }
    if (!Number.isFinite(piecesCount) || piecesCount < 1) {
      setBookingError('No. of pieces must be at least 1.');
      return;
    }
    const newTrackingId = await generateTrackingId(formData.receiverCity);
    const newDeliveryCode = generateDeliveryCode();
    const nowIso = new Date().toISOString();
    const payloadObject = {
      trackingId: newTrackingId,
      deliveryCode: newDeliveryCode,
      service: selectedService.title,
      weightKg: Number(weightKg.toFixed(3)),
      codAmount: formData.codAmount || '0',
      outOfCity: formData.outOfCity,
      itemDetail: trimmedItemDetail,
      specialInstruction: formData.specialInstruction.trim() || '-',
      referenceNo: formData.referenceNo.trim() || '-',
      orderId: formData.orderId.trim() || '-',
      pieces: piecesCount,
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
      const updated = await adjustCodAccountWallet(
        sessionAccount.id,
        -totalCharge
      );
      if (updated) setSessionAccount(updated);
    }
    await addBooking({
      trackingId: newTrackingId,
      deliveryCode: newDeliveryCode,
      status: 'pending',
      statusHistory: [{ status: 'pending', at: nowIso }],
      userId: currentUser.uid,
      isCod: Boolean(sessionAccount),
      merchantId: sessionAccount?.id ?? null,
      merchantEmail: sessionAccount?.email ?? null,
      merchantName: sessionAccount?.companyName ?? null,
      merchantPlan: sessionAccount?.planName ?? null,
      merchantCity: sessionAccount?.city ?? null,
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
      itemDetail: trimmedItemDetail,
      specialInstruction: formData.specialInstruction.trim(),
      referenceNo: formData.referenceNo.trim(),
      orderId: formData.orderId.trim(),
      pieces: piecesCount,
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
      itemDetail: '',
      specialInstruction: '',
      referenceNo: '',
      orderId: '',
      pieces: '1',
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
  const ensureTrackingFallback = () => {
    if (!generatedTrackingRef.current) {
      generatedTrackingRef.current = `${getCityCode(formData.receiverCity)}-${String(
        Date.now()
      ).slice(-6)}`;
    }
    return generatedTrackingRef.current;
  };
  const displayTrackingId =
    trackingId || formData.orderId || formData.referenceNo || ensureTrackingFallback();
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

  const summaryRows = [
    { label: 'Sender Name', value: formData.senderName || '-' },
    { label: 'Sender Phone', value: formData.senderPhone || '-' },
    { label: 'Pickup City', value: formData.senderCity || '-' },
    { label: 'Pickup Address', value: formData.senderAddress || '-' },
    { label: 'Receiver Name', value: formData.receiverName || '-' },
    { label: 'Receiver Phone', value: formData.receiverPhone || '-' },
    { label: 'WhatsApp', value: formData.receiverWhatsapp || '-' },
    { label: 'Destination City', value: formData.receiverCity || '-' },
    { label: 'Delivery Address', value: formData.receiverAddress || '-' },
    { label: 'Item Detail', value: formData.itemDetail || '-' },
    { label: 'Special Instruction', value: formData.specialInstruction || '-' },
    { label: 'Reference No.', value: formData.referenceNo || '-' },
    { label: 'Order ID.', value: formData.orderId || '-' },
    { label: 'No. of Pieces', value: formData.pieces || '-' },
    { label: 'Service', value: selectedService.title },
    { label: 'Weight', value: weightLabel },
    { label: 'Base', value: baseLabel },
    { label: 'Additional Charges', value: extraLabel },
    { label: 'Out of City', value: outOfCityLabel },
    { label: 'COD Amount', value: codLabel }
  ];

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const buildBarcodeSvg = (value: string) => {
    const cleanValue = value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
    const bars: string[] = [];
    let x = 0;
    const height = 52;
    const gap = 1;
    const bar = (w: number) => {
      bars.push(
        `<rect x="${x}" y="0" width="${w}" height="${height}" fill="#0f172a" />`
      );
      x += w + gap;
    };
    const space = (w: number) => {
      x += w + gap;
    };
    bar(3);
    cleanValue.split('').forEach((char) => {
      const bits = char.charCodeAt(0).toString(2).padStart(7, '0');
      bits.split('').forEach((bit) => {
        if (bit === '1') {
          bar(2);
        } else {
          space(2);
        }
      });
      space(2);
    });
    bar(3);
    const width = Math.max(160, x);
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${bars.join(
      ''
    )}</svg>`;
  };

  const buildLabelPayload = () => {
    const payloadTrackingId = displayTrackingId;
    const payloadObject = {
      trackingId: payloadTrackingId,
      deliveryCode: deliveryCode || '000000',
      service: selectedService.title,
      weightKg: Number(weightKg.toFixed(3)),
      codAmount: formData.codAmount || '0',
      outOfCity: formData.outOfCity,
      itemDetail: formData.itemDetail || '-',
      specialInstruction: formData.specialInstruction || '-',
      referenceNo: formData.referenceNo || '-',
      orderId: formData.orderId || '-',
      pieces: Number.parseInt(formData.pieces, 10) || 1,
      bookedAt: new Date().toISOString(),
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
    return `${baseUrl}/label?data=${encodedPayload}`;
  };

  const buildSummaryHtml = (qrImage?: string) => {
    const baseUrl = window.location.origin;
    const logoUrl = `${baseUrl}/WhatsApp%20Image%202026-02-20%20at%203.09.46%20PM.jpeg`;
    const trackingValue = displayTrackingId;
    const datetimeValue = new Date().toLocaleString('en-PK', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    const shipperName =
      sessionAccount?.companyName || formData.senderName || 'Bear Fast';
    const shipperPhone = formData.senderPhone || '-';
    const shipperAddress = formData.senderAddress || 'BEAR FAST COURIERS';
    const consigneeName = formData.receiverName || '-';
    const consigneePhone = formData.receiverPhone || '-';
    const consigneeAddress = formData.receiverAddress || '-';
    const paymentMode = formData.codAmount ? 'COD' : 'Cash';
    const collectionAmount = formData.codAmount
      ? `Rs. ${formData.codAmount}`
      : 'Rs. 0';
    const qrHtml = qrImage
      ? `<img src="${qrImage}" alt="Shipment QR" />`
      : `<div class="qr-placeholder">QR</div>`;
    const barcodeSvg = buildBarcodeSvg(trackingValue);

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Order Summary</title>
    <style>
      * { box-sizing: border-box; }
      :root {
        --navy: #0b1526;
        --teal: #0ea5a4;
        --sky: #e0f2fe;
        --card: #f8fafc;
        --line: #e2e8f0;
      }
      body { margin: 0; font-family: "Garamond", "EB Garamond", "Times New Roman", serif; background: radial-gradient(circle at top, #f8fafc 0%, #e2e8f0 45%, #e0f2fe 100%); color: var(--navy); }
      @page { size: A4; margin: 12mm; }
      .page { padding: 20px; }
      .label {
        background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 22px;
        max-width: 1040px;
        margin: 0 auto;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.15), 0 2px 6px rgba(15, 23, 42, 0.08);
      }
      .glass {
        background: rgba(248, 250, 252, 0.72);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(148, 163, 184, 0.28);
        border-radius: 16px;
        box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
      }
      .header-row { display: grid; grid-template-columns: 1.2fr 1.6fr 0.7fr; gap: 16px; align-items: center; }
      .logo { display: flex; align-items: center; gap: 14px; }
      .logo img { height: 112px; width: auto; object-fit: contain; image-rendering: -webkit-optimize-contrast; filter: drop-shadow(0 6px 14px rgba(15,23,42,0.18)); }
      .brand { font-size: 13px; color: #334155; font-weight: 600; letter-spacing: 0.02em; }
      .brand-title { font-size: 20px; font-weight: 700; color: var(--navy); }
      .barcode-wrap { padding: 12px 14px; }
      .barcode-text { text-align: center; font-size: 13px; font-weight: 700; letter-spacing: 0.12em; margin-top: 6px; color: var(--navy); }
      .qr { display: flex; align-items: center; justify-content: center; padding: 10px; border-radius: 16px; }
      .qr img { width: 140px; height: 140px; }
      .qr-placeholder {
        width: 140px; height: 140px; border: 2px dashed #94a3b8; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #94a3b8;
      }
      .section-title {
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--navy);
        font-weight: 700;
        margin-bottom: 10px;
      }
      h3.section-title { margin: 0 0 10px; }
      .card {
        padding: 16px 18px;
        border-radius: 18px;
        background: var(--card);
        border: 1px solid var(--line);
        box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.06);
      }
      .info-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; }
      .info-item { padding: 8px 10px; border-radius: 12px; background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%); border: 1px solid var(--line); box-shadow: inset 0 1px 0 rgba(255,255,255,0.6); }
      .span-2 { grid-column: span 2; }
      .info-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.12em; }
      .info-value { font-size: 13px; font-weight: 600; margin-top: 4px; color: var(--navy); }
      .split { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .kv { display: grid; grid-template-columns: 120px 1fr; gap: 8px; padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
      .kv:last-child { border-bottom: none; }
      .kv-label { font-size: 12px; color: #64748b; font-weight: 600; }
      .kv-value { font-size: 12.5px; color: var(--navy); font-weight: 600; }
      .icon { width: 14px; height: 14px; margin-right: 6px; vertical-align: -2px; }
      .package-grid { display: grid; grid-template-columns: 1.2fr 0.6fr 1.2fr; gap: 10px; }
      .payment {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: linear-gradient(90deg, #e0f2fe 0%, #dbeafe 100%);
        border: 1px solid #7dd3fc;
        border-radius: 14px;
        font-weight: 700;
        color: var(--navy);
        box-shadow: 0 10px 22px rgba(14, 165, 233, 0.18);
      }
      .footer-note {
        margin-top: 12px;
        padding: 12px 14px;
        background: #f1f5f9;
        border: 1px solid var(--line);
        border-radius: 12px;
        font-size: 12px;
        color: #475569;
        line-height: 1.6;
      }
      .muted { color: #64748b; }
      .urdu { font-family: "Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", "Noto Naskh Arabic", serif; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="label">
        <div class="header-row">
          <div class="logo">
            <img src="${logoUrl}" alt="Bear Fast" />
            <div>
              <div class="brand-title">Bear Fast Couriers</div>
              <div class="brand">Printed By: ${escapeHtml(
                sessionAccount?.contactName || sessionAccount?.companyName || 'Bear Fast'
              )}</div>
            </div>
          </div>
          <div class="barcode-wrap glass">
            ${barcodeSvg}
            <div class="barcode-text">${escapeHtml(trackingValue)}</div>
          </div>
          <div class="qr glass">
            ${qrHtml}
          </div>
        </div>

        <div style="margin-top: 14px;" class="card">
          <h3 class="section-title">Shipment Details</h3>
          <div class="info-grid">
            <div class="info-item span-2">
              <div class="info-label">Service</div>
              <div class="info-value">${escapeHtml(selectedService.title)}</div>
            </div>
            <div class="info-item span-2">
              <div class="info-label">Shipment Mode</div>
              <div class="info-value">Parcel</div>
            </div>
            <div class="info-item span-2">
              <div class="info-label">Date / Time</div>
              <div class="info-value">${escapeHtml(datetimeValue)}</div>
            </div>
            <div class="info-item span-2">
              <div class="info-label">Order ID</div>
              <div class="info-value">${escapeHtml(formData.orderId || trackingValue)}</div>
            </div>
            <div class="info-item span-2">
              <div class="info-label">Origin</div>
              <div class="info-value">${escapeHtml(formData.senderCity || '-')}</div>
            </div>
            <div class="info-item span-2">
              <div class="info-label">Destination</div>
              <div class="info-value">${escapeHtml(formData.receiverCity || '-')}</div>
            </div>
            <div class="info-item span-2">
              <div class="info-label">Business Category</div>
              <div class="info-value">Domestic</div>
            </div>
          </div>
        </div>

        <div style="margin-top: 14px;" class="split">
          <div class="card">
            <h3 class="section-title">Sender Details</h3>
            <div class="kv"><div class="kv-label">Name</div><div class="kv-value">${escapeHtml(shipperName)}</div></div>
            <div class="kv">
              <div class="kv-label">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92V21a1 1 0 0 1-1.09 1 19.86 19.86 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.07 11.72 19.86 19.86 0 0 1 0 3.09 1 1 0 0 1 1 2h4.09a1 1 0 0 1 1 .75l1 4a1 1 0 0 1-.29.95L5.21 9.29a16 16 0 0 0 9.5 9.5l1.59-1.59a1 1 0 0 1 .95-.29l4 1a1 1 0 0 1 .75 1z"/></svg>
                Phone
              </div>
              <div class="kv-value">${escapeHtml(shipperPhone)}</div>
            </div>
            <div class="kv">
              <div class="kv-label">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>
                Address
              </div>
              <div class="kv-value">${escapeHtml(shipperAddress)}</div>
            </div>
          </div>
          <div class="card">
            <h3 class="section-title">Receiver Details</h3>
            <div class="kv"><div class="kv-label">Name</div><div class="kv-value">${escapeHtml(consigneeName)}</div></div>
            <div class="kv">
              <div class="kv-label">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92V21a1 1 0 0 1-1.09 1 19.86 19.86 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.07 11.72 19.86 19.86 0 0 1 0 3.09 1 1 0 0 1 1 2h4.09a1 1 0 0 1 1 .75l1 4a1 1 0 0 1-.29.95L5.21 9.29a16 16 0 0 0 9.5 9.5l1.59-1.59a1 1 0 0 1 .95-.29l4 1a1 1 0 0 1 .75 1z"/></svg>
                Phone
              </div>
              <div class="kv-value">${escapeHtml(consigneePhone)}</div>
            </div>
            <div class="kv">
              <div class="kv-label">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>
                Address
              </div>
              <div class="kv-value">${escapeHtml(consigneeAddress)}</div>
            </div>
          </div>
        </div>

        <div style="margin-top: 14px;" class="card">
          <h3 class="section-title">Package Details</h3>
          <div class="package-grid">
            <div class="info-item">
              <div class="info-label">Item Type</div>
              <div class="info-value">${escapeHtml(formData.itemDetail || '-')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Quantity</div>
              <div class="info-value">${escapeHtml(formData.pieces || '-')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Special Instructions</div>
              <div class="info-value">${escapeHtml(formData.specialInstruction || '-')}</div>
            </div>
          </div>
        </div>

        <div style="margin-top: 14px;" class="payment">
          <div>Payment Mode: ${escapeHtml(paymentMode)}</div>
          <div>Collection Amount: ${escapeHtml(collectionAmount)}</div>
        </div>

        <div class="footer-note urdu">
          نوٹ: براہ کرم پارسل وصول کرنے سے پہلے پیکج کی حالت چیک کریں۔ پارسل وصول کرنے کے بعد کمپنی ذمہ دار نہیں ہوگی۔
          <br />
          اہم: اگر پارسل/آرڈر منسوخ ہو تو فوراً کمپنی کو مطلع کریں۔
        </div>
      </div>
    </div>
  </body>
</html>`;
  };

  const handlePrintSummary = async () => {
    const payload = labelPayload || buildLabelPayload();
    let qrImage = qrDataUrl;
    if (!qrImage) {
      try {
        qrImage = await QRCode.toDataURL(payload, {
          margin: 2,
          width: 340,
          errorCorrectionLevel: 'H'
        });
      } catch {
        qrImage = '';
      }
    }
    const html = buildSummaryHtml(qrImage);
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDownloadSummary = async () => {
    const payload = labelPayload || buildLabelPayload();
    let qrImage = qrDataUrl;
    if (!qrImage) {
      try {
        qrImage = await QRCode.toDataURL(payload, {
          margin: 2,
          width: 340,
          errorCorrectionLevel: 'H'
        });
      } catch {
        qrImage = '';
      }
    }
    const html = buildSummaryHtml(qrImage);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `order-summary-${trackingId || 'draft'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const whatsappLink = buildWhatsappLink(deliveryCode);
  return (
    <main className="w-full pt-20 min-h-screen bg-slate-50">
      <section className="py-10">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            {/* Left Form Column */}
            <div className="space-y-6">
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

              {/* Shipment Details */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">
                  Shipment Details
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Item Detail *
                    </label>
                    <textarea
                      name="itemDetail"
                      value={formData.itemDetail}
                      onChange={handleChange}
                      rows={3}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g. 2 shirts, 1 jeans"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Special Instruction
                    </label>
                    <textarea
                      name="specialInstruction"
                      value={formData.specialInstruction}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Leave at reception, call before delivery"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Reference No.
                    </label>
                    <input
                      type="text"
                      name="referenceNo"
                      value={formData.referenceNo}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Reference"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Order ID.
                    </label>
                    <input
                      type="text"
                      name="orderId"
                      value={formData.orderId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Order ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      No. of Pieces *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      name="pieces"
                      value={formData.pieces}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="1"
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
            <div className="lg:justify-self-end">
              <div className="sticky top-24 lg:w-[420px]">
                <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl">
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <h3 className="text-xl font-bold">Order Summary</h3>
                  </div>
                <div className="space-y-4 text-sm text-slate-300">
                  {summaryRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3">
                      <span>{row.label}</span>
                      <span className={`text-white ${row.label === 'COD Amount' ? 'text-orange-300 font-semibold' : ''}`}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 my-5" />
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-orange-400">{totalLabel}</span>
                </div>
                {walletBalance !== null && (
                  <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
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
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadSummary}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition">
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintSummary}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white text-slate-900 hover:bg-slate-100 transition">
                      Print
                    </button>
                  </div>
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
