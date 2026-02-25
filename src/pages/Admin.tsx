
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Booking,
  BookingStatusKey,
  STATUS_OPTIONS,
  formatDate,
  formatTime,
  isCodBooking,
  loadBookings,
  saveBookings,
  updateBookingStatus
} from '../utils/bookingStore';
import {
  CodAccountRequest,
  CodAccountStatus,
  CARD_FEE,
  SERVICE_CITIES,
  adjustCodAccountWallet,
  clearCodAccounts,
  loadCodAccounts,
  updateCodAccountStatus
} from '../utils/codAccountStore';
import {
  FundRequest,
  loadFundRequests,
  updateFundRequestStatus
} from '../utils/fundRequestStore';
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
  Edit3,
  LayoutGrid,
  Mail,
  MapPin,
  Phone,
  Search,
  Trash2,
  Truck,
  UserCircle2,
  Users,
  Wallet,
  XCircle
} from 'lucide-react';

export function Admin() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string>('');
  const [rejectionTarget, setRejectionTarget] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [activePanel, setActivePanel] = useState<'bookings' | 'cod'>('cod');
  const [codAccounts, setCodAccounts] = useState<CodAccountRequest[]>([]);
  const [codStatusFilter, setCodStatusFilter] = useState<string>('all');
  const [codCityFilter, setCodCityFilter] = useState<string>('all');
  const [codQuery, setCodQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );
  const [parcelStatusFilter, setParcelStatusFilter] = useState('all');
  const [parcelQuery, setParcelQuery] = useState('');
  const [parcelFrom, setParcelFrom] = useState('');
  const [parcelTo, setParcelTo] = useState('');
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
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
  const codStatusBadge: Record<CodAccountStatus, string> = {
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
  const formatAmount = (value: number) =>
    value.toLocaleString('en-PK', { maximumFractionDigits: 0 });
  const formatDateTime = (value: string) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return `${formatDate(value)} ${formatTime(value)}`;
  };
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
  const bookingStatusBadge = (status: BookingStatusKey) =>
    STATUS_OPTIONS.find((item) => item.key === status)?.badge ||
    'bg-slate-100 text-slate-700';
  const bookingStatusLabel = (status: BookingStatusKey) =>
    STATUS_OPTIONS.find((item) => item.key === status)?.label ??
    status.replace(/_/g, ' ');
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
  const isNonCodBooking = (booking: Booking) => {
    const codValue = Number(booking.codAmount || 0);
    return Number.isNaN(codValue) || codValue <= 0;
  };
  useEffect(() => {
    setBookings(loadBookings());
  }, []);

  useEffect(() => {
    setCodAccounts(loadCodAccounts());
  }, []);

  useEffect(() => {
    const sync = () => setFundRequests(loadFundRequests());
    sync();
    const interval = window.setInterval(sync, 4000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'cod') {
      setActivePanel('cod');
    }
    if (params.get('tab') === 'bookings') {
      setActivePanel('bookings');
    }
  }, [location.search]);

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

  const filteredCodAccounts = useMemo(() => {
    return codAccounts.filter((account) => {
      const matchStatus =
        codStatusFilter === 'all' ? true : account.status === codStatusFilter;
      const matchCity =
        codCityFilter === 'all' ? true : account.city === codCityFilter;
      const search = codQuery.trim().toLowerCase();
      const matchQuery = search
        ? account.companyName.toLowerCase().includes(search) ||
          account.contactName.toLowerCase().includes(search) ||
          account.email.toLowerCase().includes(search) ||
          account.phone.toLowerCase().includes(search) ||
          account.id.toLowerCase().includes(search)
        : true;
      return matchStatus && matchCity && matchQuery;
    });
  }, [codAccounts, codStatusFilter, codCityFilter, codQuery]);

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

  const handleStatusChange = (
    booking: Booking,
    nextStatus: BookingStatusKey
  ) => {
    if (nextStatus === 'delivery_rejected') {
      setRejectionTarget(booking.trackingId);
      setRejectionReason(booking.rejectionReason || '');
      setRejectionError('');
      return;
    }
    updateBookingStatus(booking.trackingId, nextStatus);
    setBookings(loadBookings());
  };

  const handleCodStatusChange = (
    accountId: string,
    nextStatus: CodAccountStatus
  ) => {
    updateCodAccountStatus(accountId, nextStatus);
    setCodAccounts(loadCodAccounts());
    pushAdminActivity(
      accountId,
      `Status changed to ${statusLabel(nextStatus)}`,
      'Admin control'
    );
  };

  const handleApproveFundRequest = (request: FundRequest) => {
    updateFundRequestStatus(request.id, 'approved');
    adjustCodAccountWallet(request.accountId, request.amount);
    setFundRequests(loadFundRequests());
    setCodAccounts(loadCodAccounts());
    pushAdminActivity(
      request.accountId,
      'Fund request approved',
      `Rs. ${formatAmount(request.amount)} added to wallet`
    );
  };

  const handleRejectFundRequest = (request: FundRequest) => {
    updateFundRequestStatus(request.id, 'rejected');
    setFundRequests(loadFundRequests());
    pushAdminActivity(
      request.accountId,
      'Fund request rejected',
      `Rs. ${formatAmount(request.amount)}`
    );
  };

  const handleRejectSave = () => {
    if (!rejectionTarget) return;
    const reason = rejectionReason.trim();
    if (!reason) {
      setRejectionError('Please add a rejection reason.');
      return;
    }
    updateBookingStatus(rejectionTarget, 'delivery_rejected', reason);
    setBookings(loadBookings());
    setRejectionTarget(null);
    setRejectionReason('');
    setRejectionError('');
  };

  const handleRejectCancel = () => {
    setRejectionTarget(null);
    setRejectionReason('');
    setRejectionError('');
  };

  const handleClear = () => {
    saveBookings([]);
    setBookings([]);
  };

  const handleCodClear = () => {
    clearCodAccounts();
    setCodAccounts([]);
    setSelectedAccountId(null);
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
  return (
    <div
      className="admin-ui min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100/70 text-slate-900 antialiased"
      style={{ fontFamily: "'Poppins', 'Inter', system-ui, sans-serif" }}>
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-[#0F172A] text-slate-200">
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center">
            <LayoutGrid className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-white/50">
              Bear Fast
            </div>
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
        </nav>
        <div className="px-6 pb-6 text-xs text-white/40">
          Premium logistics control center
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="px-4 sm:px-6 lg:px-10 py-4 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={activePanel === 'cod' ? codQuery : query}
                onChange={(e) =>
                  activePanel === 'cod'
                    ? setCodQuery(e.target.value)
                    : setQuery(e.target.value)
                }
                placeholder={
                  activePanel === 'cod'
                    ? 'Search merchants, email, phone...'
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

        <main className="px-4 sm:px-6 lg:px-10 py-8 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                Courier Admin
              </p>
              <h1 className="text-3xl lg:text-4xl font-semibold text-slate-900 mt-2">
                Premium Logistics Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-2">
                Monitor merchants, approvals, and daily operations in real time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {activePanel === 'cod' ? (
                <button
                  onClick={handleCodClear}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg shadow-slate-900/10">
                  <Trash2 className="w-4 h-4" />
                  Clear COD Accounts
                </button>
              ) : (
                <button
                  onClick={handleClear}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm font-semibold shadow-lg shadow-slate-900/10">
                  <Trash2 className="w-4 h-4" />
                  Clear Bookings
                </button>
              )}
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
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

          <div className="lg:hidden inline-flex rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm">
            <button
              onClick={() => setActivePanel('cod')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activePanel === 'cod'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}>
              COD Accounts
            </button>
            <button
              onClick={() => setActivePanel('bookings')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activePanel === 'bookings'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}>
              Non COD
            </button>
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
                          className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
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

                            <div className="grid gap-3 grid-cols-2 md:grid-cols-4 text-sm">
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
                              <select
                                value={booking.status}
                                onChange={(e) =>
                                  handleStatusChange(
                                    booking,
                                    e.target.value as BookingStatusKey
                                  )
                                }
                                className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                {STATUS_OPTIONS.map((status) => (
                                  <option key={status.key} value={status.key}>
                                    {status.label}
                                  </option>
                                ))}
                              </select>
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
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                    COD Dashboard
                  </p>
                  <h2 className="text-3xl lg:text-4xl font-semibold text-slate-900 mt-2">
                    COD Control Center
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    Manage COD merchants, approvals, and settlement activity.
                  </p>
                </div>
              </div>
              <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-1 animate-fade-up">
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-slate-900/10" />
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
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-500/10" />
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
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-400/15" />
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
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-500/15" />
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
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
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
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    City
                    <select
                      value={codCityFilter}
                      onChange={(e) => setCodCityFilter(e.target.value)}
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
                  return (
                    <div
                      key={account.id}
                      style={{ animationDelay: `${index * 0.04}s` }}
                      className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 space-y-5 transition hover:shadow-xl hover:-translate-y-1 animate-fade-up">
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
          ) : (
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

                      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 text-sm">
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
                        <select
                          value={booking.status}
                          onChange={(e) =>
                            handleStatusChange(
                              booking,
                              e.target.value as BookingStatusKey
                            )
                          }
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status.key} value={status.key}>
                              {status.label}
                            </option>
                          ))}
                        </select>
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

      {rejectionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-black text-slate-900">
              Add Rejection Reason
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              This reason will be visible to the user on the tracking page.
            </p>
            <div className="mt-4">
              <textarea
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setRejectionError('');
                }}
                rows={4}
                placeholder="Write the reason for rejection..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
              />
              {rejectionError && (
                <p className="text-sm text-rose-600 mt-2">
                  {rejectionError}
                </p>
              )}
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={handleRejectCancel}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={handleRejectSave}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700">
                Save Reason
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
