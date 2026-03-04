import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type MerchantFeedbackStatus = 'new' | 'in_review' | 'resolved';
export type MerchantFeedbackType = 'complaint' | 'suggestion';
export type MerchantFeedbackPriority = 'low' | 'normal' | 'high';

export type MerchantFeedback = {
  id: string;
  accountId: string;
  merchantName: string;
  email: string;
  phone: string;
  type: MerchantFeedbackType;
  priority: MerchantFeedbackPriority;
  subject: string;
  message: string;
  trackingId: string;
  orderId: string;
  createdAt: string;
  status: MerchantFeedbackStatus;
};

const COLLECTION = 'merchantFeedback';

const mapDoc = (docSnap: { data: () => MerchantFeedback; id: string }) => {
  const data = docSnap.data();
  return {
    ...data,
    id: data.id || docSnap.id
  };
};

export const subscribeMerchantFeedbackByAccount = (
  accountId: string,
  onChange: (items: MerchantFeedback[]) => void,
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

export const subscribeMerchantFeedback = (
  onChange: (items: MerchantFeedback[]) => void,
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

export const addMerchantFeedback = async (
  feedback: Omit<MerchantFeedback, 'id'>
) => {
  const ref = doc(collection(db, COLLECTION));
  const payload = { ...feedback, id: ref.id };
  await setDoc(ref, payload);
  return payload;
};
