import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';

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
  userId: string;
  merchantId?: string | null;
  merchantEmail?: string | null;
  merchantName?: string | null;
  merchantPlan?: string | null;
  merchantCity?: string | null;
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
  return false;
};

const COLLECTION = 'bookings';

const mapDoc = (docSnap: { data: () => Booking; id: string }) => {
  const data = docSnap.data();
  return {
    ...data,
    trackingId: data.trackingId || docSnap.id
  };
};

export const subscribeBookings = (
  onChange: (items: Booking[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const next = snapshot.docs.map((docSnap) => mapDoc(docSnap));
      onChange(next);
    },
    (error) => {
      onError?.(error);
    }
  );
};

export const subscribeBookingsByMerchant = (
  merchantId: string,
  onChange: (items: Booking[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(collection(db, COLLECTION), where('merchantId', '==', merchantId));
  return onSnapshot(
    q,
    (snapshot) => {
      const next = snapshot.docs.map((docSnap) => mapDoc(docSnap));
      next.sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      });
      onChange(next);
    },
    (error) => {
      onError?.(error);
    }
  );
};

export const subscribeBooking = (
  trackingId: string,
  onChange: (item: Booking | null) => void,
  onError?: (error: Error) => void
) => {
  const ref = doc(db, COLLECTION, trackingId);
  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(null);
        return;
      }
      onChange(mapDoc(snapshot as { data: () => Booking; id: string }));
    },
    (error) => {
      onError?.(error);
    }
  );
};

export const loadBookings = async (): Promise<Booking[]> => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => mapDoc(docSnap));
};

export const addBooking = async (booking: Booking) => {
  const ref = doc(db, COLLECTION, booking.trackingId);
  await setDoc(ref, booking);
};

export const getBooking = async (trackingId: string) => {
  const ref = doc(db, COLLECTION, trackingId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Booking) : null;
};

export const updateBookingStatus = async (
  trackingId: string,
  status: BookingStatusKey,
  rejectionReason?: string
) => {
  const ref = doc(db, COLLECTION, trackingId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const current = snap.data() as Booking;
  const updates: Record<string, unknown> = {
    status
  };
  if (current.status !== status) {
    updates.statusHistory = arrayUnion({ status, at: new Date().toISOString() });
  }
  if (status === 'delivery_rejected') {
    updates.rejectionReason = rejectionReason?.trim() || 'Not provided';
  } else if (current.rejectionReason) {
    updates.rejectionReason = '';
  }
  await updateDoc(ref, updates);
};

export const deleteAllBookings = async () => {
  const snapshot = await getDocs(collection(db, COLLECTION));
  if (snapshot.empty) return;
  let batch = writeBatch(db);
  let count = 0;
  for (const docSnap of snapshot.docs) {
    batch.delete(docSnap.ref);
    count += 1;
    if (count === 450) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }
  await batch.commit();
};

export const deleteBookingsByMerchantId = async (merchantId: string) => {
  const q = query(
    collection(db, COLLECTION),
    where('merchantId', '==', merchantId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;
  let batch = writeBatch(db);
  let count = 0;
  for (const docSnap of snapshot.docs) {
    batch.delete(docSnap.ref);
    count += 1;
    if (count === 450) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }
  await batch.commit();
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
