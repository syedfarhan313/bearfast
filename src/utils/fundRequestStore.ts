import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type FundRequestStatus = 'pending' | 'approved' | 'rejected';

export type FundRequest = {
  id: string;
  accountId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  amount: number;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  cnic: string;
  createdAt: string;
  status: FundRequestStatus;
};

const COLLECTION = 'fundRequests';
const ACCEPTED_COLLECTION = 'acceptedFundRequests';

const mapDoc = (docSnap: { data: () => FundRequest; id: string }) => {
  const data = docSnap.data();
  return {
    ...data,
    id: data.id || docSnap.id
  };
};

export const subscribeFundRequests = (
  onChange: (items: FundRequest[]) => void,
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

export const subscribeFundRequestsByAccount = (
  accountId: string,
  onChange: (items: FundRequest[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(
    collection(db, COLLECTION),
    where('accountId', '==', accountId),
    orderBy('createdAt', 'desc')
  );
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

export const loadFundRequests = async (): Promise<FundRequest[]> => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => mapDoc(docSnap));
};

export const addFundRequest = async (request: FundRequest) => {
  const ref = doc(db, COLLECTION, request.id);
  await setDoc(ref, request);
};

export const updateFundRequestStatus = async (
  id: string,
  status: FundRequestStatus
) => {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  await updateDoc(ref, { status });
  return { ...(snap.data() as FundRequest), status };
};

export const addAcceptedFundRequest = async (
  request: FundRequest,
  meta: { approvedAt: string; approvedBy: string | null }
) => {
  const ref = doc(db, ACCEPTED_COLLECTION, request.id);
  await setDoc(ref, {
    ...request,
    status: 'approved',
    approvedAt: meta.approvedAt,
    approvedBy: meta.approvedBy,
    originalRequestId: request.id
  });
};
