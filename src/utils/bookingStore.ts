export type BookingStatusKey =
  | 'pending'
  | 'confirmed'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'delivery_rejected'
  | 'payment_received';

export interface StatusHistoryItem {
  status: BookingStatusKey;
  at: string;
}

export interface Booking {
  trackingId: string;
  deliveryCode: string;
  status: BookingStatusKey;
  statusHistory: StatusHistoryItem[];
  rejectionReason?: string;
  isCod?: boolean;
  merchantId?: string;
  merchantEmail?: string;
  merchantName?: string;
  merchantPlan?: string;
  merchantCity?: string;
  shippingCharge?: number;
  senderName: string;
  senderPhone: string;
  senderCity: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverWhatsapp: string;
  receiverCity: string;
  receiverAddress: string;
  weightKg: number;
  serviceType: string;
  serviceTitle: string;
  codAmount: string;
  outOfCity: boolean;
  createdAt: string;
}

export const STATUS_OPTIONS: {
  key: BookingStatusKey;
  label: string;
  urdu: string;
  color: string;
  badge: string;
}[] = [
  {
    key: 'pending',
    label: 'Pending Approval',
    urdu: 'ابھی shipment approve نہیں ہوا',
    color: 'text-amber-600',
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70'
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
    urdu: 'order confirm ہو گیا',
    color: 'text-blue-600',
    badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/70'
  },
  {
    key: 'in_transit',
    label: 'In Transit',
    urdu: 'راستے میں ہے (city سے city جا رہا ہے)',
    color: 'text-indigo-600',
    badge: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/70'
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    urdu: 'delivery کے لیے نکل چکا ہے',
    color: 'text-orange-600',
    badge: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/70'
  },
  {
    key: 'delivered',
    label: 'Delivered',
    urdu: 'parcel deliver ہو گیا',
    color: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70'
  },
  {
    key: 'delivery_rejected',
    label: 'Delivery Rejected',
    urdu: 'customer نے لینے سے انکار کر دیا',
    color: 'text-rose-600',
    badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/70'
  },
  {
    key: 'payment_received',
    label: 'Payment Received',
    urdu: 'COD payment وصول ہو گئی',
    color: 'text-teal-600',
    badge: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200/70'
  }
];

export const isCodBooking = (booking: Booking) => {
  if (typeof booking.isCod === 'boolean') return booking.isCod;
  if (booking.merchantId) return true;
  const codValue = Number(booking.codAmount || 0);
  return !Number.isNaN(codValue) && codValue > 0;
};

const STORAGE_KEY = 'bearfast_bookings';

export const loadBookings = (): Booking[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Booking[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

export const saveBookings = (bookings: Booking[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
};

export const addBooking = (booking: Booking) => {
  const bookings = loadBookings();
  bookings.unshift(booking);
  saveBookings(bookings);
};

export const getBooking = (trackingId: string) => {
  const bookings = loadBookings();
  return bookings.find((booking) => booking.trackingId === trackingId);
};

export const updateBookingStatus = (
  trackingId: string,
  status: BookingStatusKey,
  rejectionReason?: string
) => {
  const bookings = loadBookings();
  const index = bookings.findIndex(
    (booking) => booking.trackingId === trackingId
  );
  if (index === -1) return;
  const booking = bookings[index];
  if (booking.status !== status) {
    booking.status = status;
    booking.statusHistory = [
      ...booking.statusHistory,
      { status, at: new Date().toISOString() }
    ];
  }
  if (status === 'delivery_rejected') {
    booking.rejectionReason = rejectionReason?.trim() || 'Not provided';
  } else if (booking.rejectionReason) {
    booking.rejectionReason = '';
  }
  bookings[index] = booking;
  saveBookings(bookings);
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB');

export const formatTime = (iso: string) =>
  new Date(iso)
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    })
    .toLowerCase();
