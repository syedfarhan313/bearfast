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

const STORAGE_KEY = 'bearfast_fund_requests';

export const loadFundRequests = (): FundRequest[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FundRequest[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

export const saveFundRequests = (requests: FundRequest[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
};

export const addFundRequest = (request: FundRequest) => {
  const requests = loadFundRequests();
  requests.unshift(request);
  saveFundRequests(requests);
};

export const updateFundRequestStatus = (
  id: string,
  status: FundRequestStatus
) => {
  const requests = loadFundRequests();
  const index = requests.findIndex((req) => req.id === id);
  if (index === -1) return null;
  const request = { ...requests[index], status };
  requests[index] = request;
  saveFundRequests(requests);
  return request;
};
