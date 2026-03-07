
import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  Booking,
  BookingStatusKey,
  STATUS_OPTIONS,
  formatDate,
  formatTime,
  isCodBooking,
  deleteAllBookings,
  subscribeBookings,
  updateBookingAssignment
} from '../utils/bookingStore';
import {
  RiderApplication,
  RiderStatus,
  clearRiders,
  subscribeRiders,
  updateRiderStatus
} from '../utils/riderStore';
import {
  CodAccountRequest,
  CodAccountStatus,
  CARD_FEE,
  SERVICE_CITIES,
  adjustCodAccountWallet,
  clearCodAccounts,
  subscribeCodAccounts,
  updateCodAccountStatus
} from '../utils/codAccountStore';
import {
  FundRequest,
  addAcceptedFundRequest,
  subscribeFundRequests,
  updateFundRequestStatus
} from '../utils/fundRequestStore';
import {
  MerchantFeedback,
  subscribeMerchantFeedback
} from '../utils/merchantFeedbackStore';
import { auth } from '../lib/firebase';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  Clipboard,
  Clock,
  FileText,
  Edit3,
  History,
  LayoutGrid,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Trash2,
  Truck,
  UserCircle2,
  Users,
  Wallet,
  XCircle
} from 'lucide-react';

const PUNJAB_CITIES = [
  'lahore',
  'rawalpindi',
  'faisalabad',
  'multan',
  'gujranwala',
  'sialkot',
  'bahawalpur',
  'sargodha',
  'gujrat',
  'okara',
  'sahiwal',
  'jhelum',
  'sheikhupura',
  'kasur',
  'chakwal',
  'attock',
  'dera ghazi khan',
  'bahawalnagar',
  'rahim yar khan',
  'khushab',
  'mandi bahauddin'
];
const SINDH_CITIES = [
  'karachi',
  'hyderabad',
  'sukkur',
  'larkana',
  'mirpurkhas',
  'nawabshah',
  'shaheed benazirabad',
  'khairpur',
  'jacobabad',
  'thatta'
];
const KPK_CITIES = [
  'peshawar',
  'mardan',
  'swat',
  'abbottabad',
  'mansehra',
  'swabi',
  'kohat',
  'bannu',
  'dera ismail khan',
  'charsadda',
  'nowshera',
  'dir',
  'chitral'
];
const BALOCHISTAN_CITIES = [
  'quetta',
  'gwadar',
  'khuzdar',
  'turbat',
  'chaman',
  'hub',
  'sibbi',
  'zhob'
];

const normalizeCityName = (value?: string | null) =>
  (value || '').trim().toLowerCase();

const getProvinceFromCity = (city?: string | null) => {
  const normalized = normalizeCityName(city);
  if (!normalized) return 'other';
  if (PUNJAB_CITIES.includes(normalized)) return 'punjab';
  if (SINDH_CITIES.includes(normalized)) return 'sindh';
  if (KPK_CITIES.includes(normalized)) return 'kpk';
  if (BALOCHISTAN_CITIES.includes(normalized)) return 'balochistan';
  return 'other';
};

const buildEmptyStatusCounts = () =>
  STATUS_OPTIONS.reduce(
    (acc, item) => {
      acc[item.key] = 0;
      return acc;
    },
    {} as Record<BookingStatusKey, number>
  );

export function Admin() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string>('');
  const [activePanel, setActivePanel] = useState<
    | 'bookings'
    | 'cod'
    | 'slips'
    | 'complaints'
    | 'riders'
    | 'receipts'
    | 'rider-history'
  >('cod');
  const [codAccounts, setCodAccounts] = useState<CodAccountRequest[]>([]);
  const [codStatusFilter, setCodStatusFilter] = useState<string>('all');
  const [codCityFilter, setCodCityFilter] = useState<string>('all');
  const [codProvinceFilter, setCodProvinceFilter] = useState<
    'all' | 'punjab' | 'sindh' | 'kpk' | 'balochistan'
  >('all');
  const [codQuery, setCodQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );
  const [parcelStatusFilter, setParcelStatusFilter] = useState('all');
  const [parcelQuery, setParcelQuery] = useState('');
  const [parcelFrom, setParcelFrom] = useState('');
  const [parcelTo, setParcelTo] = useState('');
  const [slipTab, setSlipTab] = useState<'cod' | 'non-cod'>('cod');
  const [slipQuery, setSlipQuery] = useState('');
  const [receiptQuery, setReceiptQuery] = useState('');
  const [complaintsQuery, setComplaintsQuery] = useState('');
  const [riderQuery, setRiderQuery] = useState('');
  const [riderStatusFilter, setRiderStatusFilter] = useState('all');
  const [riderCityFilter, setRiderCityFilter] = useState('all');
  const [riderProvinceFilter, setRiderProvinceFilter] = useState<
    'all' | 'punjab' | 'sindh' | 'kpk' | 'balochistan'
  >('all');
  const [riders, setRiders] = useState<RiderApplication[]>([]);
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
  const [complaints, setComplaints] = useState<MerchantFeedback[]>([]);
  const [manualTransactions, setManualTransactions] = useState<
    Record<
      string,
      {
        id: string;
        type: 'deposit' | 'cod' | 'charge' | 'withdrawal';
        amount: number;
        date: string;
        status: string;
        notes: string;
      }[]
    >
  >({});
  const [adminActivity, setAdminActivity] = useState<
    Record<string, { title: string; detail?: string; date: string }[]>
  >({});
  const [bookingsLoadError, setBookingsLoadError] = useState('');
  const [codAccountsLoadError, setCodAccountsLoadError] = useState('');
  const [fundRequestsLoadError, setFundRequestsLoadError] = useState('');
  const [complaintsLoadError, setComplaintsLoadError] = useState('');
  const [ridersLoadError, setRidersLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [liveNotifications, setLiveNotifications] = useState<
    {
      id: string;
      type: 'booking' | 'fund';
      title: string;
      detail: string;
      accountId?: string;
      trackingId?: string;
      requestId?: string;
    }[]
  >([]);
  const provinceParam = useMemo(() => {
    const param = new URLSearchParams(location.search).get('province');
    if (
      param === 'punjab' ||
      param === 'sindh' ||
      param === 'kpk' ||
      param === 'balochistan'
    ) {
      return param;
    }
    return null;
  }, [location.search]);
  const [highlightedAccounts, setHighlightedAccounts] = useState<
    Record<string, number>
  >({});
  const bookingIdsRef = useRef<Set<string>>(new Set());
  const fundIdsRef = useRef<Set<string>>(new Set());
  const bookingsInitializedRef = useRef(false);
  const fundsInitializedRef = useRef(false);
  const dismissedNotificationsRef = useRef<Set<string>>(new Set());
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description?: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  const codStatusOptions: { key: CodAccountStatus; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'suspended', label: 'Suspended' },
    { key: 'rejected', label: 'Rejected' }
  ];
  const riderStatusOptions: { key: RiderStatus; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'suspended', label: 'Suspended' },
    { key: 'rejected', label: 'Rejected' }
  ];
  const codStatusBadge: Record<CodAccountStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70',
    approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70',
    suspended: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/70',
    rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/70'
  };
  const riderStatusBadge: Record<RiderStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70',
    approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70',
    suspended: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/70',
    rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/70'
  };
  const planBadgeClass = (planName: string) => {
    const base =
      'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm';
    switch (planName.toLowerCase()) {
      case 'silver':
        return `${base} bg-gradient-to-r from-slate-700 to-slate-900`;
      case 'gold':
        return `${base} bg-gradient-to-r from-amber-400 to-orange-500`;
      case 'diamond':
        return `${base} bg-gradient-to-r from-sky-500 to-blue-600`;
      case 'executive':
        return `${base} bg-gradient-to-r from-rose-500 to-red-600`;
      default:
        return `${base} bg-gradient-to-r from-slate-500 to-slate-700`;
    }
  };
  const complaintPriorityBadge = (priority: MerchantFeedback['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/70';
      case 'low':
        return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/70';
      default:
        return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70';
    }
  };
  const formatAmount = (value: number) =>
    value.toLocaleString('en-PK', { maximumFractionDigits: 0 });
  const formatDateTime = (value: string) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return `${formatDate(value)} ${formatTime(value)}`;
  };
  const summarizeRiderStats = (
    stats?: { total: number; byStatus: Record<BookingStatusKey, number> }
  ) => {
    const base = buildEmptyStatusCounts();
    const byStatus = stats?.byStatus ? { ...base, ...stats.byStatus } : base;
    const delivered = (byStatus.delivered || 0) + (byStatus.payment_received || 0);
    const inTransit =
      (byStatus.confirmed || 0) +
      (byStatus.in_transit || 0) +
      (byStatus.out_for_delivery || 0);
    const pending = byStatus.pending || 0;
    const rejected = byStatus.delivery_rejected || 0;
    return {
      total: stats?.total ?? 0,
      delivered,
      inTransit,
      pending,
      rejected
    };
  };
  const getNotificationKey = (
    notice: Partial<typeof liveNotifications[number]>
  ) => {
    if (notice.type === 'booking' && notice.trackingId) {
      return `booking:${notice.trackingId}`;
    }
    if (notice.type === 'fund' && notice.requestId) {
      return `fund:${notice.requestId}`;
    }
    return '';
  };
  const persistDismissedNotifications = (items: Set<string>) => {
    try {
      localStorage.setItem(
        'bearfast_admin_dismissed_notifications',
        JSON.stringify([...items])
      );
    } catch {
      // ignore storage errors
    }
  };
  const markNotificationDismissed = (
    notice: Partial<typeof liveNotifications[number]>
  ) => {
    const key = getNotificationKey(notice);
    if (!key) return;
    const next = dismissedNotificationsRef.current;
    if (next.has(key)) return;
    next.add(key);
    persistDismissedNotifications(next);
  };
  const dismissNotification = (notice: typeof liveNotifications[number]) => {
    markNotificationDismissed(notice);
    setLiveNotifications((prev) => prev.filter((item) => item.id !== notice.id));
  };
  const addNotification = (next: Omit<typeof liveNotifications[number], 'id'>) => {
    const key = getNotificationKey(next);
    if (key && dismissedNotificationsRef.current.has(key)) {
      return;
    }
    const entry = { ...next, id: `${Date.now()}-${Math.random()}` };
    setLiveNotifications((prev) => {
      if (key && prev.some((item) => getNotificationKey(item) === key)) {
        return prev;
      }
      return [entry, ...prev].slice(0, 6);
    });
  };
  const flashAccount = (accountId?: string | null) => {
    if (!accountId) return;
    setHighlightedAccounts((prev) => ({
      ...prev,
      [accountId]: Date.now() + 30000
    }));
  };
  const isHighlighted = (accountId?: string | null) =>
    Boolean(accountId && highlightedAccounts[accountId]);
  const maskValue = (value: string, keepStart = 2, keepEnd = 2) => {
    if (!value) return '-';
    if (value.length <= keepStart + keepEnd + 2) return value;
    const start = value.slice(0, keepStart);
    const end = value.slice(-keepEnd);
    return `${start}${'•'.repeat(Math.max(4, value.length - keepStart - keepEnd))}${end}`;
  };
  const statusLabel = (status: CodAccountStatus) => {
    if (status === 'approved') return 'Approved';
    if (status === 'pending') return 'Pending';
    if (status === 'suspended') return 'Suspended';
    if (status === 'rejected') return 'Rejected';
    return status;
  };
  const normalizeCity = (value?: string | null) =>
    (value || '').trim().toLowerCase();
  const buildSparklinePoints = (series: number[], height = 36) => {
    if (!series.length) return '';
    const max = Math.max(...series, 1);
    return series
      .map((value, index) => {
        const x = series.length === 1 ? 0 : (index / (series.length - 1)) * 100;
        const y = height - (value / max) * height;
        return `${x},${y}`;
      })
      .join(' ');
  };
  const getDisplayWalletBalance = (account: CodAccountRequest | null) => {
    if (!account) return 0;
    const planTotal = Number.isFinite(account.planTotal) ? account.planTotal : 0;
    const baseBalance = Math.max(0, planTotal - CARD_FEE);
    const hasWallet =
      typeof account.walletBalance === 'number' &&
      !Number.isNaN(account.walletBalance);
    if (!hasWallet) return baseBalance;
    if (account.walletBalance === planTotal && planTotal > CARD_FEE) {
      return baseBalance;
    }
    return account.walletBalance;
  };

  const serviceRates: Record<
    string,
    { baseHalf: number; baseOne: number; additionalPerKg: number }
  > = {
    'super-flash': { baseHalf: 400, baseOne: 560, additionalPerKg: 400 },
    overnight: { baseHalf: 320, baseOne: 460, additionalPerKg: 300 },
    '3-7-day': { baseHalf: 220, baseOne: 360, additionalPerKg: 200 },
    'next-day': { baseHalf: 150, baseOne: 260, additionalPerKg: 150 }
  };
  const buildBarcodeSvg = (value: string) => {
    const cleanValue = value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
    const bars: string[] = [];
    let x = 0;
    const height = 54;
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
    const width = Math.max(180, x);
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${bars.join(
      ''
    )}</svg>`;
  };

  const buildBookingLabelPayload = (booking: Booking) => {
    const payloadObject = {
      trackingId: booking.trackingId,
      deliveryCode: booking.deliveryCode,
      service: booking.serviceTitle,
      weightKg: booking.weightKg,
      codAmount: booking.codAmount || '0',
      outOfCity: booking.outOfCity,
      itemDetail: booking.itemDetail || '-',
      specialInstruction: booking.specialInstruction || '-',
      referenceNo: booking.referenceNo || '-',
      orderId: booking.orderId || '-',
      pieces: booking.pieces ?? 1,
      bookedAt: booking.createdAt,
      sender: {
        name: booking.senderName || '-',
        phone: booking.senderPhone || '-',
        city: booking.senderCity || '-',
        address: booking.senderAddress || '-'
      },
      receiver: {
        name: booking.receiverName || '-',
        phone: booking.receiverPhone || '-',
        whatsapp: booking.receiverWhatsapp || '-',
        city: booking.receiverCity || '-',
        address: booking.receiverAddress || '-'
      }
    };
    const encodedPayload = encodeURIComponent(JSON.stringify(payloadObject));
    const envBase =
      (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined) || '';
    const baseUrl = envBase.trim()
      ? envBase.trim().replace(/\/+$/, '')
      : window.location.origin;
    return `${baseUrl}/label?data=${encodedPayload}`;
  };

  const buildSlipHtml = (booking: Booking, qrImage?: string) => {
    const baseUrl = window.location.origin;
    const logoUrl = `${baseUrl}/WhatsApp%20Image%202026-02-20%20at%203.09.46%20PM.jpeg`;
    const datetimeValue = new Date(booking.createdAt).toLocaleString('en-PK', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    const shipperName =
      booking.merchantName || booking.senderName || 'Bear Fast Couriers';
    const shipperPhone = booking.senderPhone || '-';
    const shipperAddress = booking.senderAddress || 'BEAR FAST COURIERS';
    const consigneeName = booking.receiverName || '-';
    const consigneePhone = booking.receiverPhone || '-';
    const consigneeAddress = booking.receiverAddress || '-';
    const paymentMode =
      Number(booking.codAmount || 0) > 0 || isCodBooking(booking) ? 'COD' : 'Cash';
    const collectionAmount = booking.codAmount
      ? `Rs. ${booking.codAmount}`
      : 'Rs. 0';
    const qrHtml = qrImage
      ? `<img src="${qrImage}" alt="Shipment QR" />`
      : `<div class="qr-placeholder">QR</div>`;
    const barcodeSvg = buildBarcodeSvg(booking.trackingId);
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Booking Slip</title>
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
                booking.merchantName || booking.senderName || 'Bear Fast'
              )}</div>
            </div>
          </div>
          <div class="barcode-wrap glass">
            ${barcodeSvg}
            <div class="barcode-text">${escapeHtml(booking.trackingId)}</div>
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
              <div class="info-value">${escapeHtml(booking.serviceTitle)}</div>
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
              <div class="info-value">${escapeHtml(
                booking.orderId || booking.trackingId
              )}</div>
            </div>
            <div class="info-item span-2">
              <div class="info-label">Origin</div>
              <div class="info-value">${escapeHtml(booking.senderCity || '-')}</div>
            </div>
            <div class="info-item span-2">
              <div class="info-label">Destination</div>
              <div class="info-value">${escapeHtml(booking.receiverCity || '-')}</div>
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
              <div class="info-value">${escapeHtml(booking.itemDetail || '-')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Quantity</div>
              <div class="info-value">${escapeHtml(String(booking.pieces ?? 1))}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Special Instructions</div>
              <div class="info-value">${escapeHtml(booking.specialInstruction || '-')}</div>
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

  const handlePrintSlip = async (booking: Booking) => {
    let qrImage = '';
    try {
      const payload = buildBookingLabelPayload(booking);
      qrImage = await QRCode.toDataURL(payload, {
        margin: 2,
        width: 340,
        errorCorrectionLevel: 'H'
      });
    } catch {
      qrImage = '';
    }
    const html = buildSlipHtml(booking, qrImage);
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDownloadSlip = async (booking: Booking) => {
    let qrImage = '';
    try {
      const payload = buildBookingLabelPayload(booking);
      qrImage = await QRCode.toDataURL(payload, {
        margin: 2,
        width: 340,
        errorCorrectionLevel: 'H'
      });
    } catch {
      qrImage = '';
    }
    const html = buildSlipHtml(booking, qrImage);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `booking-slip-${booking.trackingId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const isNonCodBooking = (booking: Booking) => !isCodBooking(booking);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('bearfast_admin_dismissed_notifications');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          dismissedNotificationsRef.current = new Set(
            parsed.filter((item) => typeof item === 'string')
          );
        }
      }
    } catch {
      // ignore storage errors
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !authUser) return;
    const unsubscribe = subscribeBookings((items) => {
      setBookings(items);
      setBookingsLoadError('');
    }, (error) => {
      console.error('[Admin] bookings subscribe failed', error);
      setBookingsLoadError(
        'Unable to load bookings. Please check Firebase permissions.'
      );
    });
    return () => unsubscribe();
  }, [authReady, authUser?.uid]);

  useEffect(() => {
    if (!authReady || !authUser) return;
    const unsubscribe = subscribeCodAccounts((items) => {
      setCodAccounts(items);
      setCodAccountsLoadError('');
    }, (error) => {
      console.error('[Admin] cod accounts subscribe failed', error);
      setCodAccountsLoadError(
        'Unable to load COD accounts. Please check Firebase permissions.'
      );
    });
    return () => unsubscribe();
  }, [authReady, authUser?.uid]);

  useEffect(() => {
    if (!authReady || !authUser) return;
    const unsubscribe = subscribeRiders((items) => {
      setRiders(items);
      setRidersLoadError('');
    }, (error) => {
      console.error('[Admin] riders subscribe failed', error);
      setRidersLoadError(
        'Unable to load riders. Please check Firebase permissions.'
      );
    });
    return () => unsubscribe();
  }, [authReady, authUser?.uid]);

  useEffect(() => {
    if (!authReady || !authUser) return;
    const unsubscribe = subscribeFundRequests((items) => {
      setFundRequests(items);
      setFundRequestsLoadError('');
    }, (error) => {
      console.error('[Admin] fund requests subscribe failed', error);
      setFundRequestsLoadError(
        'Unable to load fund requests. Please check Firebase permissions.'
      );
    });
    return () => unsubscribe();
  }, [authReady, authUser?.uid]);

  useEffect(() => {
    if (!authReady || !authUser) return;
    const unsubscribe = subscribeMerchantFeedback((items) => {
      setComplaints(items);
      setComplaintsLoadError('');
    }, (error) => {
      console.error('[Admin] complaints subscribe failed', error);
      setComplaintsLoadError(
        'Unable to load complaints. Please check Firebase permissions.'
      );
    });
    return () => unsubscribe();
  }, [authReady, authUser?.uid]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'cod') {
      setActivePanel('cod');
    }
    if (params.get('tab') === 'bookings') {
      setActivePanel('bookings');
    }
    if (params.get('tab') === 'slips') {
      setActivePanel('slips');
    }
    if (params.get('tab') === 'complaints') {
      setActivePanel('complaints');
    }
    if (params.get('tab') === 'riders') {
      setActivePanel('riders');
    }
    if (params.get('tab') === 'receipts') {
      setActivePanel('receipts');
    }
    if (params.get('tab') === 'rider-history') {
      setActivePanel('rider-history');
    }
    if (params.get('tab') === 'cod') {
      const province = params.get('province');
      if (
        province === 'punjab' ||
        province === 'sindh' ||
        province === 'kpk' ||
        province === 'balochistan'
      ) {
        setCodProvinceFilter(province);
        setSelectedAccountId(null);
      }
      const status = params.get('status');
      if (
        status === 'all' ||
        status === 'pending' ||
        status === 'approved' ||
        status === 'rejected' ||
        status === 'suspended'
      ) {
        setCodStatusFilter(status);
      }
    }
  }, [location.search]);

  useEffect(() => {
    if (Object.keys(highlightedAccounts).length === 0) return;
    const timer = window.setInterval(() => {
      setHighlightedAccounts((prev) => {
        const now = Date.now();
        const next: Record<string, number> = {};
        Object.entries(prev).forEach(([id, expires]) => {
          if (expires > now) next[id] = expires;
        });
        return next;
      });
    }, 2000);
    return () => window.clearInterval(timer);
  }, [highlightedAccounts]);

  const counts = useMemo(() => {
    const nonCodBookings = bookings.filter((booking) => isNonCodBooking(booking));
    const base: Record<string, number> = {
      all: nonCodBookings.length
    };
    STATUS_OPTIONS.forEach((status) => {
      base[status.key] = nonCodBookings.filter(
        (booking) => booking.status === status.key
      ).length;
    });
    return base;
  }, [bookings]);

  const codCounts = useMemo(() => {
    const base: Record<string, number> = {
      all: codAccounts.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      suspended: 0
    };
    codAccounts.forEach((account) => {
      base[account.status] = (base[account.status] || 0) + 1;
    });
    return base;
  }, [codAccounts]);

  const codProvinceCounts = useMemo(() => {
    const base = {
      punjab: 0,
      sindh: 0,
      kpk: 0,
      balochistan: 0
    };
    codAccounts.forEach((account) => {
      const province = getProvinceFromCity(account.city);
      if (province === 'punjab') base.punjab += 1;
      if (province === 'sindh') base.sindh += 1;
      if (province === 'kpk') base.kpk += 1;
      if (province === 'balochistan') base.balochistan += 1;
    });
    return base;
  }, [codAccounts]);

  const codProvincePendingCounts = useMemo(() => {
    const base = {
      punjab: 0,
      sindh: 0,
      kpk: 0,
      balochistan: 0
    };
    codAccounts.forEach((account) => {
      if (account.status !== 'pending') return;
      const province = getProvinceFromCity(account.city);
      if (province === 'punjab') base.punjab += 1;
      if (province === 'sindh') base.sindh += 1;
      if (province === 'kpk') base.kpk += 1;
      if (province === 'balochistan') base.balochistan += 1;
    });
    return base;
  }, [codAccounts]);

  const riderCounts = useMemo(() => {
    const base: Record<string, number> = {
      all: riders.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      suspended: 0
    };
    riders.forEach((rider) => {
      base[rider.status] = (base[rider.status] || 0) + 1;
    });
    return base;
  }, [riders]);

  const riderProvinceCounts = useMemo(() => {
    const base = {
      punjab: 0,
      sindh: 0,
      kpk: 0,
      balochistan: 0
    };
    riders.forEach((rider) => {
      const province = getProvinceFromCity(rider.city);
      if (province === 'punjab') base.punjab += 1;
      if (province === 'sindh') base.sindh += 1;
      if (province === 'kpk') base.kpk += 1;
      if (province === 'balochistan') base.balochistan += 1;
    });
    return base;
  }, [riders]);

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      if (!isNonCodBooking(booking)) return false;
      const matchStatus =
        statusFilter === 'all' ? true : booking.status === statusFilter;
      const matchQuery = query.trim()
        ? booking.trackingId.toLowerCase().includes(query.trim().toLowerCase())
        : true;
      return matchStatus && matchQuery;
    });
  }, [bookings, statusFilter, query]);

  const slipFiltered = useMemo(() => {
    const base =
      slipTab === 'cod'
        ? bookings.filter((booking) => isCodBooking(booking))
        : bookings.filter((booking) => isNonCodBooking(booking));
    const search = slipQuery.trim().toLowerCase();
    if (!search) return base;
    return base.filter((booking) => {
      const haystack = [
        booking.trackingId,
        booking.senderName,
        booking.senderPhone,
        booking.receiverName,
        booking.receiverPhone,
        booking.senderCity,
        booking.receiverCity,
        booking.merchantName,
        booking.merchantEmail,
        booking.orderId,
        booking.referenceNo
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [bookings, slipQuery, slipTab]);

  const deliveryReceipts = useMemo(() => {
    const base = bookings.filter(
      (booking) =>
        booking.assignedRiderId &&
        (booking.status === 'delivered' || booking.status === 'payment_received')
    );
    const search = receiptQuery.trim().toLowerCase();
    const filteredBase = search
      ? base.filter((booking) => {
          const haystack = [
            booking.trackingId,
            booking.senderName,
            booking.senderPhone,
            booking.receiverName,
            booking.receiverPhone,
            booking.senderCity,
            booking.receiverCity,
            booking.assignedRiderName,
            booking.assignedRiderId,
            booking.assignedRiderCity
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return haystack.includes(search);
        })
      : base;
    return filteredBase.sort((a, b) => {
      const aTime = new Date(
        a.statusHistory[a.statusHistory.length - 1]?.at || a.createdAt
      ).getTime();
      const bTime = new Date(
        b.statusHistory[b.statusHistory.length - 1]?.at || b.createdAt
      ).getTime();
      return bTime - aTime;
    });
  }, [bookings, receiptQuery]);

  const filteredCodAccounts = useMemo(() => {
    return codAccounts.filter((account) => {
      const matchStatus =
        codStatusFilter === 'all' ? true : account.status === codStatusFilter;
      const normalizedCity = normalizeCityName(account.city);
      const cityFilter = normalizeCityName(codCityFilter);
      const matchCity =
        codCityFilter === 'all' ? true : normalizedCity === cityFilter;
      const matchProvince =
        codProvinceFilter === 'all'
          ? true
          : getProvinceFromCity(account.city) === codProvinceFilter;
      const search = codQuery.trim().toLowerCase();
      const matchQuery = search
        ? account.companyName.toLowerCase().includes(search) ||
          account.contactName.toLowerCase().includes(search) ||
          account.email.toLowerCase().includes(search) ||
          account.phone.toLowerCase().includes(search) ||
          account.id.toLowerCase().includes(search)
        : true;
      const provinceOk = codCityFilter === 'all' ? matchProvince : true;
      return matchStatus && provinceOk && matchCity && matchQuery;
    });
  }, [codAccounts, codStatusFilter, codCityFilter, codQuery, codProvinceFilter]);

  const riderCityOptions = useMemo(() => {
    const cities = new Set<string>();
    riders.forEach((rider) => {
      if (rider.city) cities.add(rider.city);
    });
    return Array.from(cities).sort();
  }, [riders]);

  const filteredRiders = useMemo(() => {
    return riders.filter((rider) => {
      const matchStatus =
        riderStatusFilter === 'all' ? true : rider.status === riderStatusFilter;
      const matchCity =
        riderCityFilter === 'all' ? true : rider.city === riderCityFilter;
      const matchProvince =
        riderProvinceFilter === 'all'
          ? true
          : getProvinceFromCity(rider.city) === riderProvinceFilter;
      const search = riderQuery.trim().toLowerCase();
      const matchQuery = search
        ? [
            rider.fullName,
            rider.fatherName,
            rider.cnic,
            rider.mobile,
            rider.email,
            rider.city,
            rider.area
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(search)
        : true;
      const provinceOk = riderCityFilter === 'all' ? matchProvince : true;
      return matchStatus && provinceOk && matchCity && matchQuery;
    });
  }, [riders, riderStatusFilter, riderCityFilter, riderQuery, riderProvinceFilter]);

  const riderStats = useMemo(() => {
    const stats: Record<
      string,
      { total: number; byStatus: Record<BookingStatusKey, number> }
    > = {};
    bookings.forEach((booking) => {
      if (!booking.assignedRiderId) return;
      if (!stats[booking.assignedRiderId]) {
        stats[booking.assignedRiderId] = {
          total: 0,
          byStatus: buildEmptyStatusCounts()
        };
      }
      const bucket = stats[booking.assignedRiderId];
      bucket.total += 1;
      bucket.byStatus[booking.status] =
        (bucket.byStatus[booking.status] || 0) + 1;
    });
    return stats;
  }, [bookings]);

  const riderBookingMap = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach((booking) => {
      if (!booking.assignedRiderId) return;
      if (!map.has(booking.assignedRiderId)) {
        map.set(booking.assignedRiderId, []);
      }
      map.get(booking.assignedRiderId)?.push(booking);
    });
    map.forEach((items) => {
      items.sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      });
    });
    return map;
  }, [bookings]);

  const riderHistorySummary = useMemo(() => {
    const totals = {
      assigned: 0,
      delivered: 0,
      inTransit: 0,
      pending: 0,
      rejected: 0
    };
    Object.values(riderStats).forEach((stats) => {
      const summary = summarizeRiderStats(stats);
      totals.assigned += summary.total;
      totals.delivered += summary.delivered;
      totals.inTransit += summary.inTransit;
      totals.pending += summary.pending;
      totals.rejected += summary.rejected;
    });
    return totals;
  }, [riderStats]);

  const riderHistoryRows = useMemo(() => {
    return filteredRiders.map((rider) => {
      const stats = rider.authUid ? riderStats[rider.authUid] : undefined;
      const summary = summarizeRiderStats(stats);
      const lastAssigned = rider.authUid
        ? riderBookingMap.get(rider.authUid)?.[0]?.createdAt
        : undefined;
      return { rider, summary, lastAssigned };
    });
  }, [filteredRiders, riderStats, riderBookingMap]);

  const approvedActiveRiders = useMemo(
    () => riders.filter((rider) => rider.status === 'approved' && rider.authUid),
    [riders]
  );

  const riderLookup = useMemo(() => {
    const map = new Map<string, RiderApplication>();
    approvedActiveRiders.forEach((rider) => {
      if (rider.authUid) {
        map.set(rider.authUid, rider);
      }
    });
    return map;
  }, [approvedActiveRiders]);

  const totalCodBalance = useMemo(() => {
    return codAccounts.reduce((sum, account) => {
      const planTotal = Number.isFinite(account.planTotal) ? account.planTotal : 0;
      const fallback = Math.max(0, planTotal - CARD_FEE);
      const wallet =
        typeof account.walletBalance === 'number' && !Number.isNaN(account.walletBalance)
          ? account.walletBalance
          : fallback;
      return sum + wallet;
    }, 0);
  }, [codAccounts]);

  const codBookingMap = useMemo(() => {
    const map = new Map<
      string,
      {
        total: number;
        delivered: number;
        pending: number;
        totalCharge: number;
        codTotal: number;
        services: Record<string, number>;
        lastBooking?: string;
      }
    >();
    bookings.forEach((booking) => {
      if (!isCodBooking(booking)) return;
      const key =
        booking.merchantId ||
        (booking.merchantEmail ? booking.merchantEmail.toLowerCase() : '');
      if (!key) return;
      const current =
        map.get(key) || {
          total: 0,
          delivered: 0,
          pending: 0,
          totalCharge: 0,
          codTotal: 0,
          services: {}
        };
      current.total += 1;
      if (booking.status === 'delivered') {
        current.delivered += 1;
      }
      if (booking.status === 'pending') {
        current.pending += 1;
      }
      current.totalCharge += booking.shippingCharge || 0;
      const codValue = Number(booking.codAmount || 0);
      if (!Number.isNaN(codValue)) {
        current.codTotal += codValue;
      }
      const serviceKey = booking.serviceTitle || booking.serviceType || 'Other';
      current.services[serviceKey] =
        (current.services[serviceKey] || 0) + 1;
      if (!current.lastBooking) {
        current.lastBooking = booking.createdAt;
      } else if (new Date(booking.createdAt) > new Date(current.lastBooking)) {
        current.lastBooking = booking.createdAt;
      }
      map.set(key, current);
    });
    return map;
  }, [bookings]);

  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    return codAccounts.find((account) => account.id === selectedAccountId) ?? null;
  }, [codAccounts, selectedAccountId]);

  useEffect(() => {
    if (selectedAccountId && !selectedAccount) {
      setSelectedAccountId(null);
    }
  }, [selectedAccountId, selectedAccount]);

  const selectedBookings = useMemo(() => {
    if (!selectedAccount) return [];
    const email = selectedAccount.email?.toLowerCase().trim();
    return bookings.filter((booking) => {
      if (!isCodBooking(booking)) return false;
      if (booking.merchantId && booking.merchantId === selectedAccount.id) {
        return true;
      }
      if (
        email &&
        booking.merchantEmail &&
        booking.merchantEmail.toLowerCase() === email
      ) {
        return true;
      }
      return false;
    });
  }, [bookings, selectedAccount]);

  const selectedMetrics = useMemo(() => {
    const totalParcels = selectedBookings.length;
    const delivered = selectedBookings.filter(
      (booking) => booking.status === 'delivered'
    ).length;
    const inTransit = selectedBookings.filter(
      (booking) =>
        booking.status === 'in_transit' ||
        booking.status === 'out_for_delivery'
    ).length;
    const returned = selectedBookings.filter(
      (booking) => booking.status === 'delivery_rejected'
    ).length;
    const cancelled = selectedBookings.filter(
      (booking) => booking.status === 'pending'
    ).length;
    const totalCharges = selectedBookings.reduce(
      (sum, booking) => sum + (booking.shippingCharge || 0),
      0
    );
    const totalCodCollected = selectedBookings.reduce((sum, booking) => {
      const value = Number(booking.codAmount || 0);
      if (Number.isNaN(value)) return sum;
      if (booking.status === 'payment_received') {
        return sum + value;
      }
      return sum;
    }, 0);
    const pendingCodAmount = selectedBookings.reduce((sum, booking) => {
      const value = Number(booking.codAmount || 0);
      if (Number.isNaN(value)) return sum;
      if (booking.status === 'payment_received') return sum;
      return sum + value;
    }, 0);
    const pendingPayments = selectedBookings.filter((booking) => {
      const value = Number(booking.codAmount || 0);
      return !Number.isNaN(value) && value > 0 && booking.status !== 'payment_received';
    }).length;
    const lastActivity = selectedBookings
      .map((booking) => booking.createdAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    return {
      totalParcels,
      delivered,
      inTransit,
      returned,
      cancelled,
      totalCharges,
      totalCodCollected,
      pendingCodAmount,
      pendingPayments,
      lastActivity
    };
  }, [selectedBookings]);

  const merchantMonthlySeries = useMemo(() => {
    const items: {
      key: string;
      label: string;
      shipments: number;
      revenue: number;
      cod: number;
    }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const label = date.toLocaleString('en-US', { month: 'short' });
      items.push({ key, label, shipments: 0, revenue: 0, cod: 0 });
    }
    const lookup = new Map(items.map((item) => [item.key, item]));
    selectedBookings.forEach((booking) => {
      const created = new Date(booking.createdAt);
      if (Number.isNaN(created.getTime())) return;
      const key = `${created.getFullYear()}-${created.getMonth() + 1}`;
      const entry = lookup.get(key);
      if (!entry) return;
      entry.shipments += 1;
      entry.revenue += booking.shippingCharge || 0;
      const codValue = Number(booking.codAmount || 0);
      if (!Number.isNaN(codValue)) {
        entry.cod += codValue;
      }
    });
    return items;
  }, [selectedBookings]);

  const merchantTransactions = useMemo(() => {
    if (!selectedAccount) return [];
    const base: {
      id: string;
      type: 'deposit' | 'cod' | 'charge' | 'withdrawal';
      amount: number;
      date: string;
      status: string;
      notes: string;
    }[] = [];
    if (selectedAccount.planTotal) {
      base.push({
        id: `PLAN-${selectedAccount.id}`,
        type: 'deposit',
        amount: selectedAccount.planTotal,
        date: selectedAccount.createdAt,
        status: 'settled',
        notes: `${selectedAccount.planName} plan activation`
      });
    }
    selectedBookings.forEach((booking) => {
      base.push({
        id: `CHG-${booking.trackingId}`,
        type: 'charge',
        amount: booking.shippingCharge || 0,
        date: booking.createdAt,
        status: 'settled',
        notes: 'Shipping charge'
      });
      const codValue = Number(booking.codAmount || 0);
      if (!Number.isNaN(codValue) && codValue > 0) {
        base.push({
          id: `COD-${booking.trackingId}`,
          type: 'cod',
          amount: codValue,
          date: booking.createdAt,
          status:
            booking.status === 'payment_received' ? 'settled' : 'pending',
          notes: 'Cash on delivery'
        });
      }
    });
    const extras = manualTransactions[selectedAccount.id] || [];
    return [...base, ...extras].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [selectedAccount, selectedBookings, manualTransactions]);

  const transactionTotals = useMemo(() => {
    return merchantTransactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'deposit') acc.deposits += transaction.amount;
        if (transaction.type === 'withdrawal') acc.withdrawals += transaction.amount;
        if (transaction.type === 'cod' && transaction.status === 'settled') {
          acc.cod += transaction.amount;
        }
        if (transaction.type === 'charge') acc.charges += transaction.amount;
        return acc;
      },
      { deposits: 0, withdrawals: 0, cod: 0, charges: 0 }
    );
  }, [merchantTransactions]);

  const filteredParcels = useMemo(() => {
    return selectedBookings.filter((booking) => {
      const matchQuery = parcelQuery.trim()
        ? booking.trackingId.toLowerCase().includes(parcelQuery.trim().toLowerCase()) ||
          booking.receiverName.toLowerCase().includes(parcelQuery.trim().toLowerCase())
        : true;
      const matchStatus =
        parcelStatusFilter === 'all'
          ? true
          : booking.status === parcelStatusFilter;
      const date = new Date(booking.createdAt).getTime();
      const fromOk = parcelFrom ? date >= new Date(parcelFrom).getTime() : true;
      const toOk = parcelTo ? date <= new Date(parcelTo).getTime() : true;
      return matchQuery && matchStatus && fromOk && toOk;
    });
  }, [selectedBookings, parcelQuery, parcelStatusFilter, parcelFrom, parcelTo]);

  const filteredComplaints = useMemo(() => {
    const needle = complaintsQuery.trim().toLowerCase();
    if (!needle) return complaints;
    return complaints.filter((entry) => {
      return [
        entry.subject,
        entry.message,
        entry.merchantName,
        entry.email,
        entry.phone,
        entry.id
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [complaints, complaintsQuery]);

  const handleOpenMerchant = (accountId: string) => {
    setSelectedAccountId(accountId);
    setActivePanel('cod');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pendingFundRequests = useMemo(
    () => fundRequests.filter((request) => request.status === 'pending'),
    [fundRequests]
  );
  const selectedFundRequests = useMemo(() => {
    if (!selectedAccount) return [];
    return pendingFundRequests.filter(
      (request) => request.accountId === selectedAccount.id
    );
  }, [pendingFundRequests, selectedAccount]);

  useEffect(() => {
    const nextIds = new Set(bookings.map((item) => item.trackingId));
    if (!bookingsInitializedRef.current) {
      bookingIdsRef.current = nextIds;
      bookingsInitializedRef.current = true;
      return;
    }
    const prev = bookingIdsRef.current;
    const newBookings = bookings.filter((item) => !prev.has(item.trackingId));
    bookingIdsRef.current = nextIds;
    newBookings.forEach((booking) => {
      if (!isCodBooking(booking)) return;
      const accountId = booking.merchantId || undefined;
      const accountName =
        codAccounts.find((account) => account.id === accountId)?.companyName ||
        booking.merchantName ||
        'Merchant';
      flashAccount(accountId);
      addNotification({
        type: 'booking',
        title: 'New COD booking received',
        detail: `${accountName} • ${booking.trackingId}`,
        accountId,
        trackingId: booking.trackingId
      });
    });
  }, [bookings, codAccounts]);

  useEffect(() => {
    const pending = fundRequests.filter((request) => request.status === 'pending');
    const nextIds = new Set(pending.map((request) => request.id));
    if (!fundsInitializedRef.current) {
      fundIdsRef.current = nextIds;
      fundsInitializedRef.current = true;
      return;
    }
    const prev = fundIdsRef.current;
    const newRequests = pending.filter((request) => !prev.has(request.id));
    fundIdsRef.current = nextIds;
    newRequests.forEach((request) => {
      flashAccount(request.accountId);
      addNotification({
        type: 'fund',
        title: 'New fund request received',
        detail: `${request.companyName || 'Merchant'} • Rs. ${formatAmount(
          request.amount
        )}`,
        accountId: request.accountId,
        requestId: request.id
      });
    });
  }, [fundRequests]);

  const merchantActivity = useMemo(() => {
    if (!selectedAccount) return [];
    const base: { title: string; detail?: string; date: string }[] = [];
    base.push({
      title: 'Account created',
      detail: `Plan ${selectedAccount.planName} activated`,
      date: selectedAccount.createdAt
    });
    (selectedAccount.statusHistory || []).forEach((item) => {
      base.push({
        title: `Status changed to ${statusLabel(item.status)}`,
        detail: 'Admin action',
        date: item.at
      });
    });
    selectedBookings.forEach((booking) => {
      base.push({
        title: 'Parcel booked',
        detail: `Tracking ${booking.trackingId}`,
        date: booking.createdAt
      });
      if (booking.status === 'delivered') {
        base.push({
          title: 'Parcel delivered',
          detail: `Tracking ${booking.trackingId}`,
          date: booking.createdAt
        });
      }
      if (booking.status === 'payment_received') {
        base.push({
          title: 'COD payment received',
          detail: `Tracking ${booking.trackingId}`,
          date: booking.createdAt
        });
      }
    });
    const manual = adminActivity[selectedAccount.id] || [];
    return [...base, ...manual].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [selectedAccount, selectedBookings, adminActivity]);

  const shipmentSeries = merchantMonthlySeries.map((item) => item.shipments);
  const revenueSeries = merchantMonthlySeries.map((item) => item.revenue);
  const codSeries = merchantMonthlySeries.map((item) => item.cod);
  const shipmentPoints = buildSparklinePoints(shipmentSeries, 40);
  const revenuePoints = buildSparklinePoints(revenueSeries, 40);
  const codPoints = buildSparklinePoints(codSeries, 40);
  const maxMerchantShipments = Math.max(1, ...shipmentSeries);
  const maxMerchantRevenue = Math.max(1, ...revenueSeries);
  const maxMerchantCod = Math.max(1, ...codSeries);
  const walletBalance = getDisplayWalletBalance(selectedAccount);
  const returnRate = selectedMetrics.totalParcels
    ? Math.round((selectedMetrics.returned / selectedMetrics.totalParcels) * 100)
    : 0;

  const riskAlerts = useMemo(() => {
    const alerts: { title: string; detail: string; tone: string }[] = [];
    if (returnRate >= 20) {
      alerts.push({
        title: 'High return rate',
        detail: `Return rate at ${returnRate}% requires review.`,
        tone: 'bg-rose-50 text-rose-700 border-rose-200'
      });
    }
    if (walletBalance < 2000) {
      alerts.push({
        title: 'Low wallet balance',
        detail: 'Wallet balance below Rs. 2,000.',
        tone: 'bg-amber-50 text-amber-700 border-amber-200'
      });
    }
    if (selectedMetrics.pendingCodAmount > 0) {
      alerts.push({
        title: 'Overdue COD alert',
        detail: `Pending COD Rs. ${formatAmount(selectedMetrics.pendingCodAmount)}.`,
        tone: 'bg-orange-50 text-orange-700 border-orange-200'
      });
    }
    if (selectedMetrics.cancelled >= 5) {
      alerts.push({
        title: 'Suspicious activity',
        detail: 'Multiple pending or cancelled shipments detected.',
        tone: 'bg-slate-50 text-slate-700 border-slate-200'
      });
    }
    return alerts;
  }, [
    returnRate,
    walletBalance,
    selectedMetrics.pendingCodAmount,
    selectedMetrics.cancelled
  ]);

  const monthlyData = useMemo(() => {
    const items: { key: string; label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const label = date.toLocaleString('en-US', { month: 'short' });
      items.push({ key, label, count: 0 });
    }
    const lookup = new Map(items.map((item) => [item.key, item]));
    codAccounts.forEach((account) => {
      const created = new Date(account.createdAt);
      if (Number.isNaN(created.getTime())) return;
      const key = `${created.getFullYear()}-${created.getMonth() + 1}`;
      const entry = lookup.get(key);
      if (entry) entry.count += 1;
    });
    return items;
  }, [codAccounts]);

  const maxMonthly = Math.max(1, ...monthlyData.map((item) => item.count));

  const pushAdminActivity = (
    accountId: string,
    title: string,
    detail?: string
  ) => {
    setAdminActivity((prev) => {
      const next = { ...prev };
      const items = next[accountId] ? [...next[accountId]] : [];
      items.unshift({ title, detail, date: new Date().toISOString() });
      next[accountId] = items.slice(0, 120);
      return next;
    });
  };

  const requestConfirm = (
    title: string,
    description: string,
    onConfirm: () => void,
    confirmLabel = 'Confirm'
  ) => {
    setConfirmAction({ title, description, onConfirm, confirmLabel });
  };

  const handleCodStatusChange = async (
    accountId: string,
    nextStatus: CodAccountStatus
  ) => {
    try {
      await updateCodAccountStatus(accountId, nextStatus);
      setActionError('');
      pushAdminActivity(
        accountId,
        `Status changed to ${statusLabel(nextStatus)}`,
        'Admin control'
      );
    } catch (error) {
      console.error('[Admin] status update failed', error);
      setActionError(
        'Unable to update account status. Please check Firebase permissions.'
      );
    }
  };

  const handleRiderStatusChange = async (
    riderId: string,
    nextStatus: RiderStatus
  ) => {
    try {
      await updateRiderStatus(riderId, nextStatus);
      setActionError('');
    } catch (error) {
      console.error('[Admin] rider status update failed', error);
      setActionError(
        'Unable to update rider status. Please check Firebase permissions.'
      );
    }
  };

  const handleAssignRider = async (booking: Booking, riderAuthUid: string) => {
    const rider = riderLookup.get(riderAuthUid);
    if (!rider || !rider.authUid) {
      setActionError('Selected rider does not have an active login.');
      return;
    }
    try {
      await updateBookingAssignment(booking.trackingId, {
        riderId: rider.authUid,
        riderName: rider.fullName,
        riderCity: rider.city
      });
      setActionError('');
    } catch (error) {
      console.error('[Admin] assign rider failed', error);
      setActionError(
        'Unable to assign rider. Please check Firebase permissions.'
      );
    }
  };

  const handleApproveFundRequest = async (request: FundRequest) => {
    try {
      const approvedAt = new Date().toISOString();
      const approvedBy = auth.currentUser?.email || null;
      await updateFundRequestStatus(request.id, 'approved');
      await adjustCodAccountWallet(request.accountId, request.amount);
      await addAcceptedFundRequest(request, { approvedAt, approvedBy });
      setActionError('');
      pushAdminActivity(
        request.accountId,
        'Fund request approved',
        `Rs. ${formatAmount(request.amount)} added to wallet`
      );
    } catch (error) {
      console.error('[Admin] fund approve failed', error);
      setActionError(
        'Unable to approve fund request. Please check Firebase permissions.'
      );
    }
  };

  const handleRejectFundRequest = async (request: FundRequest) => {
    await updateFundRequestStatus(request.id, 'rejected');
    pushAdminActivity(
      request.accountId,
      'Fund request rejected',
      `Rs. ${formatAmount(request.amount)}`
    );
  };

  const handleClear = async () => {
    await deleteAllBookings();
    setBookings([]);
  };

  const handleCodClear = async () => {
    await clearCodAccounts();
    setCodAccounts([]);
    setSelectedAccountId(null);
  };

  const handleRiderClear = async () => {
    await clearRiders();
    setRiders([]);
  };

  const handleCopy = async (value: string) => {
    const doFallbackCopy = () => {
      const textarea = document.createElement('textarea');
      textarea.value = value;
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
        await navigator.clipboard.writeText(value);
      } else {
        doFallbackCopy();
      }
      setCopiedId(value);
      setTimeout(() => setCopiedId(''), 1500);
    } catch {
      doFallbackCopy();
      setCopiedId(value);
      setTimeout(() => setCopiedId(''), 1500);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      navigate('/admin-login', { replace: true });
    }
  };

  return (
    <div
      className="admin-ui min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100/70 text-slate-900 antialiased"
      style={{ fontFamily: "'Poppins', 'Inter', system-ui, sans-serif" }}>
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-[#0F172A] text-slate-200">
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center">
            <LayoutGrid className="h-5 w-5 text-white" />
          </div>
        </div>
        <nav className="px-4 space-y-2 flex-1">
          <button
            onClick={() => setActivePanel('cod')}
            className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
              activePanel === 'cod'
                ? 'bg-white/10 text-white'
                : 'text-white hover:bg-white/5'
            }`}>
            <Users className="h-4 w-4" />
            COD Accounts
          </button>
          <button
            onClick={() => setActivePanel('bookings')}
            className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
              activePanel === 'bookings'
                ? 'bg-white/10 text-white'
                : 'text-white hover:bg-white/5'
            }`}>
            <Truck className="h-4 w-4" />
            Non COD
          </button>
          <button
            onClick={() => setActivePanel('riders')}
            className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
              activePanel === 'riders'
                ? 'bg-white/10 text-white'
                : 'text-white hover:bg-white/5'
            }`}>
            <UserCircle2 className="h-4 w-4" />
            Riders
          </button>
          <button
            onClick={() => setActivePanel('receipts')}
            className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
              activePanel === 'receipts'
                ? 'bg-white/10 text-white'
                : 'text-white hover:bg-white/5'
            }`}>
            <FileText className="h-4 w-4" />
            Delivery Receipts
          </button>
          <button
            onClick={() => setActivePanel('slips')}
            className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
              activePanel === 'slips'
                ? 'bg-white/10 text-white'
                : 'text-white hover:bg-white/5'
            }`}>
            <FileText className="h-4 w-4" />
            Booking Slip
          </button>
          <button
            onClick={() => setActivePanel('complaints')}
            className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
              activePanel === 'complaints'
                ? 'bg-white/10 text-white'
                : 'text-white hover:bg-white/5'
            }`}>
            <MessageSquare className="h-4 w-4" />
            Complaints
          </button>
          <button
            onClick={() => setActivePanel('rider-history')}
            className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
              activePanel === 'rider-history'
                ? 'bg-white/10 text-white'
                : 'text-white hover:bg-white/5'
            }`}>
            <History className="h-4 w-4" />
            Rider History
          </button>
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="px-4 sm:px-6 lg:px-10 py-4 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={
                  activePanel === 'cod'
                    ? codQuery
                    : activePanel === 'riders' || activePanel === 'rider-history'
                      ? riderQuery
                      : activePanel === 'receipts'
                        ? receiptQuery
                    : activePanel === 'slips'
                      ? slipQuery
                      : activePanel === 'complaints'
                        ? complaintsQuery
                        : query
                }
                onChange={(e) =>
                  activePanel === 'cod'
                    ? setCodQuery(e.target.value)
                    : activePanel === 'riders' || activePanel === 'rider-history'
                      ? setRiderQuery(e.target.value)
                      : activePanel === 'receipts'
                        ? setReceiptQuery(e.target.value)
                    : activePanel === 'slips'
                      ? setSlipQuery(e.target.value)
                      : activePanel === 'complaints'
                        ? setComplaintsQuery(e.target.value)
                        : setQuery(e.target.value)
                }
                placeholder={
                  activePanel === 'cod'
                    ? 'Search merchants, email, phone...'
                    : activePanel === 'riders' || activePanel === 'rider-history'
                      ? 'Search riders, CNIC, phone...'
                      : activePanel === 'receipts'
                        ? 'Search receipts, tracking, rider, receiver...'
                    : activePanel === 'slips'
                      ? 'Search slips, tracking, sender, receiver...'
                      : activePanel === 'complaints'
                        ? 'Search complaints, merchant, email...'
                        : 'Search tracking ID...'
                }
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-10 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => navigate('/alerts?scope=admin')}
              className="h-10 w-10 rounded-2xl border border-slate-200 bg-white/80 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition">
              <Bell className="h-4 w-4 mx-auto" />
            </button>
          </div>
        </header>

        <main className="px-3 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6 sm:space-y-8 break-words">
          {(bookingsLoadError ||
            codAccountsLoadError ||
            fundRequestsLoadError ||
            complaintsLoadError ||
            ridersLoadError ||
            actionError) && (
            <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
              {bookingsLoadError && <div>{bookingsLoadError}</div>}
              {codAccountsLoadError && <div>{codAccountsLoadError}</div>}
              {fundRequestsLoadError && <div>{fundRequestsLoadError}</div>}
              {complaintsLoadError && <div>{complaintsLoadError}</div>}
              {ridersLoadError && <div>{ridersLoadError}</div>}
              {actionError && <div>{actionError}</div>}
            </section>
          )}
          {liveNotifications.length > 0 && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm space-y-2">
              {liveNotifications.map((notice) => (
                <div
                  key={notice.id}
                  className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold">{notice.title}</span>{' '}
                    <span className="text-emerald-700">{notice.detail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {notice.accountId && (
                      <button
                        type="button"
                        onClick={() => {
                          setActivePanel('cod');
                          setSelectedAccountId(notice.accountId || null);
                          dismissNotification(notice);
                        }}
                        className="px-3 py-1.5 rounded-full bg-white text-emerald-700 text-xs font-semibold border border-emerald-200 hover:bg-emerald-100">
                        Open Profile
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => dismissNotification(notice)}
                      className="text-xs text-emerald-700 hover:text-emerald-900">
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {activePanel === 'cod' ? (
                <button
                  onClick={handleCodClear}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg shadow-slate-900/10">
                  <Trash2 className="w-4 h-4" />
                  Clear COD Accounts
                </button>
              ) : activePanel === 'bookings' ? (
                <button
                  onClick={handleClear}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg shadow-slate-900/10">
                  <Trash2 className="w-4 h-4" />
                  Clear Bookings
                </button>
              ) : activePanel === 'riders' ? (
                <button
                  onClick={() =>
                    requestConfirm(
                      'Clear Riders',
                      'This will permanently delete all rider applications.',
                      handleRiderClear,
                      'Clear Riders'
                    )
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg shadow-slate-900/10">
                  <Trash2 className="w-4 h-4" />
                  Clear Riders
                </button>
              ) : null}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-semibold shadow-lg shadow-red-600/25 border border-transparent focus:outline-none focus:ring-0 focus-visible:ring-0">
              Logout
            </button>
            </div>
          </div>

          {pendingFundRequests.length > 0 && (
            <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
              Fund request received from{' '}
              <span className="font-semibold">
                {pendingFundRequests[0].companyName || 'Merchant'}
              </span>{' '}
              (ID: {pendingFundRequests[0].accountId}). Open the user profile to
              review and approve.
            </section>
          )}

          <div className="lg:hidden grid grid-cols-4 sm:grid-cols-7 gap-2 rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm">
            {[
              { key: 'cod', label: 'COD', icon: Users },
              { key: 'bookings', label: 'Non COD', icon: Truck },
              { key: 'riders', label: 'Riders', icon: UserCircle2 },
              { key: 'receipts', label: 'Receipts', icon: FileText },
              { key: 'slips', label: 'Slips', icon: FileText },
              { key: 'complaints', label: 'Complaints', icon: MessageSquare },
              { key: 'rider-history', label: 'History', icon: History }
            ].map((item) => {
              const isActive = activePanel === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => setActivePanel(item.key as typeof activePanel)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}>
                  <Icon className="h-4 w-4" />
                  <span className="leading-none">{item.label}</span>
                </button>
              );
            })}
          </div>
          {activePanel === 'cod' ? (
            selectedAccount ? (
              <div className="space-y-8">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <button
                        onClick={() => setSelectedAccountId(null)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800">
                        <ArrowLeft className="h-4 w-4" />
                        Back to merchants
                      </button>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mt-3">
                        Merchant Profile
                      </p>
                      <h2 className="text-3xl font-semibold text-slate-900 mt-2">
                        {selectedAccount.companyName || 'Merchant Account'}
                      </h2>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className={planBadgeClass(selectedAccount.planName)}>
                          {selectedAccount.planName}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${codStatusBadge[selectedAccount.status]}`}>
                          {statusLabel(selectedAccount.status)}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                          ID: {selectedAccount.id}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        Status
                        <select
                          value={selectedAccount.status}
                          onChange={(e) => {
                            const nextStatus = e.target.value as CodAccountStatus;
                            if (nextStatus === selectedAccount.status) return;
                            requestConfirm(
                              'Change account status',
                              `Change status to ${statusLabel(nextStatus)}?`,
                              () => handleCodStatusChange(selectedAccount.id, nextStatus)
                            );
                          }}
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {codStatusOptions.map((status) => (
                            <option key={status.key} value={status.key}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          const nextStatus =
                            selectedAccount.status === 'suspended' ||
                            selectedAccount.status === 'rejected'
                              ? 'approved'
                              : 'suspended';
                          requestConfirm(
                            nextStatus === 'approved'
                              ? 'Activate account'
                              : 'Suspend account',
                            `Are you sure you want to set status to ${statusLabel(
                              nextStatus
                            )}?`,
                            () => handleCodStatusChange(selectedAccount.id, nextStatus)
                          );
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition ${
                          selectedAccount.status === 'suspended' ||
                          selectedAccount.status === 'rejected'
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-rose-500 text-white hover:bg-rose-600'
                        }`}>
                        {selectedAccount.status === 'suspended' ||
                        selectedAccount.status === 'rejected'
                          ? 'Activate'
                          : 'Suspend'}
                      </button>
                      <button
                        onClick={() =>
                          document
                            .getElementById('company-info')
                            ?.scrollIntoView({ behavior: 'smooth' })
                        }
                        className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50">
                        <Edit3 className="h-4 w-4 inline-block mr-2" />
                        Edit Profile
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      {
                        label: 'Registration ID',
                        value: selectedAccount.id
                      },
                      {
                        label: 'Account Status',
                        value: statusLabel(selectedAccount.status)
                      },
                      {
                        label: 'Plan Type',
                        value: selectedAccount.planName
                      },
                      {
                        label: 'City',
                        value: selectedAccount.city || '-'
                      },
                      {
                        label: 'Account Created',
                        value: formatDateTime(selectedAccount.createdAt)
                      },
                      {
                        label: 'Last Login',
                        value: selectedAccount.lastLoginAt
                          ? formatDateTime(selectedAccount.lastLoginAt)
                          : 'Not available'
                      },
                      {
                        label: 'Last Activity',
                        value: selectedMetrics.lastActivity
                          ? formatDateTime(selectedMetrics.lastActivity)
                          : '-'
                      },
                      {
                        label: 'Assigned Manager',
                        value: selectedAccount.assignedManager || 'Not assigned'
                      }
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          {item.label}
                        </p>
                        <p className="text-lg font-semibold text-slate-900 mt-2">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
                {selectedFundRequests.length > 0 && (
                  <section className="rounded-3xl border border-rose-200 bg-rose-50/60 p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-600">
                          Fund Request
                        </p>
                        <h2 className="text-2xl font-semibold text-slate-900 mt-2">
                          Wallet Top-up Pending
                        </h2>
                        <p className="text-sm text-slate-600 mt-2">
                          Review this request and approve to add funds instantly.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/70 border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600">
                        Action Required
                      </div>
                    </div>
                    <div className="mt-5 grid gap-4">
                      {selectedFundRequests.map((request) => (
                        <div
                          key={request.id}
                          className={`rounded-2xl border border-rose-100 bg-white p-5 shadow-sm ${
                            isHighlighted(request.accountId)
                              ? 'ring-2 ring-rose-200 animate-pulse'
                              : ''
                          }`}>
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="text-lg font-semibold text-slate-900">
                                {request.companyName || 'Merchant'}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Account ID: {request.accountId}
                              </p>
                              <p className="text-xs text-slate-500">
                                Requested: {formatDateTime(request.createdAt)}
                              </p>
                              <p className="text-xs text-slate-500">
                                Contact: {request.contactName || '-'} •{' '}
                                {request.phone || '-'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs uppercase tracking-[0.3em] text-rose-600">
                                Amount
                              </p>
                              <p className="text-2xl font-black text-slate-900 mt-1">
                                Rs. {formatAmount(request.amount)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                            <div>Bank: {request.bankName || '-'}</div>
                            <div>Title: {request.accountTitle || '-'}</div>
                            <div>Account: {request.accountNumber || '-'}</div>
                            <div>IBAN: {request.iban || '-'}</div>
                            <div>CNIC: {request.cnic || '-'}</div>
                            <div>Email: {request.email || '-'}</div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() => handleApproveFundRequest(request)}
                              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
                              <BadgeCheck className="h-4 w-4" />
                              Approve & Add Rs. {formatAmount(request.amount)}
                            </button>
                            <button
                              onClick={() => handleRejectFundRequest(request)}
                              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100">
                              <XCircle className="h-4 w-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Financial Overview
                      </p>
                      <p className="text-xs text-slate-500">
                        Wallet, deposits, COD and charges
                      </p>
                    </div>
                    <div className="text-xs text-slate-400">
                      Updated: {formatDateTime(new Date().toISOString())}
                    </div>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      {
                        label: 'Total Wallet Balance',
                        value: `Rs. ${formatAmount(walletBalance)}`,
                        icon: Wallet,
                        points: revenuePoints
                      },
                      {
                        label: 'Total Deposits',
                        value: `Rs. ${formatAmount(transactionTotals.deposits)}`,
                        icon: BadgeCheck,
                        points: revenuePoints
                      },
                      {
                        label: 'Total Withdrawals',
                        value: `Rs. ${formatAmount(transactionTotals.withdrawals)}`,
                        icon: Clipboard,
                        points: revenuePoints
                      },
                      {
                        label: 'Total COD Collected',
                        value: `Rs. ${formatAmount(transactionTotals.cod)}`,
                        icon: Wallet,
                        points: codPoints
                      },
                      {
                        label: 'Pending Payments',
                        value: `${selectedMetrics.pendingPayments}`,
                        icon: Clock,
                        points: shipmentPoints
                      },
                      {
                        label: 'Total Charges',
                        value: `Rs. ${formatAmount(transactionTotals.charges)}`,
                        icon: BarChart3,
                        points: revenuePoints
                      }
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              {item.label}
                            </p>
                            <p className="text-2xl font-semibold text-slate-900 mt-2">
                              {item.value}
                            </p>
                          </div>
                          <div className="h-10 w-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                            <item.icon className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="mt-4 h-10">
                          <svg
                            viewBox="0 0 100 40"
                            preserveAspectRatio="none"
                            className="w-full h-full">
                            <polyline
                              fill="none"
                              stroke="rgba(59,130,246,0.6)"
                              strokeWidth="2"
                              points={item.points}
                            />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="grid gap-6 lg:grid-cols-12">
                  <div className="lg:col-span-4 grid gap-4">
                    {[
                      {
                        label: 'Total Parcels',
                        value: selectedMetrics.totalParcels,
                        icon: Truck
                      },
                      {
                        label: 'Delivered',
                        value: selectedMetrics.delivered,
                        icon: CheckCircle2
                      },
                      {
                        label: 'In Transit',
                        value: selectedMetrics.inTransit,
                        icon: Truck
                      },
                      {
                        label: 'Returned',
                        value: selectedMetrics.returned,
                        icon: XCircle
                      },
                      {
                        label: 'Cancelled',
                        value: selectedMetrics.cancelled,
                        icon: Clipboard
                      }
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            {item.label}
                          </p>
                          <div className="h-9 w-9 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                            <item.icon className="h-4 w-4" />
                          </div>
                        </div>
                        <p className="text-2xl font-semibold text-slate-900 mt-3">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="lg:col-span-8 grid gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                        Monthly Shipments
                        <span className="text-xs text-slate-400">
                          Last 6 months
                        </span>
                      </div>
                      <div className="mt-5 h-44 relative rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                        <div className="absolute inset-4 rounded-xl bg-[linear-gradient(to_top,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:100%_20px]" />
                        <div className="relative flex items-end gap-4 h-full">
                          {merchantMonthlySeries.map((item) => {
                            const height = Math.round(
                              (item.shipments / maxMerchantShipments) * 100
                            );
                            return (
                              <div
                                key={item.key}
                                className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full flex items-end h-full">
                                  <div
                                    className="w-full rounded-t-2xl rounded-b-md bg-gradient-to-t from-indigo-600 via-blue-500 to-sky-300 shadow-sm"
                                    style={{ height: `${Math.max(8, height)}%` }}
                                  />
                                </div>
                                <div className="text-xs text-slate-500">
                                  {item.label}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                          Revenue Trend
                          <span className="text-xs text-slate-400">
                            Monthly
                          </span>
                        </div>
                        <div className="mt-5 h-32">
                          <svg
                            viewBox="0 0 100 40"
                            preserveAspectRatio="none"
                            className="w-full h-full">
                            <polyline
                              fill="none"
                              stroke="rgba(14,165,233,0.9)"
                              strokeWidth="2"
                              points={revenuePoints}
                            />
                          </svg>
                        </div>
                        <div className="mt-3 text-xs text-slate-500">
                          Peak revenue: Rs. {formatAmount(maxMerchantRevenue)}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                          COD Performance
                          <span className="text-xs text-slate-400">
                            Pending vs Collected
                          </span>
                        </div>
                        <div className="mt-5 space-y-4">
                          <div>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>Collected</span>
                              <span>
                                Rs. {formatAmount(transactionTotals.cod)}
                              </span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500"
                                style={{
                                  width: `${
                                    transactionTotals.cod + selectedMetrics.pendingCodAmount
                                      ? (transactionTotals.cod /
                                          (transactionTotals.cod +
                                            selectedMetrics.pendingCodAmount)) *
                                        100
                                      : 0
                                  }%`
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>Pending</span>
                              <span>
                                Rs. {formatAmount(selectedMetrics.pendingCodAmount)}
                              </span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-amber-500"
                                style={{
                                  width: `${
                                    transactionTotals.cod + selectedMetrics.pendingCodAmount
                                      ? (selectedMetrics.pendingCodAmount /
                                          (transactionTotals.cod +
                                            selectedMetrics.pendingCodAmount)) *
                                        100
                                      : 0
                                  }%`
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-xs text-slate-500">
                            COD recovery rate: {returnRate > 0 ? 100 - returnRate : 100}%
                          </div>
                          <div className="text-xs text-slate-500">
                            Peak COD: Rs. {formatAmount(maxMerchantCod)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section
                  id="company-info"
                  className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-600 font-semibold text-lg">
                        <Building2 className="h-4 w-4" />
                        Company Info
                      </div>
                      <button className="text-slate-400 hover:text-slate-600">
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-4 text-sm text-slate-600 space-y-2">
                      <p className="font-semibold text-slate-900">
                        {selectedAccount.companyName || '-'}
                      </p>
                      <p>{selectedAccount.companyLegalName || '-'}</p>
                      <p>{selectedAccount.businessType || '-'}</p>
                      <p>{selectedAccount.website || '-'}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-violet-600 font-semibold text-lg">
                        <UserCircle2 className="h-4 w-4" />
                        Contact Info
                      </div>
                      <button className="text-slate-400 hover:text-slate-600">
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-4 text-sm text-slate-600 space-y-2">
                      <p className="font-semibold text-slate-900">
                        {selectedAccount.contactName || '-'}
                      </p>
                      <p>{selectedAccount.phone || '-'}</p>
                      <p>{selectedAccount.email || '-'}</p>
                      <p>{selectedAccount.altPhone || '-'}</p>
                      <p>{selectedAccount.address || '-'}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-600 font-semibold text-lg">
                        <BadgeCheck className="h-4 w-4" />
                        Compliance
                      </div>
                      <button className="text-slate-400 hover:text-slate-600">
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-4 text-sm text-slate-600 space-y-2">
                      <p>CNIC: {selectedAccount.cnic || '-'}</p>
                      <p>NTN/GST: {maskValue(selectedAccount.ntnGst || '')}</p>
                      <p>Registration ID: {selectedAccount.id}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-600 font-semibold text-lg">
                        <MapPin className="h-4 w-4" />
                        Pickup Address
                      </div>
                      <button className="text-slate-400 hover:text-slate-600">
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-4 text-sm text-slate-600 space-y-2">
                      <p>City: {selectedAccount.city || '-'}</p>
                      <p>Pickup: {selectedAccount.pickupTimings || '-'}</p>
                      <p>Monthly: {selectedAccount.monthlyShipment || '-'}</p>
                      <p>Instructions: {selectedAccount.specialInstructions || '-'}</p>
                      <p>Map Pin: {selectedAccount.googleMapPin || '-'}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sky-600 font-semibold text-lg">
                        <Wallet className="h-4 w-4" />
                        Bank Details
                      </div>
                      <button className="text-slate-400 hover:text-slate-600">
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-slate-600">
                      <p>Bank: {selectedAccount.bankName || '-'}</p>
                      <p>Title: {selectedAccount.accountTitle || '-'}</p>
                      <p>Account: {maskValue(selectedAccount.accountNumber || '')}</p>
                      <p>IBAN: {selectedAccount.iban || '-'}</p>
                      <p>Swift: {selectedAccount.swiftCode || '-'}</p>
                      <p>
                        Branch: {selectedAccount.branchName || '-'}{' '}
                        {selectedAccount.branchCode || ''}
                      </p>
                    </div>
                  </div>
                </section>
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-2xl font-semibold text-slate-800">
                        Activity Log
                      </p>
                      <p className="text-sm text-slate-500">
                        Full timeline of account activity and admin actions
                      </p>
                    </div>
                    <div className="text-xs text-slate-400">
                      Audit log enabled
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    {merchantActivity.slice(0, 14).map((event, index) => (
                      <div
                        key={`${event.title}-${index}`}
                        className="flex gap-4">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                            <Bell className="h-4 w-4" />
                          </div>
                          {index !== merchantActivity.length - 1 && (
                            <div className="absolute left-1/2 top-10 h-6 w-px bg-slate-200" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {event.title}
                          </p>
                          {event.detail && (
                            <p className="text-xs text-slate-500 mt-1">
                              {event.detail}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDateTime(event.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {merchantActivity.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No activity recorded yet.
                      </p>
                    )}
                  </div>
                </section>
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-2xl font-semibold text-slate-800">
                        Risk & Alerts
                      </p>
                      <p className="text-sm text-slate-500">
                        Smart risk signals and automated warnings
                      </p>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {riskAlerts.length ? (
                      riskAlerts.map((alert) => (
                        <div
                          key={alert.title}
                          className={`rounded-2xl border p-4 ${alert.tone}`}>
                          <p className="text-sm font-semibold">{alert.title}</p>
                          <p className="text-xs mt-2">{alert.detail}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 text-sm">
                        All clear. No risk alerts for this merchant.
                      </div>
                    )}
                  </div>
                </section>
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-2xl font-semibold text-slate-800">
                        Parcel History
                      </p>
                      <p className="text-sm text-slate-500">
                        Complete shipment record for this merchant
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="h-4 w-4" />
                      {filteredParcels.length} parcels
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-5">
                    <div className="relative lg:col-span-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        value={parcelQuery}
                        onChange={(e) => setParcelQuery(e.target.value)}
                        placeholder="Search tracking or receiver"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <select
                      value={parcelStatusFilter}
                      onChange={(e) => setParcelStatusFilter(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="all">All status</option>
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.key} value={status.key}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2 lg:col-span-2">
                      <input
                        type="date"
                        value={parcelFrom}
                        onChange={(e) => setParcelFrom(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="date"
                        value={parcelTo}
                        onChange={(e) => setParcelTo(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {filteredParcels.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      No parcels found for the selected filters.
                    </div>
                  ) : (
                    <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {filteredParcels.map((booking) => {
                        const statusConfig =
                          STATUS_OPTIONS.find((s) => s.key === booking.status) ??
                          STATUS_OPTIONS[0];
                        const lastUpdate =
                          booking.statusHistory[booking.statusHistory.length - 1]
                            ?.at ?? booking.createdAt;
                        const rate = serviceRates[booking.serviceType] ?? {
                          baseHalf: 0,
                          baseOne: 0,
                          additionalPerKg: 0
                        };
                        const baseRate =
                          booking.weightKg <= 0.5 ? rate.baseHalf : rate.baseOne;
                        const extraKg =
                          booking.weightKg > 1 ? Math.ceil(booking.weightKg - 1) : 0;
                        const extraCharge = extraKg * rate.additionalPerKg;
                        const outCityCharge = booking.outOfCity ? 200 : 0;
                        const totalAmount =
                          booking.shippingCharge ??
                          baseRate + extraCharge + outCityCharge;
                        const riderOptions = approvedActiveRiders;
                        return (
                          <div
                            key={booking.trackingId}
                            className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm transition hover:shadow-xl hover:-translate-y-1 space-y-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                  Tracking ID
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <p className="text-lg font-semibold text-slate-900 break-words">
                                    {booking.trackingId}
                                  </p>
                                  <button
                                    onClick={() => handleCopy(booking.trackingId)}
                                    className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                                    <Clipboard className="w-4 h-4" />
                                    {copiedId === booking.trackingId ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                                <p className="text-sm text-slate-600 mt-2 break-words">
                                  {booking.senderCity} → {booking.receiverCity}
                                </p>
                                <div className="mt-2 text-xs text-slate-500">
                                  Created {formatDate(booking.createdAt)} •{' '}
                                  {formatTime(booking.createdAt)}
                                </div>
                                <div className="text-xs text-slate-500">
                                  Updated {formatDate(lastUpdate)} •{' '}
                                  {formatTime(lastUpdate)}
                                </div>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${statusConfig.badge}`}>
                                {statusConfig.label}
                              </span>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 text-sm">
                              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                  Sender
                                </p>
                              <p className="text-sm font-semibold text-slate-900 mt-2">
                                {booking.senderName || '-'}
                              </p>
                              {isCodBooking(booking) && (
                                <p className="text-xs text-emerald-700 mt-1">
                                  Shipper (COD): {booking.merchantName || booking.merchantEmail || booking.merchantId || '-'}
                                </p>
                              )}
                              <p className="text-xs text-slate-500">
                                {booking.senderPhone || '-'}
                              </p>
                                <p className="text-xs text-slate-500">
                                  {booking.senderAddress || '-'}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                  Receiver
                                </p>
                                <p className="text-sm font-semibold text-slate-900 mt-2">
                                  {booking.receiverName || '-'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {booking.receiverPhone || '-'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {booking.receiverAddress || '-'}
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 text-sm">
                              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                  Service
                                </p>
                                <p className="text-sm font-semibold text-slate-900 mt-2">
                                  {booking.serviceTitle}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                  Weight
                                </p>
                                <p className="text-sm font-semibold text-slate-900 mt-2">
                                  {booking.weightKg.toFixed(3)} kg
                                </p>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                  COD
                                </p>
                                <p className="text-sm font-semibold text-slate-900 mt-2">
                                  {booking.codAmount
                                    ? `Rs. ${booking.codAmount}`
                                    : 'Rs. 0'}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                  Total
                                </p>
                                <p className="text-sm font-semibold text-slate-900 mt-2">
                                  Rs. {formatAmount(totalAmount)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                              <div className="text-slate-700">
                                Delivery Code{' '}
                                <span className="font-semibold text-slate-900">
                                  {booking.deliveryCode}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-3 py-2 rounded-xl text-xs font-semibold ${statusConfig.badge}`}>
                                  {statusConfig.label}
                                </span>
                                <span className="text-xs text-slate-400">
                                  Rider controlled
                                </span>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm">
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Assigned Rider
                              </p>
                              <p className="text-sm font-semibold text-slate-900 mt-2">
                                {booking.assignedRiderName || 'Not assigned'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {booking.assignedRiderCity || booking.receiverCity || '-'}
                              </p>
                              {riderOptions.length > 0 ? (
                                <div className="mt-3">
                                  <select
                                    value={booking.assignedRiderId || ''}
                                    onChange={(e) => {
                                      const riderAuthUid = e.target.value;
                                      if (!riderAuthUid) return;
                                      handleAssignRider(booking, riderAuthUid);
                                    }}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                                    <option value="">Assign rider</option>
                                    {riderOptions.map((rider) => (
                                      <option
                                        key={rider.authUid || rider.id}
                                        value={rider.authUid || ''}>
                                        {rider.fullName} • {rider.city}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 mt-2">
                                  No approved riders with active login yet.
                                </p>
                              )}
                            </div>

                            {booking.status === 'delivery_rejected' &&
                              booking.rejectionReason && (
                                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                                  <p className="text-xs uppercase tracking-[0.2em] text-rose-400">
                                    Rejection Reason
                                  </p>
                                  <p className="mt-2 font-semibold text-rose-800">
                                    {booking.rejectionReason}
                                  </p>
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </section>
                  )}
                </section>
              </div>
            ) : (
            <>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  {provinceParam ? (
                    <>
                      <button
                        onClick={() => {
                          setCodProvinceFilter('all');
                          setCodStatusFilter('all');
                          navigate('/admin?tab=cod');
                        }}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800">
                        <ArrowLeft className="h-4 w-4" />
                        Back to COD Dashboard
                      </button>
                      <h2 className="text-3xl lg:text-4xl font-semibold text-slate-900 mt-3">
                        {provinceParam === 'punjab'
                          ? 'Punjab Customers'
                          : provinceParam === 'sindh'
                            ? 'Sindh Customers'
                            : provinceParam === 'kpk'
                              ? 'KP Customers'
                              : 'Balochistan Customers'}
                      </h2>
                      <p className="text-sm text-slate-500 mt-2">
                        View and approve COD accounts for this province.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-3xl lg:text-4xl font-semibold text-slate-900 mt-2">
                        COD Control Center
                      </h2>
                      <p className="text-sm text-slate-500 mt-2">
                        Manage COD merchants, approvals, and settlement activity.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {!provinceParam && (
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      key: 'punjab',
                      label: 'Punjab Customers',
                      count: codProvinceCounts.punjab,
                      pending: codProvincePendingCounts.punjab,
                      className:
                        'border-emerald-200 bg-emerald-50 text-emerald-700'
                    },
                    {
                      key: 'sindh',
                      label: 'Sindh Customers',
                      count: codProvinceCounts.sindh,
                      pending: codProvincePendingCounts.sindh,
                      className:
                        'border-blue-200 bg-blue-50 text-blue-700'
                    },
                    {
                      key: 'kpk',
                      label: 'KP Customers',
                      count: codProvinceCounts.kpk,
                      pending: codProvincePendingCounts.kpk,
                      className:
                        'border-amber-200 bg-amber-50 text-amber-700'
                    },
                    {
                      key: 'balochistan',
                      label: 'Balochistan Customers',
                      count: codProvinceCounts.balochistan,
                      pending: codProvincePendingCounts.balochistan,
                      className:
                        'border-rose-200 bg-rose-50 text-rose-700'
                    }
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        setCodProvinceFilter(item.key as typeof codProvinceFilter);
                        setSelectedAccountId(null);
                        if (item.pending > 0) {
                          setCodStatusFilter('pending');
                        }
                        const params = new URLSearchParams();
                        params.set('tab', 'cod');
                        params.set('province', item.key);
                        if (item.pending > 0) {
                          params.set('status', 'pending');
                        }
                        navigate(`/admin?${params.toString()}`);
                      }}
                      className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-1 ${
                        codProvinceFilter === item.key
                          ? 'shadow-lg shadow-slate-900/10 ring-2 ring-slate-900/10'
                          : 'shadow-sm'
                      } ${item.className}`}>
                      {item.pending > 0 && (
                        <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-60"></span>
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600"></span>
                            </span>
                            Pending {item.pending}
                          </span>
                          <span className="text-[10px] text-slate-600">
                            Click to review
                          </span>
                        </div>
                      )}
                      <div className="text-xs uppercase tracking-[0.2em]">
                        {item.label}
                      </div>
                      <div className="text-2xl font-semibold mt-2">
                        {item.count}
                      </div>
                    </button>
                  ))}
                </section>
              )}
              <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-1 animate-fade-up">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Total Merchants
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 mt-2">
                        {codCounts.all}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Active COD accounts
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-slate-900/10 text-slate-900 flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-1 animate-fade-up">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Total Wallet Balance
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 mt-2">
                        Rs. {formatAmount(totalCodBalance)}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Plan fees collected
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <Wallet className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-1 animate-fade-up">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Pending Review
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 mt-2">
                        {codCounts.pending}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Awaiting approval
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-amber-400/15 text-amber-500 flex items-center justify-center">
                      <Clock className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-1 animate-fade-up">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Approved Merchants
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 mt-2">
                        {codCounts.approved}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Active & verified
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      Monthly Registrations
                    </div>
                    <span className="text-xs text-slate-400">
                      Last 6 months
                    </span>
                  </div>
                  <div className="mt-6 h-44 relative rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <div className="absolute inset-4 rounded-xl bg-[linear-gradient(to_top,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:100%_20px]" />
                    <div className="relative flex items-end gap-4 h-full">
                      {monthlyData.map((item) => {
                        const height = Math.round(
                          (item.count / maxMonthly) * 100
                        );
                        return (
                          <div
                            key={item.key}
                            className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex items-end h-full">
                              <div
                                className="w-full rounded-t-2xl rounded-b-md bg-gradient-to-t from-blue-500 via-blue-400 to-blue-200 shadow-sm"
                                style={{ height: `${Math.max(8, height)}%` }}
                              />
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <BadgeCheck className="h-4 w-4 text-emerald-500" />
                    Quick Insights
                  </div>
                  <div className="mt-6 space-y-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Approval Rate</span>
                      <span className="font-semibold text-slate-900">
                        {codCounts.all
                          ? Math.round(
                              (codCounts.approved / codCounts.all) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Rejection Rate</span>
                      <span className="font-semibold text-slate-900">
                        {codCounts.all
                          ? Math.round(
                              (codCounts.rejected / codCounts.all) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Pending</span>
                      <span className="font-semibold text-slate-900">
                        {codCounts.pending}
                      </span>
                    </div>
                    <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Total Merchants
                      </div>
                      <div className="text-2xl font-semibold text-slate-900 mt-2">
                        {codCounts.all}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <button
                  onClick={() => setCodStatusFilter('all')}
                  className={`group rounded-2xl border p-4 text-left transition-all hover:-translate-y-1 ${
                    codStatusFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}>
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em]">
                    All
                    <LayoutGrid className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-semibold mt-2">
                    {codCounts.all}
                  </div>
                </button>
                <button
                  onClick={() => setCodStatusFilter('pending')}
                  className={`group rounded-2xl border p-4 text-left transition-all hover:-translate-y-1 ${
                    codStatusFilter === 'pending'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-amber-200'
                  }`}>
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em]">
                    Pending
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-semibold mt-2">
                    {codCounts.pending}
                  </div>
                </button>
                <button
                  onClick={() => setCodStatusFilter('approved')}
                  className={`group rounded-2xl border p-4 text-left transition-all hover:-translate-y-1 ${
                    codStatusFilter === 'approved'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-200'
                  }`}>
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em]">
                    Approved
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-semibold mt-2">
                    {codCounts.approved}
                  </div>
                </button>
                <button
                  onClick={() => setCodStatusFilter('suspended')}
                  className={`group rounded-2xl border p-4 text-left transition-all hover:-translate-y-1 ${
                    codStatusFilter === 'suspended'
                      ? 'bg-slate-700 text-white border-slate-700 shadow-lg shadow-slate-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}>
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em]">
                    Suspended
                    <XCircle className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-semibold mt-2">
                    {codCounts.suspended}
                  </div>
                </button>
                <button
                  onClick={() => setCodStatusFilter('rejected')}
                  className={`group rounded-2xl border p-4 text-left transition-all hover:-translate-y-1 ${
                    codStatusFilter === 'rejected'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-rose-200'
                  }`}>
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em]">
                    Rejected
                    <XCircle className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-semibold mt-2">
                    {codCounts.rejected}
                  </div>
                </button>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:items-center">
                  <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    Province
                    <select
                      value={codProvinceFilter}
                      onChange={(e) => {
                        const next = e.target.value as typeof codProvinceFilter;
                        setCodProvinceFilter(next);
                        if (next !== 'all') {
                          setCodCityFilter('all');
                        }
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="all">All</option>
                      <option value="punjab">Punjab</option>
                      <option value="sindh">Sindh</option>
                      <option value="kpk">KP</option>
                      <option value="balochistan">Balochistan</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    Status
                    <select
                      value={codStatusFilter}
                      onChange={(e) => setCodStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="all">All</option>
                      {codStatusOptions.map((status) => (
                        <option key={status.key} value={status.key}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    City
                    <select
                      value={codCityFilter}
                      onChange={(e) => {
                        setCodCityFilter(e.target.value);
                        if (e.target.value !== 'all') {
                          setCodProvinceFilter('all');
                        }
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="all">All</option>
                      {SERVICE_CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={codQuery}
                      onChange={(e) => setCodQuery(e.target.value)}
                      placeholder="Search company, contact, email..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    />
                  </div>
                </div>
              </section>
              {filteredCodAccounts.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-slate-600">
                  No COD account registrations yet.
                </div>
              )}

              <section className="grid gap-6 lg:grid-cols-2">
                {filteredCodAccounts.map((account, index) => {
                  const stats =
                    codBookingMap.get(account.id) ||
                    (account.email
                      ? codBookingMap.get(account.email.toLowerCase())
                      : undefined) || {
                      total: 0,
                      delivered: 0,
                      pending: 0,
                      totalCharge: 0,
                      codTotal: 0,
                      services: {}
                    };
                  const topService =
                    Object.entries(stats.services).sort(
                      (a, b) => b[1] - a[1]
                    )[0]?.[0] || '-';
                  const highlightClass = isHighlighted(account.id)
                    ? 'ring-2 ring-emerald-300 bg-emerald-50/40 animate-pulse'
                    : '';
                  return (
                    <div
                      key={account.id}
                      style={{ animationDelay: `${index * 0.04}s` }}
                      className={`rounded-3xl bg-white border border-slate-200 shadow-sm p-6 space-y-5 transition hover:shadow-xl hover:-translate-y-1 animate-fade-up ${highlightClass}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Registration ID
                        </p>
                        <p className="text-lg font-semibold text-slate-900 mt-2">
                          {account.id}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className={planBadgeClass(account.planName)}>
                            <BadgeCheck className="h-3.5 w-3.5 mr-1" />
                            {account.planName} • Rs.{' '}
                            {formatAmount(account.planTotal)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${codStatusBadge[account.status]}`}>
                        {account.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                          <Building2 className="h-4 w-4" />
                          Company
                        </div>
                        <p className="mt-3 text-sm text-slate-700">
                          {account.companyName || '-'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {account.companyLegalName || '-'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {account.businessType || '-'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {account.website || '-'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
                          <Phone className="h-4 w-4" />
                          Contact
                        </div>
                        <p className="mt-3 text-sm text-slate-700">
                          {account.contactName || '-'}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {account.phone || '-'}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {account.email || '-'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Alt: {account.altPhone || '-'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {account.address || '-'}
                        </p>
                      </div>
                    </div>

                    {stats.total === 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Plan
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-2">
                            {account.planName} • Rs.{' '}
                            {formatAmount(account.planTotal)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Created {formatDate(account.createdAt)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Business
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-2">
                            {account.businessType || '-'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {account.companyLegalName || '-'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Operations
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-2">
                            {account.city || '-'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Monthly: {account.monthlyShipment || '-'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Compliance
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-2">
                            CNIC: {account.cnic || '-'}
                          </p>
                          <p className="text-xs text-slate-500">
                            NTN/GST: {maskValue(account.ntnGst || '')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Orders
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-2">
                            {stats.total}
                          </p>
                          <p className="text-xs text-slate-500">
                            Pending: {stats.pending}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Delivered
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-2">
                            {stats.delivered}
                          </p>
                          <p className="text-xs text-slate-500">
                            Top: {topService}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Total Charges
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-2">
                            Rs. {formatAmount(stats.totalCharge)}
                          </p>
                          <p className="text-xs text-slate-500">
                            COD: Rs. {formatAmount(stats.codTotal)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Wallet
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-2">
                            Rs. {formatAmount(getDisplayWalletBalance(account))}
                          </p>
                          <p className="text-xs text-slate-500">
                            City: {account.city || '-'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                          <BadgeCheck className="h-4 w-4" />
                          Bank Details
                        </div>
                        <p className="mt-3 text-xs text-slate-600">
                          Bank: {account.bankName || '-'}
                        </p>
                        <p className="text-xs text-slate-600">
                          Title: {account.accountTitle || '-'}
                        </p>
                        <p className="text-xs text-slate-600">
                          Account: {account.accountNumber || '-'}
                        </p>
                        <p className="text-xs text-slate-600">
                          IBAN: {account.iban || '-'}
                        </p>
                        <p className="text-xs text-slate-600">
                          Swift: {account.swiftCode || '-'}
                        </p>
                        <p className="text-xs text-slate-600">
                          Branch: {account.branchName || '-'}{' '}
                          {account.branchCode || ''}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                          <MapPin className="h-4 w-4" />
                          Shipping Info
                        </div>
                        <p className="mt-3 text-xs text-slate-600">
                          City: {account.city || '-'}
                        </p>
                        <p className="text-xs text-slate-600">
                          Pickup: {account.pickupTimings || '-'}
                        </p>
                        <p className="text-xs text-slate-600">
                          Monthly: {account.monthlyShipment || '-'}
                        </p>
                        <p className="text-xs text-slate-600">
                          Instructions: {account.specialInstructions || '-'}
                        </p>
                        <p className="text-xs text-slate-600">
                          Map Pin: {account.googleMapPin || '-'}
                        </p>
                        <p className="text-xs text-slate-600">
                          CNIC: {account.cnic || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setSelectedAccountId(account.id)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition">
                        Open Profile
                      </button>
                      <button
                        onClick={() =>
                          handleCodStatusChange(account.id, 'approved')
                        }
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm hover:shadow-md transition">
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleCodStatusChange(account.id, 'pending')
                        }
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm hover:shadow-md transition">
                        Hold
                      </button>
                      <button
                        onClick={() =>
                          handleCodStatusChange(account.id, 'rejected')
                        }
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 shadow-sm hover:shadow-md transition">
                        Reject
                      </button>
                    </div>
                  </div>
                  );
                })}
              </section>
            </>
            )
          ) : activePanel === 'bookings' ? (
            <>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                    Non COD Dashboard
                  </p>
                  <h2 className="text-3xl lg:text-4xl font-semibold text-slate-900 mt-2">
                    Non COD Bookings
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    Track and manage prepaid shipments without COD settlement.
                  </p>
                </div>
              </div>
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { key: 'all', label: 'All', count: counts.all },
                  {
                    key: 'pending',
                    label: 'Pending',
                    count: counts.pending
                  },
                  {
                    key: 'in_transit',
                    label: 'In Transit',
                    count: counts.in_transit
                  },
                  {
                    key: 'delivered',
                    label: 'Delivered',
                    count: counts.delivered
                  }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setStatusFilter(item.key)}
                    className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-1 ${
                      statusFilter === item.key
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {item.label}
                    </div>
                    <div className="text-2xl font-semibold mt-2">
                      {item.count ?? 0}
                    </div>
                  </button>
                ))}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    Status
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="all">All</option>
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.key} value={status.key}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search tracking ID..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    />
                  </div>
                </div>
              </section>

              {filtered.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-slate-600">
                  No bookings yet. New parcels will appear here.
                </div>
              )}

              <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((booking) => {
                  const statusConfig =
                    STATUS_OPTIONS.find((s) => s.key === booking.status) ??
                    STATUS_OPTIONS[0];
                  const lastUpdate =
                    booking.statusHistory[booking.statusHistory.length - 1]
                      ?.at ?? booking.createdAt;
                  const rate = serviceRates[booking.serviceType] ?? {
                    baseHalf: 0,
                    baseOne: 0,
                    additionalPerKg: 0
                  };
                  const baseRate =
                    booking.weightKg <= 0.5 ? rate.baseHalf : rate.baseOne;
                  const extraKg =
                    booking.weightKg > 1 ? Math.ceil(booking.weightKg - 1) : 0;
                  const extraCharge = extraKg * rate.additionalPerKg;
                  const outCityCharge = booking.outOfCity ? 200 : 0;
                  const totalAmount = baseRate + extraCharge + outCityCharge;
                  const riderOptions = approvedActiveRiders;
                  return (
                    <div
                      key={booking.trackingId}
                      className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm transition hover:shadow-xl hover:-translate-y-1 space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Tracking ID
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <p className="text-lg font-semibold text-slate-900 break-words">
                              {booking.trackingId}
                            </p>
                            <button
                              onClick={() => handleCopy(booking.trackingId)}
                              className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                              <Clipboard className="w-4 h-4" />
                              {copiedId === booking.trackingId
                                ? 'Copied'
                                : 'Copy'}
                            </button>
                          </div>
                          <p className="text-sm text-slate-600 mt-2 break-words">
                            {booking.senderCity} → {booking.receiverCity}
                          </p>
                          <div className="mt-2 text-xs text-slate-500">
                            Created {formatDate(booking.createdAt)} •{' '}
                            {formatTime(booking.createdAt)}
                          </div>
                          <div className="text-xs text-slate-500">
                            Updated {formatDate(lastUpdate)} •{' '}
                            {formatTime(lastUpdate)}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${statusConfig.badge}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 text-sm">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Sender
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-2">
                            {booking.senderName || '-'}
                          </p>
                          {isCodBooking(booking) && (
                            <p className="text-xs text-emerald-700 mt-1">
                              Shipper (COD): {booking.merchantName || booking.merchantEmail || booking.merchantId || '-'}
                            </p>
                          )}
                          <p className="text-xs text-slate-500">
                            {booking.senderPhone || '-'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {booking.senderAddress || '-'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Receiver
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-2">
                            {booking.receiverName || '-'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {booking.receiverPhone || '-'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {booking.receiverAddress || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 text-sm">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Service
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-2">
                            {booking.serviceTitle}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Weight
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-2">
                            {booking.weightKg.toFixed(3)} kg
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            COD
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-2">
                            {booking.codAmount
                              ? `Rs. ${booking.codAmount}`
                              : 'Rs. 0'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Total
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-2">
                            Rs. {totalAmount}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                        <div className="text-slate-700">
                          Delivery Code{' '}
                          <span className="font-semibold text-slate-900">
                            {booking.deliveryCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-2 rounded-xl text-xs font-semibold ${statusConfig.badge}`}>
                            {statusConfig.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            Rider controlled
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Assigned Rider
                        </p>
                        <p className="text-sm font-semibold text-slate-900 mt-2">
                          {booking.assignedRiderName || 'Not assigned'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {booking.assignedRiderCity || booking.receiverCity || '-'}
                        </p>
                        {riderOptions.length > 0 ? (
                          <div className="mt-3">
                            <select
                              value={booking.assignedRiderId || ''}
                              onChange={(e) => {
                                const riderAuthUid = e.target.value;
                                if (!riderAuthUid) return;
                                handleAssignRider(booking, riderAuthUid);
                              }}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                              <option value="">Assign rider</option>
                              {riderOptions.map((rider) => (
                                <option
                                  key={rider.authUid || rider.id}
                                  value={rider.authUid || ''}>
                                  {rider.fullName} • {rider.city}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 mt-2">
                            No approved riders with active login yet.
                          </p>
                        )}
                      </div>
                      {booking.status === 'delivery_rejected' &&
                        booking.rejectionReason && (
                          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                            <p className="text-xs uppercase tracking-[0.2em] text-rose-400">
                              Rejection Reason
                            </p>
                            <p className="mt-2 font-semibold text-rose-800">
                              {booking.rejectionReason}
                            </p>
                          </div>
                        )}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handlePrintSlip(booking)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50">
                        Print Slip
                      </button>
                      <button
                        onClick={() => handleDownloadSlip(booking)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800">
                        Download Slip
                      </button>
                    </div>
                  </div>
                  );
                })}
              </section>
            </>
          ) : activePanel === 'riders' ? (
            <>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <h2 className="text-3xl lg:text-4xl font-semibold text-slate-900 mt-2">
                    Rider Applications
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    Review rider signups, approve accounts, and monitor workloads.
                  </p>
                </div>
                <div className="text-sm text-slate-500">
                  Total riders: {riderCounts.all}
                </div>
              </div>

              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { key: 'all', label: 'All', count: riderCounts.all },
                  { key: 'pending', label: 'Pending', count: riderCounts.pending },
                  { key: 'approved', label: 'Approved', count: riderCounts.approved },
                  { key: 'rejected', label: 'Rejected', count: riderCounts.rejected }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setRiderStatusFilter(item.key)}
                    className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-1 ${
                      riderStatusFilter === item.key
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {item.label}
                    </div>
                    <div className="text-2xl font-semibold mt-2">
                      {item.count ?? 0}
                    </div>
                  </button>
                ))}
              </section>

              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    key: 'punjab',
                    label: 'Punjab Riders',
                    count: riderProvinceCounts.punjab,
                    className:
                      'border-emerald-200 bg-emerald-50 text-emerald-700'
                  },
                  {
                    key: 'sindh',
                    label: 'Sindh Riders',
                    count: riderProvinceCounts.sindh,
                    className:
                      'border-blue-200 bg-blue-50 text-blue-700'
                  },
                  {
                    key: 'kpk',
                    label: 'KP Riders',
                    count: riderProvinceCounts.kpk,
                    className:
                      'border-amber-200 bg-amber-50 text-amber-700'
                  },
                  {
                    key: 'balochistan',
                    label: 'Balochistan Riders',
                    count: riderProvinceCounts.balochistan,
                    className:
                      'border-rose-200 bg-rose-50 text-rose-700'
                  }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setRiderProvinceFilter(item.key as typeof riderProvinceFilter);
                      setRiderCityFilter('all');
                    }}
                    className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-1 ${
                      riderProvinceFilter === item.key
                        ? 'shadow-lg shadow-slate-900/10 ring-2 ring-slate-900/10'
                        : 'shadow-sm'
                    } ${item.className}`}>
                    <div className="text-xs uppercase tracking-[0.2em]">
                      {item.label}
                    </div>
                    <div className="text-2xl font-semibold mt-2">
                      {item.count}
                    </div>
                  </button>
                ))}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    Province
                    <select
                      value={riderProvinceFilter}
                      onChange={(e) => {
                        const next = e.target.value as typeof riderProvinceFilter;
                        setRiderProvinceFilter(next);
                        if (next !== 'all') {
                          setRiderCityFilter('all');
                        }
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="all">All</option>
                      <option value="punjab">Punjab</option>
                      <option value="sindh">Sindh</option>
                      <option value="kpk">KP</option>
                      <option value="balochistan">Balochistan</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    Status
                    <select
                      value={riderStatusFilter}
                      onChange={(e) => setRiderStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="all">All</option>
                      {riderStatusOptions.map((status) => (
                        <option key={status.key} value={status.key}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    City
                    <select
                      value={riderCityFilter}
                      onChange={(e) => {
                        setRiderCityFilter(e.target.value);
                        if (e.target.value !== 'all') {
                          setRiderProvinceFilter('all');
                        }
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="all">All</option>
                      {riderCityOptions.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {filteredRiders.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-slate-600">
                  No riders found for this filter.
                </div>
              )}

              <section className="grid gap-6 md:grid-cols-2">
                {filteredRiders.map((rider) => {
                  const stats =
                    (rider.authUid && riderStats[rider.authUid]) || {
                      total: 0,
                      byStatus: buildEmptyStatusCounts()
                    };
                  const riderBookings = rider.authUid
                    ? riderBookingMap.get(rider.authUid) || []
                    : [];
                  const cityCounts = riderBookings.reduce(
                    (acc, booking) => {
                      const city =
                        booking.receiverCity || booking.senderCity || 'Unknown';
                      acc[city] = (acc[city] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  );
                  return (
                    <div
                      key={rider.id}
                      className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Rider
                          </p>
                          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mt-1">
                            {rider.fullName}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            City: {rider.city} • Area: {rider.area}
                          </p>
                          <p className="text-xs text-slate-500">
                            CNIC: {rider.cnic}
                          </p>
                          <p className="text-xs text-slate-500">
                            Phone: {rider.mobile}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${riderStatusBadge[rider.status]}`}>
                            {rider.status}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {rider.authUid ? 'Login active' : 'Login pending'}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 text-sm">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Assigned
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-1.5">
                            {stats.total}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Parcel Status
                          </p>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {STATUS_OPTIONS.map((status) => (
                              <div
                                key={status.key}
                                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.badge}`}>
                                  {status.label}
                                </span>
                                <span className="text-xs font-semibold text-slate-900">
                                  {stats.byStatus[status.key] || 0}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 text-sm">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Vehicle
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-1.5">
                            {rider.vehicleType} • {rider.vehicleModel}
                          </p>
                          <p className="text-xs text-slate-500">
                            {rider.vehicleNumber} • {rider.vehicleColor}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Emergency
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-1.5">
                            {rider.emergencyName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {rider.emergencyRelation} • {rider.emergencyPhone}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Assigned Parcels
                          </p>
                          <p className="text-xs text-slate-500">
                            Total {riderBookings.length}
                          </p>
                        </div>
                        {Object.keys(cityCounts).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(cityCounts).map(([city, count]) => (
                              <span
                                key={city}
                                className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 ring-1 ring-slate-200/70">
                                {city} • {count}
                              </span>
                            ))}
                          </div>
                        )}
                        {riderBookings.length === 0 ? (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                            No parcels assigned yet.
                          </div>
                        ) : (
                          <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
                            {riderBookings.map((booking) => {
                              const statusConfig =
                                STATUS_OPTIONS.find(
                                  (item) => item.key === booking.status
                                ) ?? STATUS_OPTIONS[0];
                              return (
                                <div
                                  key={booking.trackingId}
                                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5">
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                        Tracking ID
                                      </p>
                                      <p className="text-sm font-semibold text-slate-900 mt-1">
                                        {booking.trackingId}
                                      </p>
                                      <p className="text-xs text-slate-500 mt-1">
                                        {booking.senderCity} → {booking.receiverCity}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {booking.receiverAddress || '-'}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {formatDate(booking.createdAt)}{' '}
                                        {formatTime(booking.createdAt)}
                                      </p>
                                    </div>
                                    <span
                                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusConfig.badge}`}>
                                      {statusConfig.label}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            handleRiderStatusChange(rider.id, 'approved')
                          }
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm hover:shadow-md transition">
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handleRiderStatusChange(rider.id, 'pending')
                          }
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm hover:shadow-md transition">
                          Hold
                        </button>
                        <button
                          onClick={() =>
                            handleRiderStatusChange(rider.id, 'suspended')
                          }
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-slate-500 to-slate-700 shadow-sm hover:shadow-md transition">
                          Suspend
                        </button>
                        <button
                          onClick={() =>
                            handleRiderStatusChange(rider.id, 'rejected')
                          }
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 shadow-sm hover:shadow-md transition">
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </section>
            </>
          ) : activePanel === 'receipts' ? (
            <>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                    Delivery Receipts
                  </p>
                  <h2 className="text-3xl lg:text-4xl font-semibold text-slate-900 mt-2">
                    Delivered Parcels History
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    View rider delivery history and download parcel receipts.
                  </p>
                </div>
                <div className="text-sm text-slate-500">
                  Total receipts: {deliveryReceipts.length}
                </div>
              </div>

              {deliveryReceipts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-slate-600">
                  No delivered parcels yet.
                </div>
              ) : (
                <section className="grid gap-6 md:grid-cols-2">
                  {deliveryReceipts.map((booking) => {
                    const statusConfig =
                      STATUS_OPTIONS.find((s) => s.key === booking.status) ??
                      STATUS_OPTIONS[0];
                    const deliveredAt =
                      booking.statusHistory[booking.statusHistory.length - 1]
                        ?.at ?? booking.createdAt;
                    return (
                      <div
                        key={booking.trackingId}
                        className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Tracking ID
                            </p>
                            <p className="text-lg font-semibold text-slate-900 mt-2">
                              {booking.trackingId}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {booking.senderCity} → {booking.receiverCity}
                            </p>
                            <p className="text-xs text-slate-500">
                              Delivered {formatDate(deliveredAt)} {formatTime(deliveredAt)}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.badge}`}>
                            {statusConfig.label}
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 text-sm">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Sender
                            </p>
                            <p className="text-sm font-semibold text-slate-900 mt-2">
                              {booking.senderName || '-'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {booking.senderPhone || '-'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {booking.senderAddress || '-'}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Receiver
                            </p>
                            <p className="text-sm font-semibold text-slate-900 mt-2">
                              {booking.receiverName || '-'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {booking.receiverPhone || '-'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {booking.receiverAddress || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 text-sm">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Parcel
                            </p>
                            <p className="text-sm font-semibold text-slate-900 mt-2">
                              {booking.itemDetail || 'Parcel'}
                            </p>
                            <p className="text-xs text-slate-500">
                              Weight: {booking.weightKg.toFixed(3)} kg
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              COD
                            </p>
                            <p className="text-sm font-semibold text-slate-900 mt-2">
                              {booking.codAmount ? `Rs. ${booking.codAmount}` : 'Rs. 0'}
                            </p>
                            <p className="text-xs text-slate-500">
                              Delivery Code: {booking.deliveryCode}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Rider
                            </p>
                            <p className="text-sm font-semibold text-slate-900 mt-2">
                              {booking.assignedRiderName || 'Assigned Rider'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {booking.assignedRiderCity || '-'}
                            </p>
                            <p className="text-xs text-slate-500">
                              ID: {booking.assignedRiderId || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                          <div className="text-slate-600">
                            Receipt ready for download.
                          </div>
                          <button
                            onClick={() => handleDownloadSlip(booking)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800">
                            Download Receipt
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}
            </>
          ) : activePanel === 'complaints' ? (
            <>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                    Complaints Center
                  </p>
                  <h2 className="text-3xl lg:text-4xl font-semibold text-slate-900 mt-2">
                    Merchant Complaints
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    Review issues submitted by merchants and jump to their profile.
                  </p>
                </div>
                <div className="text-sm text-slate-500">
                  Total: {filteredComplaints.length}
                </div>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-4 shadow-sm">
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Merchant</th>
                        <th className="pb-3">Contact</th>
                        <th className="pb-3">Subject</th>
                        <th className="pb-3">Complaint</th>
                        <th className="pb-3">Priority</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredComplaints.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50">
                          <td className="py-3 text-slate-600">
                            {formatDate(entry.createdAt)} {formatTime(entry.createdAt)}
                          </td>
                          <td className="py-3 text-slate-800 font-semibold">
                            {entry.merchantName || 'Merchant'}
                          </td>
                          <td className="py-3 text-slate-600">
                            <div>{entry.email || '-'}</div>
                            <div>{entry.phone || '-'}</div>
                          </td>
                          <td className="py-3 text-slate-800 font-semibold">
                            {entry.subject}
                          </td>
                          <td className="py-3 text-slate-600">
                            {entry.message.length > 120
                              ? `${entry.message.slice(0, 120)}...`
                              : entry.message}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${complaintPriorityBadge(
                                entry.priority
                              )}`}>
                              {entry.priority}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleOpenMerchant(entry.accountId)}
                              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800">
                              Open Merchant
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredComplaints.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-6 text-center text-sm text-slate-500">
                            No complaints submitted yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-4 lg:hidden">
                  {filteredComplaints.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Merchant
                          </p>
                          <p className="text-base font-semibold text-slate-900 mt-1">
                            {entry.merchantName || 'Merchant'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDate(entry.createdAt)} {formatTime(entry.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${complaintPriorityBadge(
                            entry.priority
                          )}`}>
                          {entry.priority}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        <p className="font-semibold text-slate-800">
                          {entry.subject}
                        </p>
                        <p className="mt-1">
                          {entry.message.length > 160
                            ? `${entry.message.slice(0, 160)}...`
                            : entry.message}
                        </p>
                      </div>
                      <div className="text-xs text-slate-500">
                        <div>{entry.email || '-'}</div>
                        <div>{entry.phone || '-'}</div>
                      </div>
                      <button
                        onClick={() => handleOpenMerchant(entry.accountId)}
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800">
                        Open Merchant
                      </button>
                    </div>
                  ))}
                  {filteredComplaints.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                      No complaints submitted yet.
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : activePanel === 'rider-history' ? (
            <>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                    Rider Insights
                  </p>
                  <h2 className="text-3xl lg:text-4xl font-semibold text-slate-900 mt-2">
                    Rider History
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    View rider profiles, assignments, and overall performance in one place.
                  </p>
                </div>
                <div className="text-sm text-slate-500">
                  Total riders: {riderCounts.all}
                </div>
              </div>

              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Total Riders
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 mt-2">
                        {riderCounts.all}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        All rider profiles
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-slate-900/10 text-slate-900 flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Approved Riders
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 mt-2">
                        {riderCounts.approved}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Login active: {approvedActiveRiders.length}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Pending Riders
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 mt-2">
                        {riderCounts.pending}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Awaiting review
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Clock className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Suspended Riders
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 mt-2">
                        {riderCounts.suspended}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Temporarily paused
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                      <XCircle className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Total Assigned
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 mt-2">
                        {riderHistorySummary.assigned}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Overall parcels assigned
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-slate-900/10 text-slate-900 flex items-center justify-center">
                      <Truck className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Delivered
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 mt-2">
                        {riderHistorySummary.delivered}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Delivered or paid
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <BadgeCheck className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        In Transit
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 mt-2">
                        {riderHistorySummary.inTransit}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Confirmed / In transit
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Rejected
                      </p>
                      <p className="text-2xl font-semibold text-slate-900 mt-2">
                        {riderHistorySummary.rejected}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Delivery rejected
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    Province
                    <select
                      value={riderProvinceFilter}
                      onChange={(e) => {
                        const next = e.target.value as typeof riderProvinceFilter;
                        setRiderProvinceFilter(next);
                        if (next !== 'all') {
                          setRiderCityFilter('all');
                        }
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="all">All</option>
                      <option value="punjab">Punjab</option>
                      <option value="sindh">Sindh</option>
                      <option value="kpk">KP</option>
                      <option value="balochistan">Balochistan</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    Status
                    <select
                      value={riderStatusFilter}
                      onChange={(e) => setRiderStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="all">All</option>
                      {riderStatusOptions.map((status) => (
                        <option key={status.key} value={status.key}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    City
                    <select
                      value={riderCityFilter}
                      onChange={(e) => {
                        setRiderCityFilter(e.target.value);
                        if (e.target.value !== 'all') {
                          setRiderProvinceFilter('all');
                        }
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="all">All</option>
                      {riderCityOptions.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setRiderProvinceFilter('all');
                      setRiderStatusFilter('all');
                      setRiderCityFilter('all');
                      setRiderQuery('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">
                    Reset Filters
                  </button>
                </div>
              </section>

              {riderHistoryRows.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-slate-600">
                  No riders found for this filter.
                </div>
              ) : (
                <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {riderHistoryRows.map(({ rider, summary, lastAssigned }) => (
                    <div
                      key={rider.id}
                      className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Rider
                          </p>
                          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mt-1">
                            {rider.fullName}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {rider.city || '-'}
                            {rider.area ? ` • ${rider.area}` : ''}
                          </p>
                          <p className="text-xs text-slate-500">
                            CNIC: {rider.cnic}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${riderStatusBadge[rider.status]}`}>
                            {rider.status}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {rider.authUid ? 'Login active' : 'Login pending'}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 text-sm">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Contact
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-1.5">
                            {rider.mobile || '-'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {rider.email || '-'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Vehicle
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-1.5">
                            {rider.vehicleType} • {rider.vehicleModel}
                          </p>
                          <p className="text-xs text-slate-500">
                            {rider.vehicleNumber ||
                              rider.vehicleRegistrationNumber ||
                              '-'}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Performance
                        </p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                            <span className="text-xs text-slate-500">
                              Assigned
                            </span>
                            <span className="text-xs font-semibold text-slate-900">
                              {summary.total}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                            <span className="text-xs text-slate-500">
                              Delivered
                            </span>
                            <span className="text-xs font-semibold text-slate-900">
                              {summary.delivered}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                            <span className="text-xs text-slate-500">
                              In Transit
                            </span>
                            <span className="text-xs font-semibold text-slate-900">
                              {summary.inTransit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                            <span className="text-xs text-slate-500">
                              Pending
                            </span>
                            <span className="text-xs font-semibold text-slate-900">
                              {summary.pending}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                            <span className="text-xs text-slate-500">
                              Rejected
                            </span>
                            <span className="text-xs font-semibold text-slate-900">
                              {summary.rejected}
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          Last assigned:{' '}
                          {lastAssigned ? formatDateTime(lastAssigned) : 'No assignments yet'}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-500">
                        <div>Joined: {formatDateTime(rider.createdAt)}</div>
                        <div>Address: {rider.fullAddress || '-'}</div>
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                    Booking Slip Center
                  </p>
                  <h2 className="text-3xl lg:text-4xl font-semibold text-slate-900 mt-2">
                    Booking Slips
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    Print or download courier slips for COD and Non COD shipments.
                  </p>
                </div>
                <div className="inline-flex rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm">
                  <button
                    onClick={() => setSlipTab('cod')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                      slipTab === 'cod'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}>
                    COD Slips ({bookings.filter((booking) => isCodBooking(booking)).length})
                  </button>
                  <button
                    onClick={() => setSlipTab('non-cod')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                      slipTab === 'non-cod'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}>
                    Non COD Slips ({bookings.filter((booking) => isNonCodBooking(booking)).length})
                  </button>
                </div>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={slipQuery}
                      onChange={(e) => setSlipQuery(e.target.value)}
                      placeholder="Search slips by tracking, sender, receiver..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    />
                  </div>
                </div>
              </section>

              {slipFiltered.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-slate-600">
                  No slips yet. New bookings will appear here.
                </div>
              )}

              <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {slipFiltered.map((booking) => {
                  const statusConfig =
                    STATUS_OPTIONS.find((s) => s.key === booking.status) ??
                    STATUS_OPTIONS[0];
                  const isCod = isCodBooking(booking);
                  return (
                    <div
                      key={booking.trackingId}
                      className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm transition hover:shadow-xl hover:-translate-y-1 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Tracking ID
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-2 break-words">
                            {booking.trackingId}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {booking.senderCity} → {booking.receiverCity}
                          </p>
                          <p className="text-xs text-slate-500">
                            {isCod ? 'COD' : 'Non COD'} •{' '}
                            {formatDate(booking.createdAt)} {formatTime(booking.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${statusConfig.badge}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 text-sm">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Sender
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-2">
                            {booking.senderName || '-'}
                          </p>
                          {isCod && (
                            <p className="text-xs text-emerald-700 mt-1">
                              Shipper (COD): {booking.merchantName || booking.merchantEmail || booking.merchantId || '-'}
                            </p>
                          )}
                          <p className="text-xs text-slate-500">
                            {booking.senderPhone || '-'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Receiver
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-2">
                            {booking.receiverName || '-'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {booking.receiverPhone || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 text-sm">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Item Detail
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-2">
                            {booking.itemDetail || '-'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Pieces
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-2">
                            {booking.pieces ?? 1}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handlePrintSlip(booking)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50">
                          Print Slip
                        </button>
                        <button
                          onClick={() => handleDownloadSlip(booking)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800">
                          Download Slip
                        </button>
                        {booking.merchantId && isCod && (
                          <button
                            onClick={() => {
                              setActivePanel('cod');
                              setSelectedAccountId(booking.merchantId || null);
                            }}
                            className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600">
                            Open Merchant
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>
            </>
          )}
        </main>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-black text-slate-900">
              {confirmAction.title}
            </h3>
            {confirmAction.description && (
              <p className="text-sm text-slate-500 mt-2">
                {confirmAction.description}
              </p>
            )}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold">
                {confirmAction.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
