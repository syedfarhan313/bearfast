import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type RiderStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface RiderStatusHistory {
  status: RiderStatus;
  at: string;
  note?: string;
}

export interface RiderApplication {
  id: string;
  status: RiderStatus;
  statusHistory: RiderStatusHistory[];
  createdAt: string;
  createdBy?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;
  fullName: string;
  fatherName: string;
  dob: string;
  cnic: string;
  cnicNormalized: string;
  mobile: string;
  email?: string;
  city: string;
  cityNormalized: string;
  area: string;
  fullAddress: string;
  postalCode?: string;
  vehicleType: 'Bike' | 'Car';
  vehicleNumber: string;
  vehicleModel: string;
  vehicleColor: string;
  vehicleRegistrationNumber: string;
  drivingLicenseNumber: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  authUid?: string | null;
  authEmail?: string | null;
  activatedAt?: string | null;
}

const COLLECTION = 'riders';

const normalizeCnic = (value: string) => value.replace(/\D/g, '');
const normalizeCity = (value: string) => value.trim().toLowerCase();

const mapDoc = (docSnap: { data: () => RiderApplication; id: string }) => {
  const data = docSnap.data();
  return {
    ...data,
    id: data.id || docSnap.id
  };
};

export const addRiderApplication = async (
  application: Omit<RiderApplication, 'id' | 'statusHistory'>
) => {
  const ref = doc(collection(db, COLLECTION));
  const nowIso = new Date().toISOString();
  const createdBy = auth.currentUser?.uid ?? null;
  const payload: RiderApplication = {
    ...application,
    id: ref.id,
    status: application.status || 'pending',
    createdBy,
    statusHistory: [
      { status: application.status || 'pending', at: nowIso }
    ],
    cnicNormalized: normalizeCnic(application.cnic),
    cityNormalized: normalizeCity(application.city)
  };
  await setDoc(ref, payload);
  return payload;
};

export const subscribeRiders = (
  onChange: (items: RiderApplication[]) => void,
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

export const subscribeRiderByAuthUid = (
  authUid: string,
  onChange: (item: RiderApplication | null) => void,
  onError?: (error: Error) => void
) => {
  if (!authUid) {
    onChange(null);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTION),
    where('authUid', '==', authUid),
    limit(1)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onChange(null);
        return;
      }
      onChange(mapDoc(snapshot.docs[0]));
    },
    (error) => {
      onError?.(error);
    }
  );
};

export const getRiderByAuthUid = async (authUid: string) => {
  if (!authUid) return null;
  const q = query(
    collection(db, COLLECTION),
    where('authUid', '==', authUid),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return mapDoc(snapshot.docs[0]);
};

export const getRiderByEmail = async (email: string) => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const byEmail = query(
    collection(db, COLLECTION),
    where('email', '==', normalized),
    limit(1)
  );
  const emailSnap = await getDocs(byEmail);
  if (!emailSnap.empty) return mapDoc(emailSnap.docs[0]);
  const byAuthEmail = query(
    collection(db, COLLECTION),
    where('authEmail', '==', normalized),
    limit(1)
  );
  const authEmailSnap = await getDocs(byAuthEmail);
  if (authEmailSnap.empty) return null;
  return mapDoc(authEmailSnap.docs[0]);
};

export const findApprovedRiderByCnic = async (cnic: string) => {
  const normalized = normalizeCnic(cnic);
  if (!normalized) return null;
  const q = query(
    collection(db, COLLECTION),
    where('cnicNormalized', '==', normalized),
    where('status', '==', 'approved'),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return mapDoc(snapshot.docs[0]);
};

export const updateRiderStatus = async (
  id: string,
  status: RiderStatus,
  rejectionReason?: string
) => {
  const ref = doc(db, COLLECTION, id);
  const nowIso = new Date().toISOString();
  const adminEmail = auth.currentUser?.email || null;
  const updates: Record<string, unknown> = {
    status,
    statusHistory: arrayUnion({ status, at: nowIso })
  };
  if (status === 'approved') {
    updates.approvedAt = nowIso;
    updates.approvedBy = adminEmail;
    updates.rejectedAt = null;
    updates.rejectedBy = null;
    updates.rejectionReason = null;
  } else if (status === 'rejected') {
    updates.rejectedAt = nowIso;
    updates.rejectedBy = adminEmail;
    updates.approvedAt = null;
    updates.approvedBy = null;
    updates.rejectionReason = rejectionReason?.trim() || 'Not provided';
  }
  await updateDoc(ref, updates);
};

export const linkRiderAuth = async (
  id: string,
  authUid: string,
  authEmail: string
) => {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    authUid,
    authEmail,
    activatedAt: new Date().toISOString()
  });
};

export const clearRiders = async () => {
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
