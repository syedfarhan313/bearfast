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
  password: string;
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

const STORAGE_KEY = 'bearfast_cod_accounts';
const SESSION_KEY = 'bearfast_cod_session';
export const CARD_FEE = 800;

const normalizeAccount = (account: CodAccountRequest) => {
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
    walletBalance
  };
};

export const loadCodAccounts = (): CodAccountRequest[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CodAccountRequest[];
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed.map((account) => normalizeAccount(account));
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      saveCodAccounts(normalized);
    }
    return normalized;
  } catch {
    return [];
  }
};

export const saveCodAccounts = (accounts: CodAccountRequest[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
};

export const addCodAccount = (account: CodAccountRequest) => {
  const accounts = loadCodAccounts();
  accounts.unshift(normalizeAccount(account));
  saveCodAccounts(accounts);
};

export const updateCodAccountStatus = (
  id: string,
  status: CodAccountStatus
) => {
  const accounts = loadCodAccounts();
  const index = accounts.findIndex((account) => account.id === id);
  if (index === -1) return;
  const account = accounts[index];
  if (account.status !== status) {
    account.status = status;
    account.statusHistory = [
      ...account.statusHistory,
      { status, at: new Date().toISOString() }
    ];
  }
  accounts[index] = account;
  saveCodAccounts(accounts);
};

export const adjustCodAccountWallet = (id: string, delta: number) => {
  const accounts = loadCodAccounts();
  const index = accounts.findIndex((account) => account.id === id);
  if (index === -1) return null;
  const account = accounts[index];
  const current = Number.isFinite(account.walletBalance)
    ? account.walletBalance
    : account.planTotal || 0;
  account.walletBalance = Number((current + delta).toFixed(2));
  accounts[index] = account;
  saveCodAccounts(accounts);
  return account;
};

export const updateCodAccountPassword = (id: string, password: string) => {
  const accounts = loadCodAccounts();
  const index = accounts.findIndex((account) => account.id === id);
  if (index === -1) return null;
  const account = accounts[index];
  account.password = password;
  accounts[index] = account;
  saveCodAccounts(accounts);
  return account;
};

export const setCodSession = (accountId: string) => {
  sessionStorage.setItem(SESSION_KEY, accountId);
};

export const clearCodSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
};

export const loadCodSession = () => {
  const id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  const accounts = loadCodAccounts();
  return accounts.find((account) => account.id === id) ?? null;
};

export const clearCodAccounts = () => {
  saveCodAccounts([]);
};

export const deleteCodAccount = (id: string) => {
  const accounts = loadCodAccounts();
  const next = accounts.filter((account) => account.id !== id);
  saveCodAccounts(next);
  return next;
};
