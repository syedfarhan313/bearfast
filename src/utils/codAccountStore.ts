import {
  arrayUnion,
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type CodAccountStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended';

export interface CodAccountStatusHistory {
  status: CodAccountStatus;
  at: string;
}

export interface CodAccountRequest {
  id: string;
  planCode: string;
  planName: string;
  planTotal: number;
  walletBalance: number;
  status: CodAccountStatus;
  statusHistory: CodAccountStatusHistory[];
  createdAt: string;
  lastLoginAt?: string;
  assignedManager?: string;
  companyName: string;
  companyLegalName: string;
  businessType: string;
  website: string;
  contactName: string;
  phone: string;
  email: string;
  altPhone: string;
  address: string;
  cnic: string;
  ntnGst?: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
  branchName: string;
  branchCode: string;
  city: string;
  pickupTimings: string;
  monthlyShipment: string;
  specialInstructions: string;
  googleMapPin: string;
  password?: string;
}

export const SERVICE_CITIES = [
  'Islamabad',
  'Rawalpindi',
  'Lahore',
  'Karachi',
  'Multan',
  'Peshawar',
  'Swabi',
  'Bannu'
];

export const CARD_FEE = 800;
const COLLECTION = 'codAccounts';

const normalizeStatus = (value: string | undefined) => {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'approved') return 'approved';
  if (normalized === 'pending') return 'pending';
  if (normalized === 'rejected') return 'rejected';
  if (normalized === 'suspended') return 'suspended';
  return undefined;
};

const normalizeAccount = (account: CodAccountRequest) => {
  const status = normalizeStatus(account.status) ?? 'pending';
  const planTotal = Number.isFinite(account.planTotal) ? account.planTotal : 0;
  const baseBalance = Math.max(0, planTotal - CARD_FEE);
  const hasWallet =
    typeof account.walletBalance === 'number' &&
    !Number.isNaN(account.walletBalance);
  let walletBalance = hasWallet ? account.walletBalance : baseBalance;
  if (
    hasWallet &&
    planTotal > CARD_FEE &&
    walletBalance === planTotal &&
    baseBalance !== planTotal
  ) {
    walletBalance = baseBalance;
  }
  return {
    ...account,
    status,
    walletBalance
  };
};

const mapDoc = (docSnap: { data: () => CodAccountRequest; id: string }) => {
  const data = docSnap.data();
  return normalizeAccount({
    ...data,
    id: data.id || docSnap.id
  });
};

export const subscribeCodAccounts = (
  onChange: (items: CodAccountRequest[]) => void,
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

export const subscribeCodAccount = (
  id: string,
  onChange: (item: CodAccountRequest | null) => void,
  onError?: (error: Error) => void
) => {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== id) {
    onChange(null);
    return () => {};
  }
  const ref = doc(db, COLLECTION, id);
  return onSnapshot(
    ref,
    (snapshot) => {
      onChange(snapshot.exists() ? mapDoc(snapshot) : null);
    },
    (error) => {
      onError?.(error);
    }
  );
};

export const loadCodAccounts = async (): Promise<CodAccountRequest[]> => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => mapDoc(docSnap));
};

export const getCodAccount = async (id: string) => {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  return snap.exists() ? mapDoc(snap as { data: () => CodAccountRequest }) : null;
};

export const addCodAccount = async (
  id: string,
  account: Omit<CodAccountRequest, 'id'>
) => {
  const ref = doc(db, COLLECTION, id);
  const payload = normalizeAccount({ ...account, id });
  await setDoc(ref, payload);
  return payload;
};

export const updateCodAccountStatus = async (
  id: string,
  status: CodAccountStatus
) => {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const current = snap.data() as CodAccountRequest;
  if (current.status === status) return;
  const nowIso = new Date().toISOString();
  const adminEmail = auth.currentUser?.email || null;
  const updates: Record<string, unknown> = { status };
  if (status === 'approved') {
    updates.approvedAt = nowIso;
    updates.approvedBy = adminEmail;
    updates.rejectedAt = null;
    updates.rejectedBy = null;
  } else if (status === 'rejected') {
    updates.rejectedAt = nowIso;
    updates.rejectedBy = adminEmail;
    updates.approvedAt = null;
    updates.approvedBy = null;
  }
  await updateDoc(ref, updates);
};

export const adjustCodAccountWallet = async (id: string, delta: number) => {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    walletBalance: increment(delta)
  });
  const snap = await getDoc(ref);
  return snap.exists() ? mapDoc(snap as { data: () => CodAccountRequest }) : null;
};

export const updateCodAccountLastLogin = async (id: string) => {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { lastLoginAt: new Date().toISOString() });
};

export const clearCodAccounts = async () => {
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

export const deleteCodAccount = async (id: string) => {
  await deleteDoc(doc(db, COLLECTION, id));
};
