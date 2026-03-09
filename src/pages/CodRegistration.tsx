import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  LayoutGrid,
  Lock,
  Mail,
  MessageSquare,
  Moon,
  Package,
  PackageCheck,
  PlusCircle,
  Search,
  Settings,
  Sun,
  Truck,
  UserCircle2,
  Wallet,
  X
} from 'lucide-react';
import {
  addCodAccount,
  CodAccountRequest,
  CARD_FEE,
  deleteCodAccount,
  SERVICE_CITIES,
  subscribeCodAccount,
  updateCodAccountProfile,
  updateCodAccountLastLogin
} from '../utils/codAccountStore';
import {
  addFundRequest,
  FundRequest,
  subscribeFundRequestsByAccount
} from '../utils/fundRequestStore';
import {
  deleteBookingsByMerchantId,
  subscribeBookingsByMerchant,
  Booking,
  STATUS_OPTIONS,
  isCodBooking
} from '../utils/bookingStore';
import { addMerchantFeedback, MerchantFeedback } from '../utils/merchantFeedbackStore';
import { auth } from '../lib/firebase';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword
} from 'firebase/auth';

const packages = [
  {
    name: 'Silver',
    code: 'SC',
    base: 3000,
    charges: 800,
    accent: 'from-slate-900/90 via-slate-700 to-slate-900/90'
  },
  {
    name: 'Gold',
    code: 'GC',
    base: 6500,
    charges: 800,
    accent: 'from-amber-500/90 via-amber-400 to-orange-500/90'
  },
  {
    name: 'Diamond',
    code: 'DC',
    base: 9000,
    charges: 800,
    accent: 'from-sky-500/90 via-indigo-500 to-blue-700/90'
  },
  {
    name: 'Executive',
    code: 'EC',
    base: 12000,
    charges: 800,
    accent: 'from-rose-500/90 via-pink-500 to-red-600/90'
  }
];

const PLAN_STORAGE_KEY = 'cod_plan_id';
const BUSINESS_TYPES = [
  'Ecommerce',
  'Wholesale',
  'Retail',
  'Services',
  'Marketplace',
  'Other'
];
const STEPS = [
  'Personal Information',
  'Bank Information',
  'Shipping Information',
  'Password'
];

const DASHBOARD_NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { key: 'orders', label: 'Orders', icon: Package },
  { key: 'wallet', label: 'Wallet', icon: Wallet },
  { key: 'summary', label: 'Booking Summary', icon: Clipboard },
  { key: 'loadsheet', label: 'Generate Load Sheet', icon: Clipboard },
  { key: 'loadsheet_log', label: 'Loading Sheet Log', icon: FileText },
  { key: 'shipper_advice', label: 'Shipper Advice', icon: Mail },
  { key: 'track', label: 'Track Deliveries', icon: Truck },
  { key: 'edit_profile', label: 'Edit Profile', icon: UserCircle2 },
  { key: 'payments', label: 'Payment History', icon: Wallet },
  { key: 'support', label: 'Complaints', icon: MessageSquare },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'settings', label: 'Settings', icon: Settings }
] as const;

type DashboardSection = (typeof DASHBOARD_NAV)[number]['key'];

type FormState = {
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
  confirmPassword: string;
};

type ProfileFormState = Omit<FormState, 'password' | 'confirmPassword'>;

const initialForm: FormState = {
  companyName: '',
  companyLegalName: '',
  businessType: '',
  website: '',
  contactName: '',
  phone: '',
  email: '',
  altPhone: '',
  address: '',
  cnic: '',
  bankName: '',
  accountTitle: '',
  accountNumber: '',
  iban: '',
  swiftCode: '',
  branchName: '',
  branchCode: '',
  city: '',
  pickupTimings: '',
  monthlyShipment: '',
  specialInstructions: '',
  googleMapPin: '',
  password: '',
  confirmPassword: ''
};

const initialProfileForm: ProfileFormState = {
  companyName: '',
  companyLegalName: '',
  businessType: '',
  website: '',
  contactName: '',
  phone: '',
  email: '',
  altPhone: '',
  address: '',
  cnic: '',
  bankName: '',
  accountTitle: '',
  accountNumber: '',
  iban: '',
  swiftCode: '',
  branchName: '',
  branchCode: '',
  city: '',
  pickupTimings: '',
  monthlyShipment: '',
  specialInstructions: '',
  googleMapPin: ''
};

const isEmailValid = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isPhoneValid = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};

const isCnicValid = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 13) return false;
  if (/^\d{5}-\d{7}-\d$/.test(value.trim())) return true;
  return /^\d{13}$/.test(digits);
};

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })}`;
};

const formatDateOnly = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB');
};

const formatWeight = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return value
    .toFixed(3)
    .replace(/\.?0+$/, '');
};

const formatMoney = (value: number) =>
  value.toLocaleString('en-PK', { maximumFractionDigits: 0 });
const formatMoneyDecimal = (value: number) =>
  value.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
const getPaymentDate = (booking: Booking) => {
  const history = booking.statusHistory || [];
  const entry = [...history].reverse().find((item) => item.status === 'payment_received');
  return entry?.at || booking.createdAt;
};
const getPaymentStatusLabel = (booking: Booking) => {
  if (booking.status === 'payment_received') return 'Paid';
  if (booking.status === 'delivered') return 'Pending Settlement';
  if (booking.status === 'out_for_delivery') return 'Out for Delivery';
  if (booking.status === 'in_transit') return 'In Transit';
  return 'In Process';
};

const loadSheetEntries = [
  {
    date: '2026-03-09',
    trackingNo: '173011578696',
    pickupName: 'BEAR FAST COURIERS CARGO & LOGISTICS',
    pickupCompany: 'BEAR FAST COURIERS CARGO & Logistics',
    pickupPhone: '03341808510',
    orderId: '',
    deliveryName: 'SAHIL KHAN',
    deliveryPhone: '923415355998',
    qty: 1,
    pickupCity: 'Bannuu',
    deliveryCity: 'Swat',
    weightKg: 0.5,
    codAmount: 0
  },
  {
    date: '2026-03-09',
    trackingNo: '173011578702',
    pickupName: 'HUGO ECOM STORE',
    pickupCompany: 'Hugo Online Pvt Ltd',
    pickupPhone: '03001239876',
    orderId: 'HF-77452',
    deliveryName: 'AIMAN BUTT',
    deliveryPhone: '923004442211',
    qty: 2,
    pickupCity: 'Lahore',
    deliveryCity: 'Karachi',
    weightKg: 1.25,
    codAmount: 3450
  },
  {
    date: '2026-03-09',
    trackingNo: '173011578711',
    pickupName: 'MEGA MART',
    pickupCompany: 'Mega Mart Wholesale',
    pickupPhone: '03451234567',
    orderId: 'MM-21909',
    deliveryName: 'USMAN TARIQ',
    deliveryPhone: '923015559988',
    qty: 1,
    pickupCity: 'Islamabad',
    deliveryCity: 'Peshawar',
    weightKg: 0.9,
    codAmount: 1890
  },
  {
    date: '2026-03-09',
    trackingNo: '173011578724',
    pickupName: 'NOVA FASHION',
    pickupCompany: 'Nova Fashion House',
    pickupPhone: '03111222111',
    orderId: 'NF-48031',
    deliveryName: 'HASSAN RAZA',
    deliveryPhone: '923327001122',
    qty: 3,
    pickupCity: 'Faisalabad',
    deliveryCity: 'Sialkot',
    weightKg: 2.4,
    codAmount: 7650
  },
  {
    date: '2026-03-09',
    trackingNo: '173011578739',
    pickupName: 'URBAN TECH',
    pickupCompany: 'Urban Tech Traders',
    pickupPhone: '03211223344',
    orderId: 'UT-66708',
    deliveryName: 'ZAINAB IQBAL',
    deliveryPhone: '923218889900',
    qty: 1,
    pickupCity: 'Karachi',
    deliveryCity: 'Multan',
    weightKg: 1.8,
    codAmount: 5200
  },
  {
    date: '2026-03-09',
    trackingNo: '173011578745',
    pickupName: 'RUBY BEAUTY',
    pickupCompany: 'Ruby Beauty Co.',
    pickupPhone: '03336667788',
    orderId: 'RB-50122',
    deliveryName: 'MOMINA ASIF',
    deliveryPhone: '923336770099',
    qty: 2,
    pickupCity: 'Quetta',
    deliveryCity: 'Hyderabad',
    weightKg: 1.1,
    codAmount: 2790
  },
  {
    date: '2026-03-09',
    trackingNo: '173011578752',
    pickupName: 'ALPHA HOME',
    pickupCompany: 'Alpha Home Store',
    pickupPhone: '03019998877',
    orderId: 'AH-11892',
    deliveryName: 'IRFAN ALI',
    deliveryPhone: '923456700112',
    qty: 1,
    pickupCity: 'Gujranwala',
    deliveryCity: 'Sargodha',
    weightKg: 3.2,
    codAmount: 9900
  },
  {
    date: '2026-03-09',
    trackingNo: '173011578761',
    pickupName: 'ZEN LIFESTYLE',
    pickupCompany: 'Zen Lifestyle PK',
    pickupPhone: '03145556677',
    orderId: 'ZL-88310',
    deliveryName: 'FARHAN AKRAM',
    deliveryPhone: '923001112233',
    qty: 1,
    pickupCity: 'Rawalpindi',
    deliveryCity: 'Bahawalpur',
    weightKg: 0.75,
    codAmount: 2250
  },
  {
    date: '2026-03-09',
    trackingNo: '173011578774',
    pickupName: 'BRIGHT ACCESSORIES',
    pickupCompany: 'Bright Accessories',
    pickupPhone: '03225667788',
    orderId: 'BA-99017',
    deliveryName: 'HINA YOUSAF',
    deliveryPhone: '923142229944',
    qty: 4,
    pickupCity: 'Sialkot',
    deliveryCity: 'Lahore',
    weightKg: 2.8,
    codAmount: 4300
  },
  {
    date: '2026-03-09',
    trackingNo: '173011578781',
    pickupName: 'NEXA BOOKS',
    pickupCompany: 'Nexa Books & Stationery',
    pickupPhone: '03400011223',
    orderId: 'NB-77025',
    deliveryName: 'MAAZ KHAN',
    deliveryPhone: '923077700011',
    qty: 2,
    pickupCity: 'Lahore',
    deliveryCity: 'Gujrat',
    weightKg: 1.6,
    codAmount: 3150
  }
];

const loadSheetLogEntries: {
  assignmentNo: string;
  rider: string;
  date: string;
  action: string;
}[] = [];

const shipperAdviceEntries = [
  {
    adviceNo: 'SA-2026-0012',
    date: '2026-03-09',
    shipper: 'BEAR FAST COURIERS CARGO & Logistics',
    origin: 'Karachi',
    destination: 'Lahore',
    shipments: 18,
    weightKg: 42.5,
    codAmount: 125400,
    status: 'In Transit'
  },
  {
    adviceNo: 'SA-2026-0013',
    date: '2026-03-09',
    shipper: 'Nova Fashion House',
    origin: 'Faisalabad',
    destination: 'Islamabad',
    shipments: 12,
    weightKg: 27.8,
    codAmount: 68400,
    status: 'Pending'
  },
  {
    adviceNo: 'SA-2026-0014',
    date: '2026-03-08',
    shipper: 'Urban Tech Traders',
    origin: 'Karachi',
    destination: 'Multan',
    shipments: 9,
    weightKg: 18.4,
    codAmount: 45200,
    status: 'Delivered'
  },
  {
    adviceNo: 'SA-2026-0015',
    date: '2026-03-08',
    shipper: 'Mega Mart Wholesale',
    origin: 'Islamabad',
    destination: 'Peshawar',
    shipments: 7,
    weightKg: 15.2,
    codAmount: 18900,
    status: 'In Transit'
  },
  {
    adviceNo: 'SA-2026-0016',
    date: '2026-03-07',
    shipper: 'Hugo Online Pvt Ltd',
    origin: 'Lahore',
    destination: 'Karachi',
    shipments: 16,
    weightKg: 34.1,
    codAmount: 91200,
    status: 'Open'
  }
];

const shipperAdviceBadge = (status: string) => {
  if (status === 'Delivered') return 'bg-emerald-100 text-emerald-700';
  if (status === 'In Transit') return 'bg-sky-100 text-sky-700';
  if (status === 'Pending') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-700';
};

const initialFeedbackForm = {
  type: 'complaint',
  priority: 'normal',
  subject: '',
  trackingId: '',
  orderId: '',
  message: ''
};

export function CodRegistration() {
  const location = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [planError, setPlanError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginNotice, setLoginNotice] = useState('');
  const [loginNoticeTone, setLoginNoticeTone] = useState<'info' | 'success'>(
    'info'
  );
  const [copiedTrackingId, setCopiedTrackingId] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConsent, setClearConsent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginAccount, setLoginAccount] = useState<CodAccountRequest | null>(
    null
  );
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [viewMode, setViewMode] = useState<'register' | 'account'>('register');
  const [registerOnly, setRegisterOnly] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'reset'>('email');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState(initialFeedbackForm);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackTicketId, setFeedbackTicketId] = useState('');
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
  const [fundAmount, setFundAmount] = useState('');
  const [fundBankName, setFundBankName] = useState('');
  const [fundAccountTitle, setFundAccountTitle] = useState('');
  const [fundAccountNumber, setFundAccountNumber] = useState('');
  const [fundIban, setFundIban] = useState('');
  const [fundCnic, setFundCnic] = useState('');
  const [fundError, setFundError] = useState('');
  const [fundSuccess, setFundSuccess] = useState('');
  const [showFundSentModal, setShowFundSentModal] = useState(false);
  const [lastFundAmount, setLastFundAmount] = useState<number | null>(null);
  const fundPrefilledRef = useRef(false);
  const [activeSection, setActiveSection] =
    useState<DashboardSection>('dashboard');
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [bookingSnapshot, setBookingSnapshot] = useState<Booking[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [chartMode, setChartMode] = useState<'weekly' | 'monthly' | 'yearly'>(
    'monthly'
  );
  const [balancePulse, setBalancePulse] = useState(false);
  const navigate = useNavigate();
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [confirmAccountPassword, setConfirmAccountPassword] = useState('');
  const [accountPasswordError, setAccountPasswordError] = useState('');
  const [accountPasswordSuccess, setAccountPasswordSuccess] = useState('');
  const [profileForm, setProfileForm] =
    useState<ProfileFormState>(initialProfileForm);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileEmailNotice, setProfileEmailNotice] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({
    company: false,
    contact: false,
    bank: false,
    shipping: false,
    credentials: false
  });
  const registrationRef = useRef<HTMLDivElement | null>(null);
  const planRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('signin') === '1') {
      setShowLoginModal(true);
      setLoginError('');
      setLoginNotice('');
      setLoginNoticeTone('info');
      setLoginAccount(null);
    }
  }, [location.search]);

  useEffect(() => {
    const className = 'hide-floating-whatsapp';
    const shouldHide =
      viewMode === 'account' && activeSection === 'settings';
    if (shouldHide) {
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }
    return () => {
      document.body.classList.remove(className);
    };
  }, [viewMode, activeSection]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const planParam = params.get('plan');
    const registerParam = params.get('register') === '1';
    const isValidPlan = (code: string | null) =>
      Boolean(code && packages.some((pack) => pack.code === code));
    if (isValidPlan(planParam)) {
      setSelectedPlan(planParam);
      setPlanError('');
    } else {
      setSelectedPlan(null);
    }
    const nextRegisterOnly = registerParam && isValidPlan(planParam);
    setRegisterOnly(nextRegisterOnly);
    if (nextRegisterOnly) {
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0 });
      }, 0);
    }
  }, [location.search]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('bearfast_login_email');
    if (savedEmail) {
      setLoginEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (!showForgotModal) {
      setForgotEmail('');
      setForgotStep('email');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setForgotError('');
      setForgotSuccess('');
      setShowForgotPassword(false);
      setShowForgotConfirm(false);
    }
  }, [showForgotModal]);

  useEffect(() => {
    if (!showFundModal) {
      setFundAmount('');
      setFundError('');
      setFundSuccess('');
      fundPrefilledRef.current = false;
      return;
    }
    if (loginAccount && !fundPrefilledRef.current) {
      setFundBankName(loginAccount.bankName || '');
      setFundAccountTitle(loginAccount.accountTitle || '');
      setFundAccountNumber(loginAccount.accountNumber || '');
      setFundIban(loginAccount.iban || '');
      setFundCnic(loginAccount.cnic || '');
      fundPrefilledRef.current = true;
    }
  }, [showFundModal, loginAccount]);


  useEffect(() => {
    let unsubscribeAccount = () => {};
    let unsubscribeFunds = () => {};
    let unsubscribeBookings = () => {};
    let didUpdateLogin = false;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeAccount();
      unsubscribeFunds();
      unsubscribeBookings();
      didUpdateLogin = false;
      if (!user) {
        setLoginAccount(null);
        setViewMode('register');
        setFundRequests([]);
        setBookingSnapshot([]);
        setAccountNotFound(false);
        setAuthChecking(false);
        return;
      }
      if (user.isAnonymous) {
        setLoginAccount(null);
        setViewMode('register');
        setFundRequests([]);
        setBookingSnapshot([]);
        setAccountNotFound(false);
        setAuthChecking(false);
        return;
      }
      setAuthChecking(true);
      setAccountNotFound(false);
      setViewMode('account');
      unsubscribeAccount = subscribeCodAccount(user.uid, (account) => {
        if (account) {
          setLoginAccount(account);
          setAccountNotFound(false);
          if (!didUpdateLogin) {
            didUpdateLogin = true;
            updateCodAccountLastLogin(account.id).catch(() => undefined);
          }
        } else {
          setLoginAccount(null);
          setAccountNotFound(true);
          setViewMode('register');
        }
        setAuthChecking(false);
      }, (error) => {
        console.error('[COD] account subscribe failed', error);
        setAccountNotFound(false);
        setViewMode('register');
        setAuthChecking(false);
      });
      unsubscribeFunds = subscribeFundRequestsByAccount(
        user.uid,
        setFundRequests,
        (error) => {
          console.error('[COD] fund request subscribe failed', error);
        }
      );
      unsubscribeBookings = subscribeBookingsByMerchant(
        user.uid,
        setBookingSnapshot,
        (error) => {
          console.error('[COD] booking subscribe failed', error);
        }
      );
    });
    return () => {
      unsubscribeAuth();
      unsubscribeAccount();
      unsubscribeFunds();
      unsubscribeBookings();
    };
  }, []);

  useEffect(() => {
    if (viewMode === 'account') {
      setActiveSection('dashboard');
    }
  }, [viewMode, loginAccount?.id]);

  useEffect(() => {
    if (!loginAccount) {
      setProfileForm(initialProfileForm);
      return;
    }
    setProfileForm({
      companyName: loginAccount.companyName || '',
      companyLegalName: loginAccount.companyLegalName || '',
      businessType: loginAccount.businessType || '',
      website: loginAccount.website || '',
      contactName: loginAccount.contactName || '',
      phone: loginAccount.phone || '',
      email: loginAccount.email || '',
      altPhone: loginAccount.altPhone || '',
      address: loginAccount.address || '',
      cnic: loginAccount.cnic || '',
      bankName: loginAccount.bankName || '',
      accountTitle: loginAccount.accountTitle || '',
      accountNumber: loginAccount.accountNumber || '',
      iban: loginAccount.iban || '',
      swiftCode: loginAccount.swiftCode || '',
      branchName: loginAccount.branchName || '',
      branchCode: loginAccount.branchCode || '',
      city: loginAccount.city || '',
      pickupTimings: loginAccount.pickupTimings || '',
      monthlyShipment: loginAccount.monthlyShipment || '',
      specialInstructions: loginAccount.specialInstructions || '',
      googleMapPin: loginAccount.googleMapPin || ''
    });
    setProfileError('');
    setProfileSuccess('');
    setProfileEmailNotice('');
  }, [loginAccount]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const className = 'hide-floating-whatsapp-mobile';
    if (viewMode === 'account') {
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }
    return () => {
      document.body.classList.remove(className);
    };
  }, [viewMode]);


  const selectedPlanData =
    packages.find((pack) => pack.code === selectedPlan) ?? null;

  const goToRegistration = (code: string) => {
    const target = `/cod-registration?plan=${encodeURIComponent(code)}&register=1`;
    if (typeof window !== 'undefined') {
      window.location.assign(target);
    } else {
      navigate(target);
    }
  };

  const handlePlanSelect = (code: string) => {
    setSelectedPlan(code);
    setPlanError('');
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(PLAN_STORAGE_KEY, code);
      window.localStorage.setItem(PLAN_STORAGE_KEY, code);
    }
    goToRegistration(code);
  };

  const updateField = (
    name: keyof FormState,
    value: FormState[keyof FormState]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as string];
        return next;
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    updateField(name as keyof FormState, value);
  };

  const validateStep = (step: number) => {
    const nextErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.companyName.trim()) {
        nextErrors.companyName = 'Company name is required.';
      }
      if (!formData.contactName.trim()) {
        nextErrors.contactName = 'Contact person is required.';
      }
      if (!formData.phone.trim()) {
        nextErrors.phone = 'Phone number is required.';
      } else if (!isPhoneValid(formData.phone)) {
        nextErrors.phone = 'Enter a valid phone number.';
      }
      if (!formData.email.trim()) {
        nextErrors.email = 'Email is required.';
      } else if (!isEmailValid(formData.email)) {
        nextErrors.email = 'Enter a valid email address.';
      }
      if (!formData.address.trim()) {
        nextErrors.address = 'Pickup address is required.';
      }
    }

    if (step === 2) {
      if (!formData.city.trim()) {
        nextErrors.city = 'Select a city.';
      }
      if (!formData.cnic.trim()) {
        nextErrors.cnic = 'CNIC is required.';
      } else if (!isCnicValid(formData.cnic)) {
        nextErrors.cnic = 'CNIC format should be 12345-1234567-1.';
      }
    }

    if (step === 3) {
      if (!formData.password.trim()) {
        nextErrors.password = 'Password is required.';
      } else if (formData.password.length < 8) {
        nextErrors.password = 'Password must be at least 8 characters.';
      }
      if (!formData.confirmPassword.trim()) {
        nextErrors.confirmPassword = 'Please confirm your password.';
      } else if (formData.confirmPassword !== formData.password) {
        nextErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleProceedToRegistration = () => {
    if (!selectedPlan) {
      setPlanError('Please select a plan to continue.');
      planRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    goToRegistration(selectedPlan);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError('');
    if (!selectedPlan) {
      setPlanError('Please select a plan to continue.');
      planRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (!validateStep(currentStep)) return;
    if (!selectedPlanData) return;
    const nowIso = new Date().toISOString();
    const email = formData.email.trim().toLowerCase();
    const payload = {
      planCode: selectedPlanData.code,
      planName: selectedPlanData.name,
      planTotal: selectedPlanData.base + selectedPlanData.charges,
      walletBalance: selectedPlanData.base,
      status: 'pending' as const,
      statusHistory: [{ status: 'pending' as const, at: nowIso }],
      createdAt: nowIso,
      companyName: formData.companyName,
      companyLegalName: formData.companyLegalName,
      businessType: formData.businessType,
      website: formData.website,
      contactName: formData.contactName,
      phone: formData.phone,
      email,
      altPhone: formData.altPhone,
      address: formData.address,
      cnic: formData.cnic,
      bankName: formData.bankName,
      accountTitle: formData.accountTitle,
      accountNumber: formData.accountNumber,
      iban: formData.iban,
      swiftCode: formData.swiftCode,
      branchName: formData.branchName,
      branchCode: formData.branchCode,
      city: formData.city,
      pickupTimings: formData.pickupTimings,
      monthlyShipment: formData.monthlyShipment,
      specialInstructions: formData.specialInstructions,
      googleMapPin: formData.googleMapPin
    };
    try {
      const existingUser =
        auth.currentUser && !auth.currentUser.isAnonymous
          ? auth.currentUser
          : null;
      let authUser = existingUser;
      if (authUser) {
        const currentEmail = (authUser.email || '').toLowerCase();
        if (currentEmail && currentEmail !== email) {
          setSubmitError(
            'Please sign in with the same email to register this account.'
          );
          return;
        }
      }
      if (!authUser) {
        try {
          const credential = await createUserWithEmailAndPassword(
            auth,
            email,
            formData.password
          );
          authUser = credential.user;
        } catch (err) {
          const code =
            typeof err === 'object' && err && 'code' in err
              ? String((err as { code: string }).code)
              : '';
          if (code === 'auth/email-already-in-use') {
            const credential = await signInWithEmailAndPassword(
              auth,
              email,
              formData.password
            );
            authUser = credential.user;
          } else {
            throw err;
          }
        }
      }
      await addCodAccount(authUser.uid, payload);
      setSubmitted(true);
      setShowSuccessModal(true);
    } catch (error) {
      const code =
        typeof error === 'object' && error && 'code' in error
          ? String((error as { code: string }).code)
          : '';
      if (code === 'auth/email-already-in-use') {
        setErrors((prev) => ({
          ...prev,
          email: 'Email already registered. Please sign in.'
        }));
        setSubmitError(
          'Email already registered. Please use the same password to continue.'
        );
      } else if (code === 'auth/invalid-email') {
        setErrors((prev) => ({ ...prev, email: 'Enter a valid email.' }));
        setSubmitError('Enter a valid email address.');
      } else if (
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/invalid-login-credentials'
      ) {
        setSubmitError('Incorrect password for this email.');
      } else if (code === 'auth/weak-password') {
        setErrors((prev) => ({
          ...prev,
          password: 'Password must be at least 6 characters.'
        }));
        setSubmitError('Password is too weak.');
      } else {
        setSubmitError('Unable to create your account. Please try again.');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSigningIn) return;
    setIsSigningIn(true);
    setLoginError('');
    setLoginNotice('');
    setLoginAccount(null);
    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword;
    if (!email || !password) {
      setLoginError('Please enter email and password.');
      setIsSigningIn(false);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (rememberMe) {
        localStorage.setItem('bearfast_login_email', email);
      } else {
        localStorage.removeItem('bearfast_login_email');
      }
      setAuthChecking(true);
      navigate('/cod-registration', { replace: true });
      setLoginSuccess(true);
      setShowAccountPassword(false);
      setLoginNoticeTone('success');
      setLoginNotice('Signed in successfully.');
      setTimeout(() => {
        setShowLoginModal(false);
        setLoginSuccess(false);
      }, 600);
    } catch {
      setLoginError('Invalid email or password.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleForgotLookup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    const email = forgotEmail.trim().toLowerCase();
    if (!email) {
      setForgotError('Please enter your email.');
      return;
    }
    if (!isEmailValid(email)) {
      setForgotError('Enter a valid email address.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setForgotSuccess('Password reset email sent. Please check your inbox.');
    } catch {
      setForgotError('Unable to send reset email. Check the address.');
    }
  };

  const handleForgotReset = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotError('Please use the reset email link to update your password.');
  };

  const handleFundSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!loginAccount) return;
    setFundError('');
    setFundSuccess('');
    const pending = fundRequests.find(
      (request) =>
        request.accountId === loginAccount.id && request.status === 'pending'
    );
    if (pending) {
      setFundError('A fund request is already pending approval.');
      return;
    }
    const amountValue = Number(fundAmount.replace(/,/g, '').trim());
    if (!amountValue || amountValue <= 0) {
      setFundError('Enter a valid amount.');
      return;
    }
    if (
      !fundBankName.trim() ||
      !fundAccountTitle.trim() ||
      !fundAccountNumber.trim() ||
      !fundIban.trim()
    ) {
      setFundError('Please fill all bank details.');
      return;
    }
    const idSuffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    await addFundRequest({
      id: `FUND-${Date.now()}-${idSuffix}`,
      accountId: loginAccount.id,
      companyName: loginAccount.companyName,
      contactName: loginAccount.contactName,
      email: loginAccount.email,
      phone: loginAccount.phone,
      amount: amountValue,
      bankName: fundBankName.trim(),
      accountTitle: fundAccountTitle.trim(),
      accountNumber: fundAccountNumber.trim(),
      iban: fundIban.trim(),
      cnic: fundCnic.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
    setShowFundModal(false);
    setLastFundAmount(amountValue);
    setShowFundSentModal(true);
  };

  const inputBase =
    'w-full px-4 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-orange-500';
  const inputError = 'border-red-400 focus:ring-red-400';
  const inputOk = 'border-slate-200';
  const inputClass = (field: string) =>
    `${inputBase} ${errors[field] ? inputError : inputOk}`;
  const profileInput =
    'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const toggleSection = (
    section: keyof typeof collapsedSections
  ) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    setProfileError('');
    setProfileSuccess('');
  };

  const handleProfileSave = async () => {
    if (!loginAccount) {
      setProfileError('Please sign in to update your profile.');
      return;
    }
    if (!profileForm.companyName.trim()) {
      setProfileError('Company name is required.');
      return;
    }
    if (!isEmailValid(profileForm.email)) {
      setProfileError('Please enter a valid email address.');
      return;
    }
    if (!isPhoneValid(profileForm.phone)) {
      setProfileError('Please enter a valid phone number.');
      return;
    }
    if (profileForm.cnic && !isCnicValid(profileForm.cnic)) {
      setProfileError('Please enter a valid CNIC (13 digits).');
      return;
    }
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');
    setProfileEmailNotice('');
    const currentUser = auth.currentUser;
    const nextEmail = profileForm.email.trim();
    const emailChanged = Boolean(
      currentUser && currentUser.email && currentUser.email !== nextEmail
    );
    let emailUpdateFailed = false;
    if (emailChanged && currentUser) {
      try {
        await updateEmail(currentUser, nextEmail);
        await sendEmailVerification(currentUser);
        setProfileEmailNotice(
          'Verification email sent. Please verify to keep login access.'
        );
      } catch (error) {
        emailUpdateFailed = true;
        const code =
          typeof error === 'object' && error && 'code' in error
            ? String((error as { code: string }).code)
            : '';
        if (code === 'auth/requires-recent-login') {
          setProfileError('Please log in again to change your email.');
        } else {
          setProfileError('Unable to update email right now.');
        }
      }
    }
    try {
      const payload: Partial<CodAccountRequest> = {
        companyName: profileForm.companyName.trim(),
        companyLegalName: profileForm.companyLegalName.trim(),
        businessType: profileForm.businessType.trim(),
        website: profileForm.website.trim(),
        contactName: profileForm.contactName.trim(),
        phone: profileForm.phone.trim(),
        altPhone: profileForm.altPhone.trim(),
        email: emailUpdateFailed ? loginAccount.email : nextEmail,
        address: profileForm.address.trim(),
        cnic: profileForm.cnic.trim(),
        bankName: profileForm.bankName.trim(),
        accountTitle: profileForm.accountTitle.trim(),
        accountNumber: profileForm.accountNumber.trim(),
        iban: profileForm.iban.trim(),
        swiftCode: profileForm.swiftCode.trim(),
        branchName: profileForm.branchName.trim(),
        branchCode: profileForm.branchCode.trim(),
        city: profileForm.city.trim(),
        pickupTimings: profileForm.pickupTimings.trim(),
        monthlyShipment: profileForm.monthlyShipment.trim(),
        specialInstructions: profileForm.specialInstructions.trim(),
        googleMapPin: profileForm.googleMapPin.trim()
      };
      await updateCodAccountProfile(loginAccount.id, payload);
      if (!emailUpdateFailed) {
        setProfileSuccess('Profile updated successfully.');
      }
    } catch (error) {
      console.error('[COD] profile update failed', error);
      setProfileError('Unable to update profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSendVerification = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setProfileEmailNotice('');
    try {
      await sendEmailVerification(currentUser);
      setProfileEmailNotice('Verification email sent.');
    } catch (error) {
      console.error('[COD] email verification failed', error);
      setProfileEmailNotice('Unable to send verification email.');
    }
  };

  const handleViewBooking = (trackingId: string) => {
    navigate(`/tracking?tracking=${encodeURIComponent(trackingId)}`);
  };

  const handleDownloadBooking = (booking: Booking) => {
    const lastUpdate =
      booking.statusHistory?.[booking.statusHistory.length - 1]?.at ??
      booking.createdAt;
    const codValue = Number(booking.codAmount || 0);
    const content = [
      `Tracking ID: ${booking.trackingId}`,
      `Status: ${statusLabel(booking.status)}`,
      `Delivery Code: ${booking.deliveryCode}`,
      `Service: ${booking.serviceTitle}`,
      `Weight: ${booking.weightKg.toFixed(3)} kg`,
      `COD Amount: Rs. ${formatMoney(Number.isNaN(codValue) ? 0 : codValue)}`,
      `Shipping Charges: Rs. ${formatMoney(booking.shippingCharge || 0)}`,
      `Sender: ${booking.senderName} (${booking.senderPhone})`,
      `Sender Address: ${booking.senderAddress}`,
      `Receiver: ${booking.receiverName} (${booking.receiverPhone})`,
      `Receiver Address: ${booking.receiverAddress}`,
      `Created At: ${formatDateTime(booking.createdAt)}`,
      `Last Update: ${formatDateTime(lastUpdate)}`
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `booking-${booking.trackingId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handlePasswordUpdate = async () => {
    if (!loginAccount || !auth.currentUser) return;
    const nextPassword = newAccountPassword.trim();
    const confirmPassword = confirmAccountPassword.trim();
    setAccountPasswordError('');
    setAccountPasswordSuccess('');
    if (!nextPassword) {
      setAccountPasswordError('Please enter a new password.');
      return;
    }
    if (nextPassword.length < 8) {
      setAccountPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (nextPassword !== confirmPassword) {
      setAccountPasswordError('Passwords do not match.');
      return;
    }
    try {
      await updatePassword(auth.currentUser, nextPassword);
      setNewAccountPassword('');
      setConfirmAccountPassword('');
      setShowAccountPassword(false);
      setAccountPasswordSuccess('Password updated successfully.');
    } catch (error) {
      const code =
        typeof error === 'object' && error && 'code' in error
          ? String((error as { code: string }).code)
          : '';
      if (code === 'auth/requires-recent-login') {
        setAccountPasswordError(
          'Please sign in again before changing your password.'
        );
      } else {
        setAccountPasswordError('Unable to update password. Try again.');
      }
    }
  };

  const handleCopyTracking = async (value: string) => {
    if (!value) return;
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
      setCopiedTrackingId(value);
      setTimeout(() => setCopiedTrackingId(''), 1500);
    } catch {
      doFallbackCopy();
      setCopiedTrackingId(value);
      setTimeout(() => setCopiedTrackingId(''), 1500);
    }
  };

  const handleClearDashboard = async () => {
    if (!loginAccount) return;
    await deleteBookingsByMerchantId(loginAccount.id);
    await deleteCodAccount(loginAccount.id);
    await signOut(auth);
    setLoginAccount(null);
    setViewMode('register');
    setShowClearModal(false);
    setClearConsent(false);
  };

  const userBookings = useMemo(() => {
    if (!loginAccount) return [];
    const email = loginAccount.email?.trim().toLowerCase();
    return bookingSnapshot.filter((booking) => {
      if (!isCodBooking(booking)) return false;
      if (booking.merchantId && booking.merchantId === loginAccount.id) {
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
  }, [bookingSnapshot, loginAccount]);

  const sortedBookings = useMemo(() => {
    return [...userBookings].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;
      return bTime - aTime;
    });
  }, [userBookings]);

  const totalOrders = userBookings.length;
  const deliveredOrders = userBookings.filter(
    (booking) => booking.status === 'delivered'
  ).length;
  const totalSpent = userBookings.reduce(
    (sum, booking) => sum + (booking.shippingCharge || 0),
    0
  );
  const statusCounts = useMemo(() => {
    const base = STATUS_OPTIONS.reduce<Record<string, number>>(
      (acc, item) => {
        acc[item.key] = 0;
        return acc;
      },
      {}
    );
    userBookings.forEach((booking) => {
      const key = booking.status;
      base[key] = (base[key] || 0) + 1;
    });
    return base;
  }, [userBookings]);
  const inTransitOrders = userBookings.filter(
    (booking) =>
      booking.status === 'in_transit' || booking.status === 'out_for_delivery'
  ).length;
  const codBalance = userBookings.reduce((sum, booking) => {
    const value = Number(booking.codAmount || 0);
    return Number.isNaN(value) ? sum : sum + value;
  }, 0);
  const pendingPayments = userBookings.filter((booking) => {
    const value = Number(booking.codAmount || 0);
    return !Number.isNaN(value) && value > 0 && booking.status !== 'payment_received';
  }).length;
  const paymentBookings = useMemo(
    () =>
      sortedBookings.filter((booking) => {
        const value = Number(booking.codAmount || 0);
        return !Number.isNaN(value) && value > 0;
      }),
    [sortedBookings]
  );
  const paymentTotals = useMemo(() => {
    return paymentBookings.reduce(
      (acc, booking) => {
        const value = Number(booking.codAmount || 0);
        if (!Number.isNaN(value)) {
          acc.total += value;
          if (booking.status === 'payment_received') {
            acc.received += value;
          } else {
            acc.pending += value;
          }
        }
        return acc;
      },
      { total: 0, received: 0, pending: 0 }
    );
  }, [paymentBookings]);
  const walletBalance = getDisplayWalletBalance(loginAccount);
  const pendingFundRequest =
    loginAccount &&
    fundRequests.find(
      (request) =>
        request.accountId === loginAccount.id && request.status === 'pending'
    );
  const accountStatusBadge =
    loginAccount?.status === 'approved'
      ? 'bg-emerald-100 text-emerald-700'
      : loginAccount?.status === 'suspended'
        ? 'bg-slate-200 text-slate-700'
      : loginAccount?.status === 'rejected'
        ? 'bg-rose-100 text-rose-700'
        : 'bg-amber-100 text-amber-700';
  const canBookParcels = loginAccount?.status === 'approved';
  const planBadgeClass = () => {
    const name = loginAccount?.planName?.toLowerCase() || '';
    if (name.includes('gold')) return 'from-amber-400 to-orange-500';
    if (name.includes('silver')) return 'from-slate-500 to-slate-700';
    if (name.includes('diamond')) return 'from-sky-500 to-indigo-600';
    if (name.includes('executive')) return 'from-rose-500 to-red-600';
    return 'from-slate-600 to-slate-800';
  };
  const activeSectionLabel =
    DASHBOARD_NAV.find((item) => item.key === activeSection)?.label ??
    'Dashboard';


  const handleFeedbackChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFeedbackForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeedbackSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!loginAccount) {
      setFeedbackError('Please sign in to submit your request.');
      return;
    }
    if (!feedbackForm.subject.trim()) {
      setFeedbackError('Subject is required.');
      return;
    }
    if (!feedbackForm.message.trim()) {
      setFeedbackError('Please share your details so we can help.');
      return;
    }
    setFeedbackSubmitting(true);
    setFeedbackError('');
    setFeedbackSuccess('');
    try {
      const payload = await addMerchantFeedback({
        accountId: loginAccount.id,
        merchantName: loginAccount.companyName || 'Merchant',
        email: loginAccount.email || '',
        phone: loginAccount.phone || '',
        type: feedbackForm.type as MerchantFeedback['type'],
        priority: feedbackForm.priority as MerchantFeedback['priority'],
        subject: feedbackForm.subject.trim(),
        trackingId: feedbackForm.trackingId.trim(),
        orderId: feedbackForm.orderId.trim(),
        message: feedbackForm.message.trim(),
        createdAt: new Date().toISOString(),
        status: 'new'
      });
      setFeedbackTicketId(payload.id);
      setFeedbackSuccess('Your request has been submitted.');
      setFeedbackForm(initialFeedbackForm);
    } catch (error) {
      console.error('[COD] feedback submit failed', error);
      setFeedbackError('Unable to submit right now. Please try again.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  function getDisplayWalletBalance(account: CodAccountRequest | null) {
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
  }
  const performanceScore = totalOrders
    ? Math.round((deliveredOrders / totalOrders) * 100)
    : 0;

  const chartData = useMemo(() => {
    const items: { key: string; label: string; shipments: number; revenue: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const label = date.toLocaleString('en-US', { month: 'short' });
      items.push({ key, label, shipments: 0, revenue: 0 });
    }
    const lookup = new Map(items.map((item) => [item.key, item]));
    userBookings.forEach((booking) => {
      const created = new Date(booking.createdAt);
      if (Number.isNaN(created.getTime())) return;
      const key = `${created.getFullYear()}-${created.getMonth() + 1}`;
      const entry = lookup.get(key);
      if (entry) {
        entry.shipments += 1;
        entry.revenue += booking.shippingCharge || 0;
      }
    });
    return items;
  }, [userBookings]);

  const maxShipments = Math.max(1, ...chartData.map((item) => item.shipments));
  const maxRevenue = Math.max(1, ...chartData.map((item) => item.revenue));
  const revenueLinePoints = chartData
    .map((item, index) => {
      const x = chartData.length === 1 ? 0 : (index / (chartData.length - 1)) * 100;
      const y = 100 - (item.revenue / maxRevenue) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  const sparklinePoints = chartData
    .map((item, index) => {
      const x = chartData.length === 1 ? 0 : (index / (chartData.length - 1)) * 100;
      const y = 40 - (item.revenue / maxRevenue) * 40;
      return `${x},${y}`;
    })
    .join(' ');
  const chartEmpty = chartData.every(
    (item) => item.shipments === 0 && item.revenue === 0
  );

  const statusBadge = (status: string) => {
    if (status === 'delivered' || status === 'payment_received') {
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70';
    }
    if (status === 'confirmed' || status === 'in_transit') {
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/70';
    }
    if (status === 'out_for_delivery' || status === 'pending') {
      return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/70';
    }
    if (status === 'delivery_rejected') {
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/70';
    }
    return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/70';
  };
  const statusLabel = (status: string) =>
    STATUS_OPTIONS.find((item) => item.key === status)?.label ??
    status.replace(/_/g, ' ');

  useEffect(() => {
    if (viewMode !== 'account') return;
    setBalancePulse(true);
    const timer = setTimeout(() => setBalancePulse(false), 650);
    return () => clearTimeout(timer);
  }, [walletBalance, viewMode]);

  useEffect(() => {
    if (!profileOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!profileRef.current || profileRef.current.contains(target)) return;
      setProfileOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [profileOpen]);

  if (authChecking) {
    return (
      <main className="w-full pt-20 min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Loading your account...
        </div>
      </main>
    );
  }

  return (
    <main
      className={`w-full pt-20 min-h-screen ${
        viewMode === 'account'
          ? isDarkMode
            ? 'bg-slate-950 text-slate-100'
            : 'bg-[#F4F6FB] text-slate-900'
          : 'bg-gradient-to-b from-slate-50 via-white to-slate-100/70'
      }`}>
      {viewMode === 'account' && loginAccount ? (
        <div
          className="min-h-screen relative overflow-hidden"
          style={{ fontFamily: "'Poppins', 'Inter', system-ui, sans-serif" }}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_80%_20%,_rgba(244,63,94,0.10),transparent_40%),radial-gradient(circle_at_bottom,_rgba(14,165,233,0.12),transparent_55%)]" />
          <div className="relative">
          <aside
            className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white flex-col border-r border-white/10 shadow-[inset_-1px_0_0_rgba(255,255,255,0.05)]">
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white flex items-center justify-center text-base font-black shadow-lg shadow-orange-500/30">
                  BF
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                    Bear Fast
                  </p>
                  <p className="text-lg font-semibold text-white">
                    Merchant
                  </p>
                </div>
              </div>
            </div>
            <nav className="px-4 space-y-2 flex-1">
              {DASHBOARD_NAV.map((item, index) => {
                const isActive = activeSection === item.key;
                return (
                  <React.Fragment key={item.key}>
                    {index === 1 && (
                      canBookParcels ? (
                        <Link
                          to="/book"
                          className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold transition text-white/65 hover:text-white hover:bg-white/10">
                          <PlusCircle className="h-4 w-4" />
                          Book a Parcel
                        </Link>
                      ) : (
                        <div className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold text-white/40 cursor-not-allowed">
                          <Lock className="h-4 w-4" />
                          Booking locked
                        </div>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection(item.key);
                        setSidebarOpen(false);
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold transition min-w-0 ${
                        isActive
                          ? 'bg-gradient-to-r from-white/20 to-white/5 text-white ring-1 ring-white/25 shadow-sm'
                          : 'text-white/65 hover:text-white hover:bg-white/10'
                      }`}>
                      <item.icon className="h-4 w-4" />
                      <span className="truncate whitespace-nowrap">
                        {item.label}
                      </span>
                    </button>
                  </React.Fragment>
                );
              })}
            </nav>
            <div className="px-6 pb-6 text-xs text-white/40">
              Premium logistics dashboard
            </div>
          </aside>

          {sidebarOpen && (
            <div
              className="hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className="lg:pl-64">
            <header className="sticky top-0 z-40">
              <div className="px-4 sm:px-6 lg:px-10 pt-4">
                <div className="rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur-xl shadow-sm px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
                <div className="flex items-start gap-3 min-w-0">
                  <div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] text-slate-400">
                      Merchant Dashboard
                    </p>
                    <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-900 mt-1 break-words">
                      {loginAccount.companyName || 'Your COD Account'}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                      <span className="px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-slate-900 to-slate-700 text-white ring-1 ring-slate-900/10 whitespace-nowrap">
                        {activeSectionLabel}
                      </span>
                      <span
                        className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${accountStatusBadge}`}>
                        {loginAccount.status.toUpperCase()}
                      </span>
                      <span
                        className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold text-white bg-gradient-to-r ${planBadgeClass()} shadow-sm`}>
                        {loginAccount.planName}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-full lg:w-auto grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/alerts?scope=user')}
                    className="h-11 w-full sm:w-10 rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:border-slate-300 transition flex items-center justify-center">
                    <Bell className="h-4 w-4 mx-auto" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDarkMode((prev) => !prev)}
                    className="h-11 w-full sm:w-10 rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:border-slate-300 transition flex items-center justify-center">
                    {isDarkMode ? (
                      <Sun className="h-4 w-4 mx-auto" />
                    ) : (
                      <Moon className="h-4 w-4 mx-auto" />
                    )}
                  </button>
                  <div className="relative col-span-2 sm:col-span-1" ref={profileRef}>
                    <button
                      type="button"
                      onClick={() => setProfileOpen((prev) => !prev)}
                      aria-haspopup="menu"
                      aria-expanded={profileOpen}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50">
                      <UserCircle2 className="h-5 w-5 text-slate-500" />
                      Profile
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition ${
                          profileOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {profileOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 mt-3 w-64 rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 p-3 z-50">
                        <div className="px-3 pb-3 border-b border-slate-100">
                          <p className="text-sm font-semibold text-slate-800">
                            {loginAccount?.companyName || 'Merchant Account'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {loginAccount?.email || 'no-email@bearfast.com'}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                            <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white">
                              {activeSectionLabel}
                            </span>
                            <span
                              className={`px-2.5 py-1 rounded-full ${accountStatusBadge}`}>
                              {loginAccount?.status?.toUpperCase() || 'ACTIVE'}
                            </span>
                          </div>
                        </div>
                        <div className="py-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSection('edit_profile');
                              setProfileOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100">
                            Edit profile
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSection('wallet');
                              setProfileOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100">
                            Wallet overview
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigate('/logout');
                              setProfileOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50">
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/logout');
                    }}
                    className="btn-ripple col-span-2 sm:col-span-1 w-full sm:w-auto text-center px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50">
                    Logout
                  </button>
                </div>
              </div>
              </div>
            </header>

            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0B1220] shadow-[0_-10px_30px_-20px_rgba(15,23,42,0.7)]">
              <div className="max-w-[760px] mx-auto px-3 pt-2 pb-3">
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {canBookParcels ? (
                    <Link
                      to="/book"
                      className="flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 min-h-[56px] text-[9px] font-semibold text-center leading-snug transition text-white/70 hover:bg-white/10 hover:text-white">
                      <PlusCircle className="h-5 w-5" />
                      <span className="leading-snug">
                        Book a Parcel
                      </span>
                    </Link>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 min-h-[56px] text-[9px] font-semibold text-center leading-snug text-white/40 cursor-not-allowed">
                      <Lock className="h-5 w-5" />
                      <span className="leading-snug">
                        Booking locked
                      </span>
                    </div>
                  )}
                  {DASHBOARD_NAV.filter((item) => item.key !== 'dashboard').map(
                    (item) => {
                      const isActive = activeSection === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setActiveSection(item.key)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 min-h-[56px] text-[9px] font-semibold text-center leading-snug transition ${
                            isActive
                              ? 'bg-gradient-to-r from-white/20 to-white/5 text-white ring-1 ring-white/25'
                              : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }`}>
                          <item.icon className="h-5 w-5" />
                          <span className="leading-snug truncate whitespace-nowrap max-w-[72px]">
                            {item.label}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </nav>

            <main className="px-4 sm:px-6 lg:px-10 pt-8 pb-28 lg:pb-8 max-w-[1600px] mx-auto space-y-8">
              {pendingPayments > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-700 text-sm">
                  Pending payments alert: {pendingPayments} COD payments are
                  awaiting settlement.
                </div>
              )}

              {loginAccount.status !== 'approved' && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-700 text-sm">
                  Your account is currently in <strong>PROCESSING</strong>. Once
                  approved, you will get full operational access.
                </div>
              )}

              {activeSection === 'dashboard' && (
                <>
                  <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Merchant Actions
                        </p>
                        <p className="text-xl sm:text-2xl font-semibold text-slate-800 mt-2">
                          Book a Parcel
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                          Create a new shipment and generate tracking instantly.
                        </p>
                      </div>
                      {canBookParcels ? (
                        <div className="w-full sm:w-auto text-sm text-slate-500">
                          Use the menu to book a parcel.
                        </div>
                      ) : (
                        <div className="w-full sm:w-auto text-center px-5 py-2.5 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold">
                          Booking locked until approval
                        </div>
                      )}
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowClearModal(true)}
                        className="w-full sm:w-auto text-center px-4 py-2.5 rounded-full border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold hover:bg-rose-100">
                        Clear Dashboard
                      </button>
                      <span className="text-xs text-slate-500 sm:text-sm">
                        This will remove all account records and log you out.
                      </span>
                    </div>
                  </section>
                  <section className="grid gap-6 lg:grid-cols-12">
                  <div className="lg:col-span-8 rounded-[30px] bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-800 p-6 sm:p-8 text-white shadow-[0_30px_60px_-40px_rgba(15,23,42,0.85)] border border-white/10 relative overflow-hidden">
                    <div className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
                    <div className="relative">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                          Available Balance
                        </p>
                        <p
                          className={`text-3xl sm:text-4xl lg:text-5xl font-black mt-3 ${
                            balancePulse ? 'animate-pulse' : ''
                          }`}>
                          Rs. {formatMoney(walletBalance)}
                        </p>
                        <p className="text-sm text-white/70 mt-2">
                          {loginAccount.planName} Wallet
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/80">
                        Premium COD
                      </div>
                    </div>
                    <div className="mt-8 h-24">
                      <svg
                        viewBox="0 0 100 40"
                        preserveAspectRatio="none"
                        className="w-full h-full">
                        <polyline
                          fill="none"
                          stroke="rgba(255,255,255,0.6)"
                          strokeWidth="2"
                          points={sparklinePoints}
                        />
                      </svg>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setShowFundModal(true)}
                        disabled={Boolean(pendingFundRequest)}
                        className={`btn-ripple w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-semibold shadow-sm transition ${
                          pendingFundRequest
                            ? 'bg-white/60 text-slate-600 cursor-not-allowed'
                            : 'bg-white text-slate-900 hover:bg-slate-100'
                        }`}>
                        <PlusCircle className="h-4 w-4" />
                        {pendingFundRequest ? 'Request Pending' : 'Add Funds'}
                      </button>
                      <button className="btn-ripple w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-white/30 text-white font-semibold hover:bg-white/10 transition">
                        <BarChart3 className="h-4 w-4" />
                        View Transactions
                      </button>
                    </div>
                    {pendingFundRequest && (
                      <div className="mt-4 rounded-2xl border border-amber-200/70 bg-amber-50/10 px-4 py-3 text-sm text-amber-100">
                        Fund request pending: Rs. {formatMoney(pendingFundRequest.amount)}. Admin will review it soon.
                      </div>
                    )}
                    </div>
                  </div>

                  <div className="lg:col-span-4 grid gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        {
                          label: 'Total Orders',
                          value: totalOrders,
                          icon: Package
                        },
                        {
                          label: 'Delivered',
                          value: deliveredOrders,
                          icon: PackageCheck
                        },
                        {
                          label: 'In Transit',
                          value: inTransitOrders,
                          icon: Truck
                        },
                        {
                          label: 'Total Spent',
                          value: `Rs. ${formatMoney(totalSpent)}`,
                          icon: Wallet
                        }
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-2xl bg-white/90 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.35)] p-4 border border-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)]">
                          <div className="h-9 w-9 rounded-2xl bg-slate-900/5 ring-1 ring-slate-200/70 flex items-center justify-center">
                            <stat.icon className="h-4 w-4 text-slate-700" />
                          </div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mt-3">
                            {stat.label}
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-1">
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
                </>
              )}

              {activeSection === 'summary' && (
                <>
                  <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Booking Summary
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 mt-2">
                          All Bookings
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                          Showing {sortedBookings.length} bookings
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:hidden">
                      {sortedBookings.map((booking) => {
                        const pickupCompany =
                          booking.merchantName || loginAccount?.companyName || '-';
                        const pickupName = booking.senderName || '-';
                        const pickupPhone = booking.senderPhone || '-';
                        const orderId = booking.orderId || '-';
                        const deliveryName = booking.receiverName || '-';
                        const deliveryPhone = booking.receiverPhone || '-';
                        const pieces = booking.pieces ?? 1;
                        const codValue =
                          booking.codAmount && booking.codAmount.trim()
                            ? booking.codAmount
                            : '0';
                        return (
                          <div
                            key={booking.trackingId}
                            className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                  Tracking
                                </p>
                                <p className="text-base font-semibold text-slate-900 mt-1">
                                  {booking.trackingId}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {formatDateOnly(booking.createdAt)}
                                </p>
                              </div>
                              <div className="text-right text-xs text-slate-500">
                                <div>Qty: {pieces}</div>
                                <div className="mt-1">
                                  {formatWeight(booking.weightKg)} Kg
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 grid gap-3 text-xs text-slate-600">
                              <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200/40">
                                <p className="uppercase tracking-[0.2em] text-slate-400">
                                  Pickup
                                </p>
                                <p className="mt-2 font-semibold text-slate-900">
                                  {pickupName}
                                </p>
                                <p>{pickupPhone}</p>
                                <p>{pickupCompany}</p>
                                <p>Order ID: {orderId}</p>
                                <p>City: {booking.senderCity || '-'}</p>
                              </div>
                              <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200/40">
                                <p className="uppercase tracking-[0.2em] text-slate-400">
                                  Delivery
                                </p>
                                <p className="mt-2 font-semibold text-slate-900">
                                  {deliveryName}
                                </p>
                                <p>{deliveryPhone}</p>
                                <p>City: {booking.receiverCity || '-'}</p>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                              <span>COD</span>
                              <span className="font-semibold text-slate-900">
                                Rs. {codValue}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {sortedBookings.length === 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                          No bookings yet. Book a parcel to see the summary here.
                        </div>
                      )}
                    </div>

                    <div className="mt-5 hidden sm:block rounded-2xl border border-slate-200 bg-slate-50/60">
                      <div className="max-h-[70vh] overflow-auto">
                        <table className="w-full min-w-[1150px] text-sm">
                          <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr className="text-left text-[11px] uppercase tracking-[0.2em] text-slate-400">
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Tracking No</th>
                              <th className="px-4 py-3">Pickup Info</th>
                              <th className="px-4 py-3">Delivery Info</th>
                              <th className="px-4 py-3 text-center">Qty</th>
                              <th className="px-4 py-3">Pickup City</th>
                              <th className="px-4 py-3">Delivery City</th>
                              <th className="px-4 py-3">Weight</th>
                              <th className="px-4 py-3">COD Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {sortedBookings.map((booking) => {
                              const pickupCompany =
                                booking.merchantName ||
                                loginAccount?.companyName ||
                                '-';
                              const pickupName = booking.senderName || '-';
                              const pickupPhone = booking.senderPhone || '-';
                              const orderId = booking.orderId || '-';
                              const deliveryName = booking.receiverName || '-';
                              const deliveryPhone = booking.receiverPhone || '-';
                              const pieces = booking.pieces ?? 1;
                              const codValue =
                                booking.codAmount && booking.codAmount.trim()
                                  ? booking.codAmount
                                  : '0';
                              return (
                                <tr
                                  key={booking.trackingId}
                                  className="hover:bg-slate-50">
                                  <td className="px-4 py-4 text-slate-700 font-semibold">
                                    {formatDateOnly(booking.createdAt)}
                                  </td>
                                  <td className="px-4 py-4 font-semibold text-slate-900">
                                    {booking.trackingId}
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="space-y-1 text-xs text-slate-600">
                                      <div>
                                        <span className="text-slate-400">Name:</span>{' '}
                                        {pickupName}
                                      </div>
                                      <div>
                                        <span className="text-slate-400">
                                          Company:
                                        </span>{' '}
                                        {pickupCompany}
                                      </div>
                                      <div>
                                        <span className="text-slate-400">
                                          Phone:
                                        </span>{' '}
                                        {pickupPhone}
                                      </div>
                                      <div>
                                        <span className="text-slate-400">
                                          Order ID:
                                        </span>{' '}
                                        {orderId}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="space-y-1 text-xs text-slate-600">
                                      <div>
                                        <span className="text-slate-400">Name:</span>{' '}
                                        {deliveryName}
                                      </div>
                                      <div>
                                        <span className="text-slate-400">
                                          Phone:
                                        </span>{' '}
                                        {deliveryPhone}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-center text-slate-700">
                                    {pieces}
                                  </td>
                                  <td className="px-4 py-4 text-slate-700">
                                    {booking.senderCity || '-'}
                                  </td>
                                  <td className="px-4 py-4 text-slate-700">
                                    {booking.receiverCity || '-'}
                                  </td>
                                  <td className="px-4 py-4 text-slate-700">
                                    {formatWeight(booking.weightKg)} Kg
                                  </td>
                                  <td className="px-4 py-4 text-slate-700 whitespace-nowrap">
                                    Rs. {codValue}
                                  </td>
                                </tr>
                              );
                            })}
                            {sortedBookings.length === 0 && (
                              <tr>
                                <td
                                  colSpan={9}
                                  className="px-4 py-8 text-center text-sm text-slate-500">
                                  No bookings yet. Book a parcel to see the summary
                                  here.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {activeSection === 'loadsheet' && (
                <>
                  <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Generate Load Sheet
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 mt-2">
                          Dispatch Load Sheet
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                          Ready shipments for {formatDateOnly('2026-03-09')}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-ripple inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800">
                        <Download className="h-4 w-4" />
                        Generate Sheet
                      </button>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>Show</span>
                        <select
                          defaultValue="10"
                          className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                        </select>
                        <span>entries</span>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search load sheet"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200/70 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="mt-5 grid gap-3 sm:hidden">
                    {loadSheetEntries.map((entry) => (
                      <div
                        key={entry.trackingNo}
                        className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Tracking
                            </p>
                            <p className="text-base font-semibold text-slate-900 mt-1">
                              {entry.trackingNo}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDateOnly(entry.date)}
                            </p>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                            <div>Qty: {entry.qty}</div>
                            <div className="mt-1">
                              {formatWeight(entry.weightKg)} Kg
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3 text-xs text-slate-600">
                          <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200/40">
                            <p className="uppercase tracking-[0.2em] text-slate-400">
                              Pickup
                            </p>
                            <p className="mt-2 font-semibold text-slate-900 truncate">
                              {entry.pickupName}
                            </p>
                            <p>{entry.pickupPhone}</p>
                            <p>{entry.pickupCompany}</p>
                            <p>Order ID: {entry.orderId || '-'}</p>
                            <p>City: {entry.pickupCity}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200/40">
                            <p className="uppercase tracking-[0.2em] text-slate-400">
                              Delivery
                            </p>
                            <p className="mt-2 font-semibold text-slate-900 truncate">
                              {entry.deliveryName}
                            </p>
                            <p>{entry.deliveryPhone}</p>
                            <p>City: {entry.deliveryCity}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                          <span>COD</span>
                          <span className="font-semibold text-slate-900">
                            Rs. {formatMoneyDecimal(entry.codAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </section>

                  <div className="mt-5 hidden sm:block rounded-2xl border border-slate-200 bg-slate-50/60">
                    <div className="max-h-[70vh] overflow-auto">
                      <table className="w-full min-w-[1150px] text-sm">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                          <tr className="text-left text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Tracking No</th>
                            <th className="px-4 py-3">Pickup Info</th>
                            <th className="px-4 py-3">Delivery Info</th>
                            <th className="px-4 py-3 text-center">Qty</th>
                            <th className="px-4 py-3">Pickup City</th>
                            <th className="px-4 py-3">Delivery City</th>
                            <th className="px-4 py-3">Weight</th>
                            <th className="px-4 py-3">COD Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {loadSheetEntries.map((entry) => (
                            <tr key={entry.trackingNo} className="hover:bg-slate-50">
                              <td className="px-4 py-4 text-slate-700 font-semibold">
                                {formatDateOnly(entry.date)}
                              </td>
                              <td className="px-4 py-4 font-semibold text-slate-900">
                                {entry.trackingNo}
                              </td>
                              <td className="px-4 py-4">
                                <div className="space-y-1 text-xs text-slate-600">
                                  <div>
                                    <span className="text-slate-400">Name:</span>{' '}
                                    <span className="inline-block max-w-[220px] align-top truncate whitespace-nowrap">
                                      {entry.pickupName}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Company:</span>{' '}
                                    {entry.pickupCompany}
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Phone:</span>{' '}
                                    {entry.pickupPhone}
                                  </div>
                                  <div>
                                    <span className="text-slate-400">
                                      Order ID:
                                    </span>{' '}
                                    {entry.orderId || '-'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="space-y-1 text-xs text-slate-600">
                                  <div>
                                    <span className="text-slate-400">Name:</span>{' '}
                                    <span className="inline-block max-w-[220px] align-top truncate whitespace-nowrap">
                                      {entry.deliveryName}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Phone:</span>{' '}
                                    {entry.deliveryPhone}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center text-slate-700">
                                {entry.qty}
                              </td>
                              <td className="px-4 py-4 text-slate-700">
                                {entry.pickupCity}
                              </td>
                              <td className="px-4 py-4 text-slate-700">
                                {entry.deliveryCity}
                              </td>
                              <td className="px-4 py-4 text-slate-700">
                                {formatWeight(entry.weightKg)} Kg
                              </td>
                              <td className="px-4 py-4 text-slate-700 whitespace-nowrap">
                                Rs. {formatMoneyDecimal(entry.codAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                    <span>
                      Showing 1 to {loadSheetEntries.length} of{' '}
                      {loadSheetEntries.length} entries
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500">
                        Previous
                      </button>
                      <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white">
                        1
                      </span>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500">
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'loadsheet_log' && (
                <>
                  <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Loading Sheet Log
                      </p>
                      <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 mt-2">
                        Assignment Log
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Track assigned load sheets and rider pickups.
                      </p>
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-4">
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Assignment No
                        </label>
                        <input
                          type="text"
                          placeholder="Assignment No"
                          className="mt-2 w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          From
                        </label>
                        <input
                          type="date"
                          defaultValue="2026-03-09"
                          className="mt-2 w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          To
                        </label>
                        <input
                          type="date"
                          defaultValue="2026-03-09"
                          className="mt-2 w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          className="btn-ripple w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 hover:bg-slate-800">
                          <Search className="h-4 w-4" />
                          Search
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.4)] backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>Show</span>
                        <select
                          defaultValue="10"
                          className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                        </select>
                        <span>entries</span>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search assignments"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200/70 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="w-full min-w-[720px] text-sm">
                        <thead className="bg-slate-50">
                          <tr className="text-left text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            <th className="px-4 py-3">Sr.No.</th>
                            <th className="px-4 py-3">Assignment No#</th>
                            <th className="px-4 py-3">Rider</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {loadSheetLogEntries.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-4 py-8 text-center text-sm text-slate-500">
                                No data available in table
                              </td>
                            </tr>
                          ) : (
                            loadSheetLogEntries.map((entry, index) => (
                              <tr key={entry.assignmentNo} className="hover:bg-slate-50">
                                <td className="px-4 py-4 text-slate-600">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-4 font-semibold text-slate-900">
                                  {entry.assignmentNo}
                                </td>
                                <td className="px-4 py-4 text-slate-600">
                                  {entry.rider}
                                </td>
                                <td className="px-4 py-4 text-slate-600">
                                  {formatDateOnly(entry.date)}
                                </td>
                                <td className="px-4 py-4 text-slate-600">
                                  {entry.action}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                      <span>Showing 0 to 0 of 0 entries</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500">
                          Previous
                        </button>
                        <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white">
                          1
                        </span>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500">
                          Next
                        </button>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {activeSection === 'shipper_advice' && (
                <>
                  <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Shipper Advice
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 mt-2">
                          Linehaul Advice Register
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                          Detailed advice slips for intercity movement.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-ripple inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50">
                        <Download className="h-4 w-4" />
                        Export Advice
                      </button>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>Show</span>
                        <select
                          defaultValue="10"
                          className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                        </select>
                        <span>entries</span>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search advice"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200/70 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="mt-5 grid gap-3 sm:hidden">
                    {shipperAdviceEntries.map((entry) => (
                      <div
                        key={entry.adviceNo}
                        className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Advice No
                            </p>
                            <p className="text-base font-semibold text-slate-900 mt-1">
                              {entry.adviceNo}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDateOnly(entry.date)}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${shipperAdviceBadge(
                              entry.status
                            )}`}>
                            {entry.status}
                          </span>
                        </div>
                        <div className="mt-3 text-xs text-slate-600 space-y-2">
                          <div>
                            <span className="text-slate-400">Shipper:</span>{' '}
                            {entry.shipper}
                          </div>
                          <div>
                            <span className="text-slate-400">Route:</span>{' '}
                            {entry.origin} → {entry.destination}
                          </div>
                          <div className="flex items-center justify-between text-sm text-slate-700">
                            <span>Shipments: {entry.shipments}</span>
                            <span>{formatWeight(entry.weightKg)} Kg</span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-slate-700">
                            <span>COD</span>
                            <span className="font-semibold text-slate-900">
                              Rs. {formatMoneyDecimal(entry.codAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </section>

                  <div className="mt-5 hidden sm:block rounded-2xl border border-slate-200 bg-slate-50/60">
                    <div className="max-h-[70vh] overflow-auto">
                      <table className="w-full min-w-[1050px] text-sm">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                          <tr className="text-left text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            <th className="px-4 py-3">Advice No</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Shipper</th>
                            <th className="px-4 py-3">Origin</th>
                            <th className="px-4 py-3">Destination</th>
                            <th className="px-4 py-3 text-center">Shipments</th>
                            <th className="px-4 py-3">Weight</th>
                            <th className="px-4 py-3">COD Amount</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {shipperAdviceEntries.map((entry) => (
                            <tr key={entry.adviceNo} className="hover:bg-slate-50">
                              <td className="px-4 py-4 font-semibold text-slate-900">
                                {entry.adviceNo}
                              </td>
                              <td className="px-4 py-4 text-slate-700">
                                {formatDateOnly(entry.date)}
                              </td>
                              <td className="px-4 py-4 text-slate-700">
                                {entry.shipper}
                              </td>
                              <td className="px-4 py-4 text-slate-700">
                                {entry.origin}
                              </td>
                              <td className="px-4 py-4 text-slate-700">
                                {entry.destination}
                              </td>
                              <td className="px-4 py-4 text-center text-slate-700">
                                {entry.shipments}
                              </td>
                              <td className="px-4 py-4 text-slate-700">
                                {formatWeight(entry.weightKg)} Kg
                              </td>
                              <td className="px-4 py-4 text-slate-700 whitespace-nowrap">
                                Rs. {formatMoneyDecimal(entry.codAmount)}
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${shipperAdviceBadge(
                                    entry.status
                                  )}`}>
                                  {entry.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                    <span>
                      Showing 1 to {shipperAdviceEntries.length} of{' '}
                      {shipperAdviceEntries.length} entries
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500">
                        Previous
                      </button>
                      <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white">
                        1
                      </span>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500">
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'track' && (
                <>
                  <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Track Your Deliveries
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 mt-2">
                          Live Shipment Tracking
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                          Search by tracking number to view real-time movement.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-ripple inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50">
                        <Eye className="h-4 w-4" />
                        Open Tracker
                      </button>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-3">
                      <div className="lg:col-span-2 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Tracking Lookup
                        </p>
                        <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr_1fr_auto]">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Enter tracking number"
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200/70 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Receiver phone (optional)"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200/70 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            className="btn-ripple inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 hover:bg-slate-800">
                            <Search className="h-4 w-4" />
                            Track
                          </button>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
                            Tip: paste multiple IDs separated by comma.
                          </span>
                          <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
                            Latest updates every 15 minutes.
                          </span>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                          Tracking Snapshot
                        </p>
                        <div className="mt-4 space-y-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span>Total Shipments</span>
                            <span className="font-semibold">{totalOrders}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Delivered</span>
                            <span className="font-semibold">{deliveredOrders}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>In Transit</span>
                            <span className="font-semibold">{inTransitOrders}</span>
                          </div>
                        </div>
                        <div className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-xs text-white/80">
                          Track from pickup to doorstep with one view.
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="mt-5 grid gap-3 sm:hidden">
                    {sortedBookings.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                        No shipments to track yet.
                      </div>
                    ) : (
                      sortedBookings.slice(0, 8).map((booking) => {
                        const lastUpdate =
                          booking.statusHistory?.[
                            booking.statusHistory.length - 1
                          ]?.at ?? booking.createdAt;
                        return (
                          <div
                            key={booking.trackingId}
                            className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                  Tracking
                                </p>
                                <p className="text-base font-semibold text-slate-900 mt-1">
                                  {booking.trackingId}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {formatDateTime(lastUpdate)}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
                                  booking.status
                                )}`}>
                                {statusLabel(booking.status)}
                              </span>
                            </div>
                            <div className="mt-3 text-xs text-slate-600">
                              <div>
                                <span className="text-slate-400">Receiver:</span>{' '}
                                {booking.receiverName || '-'}
                              </div>
                              <div>
                                <span className="text-slate-400">City:</span>{' '}
                                {booking.receiverCity || '-'}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleViewBooking(booking.trackingId)}
                              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                              View Tracking
                              <ArrowUpRight className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </section>

                  <div className="mt-5 hidden sm:block rounded-2xl border border-slate-200 bg-slate-50/60">
                    <div className="max-h-[70vh] overflow-auto">
                      <table className="w-full min-w-[980px] text-sm">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                          <tr className="text-left text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            <th className="px-4 py-3">Tracking No</th>
                            <th className="px-4 py-3">Receiver</th>
                            <th className="px-4 py-3">City</th>
                            <th className="px-4 py-3">Last Update</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {sortedBookings.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-8 text-center text-sm text-slate-500">
                                No shipments to track yet.
                              </td>
                            </tr>
                          ) : (
                            sortedBookings.slice(0, 12).map((booking) => {
                              const lastUpdate =
                                booking.statusHistory?.[
                                  booking.statusHistory.length - 1
                                ]?.at ?? booking.createdAt;
                              return (
                                <tr key={booking.trackingId} className="hover:bg-slate-50">
                                  <td className="px-4 py-4 font-semibold text-slate-900">
                                    {booking.trackingId}
                                  </td>
                                  <td className="px-4 py-4 text-slate-700">
                                    {booking.receiverName || '-'}
                                  </td>
                                  <td className="px-4 py-4 text-slate-700">
                                    {booking.receiverCity || '-'}
                                  </td>
                                  <td className="px-4 py-4 text-slate-600">
                                    {formatDateTime(lastUpdate)}
                                  </td>
                                  <td className="px-4 py-4">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
                                        booking.status
                                      )}`}>
                                      {statusLabel(booking.status)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleViewBooking(booking.trackingId)
                                      }
                                      className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-900">
                                      View
                                      <ArrowUpRight className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'edit_profile' && (
                <>
                  <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Edit Profile
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 mt-2">
                          Update Your Account Details
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                          Keep your email and contact info accurate for login and delivery updates.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span
                          className={`px-3 py-1 rounded-full ${
                            auth.currentUser?.emailVerified
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                          {auth.currentUser?.emailVerified
                            ? 'Email Verified'
                            : 'Email Pending'}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="grid gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-8 space-y-6">
                      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Company Details
                        </p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Company Name
                            </label>
                            <input
                              name="companyName"
                              value={profileForm.companyName}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Legal Name
                            </label>
                            <input
                              name="companyLegalName"
                              value={profileForm.companyLegalName}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Business Type
                            </label>
                            <select
                              name="businessType"
                              value={profileForm.businessType}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}>
                              <option value="">Select business type</option>
                              {BUSINESS_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Website
                            </label>
                            <input
                              name="website"
                              value={profileForm.website}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Contact Details
                        </p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Contact Name
                            </label>
                            <input
                              name="contactName"
                              value={profileForm.contactName}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Phone
                            </label>
                            <input
                              name="phone"
                              value={profileForm.phone}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Alternate Phone
                            </label>
                            <input
                              name="altPhone"
                              value={profileForm.altPhone}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Login Email
                            </label>
                            <input
                              name="email"
                              value={profileForm.email}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Address
                            </label>
                            <input
                              name="address"
                              value={profileForm.address}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Shipping Details
                        </p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              City
                            </label>
                            <select
                              name="city"
                              value={profileForm.city}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}>
                              <option value="">Select city</option>
                              {SERVICE_CITIES.map((city) => (
                                <option key={city} value={city}>
                                  {city}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Pickup Timings
                            </label>
                            <input
                              name="pickupTimings"
                              value={profileForm.pickupTimings}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Monthly Shipments
                            </label>
                            <input
                              name="monthlyShipment"
                              value={profileForm.monthlyShipment}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              CNIC
                            </label>
                            <input
                              name="cnic"
                              value={profileForm.cnic}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Special Instructions
                            </label>
                            <textarea
                              name="specialInstructions"
                              value={profileForm.specialInstructions}
                              onChange={handleProfileChange}
                              rows={3}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Google Map Pin
                            </label>
                            <input
                              name="googleMapPin"
                              value={profileForm.googleMapPin}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Bank Details
                        </p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Bank Name
                            </label>
                            <input
                              name="bankName"
                              value={profileForm.bankName}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Account Title
                            </label>
                            <input
                              name="accountTitle"
                              value={profileForm.accountTitle}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Account Number
                            </label>
                            <input
                              name="accountNumber"
                              value={profileForm.accountNumber}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              IBAN
                            </label>
                            <input
                              name="iban"
                              value={profileForm.iban}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Swift Code
                            </label>
                            <input
                              name="swiftCode"
                              value={profileForm.swiftCode}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Branch Name
                            </label>
                            <input
                              name="branchName"
                              value={profileForm.branchName}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Branch Code
                            </label>
                            <input
                              name="branchCode"
                              value={profileForm.branchCode}
                              onChange={handleProfileChange}
                              className={`${profileInput} mt-2`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Login Email Status
                        </p>
                        <p className="text-sm text-slate-700 mt-3">
                          {auth.currentUser?.email || profileForm.email || '-'}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {auth.currentUser?.emailVerified ? (
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                              Verified
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                              Verification Required
                            </span>
                          )}
                          {!auth.currentUser?.emailVerified && (
                            <button
                              type="button"
                              onClick={handleSendVerification}
                              className="text-xs font-semibold text-slate-700 underline underline-offset-4">
                              Send Verification Email
                            </button>
                          )}
                        </div>
                        {profileEmailNotice && (
                          <p className="mt-3 text-xs text-slate-500">
                            {profileEmailNotice}
                          </p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-5 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                          Update Password
                        </p>
                        <div className="mt-4 space-y-3">
                          <input
                            type="password"
                            value={newAccountPassword}
                            onChange={(e) => {
                              setNewAccountPassword(e.target.value);
                              setAccountPasswordError('');
                              setAccountPasswordSuccess('');
                            }}
                            placeholder="New password"
                            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
                          />
                          <input
                            type="password"
                            value={confirmAccountPassword}
                            onChange={(e) => {
                              setConfirmAccountPassword(e.target.value);
                              setAccountPasswordError('');
                              setAccountPasswordSuccess('');
                            }}
                            placeholder="Confirm password"
                            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
                          />
                          {accountPasswordError && (
                            <p className="text-xs text-rose-200">
                              {accountPasswordError}
                            </p>
                          )}
                          {accountPasswordSuccess && (
                            <p className="text-xs text-emerald-200">
                              {accountPasswordSuccess}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={handlePasswordUpdate}
                            className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition">
                            Save new password
                          </button>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Save Updates
                        </p>
                        <button
                          type="button"
                          onClick={handleProfileSave}
                          disabled={profileSaving}
                          className={`mt-4 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                            profileSaving
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}>
                          {profileSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                        {profileError && (
                          <p className="mt-3 text-xs text-rose-600">
                            {profileError}
                          </p>
                        )}
                        {profileSuccess && (
                          <p className="mt-3 text-xs text-emerald-600">
                            {profileSuccess}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>
                </>
              )}

              {activeSection === 'payments' && (
                <>
                  <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Payment History
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 mt-2">
                          COD Settlement Overview
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                          Track delivery status, COD totals, and settlements.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-ripple inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50">
                        <Download className="h-4 w-4" />
                        Export History
                      </button>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        {
                          label: 'Total COD',
                          value: `Rs. ${formatMoney(paymentTotals.total)}`
                        },
                        {
                          label: 'Received',
                          value: `Rs. ${formatMoney(paymentTotals.received)}`
                        },
                        {
                          label: 'Pending',
                          value: `Rs. ${formatMoney(paymentTotals.pending)}`
                        },
                        {
                          label: 'COD Shipments',
                          value: paymentBookings.length
                        }
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-2xl bg-white border border-slate-200/60 p-4 shadow-sm">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            {stat.label}
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-2">
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>Show</span>
                        <select
                          defaultValue="10"
                          className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                        </select>
                        <span>entries</span>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search payments"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200/70 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="mt-5 grid gap-3 sm:hidden">
                    {paymentBookings.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                        No COD payment history yet.
                      </div>
                    ) : (
                      paymentBookings.slice(0, 8).map((booking) => {
                        const paymentDate = getPaymentDate(booking);
                        const codValue = Number(booking.codAmount || 0);
                        return (
                          <div
                            key={booking.trackingId}
                            className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                  Tracking
                                </p>
                                <p className="text-base font-semibold text-slate-900 mt-1">
                                  {booking.trackingId}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {formatDateOnly(paymentDate)}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
                                  booking.status
                                )}`}>
                                {getPaymentStatusLabel(booking)}
                              </span>
                            </div>
                            <div className="mt-3 text-xs text-slate-600 space-y-1">
                              <div>
                                <span className="text-slate-400">Receiver:</span>{' '}
                                {booking.receiverName || '-'}
                              </div>
                              <div>
                                <span className="text-slate-400">City:</span>{' '}
                                {booking.receiverCity || '-'}
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                              <span>COD</span>
                              <span className="font-semibold text-slate-900">
                                Rs. {formatMoney(Number.isNaN(codValue) ? 0 : codValue)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleViewBooking(booking.trackingId)}
                              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                              View Tracking
                              <ArrowUpRight className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </section>

                  <div className="mt-5 hidden sm:block rounded-2xl border border-slate-200 bg-slate-50/60">
                    <div className="max-h-[70vh] overflow-auto">
                      <table className="w-full min-w-[1050px] text-sm">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                          <tr className="text-left text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            <th className="px-4 py-3">Payment Date</th>
                            <th className="px-4 py-3">Tracking No</th>
                            <th className="px-4 py-3">Receiver</th>
                            <th className="px-4 py-3">City</th>
                            <th className="px-4 py-3">COD Amount</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Last Update</th>
                            <th className="px-4 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {paymentBookings.length === 0 ? (
                            <tr>
                              <td
                                colSpan={8}
                                className="px-4 py-8 text-center text-sm text-slate-500">
                                No COD payment history yet.
                              </td>
                            </tr>
                          ) : (
                            paymentBookings.slice(0, 12).map((booking) => {
                              const paymentDate = getPaymentDate(booking);
                              const lastUpdate =
                                booking.statusHistory?.[
                                  booking.statusHistory.length - 1
                                ]?.at ?? booking.createdAt;
                              const codValue = Number(booking.codAmount || 0);
                              return (
                                <tr key={booking.trackingId} className="hover:bg-slate-50">
                                  <td className="px-4 py-4 text-slate-700 font-semibold">
                                    {formatDateOnly(paymentDate)}
                                  </td>
                                  <td className="px-4 py-4 font-semibold text-slate-900">
                                    {booking.trackingId}
                                  </td>
                                  <td className="px-4 py-4 text-slate-700">
                                    {booking.receiverName || '-'}
                                  </td>
                                  <td className="px-4 py-4 text-slate-700">
                                    {booking.receiverCity || '-'}
                                  </td>
                                  <td className="px-4 py-4 text-slate-700 whitespace-nowrap">
                                    Rs. {formatMoney(Number.isNaN(codValue) ? 0 : codValue)}
                                  </td>
                                  <td className="px-4 py-4">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
                                        booking.status
                                      )}`}>
                                      {getPaymentStatusLabel(booking)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-slate-600">
                                    {formatDateTime(lastUpdate)}
                                  </td>
                                  <td className="px-4 py-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleViewBooking(booking.trackingId)}
                                      className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-900">
                                      View
                                      <ArrowUpRight className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                    <span>
                      Showing 1 to {Math.min(12, paymentBookings.length)} of{' '}
                      {paymentBookings.length} entries
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500">
                        Previous
                      </button>
                      <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white">
                        1
                      </span>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500">
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'support' && (
                <section className="max-w-3xl mx-auto rounded-[28px] border border-slate-200/70 bg-white/90 p-6 sm:p-8 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Complaints
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-semibold text-slate-800 mt-2">
                      Submit Complaint
                    </h3>
                  </div>

                  <form
                    className="mt-6 space-y-4"
                    onSubmit={handleFeedbackSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Priority
                        </label>
                        <select
                          name="priority"
                          value={feedbackForm.priority}
                          onChange={handleFeedbackChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Subject *
                        </label>
                        <input
                          name="subject"
                          value={feedbackForm.subject}
                          onChange={handleFeedbackChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. Delay in pickup" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Contact Email
                      </label>
                      <input
                        value={loginAccount?.email || ''}
                        readOnly
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Complaint Details *
                      </label>
                      <textarea
                        name="message"
                        value={feedbackForm.message}
                        onChange={handleFeedbackChange}
                        rows={5}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Write full details so our team can resolve quickly." />
                    </div>

                    {feedbackError && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {feedbackError}
                      </div>
                    )}
                    {feedbackSuccess && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {feedbackSuccess}
                        {feedbackTicketId && (
                          <span className="ml-2 font-semibold">
                            Ticket: {feedbackTicketId}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={feedbackSubmitting}
                        className="btn-ripple inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70">
                        {feedbackSubmitting ? 'Submitting...' : 'Submit Complaint'}
                      </button>
                      <span className="text-xs text-slate-500">
                        We will contact you on your registered phone/email.
                      </span>
                    </div>
                  </form>
                </section>
              )}

              {activeSection === 'reports' && (
                <section className="grid gap-6 lg:grid-cols-12">
                  <div className="lg:col-span-8 rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Monthly Analytics
                        </p>
                        <p className="text-xs text-slate-500">
                          Shipments & revenue performance
                        </p>
                      </div>
                      <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-500">
                        {(['weekly', 'monthly', 'yearly'] as const).map(
                          (mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setChartMode(mode)}
                              className={`px-3 py-1 rounded-full transition ${
                                chartMode === mode
                                  ? 'bg-slate-900 text-white'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}>
                              {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.1)_1px,transparent_1px)] bg-[size:20%_100%]" />
                      <div className="relative h-56 flex items-end gap-3">
                        {chartEmpty
                          ? chartData.map((item) => (
                              <div
                                key={item.key}
                                className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full h-16 rounded-full bg-slate-200/70 animate-pulse" />
                                <span className="text-xs text-slate-400">
                                  {item.label}
                                </span>
                              </div>
                            ))
                          : chartData.map((item) => (
                              <div
                                key={item.key}
                                className="flex-1 flex flex-col items-center gap-2">
                                <div
                                  className="w-full rounded-full bg-gradient-to-t from-blue-500/80 to-blue-200"
                                  style={{
                                    height: `${Math.max(
                                      12,
                                      (item.shipments / maxShipments) * 180
                                    )}px`
                                  }}
                                />
                                <span className="text-xs text-slate-500">
                                  {item.label}
                                </span>
                              </div>
                            ))}
                        {!chartEmpty && (
                          <svg
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            className="absolute inset-0">
                            <polyline
                              fill="none"
                              stroke="rgba(56,189,248,0.9)"
                              strokeWidth="2"
                              points={revenueLinePoints}
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 grid gap-4">
                    <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.3)]">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Shipment Performance
                      </p>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm text-slate-600">
                          <span>Delivery Success</span>
                          <span className="font-semibold text-slate-900">
                            {performanceScore}%
                          </span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                            style={{ width: `${performanceScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.3)]">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        COD Balance
                      </p>
                      <p className="text-2xl font-black text-slate-900 mt-3">
                        Rs. {formatMoney(codBalance)}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Total COD collected to date
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.3)]">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Pickup Schedule
                      </p>
                      <p className="text-sm text-slate-600 mt-3">
                        Next pickup window
                      </p>
                      <p className="text-lg font-semibold text-slate-900 mt-1">
                        {loginAccount.pickupTimings || '12:00 PM - 6:00 PM'}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {activeSection === 'dashboard' && (
                <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xl sm:text-2xl font-semibold text-slate-800">
                        Recent Orders
                      </p>
                      <p className="text-base sm:text-lg text-slate-500">
                        Latest activity across your account
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection('orders')}
                      className="text-base sm:text-lg font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-4 decoration-orange-200/80">
                      View all
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3 sm:hidden">
                    {sortedBookings.slice(0, 6).map((booking) => (
                      <div
                        key={booking.trackingId}
                        className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Tracking
                            </p>
                            <p className="text-base font-semibold text-slate-900 mt-1">
                              {booking.trackingId}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDateTime(booking.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
                              booking.status
                            )}`}>
                            {statusLabel(booking.status)}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                          <span>Amount</span>
                          <span className="font-semibold text-slate-900">
                            Rs. {formatMoney(booking.shippingCharge || 0)}
                          </span>
                        </div>
                        <button className="mt-3 w-full inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                          Details
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {sortedBookings.length === 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                        No parcels booked yet. Start by booking your first shipment.
                      </div>
                    )}
                  </div>

                  <div className="mt-5 hidden sm:block overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm sm:text-base">
                      <thead>
                        <tr className="text-left text-slate-400 text-xs sm:text-sm uppercase tracking-[0.2em]">
                          <th className="pb-3">Tracking</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedBookings.slice(0, 6).map((booking) => (
                          <tr
                            key={booking.trackingId}
                            className="hover:bg-slate-50">
                            <td className="py-3 sm:py-4 font-semibold text-slate-900">
                              {booking.trackingId}
                            </td>
                            <td className="py-3 sm:py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${statusBadge(
                                  booking.status
                                )}`}>
                                {statusLabel(booking.status)}
                              </span>
                            </td>
                            <td className="py-3 sm:py-4 text-slate-600">
                              Rs. {formatMoney(booking.shippingCharge || 0)}
                            </td>
                            <td className="py-3 sm:py-4 text-slate-600">
                              {formatDateTime(booking.createdAt)}
                            </td>
                            <td className="py-3 sm:py-4 text-right">
                              <button className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-900">
                                Details
                                <ArrowUpRight className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {sortedBookings.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-6 text-center text-base sm:text-lg text-slate-500">
                              No parcels booked yet. Start by booking your first
                              shipment.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activeSection === 'orders' && (
                <>
                  <section className="grid gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-12 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                      {[
                        {
                          label: 'Total Orders',
                          value: totalOrders,
                          icon: Package
                        },
                        {
                          label: 'Pending Approval',
                          value: statusCounts.pending,
                          icon: Bell
                        },
                        {
                          label: 'Confirmed',
                          value: statusCounts.confirmed,
                          icon: Package
                        },
                        {
                          label: 'In Transit',
                          value: statusCounts.in_transit,
                          icon: Truck
                        },
                        {
                          label: 'Out for Delivery',
                          value: statusCounts.out_for_delivery,
                          icon: Truck
                        },
                        {
                          label: 'Delivered',
                          value: deliveredOrders,
                          icon: PackageCheck
                        },
                        {
                          label: 'Delivery Rejected',
                          value: statusCounts.delivery_rejected,
                          icon: X
                        },
                        {
                          label: 'Payment Received',
                          value: statusCounts.payment_received,
                          icon: Wallet
                        },
                        {
                          label: 'Pending COD',
                          value: pendingPayments,
                          icon: Bell
                        },
                        {
                          label: 'Total Spent',
                          value: `Rs. ${formatMoney(totalSpent)}`,
                          icon: BarChart3
                        }
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-2xl bg-gradient-to-br from-white via-white to-slate-50 shadow-sm p-5 border border-slate-200/40 transition hover:-translate-y-0.5 hover:shadow-md">
                          <div className="h-10 w-10 rounded-2xl bg-slate-900/5 ring-1 ring-slate-200/60 flex items-center justify-center">
                            <stat.icon className="h-5 w-5 text-slate-700" />
                          </div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mt-3">
                            {stat.label}
                          </p>
                          <p className="text-2xl font-semibold text-slate-900 mt-1">
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[26px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.4)] backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-2xl font-semibold text-slate-800">
                          All Orders
                        </p>
                        <p className="text-lg text-slate-500">
                          Showing {sortedBookings.length} shipments
                        </p>
                      </div>
                      {canBookParcels ? (
                        <Link
                          to="/book"
                          className="text-lg font-semibold text-orange-600 hover:text-orange-700">
                          Book new
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-slate-400">
                          Booking locked
                        </span>
                      )}
                    </div>

                    <div className="mt-6 sticky top-4 z-10">
                      <div className="rounded-2xl bg-white/90 backdrop-blur border border-slate-200/60 px-4 py-3 shadow-sm">
                        <div className="grid gap-3 md:grid-cols-4">
                          <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search tracking, receiver, city"
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200/70 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <select className="px-3 py-2.5 rounded-xl border border-slate-200/70 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="all">All Status</option>
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status.key} value={status.key}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" />
                        </div>
                      </div>
                    </div>

                    {sortedBookings.length === 0 ? (
                      <div className="mt-6 rounded-2xl border border-slate-200/60 bg-slate-50/70 p-8 text-center text-slate-500">
                        <div className="mx-auto h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400">
                          <FileText className="h-6 w-6" />
                        </div>
                        <p className="mt-4 text-lg font-semibold text-slate-700">
                          No orders yet
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          When you create a shipment, it will appear here with live status
                          updates from the admin team.
                        </p>
                      </div>
                    ) : (
                      <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {sortedBookings.map((booking) => {
                          const lastUpdate =
                            booking.statusHistory?.[
                              booking.statusHistory.length - 1
                            ]?.at ?? booking.createdAt;
                          const codValue = Number(booking.codAmount || 0);
                          const totalAmount = booking.shippingCharge || 0;
                          return (
                            <div
                              key={booking.trackingId}
                              className="group rounded-2xl bg-white border border-slate-200/60 p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1 space-y-5">
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                  <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-slate-400">
                                    Tracking ID
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 break-words">
                                      {booking.trackingId}
                                    </h3>
                                    <button
                                      onClick={() =>
                                        handleCopyTracking(booking.trackingId)
                                      }
                                      className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                                      <Clipboard className="w-4 h-4" />
                                      {copiedTrackingId === booking.trackingId
                                        ? 'Copied'
                                        : 'Copy'}
                                    </button>
                                  </div>
                                  <p className="text-sm sm:text-base text-slate-600 mt-2 break-words">
                                    {booking.senderCity} →{' '}
                                    {booking.receiverCity}
                                  </p>
                                  <div className="mt-2 text-sm text-slate-500">
                                    Created {formatDateTime(booking.createdAt)}
                                  </div>
                                  <div className="text-sm text-slate-500">
                                    Updated {formatDateTime(lastUpdate)}
                                  </div>
                                </div>
                                <div className="flex w-full sm:w-auto flex-col items-start sm:items-end gap-2">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${statusBadge(
                                      booking.status
                                    )}`}>
                                    {statusLabel(booking.status)}
                                  </span>
                                  <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleViewBooking(booking.trackingId)
                                      }
                                      className="inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200">
                                      <Eye className="h-3.5 w-3.5" />
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDownloadBooking(booking)
                                      }
                                      className="inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200">
                                      <Download className="h-3.5 w-3.5" />
                                      Download
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2 text-sm">
                                <div className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-200/40 break-words">
                                  <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-slate-400">
                                    Sender
                                  </p>
                                  <h3 className="text-base font-semibold text-slate-900 mt-2">
                                    {booking.senderName || '-'}
                                  </h3>
                                  <p className="text-sm text-slate-500">
                                    {booking.senderPhone || '-'}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    {booking.senderAddress || '-'}
                                  </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-200/40 break-words">
                                  <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-slate-400">
                                    Receiver
                                  </p>
                                  <h3 className="text-base font-semibold text-slate-900 mt-2">
                                    {booking.receiverName || '-'}
                                  </h3>
                                  <p className="text-sm text-slate-500">
                                    {booking.receiverPhone || '-'}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    {booking.receiverAddress || '-'}
                                  </p>
                                </div>
                              </div>

                              <div className="grid gap-3 grid-cols-2 md:grid-cols-4 text-sm">
                                <div className="rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-200/40 break-words">
                                  <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-slate-400">
                                    Service
                                  </p>
                                  <h3 className="text-base font-semibold text-slate-900 mt-2">
                                    {booking.serviceTitle}
                                  </h3>
                                </div>
                                <div className="rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-200/40 break-words">
                                  <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-slate-400">
                                    Weight
                                  </p>
                                  <h3 className="text-base font-semibold text-slate-900 mt-2">
                                    {booking.weightKg.toFixed(3)} kg
                                  </h3>
                                </div>
                                <div className="rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-200/40 break-words">
                                  <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-slate-400">
                                    COD
                                  </p>
                                  <h3 className="text-base font-semibold text-slate-900 mt-2">
                                    {codValue > 0
                                      ? `Rs. ${formatMoney(codValue)}`
                                      : 'Rs. 0'}
                                  </h3>
                                </div>
                                <div className="rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-200/40 break-words">
                                  <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-slate-400">
                                    Total
                                  </p>
                                  <h3 className="text-base font-semibold text-slate-900 mt-2">
                                    Rs. {formatMoney(totalAmount)}
                                  </h3>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                                <h3 className="text-slate-700 text-base font-semibold break-words">
                                  Delivery Code{' '}
                                  <span className="font-semibold text-slate-900">
                                    {booking.deliveryCode}
                                  </span>
                                </h3>
                                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                  Status updated by admin
                                </div>
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
                </>
              )}

              {activeSection === 'wallet' && (
                <>
                  <section className="grid gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          label: 'Available Balance',
                          value: `Rs. ${formatMoney(walletBalance)}`,
                          icon: Wallet
                        },
                        {
                          label: 'COD Balance',
                          value: `Rs. ${formatMoney(codBalance)}`,
                          icon: Package
                        },
                        {
                          label: 'Total Spent',
                          value: `Rs. ${formatMoney(totalSpent)}`,
                          icon: BarChart3
                        },
                        {
                          label: 'Pending COD',
                          value: pendingPayments,
                          icon: Bell
                        }
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-2xl bg-white shadow-sm p-5 border border-slate-200/60">
                          <div className="h-10 w-10 rounded-2xl bg-slate-900/5 flex items-center justify-center">
                            <stat.icon className="h-5 w-5 text-slate-700" />
                          </div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mt-3">
                            {stat.label}
                          </p>
                          <p className="text-2xl font-semibold text-slate-900 mt-1">
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xl sm:text-2xl font-semibold text-slate-800">
                          Wallet Activity
                        </p>
                        <p className="text-base sm:text-lg text-slate-500">
                          Latest charges & COD collections
                        </p>
                      </div>
                      <button className="text-base sm:text-lg font-semibold text-orange-600 hover:text-orange-700">
                        Export
                      </button>
                    </div>

                    <div className="mt-5 grid gap-3 sm:hidden">
                      {sortedBookings.map((booking) => {
                        const codValue = Number(booking.codAmount || 0);
                        return (
                          <div
                            key={booking.trackingId}
                            className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                  Tracking
                                </p>
                                <p className="text-base font-semibold text-slate-900 mt-1">
                                  {booking.trackingId}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {formatDateTime(booking.createdAt)}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
                                  booking.status
                                )}`}>
                                {statusLabel(booking.status)}
                              </span>
                            </div>
                            <div className="mt-3 space-y-2 text-sm text-slate-600">
                              <div className="flex items-center justify-between">
                                <span>Shipping</span>
                                <span className="font-semibold text-slate-900">
                                  Rs. {formatMoney(booking.shippingCharge || 0)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>COD</span>
                                <span className="font-semibold text-slate-900">
                                  Rs. {formatMoney(Number.isNaN(codValue) ? 0 : codValue)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {sortedBookings.length === 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                          No wallet activity yet. Book a shipment to generate charges.
                        </div>
                      )}
                    </div>

                    <div className="mt-5 hidden sm:block overflow-x-auto">
                      <table className="w-full min-w-[720px] text-sm sm:text-base">
                        <thead>
                          <tr className="text-left text-slate-400 text-xs sm:text-sm uppercase tracking-[0.2em]">
                            <th className="pb-3">Tracking</th>
                            <th className="pb-3">Shipping</th>
                            <th className="pb-3">COD</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sortedBookings.map((booking) => {
                            const codValue = Number(booking.codAmount || 0);
                            return (
                              <tr
                                key={booking.trackingId}
                                className="hover:bg-slate-50">
                                <td className="py-3 sm:py-4 font-semibold text-slate-900">
                                  {booking.trackingId}
                                </td>
                                <td className="py-3 sm:py-4 text-slate-600">
                                  Rs.{' '}
                                  {formatMoney(booking.shippingCharge || 0)}
                                </td>
                                <td className="py-3 sm:py-4 text-slate-600">
                                  Rs. {formatMoney(Number.isNaN(codValue) ? 0 : codValue)}
                                </td>
                                <td className="py-3 sm:py-4">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${statusBadge(
                                      booking.status
                                    )}`}>
                                    {statusLabel(booking.status)}
                                  </span>
                                </td>
                                <td className="py-3 sm:py-4 text-slate-600">
                                  {formatDateTime(booking.createdAt)}
                                </td>
                              </tr>
                            );
                          })}
                          {sortedBookings.length === 0 && (
                            <tr>
                              <td
                                colSpan={5}
                                className="py-6 text-center text-base sm:text-lg text-slate-500">
                                No wallet activity yet. Book a shipment to
                                generate charges.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}

              {activeSection === 'settings' && (
                <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-600 font-semibold text-2xl">
                    Company Info
                  </div>
                    <div className="flex items-center gap-2">
                      <button className="text-slate-400 hover:text-slate-600">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSection('company')}
                        className="text-slate-400 hover:text-slate-600">
                        {collapsedSections.company ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                {!collapsedSections.company && (
                  <div className="mt-4 text-lg text-slate-600 space-y-2">
                    <p className="font-semibold text-slate-900">
                      {loginAccount.companyName || '-'}
                    </p>
                      <p>{loginAccount.companyLegalName || '-'}</p>
                      <p>{loginAccount.businessType || '-'}</p>
                      <p>{loginAccount.website || '-'}</p>
                    </div>
                  )}
                </div>

              <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-violet-600 font-semibold text-2xl">
                    Contact Info
                  </div>
                    <div className="flex items-center gap-2">
                      <button className="text-slate-400 hover:text-slate-600">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSection('contact')}
                        className="text-slate-400 hover:text-slate-600">
                        {collapsedSections.contact ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                {!collapsedSections.contact && (
                  <div className="mt-4 text-lg text-slate-600 space-y-2">
                    <p className="font-semibold text-slate-900">
                      {loginAccount.contactName || '-'}
                    </p>
                      <p>{loginAccount.phone || '-'}</p>
                      <p>{loginAccount.altPhone || '-'}</p>
                      <p>{loginAccount.email || '-'}</p>
                      <p>{loginAccount.address || '-'}</p>
                    </div>
                  )}
                </div>

              <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold text-2xl">
                    Bank Details
                  </div>
                    <div className="flex items-center gap-2">
                      <button className="text-slate-400 hover:text-slate-600">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSection('bank')}
                        className="text-slate-400 hover:text-slate-600">
                        {collapsedSections.bank ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                {!collapsedSections.bank && (
                  <div className="mt-4 text-lg text-slate-600 space-y-2">
                    <p>Bank: {loginAccount.bankName || '-'}</p>
                    <p>Title: {loginAccount.accountTitle || '-'}</p>
                    <p>Account: {loginAccount.accountNumber || '-'}</p>
                      <p>IBAN: {loginAccount.iban || '-'}</p>
                      <p>Swift: {loginAccount.swiftCode || '-'}</p>
                      <p>
                        Branch: {loginAccount.branchName || '-'}{' '}
                        {loginAccount.branchCode || ''}
                      </p>
                    </div>
                  )}
                </div>

              <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-600 font-semibold text-2xl">
                    Shipping Info
                  </div>
                    <div className="flex items-center gap-2">
                      <button className="text-slate-400 hover:text-slate-600">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSection('shipping')}
                        className="text-slate-400 hover:text-slate-600">
                        {collapsedSections.shipping ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                {!collapsedSections.shipping && (
                  <div className="mt-4 text-lg text-slate-600 space-y-2">
                    <p>City: {loginAccount.city || '-'}</p>
                    <p>Pickup: {loginAccount.pickupTimings || '-'}</p>
                    <p>Monthly: {loginAccount.monthlyShipment || '-'}</p>
                      <p>Instructions: {loginAccount.specialInstructions || '-'}</p>
                      <p>Map Pin: {loginAccount.googleMapPin || '-'}</p>
                      <p>CNIC: {loginAccount.cnic || '-'}</p>
                    </div>
                  )}
                </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-4 sm:p-5 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="text-lg sm:text-2xl font-semibold">Credentials</div>
                    <button
                      type="button"
                      onClick={() => toggleSection('credentials')}
                      className="text-white/60 hover:text-white">
                      {collapsedSections.credentials ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                {!collapsedSections.credentials && (
                  <div className="mt-4 text-sm sm:text-lg text-white/80 space-y-2">
                    <p className="break-words">Email: {loginAccount.email || '-'}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <input
                          type={showAccountPassword ? 'text' : 'password'}
                          value="********"
                          readOnly
                          className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-white/10 text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowAccountPassword((prev) => !prev)
                          }
                          className="w-full sm:w-auto text-xs font-semibold text-white/70 hover:text-white">
                          {showAccountPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <input
                          type="password"
                          value={newAccountPassword}
                          onChange={(e) => {
                            setNewAccountPassword(e.target.value);
                            setAccountPasswordError('');
                            setAccountPasswordSuccess('');
                          }}
                          placeholder="New password"
                          className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                        <input
                          type="password"
                          value={confirmAccountPassword}
                          onChange={(e) => {
                            setConfirmAccountPassword(e.target.value);
                            setAccountPasswordError('');
                            setAccountPasswordSuccess('');
                          }}
                          placeholder="Confirm password"
                          className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                      </div>
                      {accountPasswordError && (
                        <p className="text-sm text-rose-200">
                          {accountPasswordError}
                        </p>
                      )}
                      {accountPasswordSuccess && (
                        <p className="text-sm text-emerald-200">
                          {accountPasswordSuccess}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={handlePasswordUpdate}
                        className="mt-2 w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition">
                        Save new password
                      </button>
                    </div>
                  )}
                </div>
              </section>
              )}
            </main>
          </div>

        </div>
        </div>
      ) : (
        <>
          {!registerOnly && (
          <section className="py-14" ref={planRef}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Packages + Charges
                </p>
                <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mt-3">
                  COD Account
                </h1>
                <p className="text-base lg:text-lg text-slate-600 mt-4 max-w-2xl mx-auto">
                  Select a plan, then complete the registration form to open your COD account.
                </p>
              </div>

              <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {packages.map((pack) => {
                  const total = pack.base + pack.charges;
                  const isSelected = selectedPlan === pack.code;
                  return (
                    <div
                      key={pack.name}
                      className={`group relative bg-white rounded-3xl border shadow-[0_20px_50px_-32px_rgba(15,23,42,0.55)] overflow-hidden flex flex-col transform-gpu transition duration-300 hover:-translate-y-2 hover:shadow-[0_30px_70px_-40px_rgba(15,23,42,0.7)] ${
                        isSelected
                          ? 'border-orange-500 ring-2 ring-orange-200'
                          : 'border-slate-200'
                      }`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <div
                        className={`relative h-44 bg-gradient-to-br ${pack.accent} overflow-hidden`}>
                        <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute -bottom-12 -right-8 h-40 w-40 rounded-full bg-black/30 blur-3xl" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_55%)]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative h-20 w-20">
                            <div className="absolute inset-0 rounded-full border border-white/45 animate-pulse-ring" />
                            <div className="absolute -inset-3 rounded-full border border-white/25 border-dashed animate-spin [animation-duration:18s]" />
                            <div className="relative h-20 w-20 rounded-full bg-white/20 backdrop-blur border border-white/50 shadow-[inset_0_0_22px_rgba(255,255,255,0.35)] flex items-center justify-center">
                              <span className="text-white text-lg font-black tracking-[0.35em] ml-1">
                                {pack.code}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/90 drop-shadow">
                            {pack.name} Card
                          </span>
                        </div>
                      </div>
                      <div className="p-7 flex-1 flex flex-col gap-5">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                            Package
                          </p>
                          <h2 className="text-2xl font-black text-slate-900 mt-1">
                            {pack.name}
                          </h2>
                        </div>
                        <div className="grid gap-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Package Fee</span>
                            <span className="font-semibold text-slate-800">
                              Rs. {pack.base}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Card + Form Charges</span>
                            <span className="font-semibold text-slate-800">
                              Rs. {pack.charges}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                            <span className="text-slate-700 font-semibold">Total</span>
                            <span className="text-lg font-black text-slate-900">
                              Rs. {total}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePlanSelect(pack.code)}
                          className={`mt-auto w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors text-center ${
                            isSelected
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}>
                          {isSelected ? 'Selected' : 'Select Plan'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600">
                  {selectedPlanData ? (
                    <span>
                      Selected Plan:{' '}
                      <span className="font-semibold text-slate-900">
                        {selectedPlanData.name}
                      </span>{' '}
                      | Total:{' '}
                      <span className="font-semibold text-slate-900">
                        Rs. {selectedPlanData.base + selectedPlanData.charges}
                      </span>
                    </span>
                  ) : (
                    <span>Select a plan to continue.</span>
                  )}
                  {planError && (
                    <span className="block mt-2 text-sm text-red-500">
                      {planError}
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleProceedToRegistration}
                    disabled={!selectedPlan}
                    className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
                      selectedPlan
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}>
                    Proceed to Registration
                  </button>
                </div>
              </div>
            </div>
          </section>
          )}

          {registerOnly && (
          <section className="py-14" ref={registrationRef} id="registration">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.6)]">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">
                        Merchant Registration
                      </h2>
                      <p className="text-sm text-slate-600 mt-1">
                        Complete all steps. Required fields are marked with *.
                      </p>
                    </div>
                    {selectedPlanData && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-700">
                        <span className="font-semibold">Plan:</span>
                        <span>{selectedPlanData.name}</span>
                        <span className="text-orange-500">|</span>
                        <span className="font-semibold">
                          Rs. {selectedPlanData.base + selectedPlanData.charges}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {STEPS.map((label, index) => {
                      const isActive = index === currentStep;
                      const isDone = index < currentStep;
                      return (
                        <div
                          key={label}
                          className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors ${
                            isDone
                              ? 'border-emerald-200 bg-emerald-50'
                              : isActive
                              ? 'border-orange-200 bg-orange-50'
                              : 'border-slate-200 bg-slate-50'
                          }`}>
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold ${
                              isDone
                                ? 'bg-emerald-500 text-white'
                                : isActive
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                            {index + 1}
                          </div>
                          <div className="text-xs font-semibold text-slate-700">
                            {label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedPlan ? (
                <form className="p-6" onSubmit={handleSubmit}>
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-[0.2em]">
                      Company / Business Info
                    </h3>
                    <div className="mt-3 grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Company Name / Brand Name*
                        </label>
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          className={inputClass('companyName')}
                          placeholder="Your brand name"
                        />
                        {errors.companyName && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.companyName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Company Legal Name
                        </label>
                        <input
                          type="text"
                          name="companyLegalName"
                          value={formData.companyLegalName}
                          onChange={handleChange}
                          className={inputClass('companyLegalName')}
                          placeholder="Legal entity name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Business Type
                        </label>
                        <select
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleChange}
                          className={inputClass('businessType')}>
                          <option value="">Select type</option>
                          {BUSINESS_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Website / Facebook Page
                        </label>
                        <input
                          type="url"
                          name="website"
                          value={formData.website}
                          onChange={handleChange}
                          className={inputClass('website')}
                          placeholder="https://"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-[0.2em]">
                      Contact Person Info
                    </h3>
                    <div className="mt-3 grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Person of Contact*
                        </label>
                        <input
                          type="text"
                          name="contactName"
                          value={formData.contactName}
                          onChange={handleChange}
                          className={inputClass('contactName')}
                          placeholder="Full name"
                        />
                        {errors.contactName && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.contactName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Phone No*
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className={inputClass('phone')}
                          placeholder="+92 300 1234567"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.phone}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Email*
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={inputClass('email')}
                          placeholder="name@company.com"
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.email}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Alternate Phone
                        </label>
                        <input
                          type="tel"
                          name="altPhone"
                          value={formData.altPhone}
                          onChange={handleChange}
                          className={inputClass('altPhone')}
                          placeholder="+92 300 7654321"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Company / Pickup Address*
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          className={inputClass('address')}
                          placeholder="House, Street, Area"
                        />
                        {errors.address && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {currentStep === 1 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-[0.2em]">
                    Bank Information
                  </h3>
                  <div className="mt-3 grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        className={inputClass('bankName')}
                        placeholder="Bank name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Account Title
                      </label>
                      <input
                        type="text"
                        name="accountTitle"
                        value={formData.accountTitle}
                        onChange={handleChange}
                        className={inputClass('accountTitle')}
                        placeholder="Account holder"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        className={inputClass('accountNumber')}
                        placeholder="Account number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        IBAN
                      </label>
                      <input
                        type="text"
                        name="iban"
                        value={formData.iban}
                        onChange={handleChange}
                        className={inputClass('iban')}
                        placeholder="PK00XXXX000000000000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Swift Code
                      </label>
                      <input
                        type="text"
                        name="swiftCode"
                        value={formData.swiftCode}
                        onChange={handleChange}
                        className={inputClass('swiftCode')}
                        placeholder="Swift code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Branch Name
                      </label>
                      <input
                        type="text"
                        name="branchName"
                        value={formData.branchName}
                        onChange={handleChange}
                        className={inputClass('branchName')}
                        placeholder="Branch name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Branch Code
                      </label>
                      <input
                        type="text"
                        name="branchCode"
                        value={formData.branchCode}
                        onChange={handleChange}
                        className={inputClass('branchCode')}
                        placeholder="Branch code"
                      />
                    </div>
                  </div>
                </div>
              )}
              {currentStep === 2 && (
                <div className="space-y-0">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-[0.2em]">
                      Shipping Information
                    </h3>
                    <div className="mt-3 grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Select City*
                        </label>
                        <select
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className={inputClass('city')}>
                          <option value="">Select city</option>
                          {SERVICE_CITIES.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                        {errors.city && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.city}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Pickup Timings
                        </label>
                        <input
                          type="text"
                          name="pickupTimings"
                          value={formData.pickupTimings}
                          onChange={handleChange}
                          className={inputClass('pickupTimings')}
                          placeholder="e.g. 12 PM - 6 PM"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Expected Monthly Shipment
                        </label>
                        <input
                          type="text"
                          name="monthlyShipment"
                          value={formData.monthlyShipment}
                          onChange={handleChange}
                          className={inputClass('monthlyShipment')}
                          placeholder="e.g. 200 parcels"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Any Special Instructions
                        </label>
                        <textarea
                          name="specialInstructions"
                          value={formData.specialInstructions}
                          onChange={handleChange}
                          className={`${inputClass('specialInstructions')} min-h-[120px]`}
                          placeholder="Pickup notes, landmarks, etc."
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-[0.2em]">
                      Identity (CNIC)
                    </h3>
                    <div className="mt-3 grid md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          CNIC*
                        </label>
                        <input
                          type="text"
                          name="cnic"
                          value={formData.cnic}
                          onChange={handleChange}
                          className={inputClass('cnic')}
                          placeholder="12345-1234567-1"
                        />
                        {errors.cnic && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.cnic}
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Google Map Pin
                        </label>
                        <input
                          type="text"
                          name="googleMapPin"
                          value={formData.googleMapPin}
                          onChange={handleChange}
                          className={inputClass('googleMapPin')}
                          placeholder="Google Maps link or pin"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {currentStep === 3 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-[0.2em]">
                    Password
                  </h3>
                  <div className="mt-3 grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Password* (min 8)
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className={`${inputClass('password')} pr-12`}
                          placeholder="********"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-700">
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.password}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Confirm Password*
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={`${inputClass('confirmPassword')} pr-12`}
                          placeholder="********"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-700">
                          {showConfirmPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {submitted && (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="text-emerald-700 font-semibold">
                    Application submitted successfully.
                  </div>
                  <div className="text-sm text-emerald-700 mt-1">
                    Account status:{' '}
                    <span className="font-semibold">PENDING</span>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="mt-4 text-sm font-semibold text-rose-600">
                  {submitError}
                </div>
              )}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (submitted) {
                      navigate('/');
                      return;
                    }
                    handleBack();
                  }}
                  disabled={!submitted && currentStep === 0}
                  className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
                    !submitted && currentStep === 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}>
                  Back
                </button>
                {currentStep < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 rounded-xl font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors">
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors">
                    Submit Application
                  </button>
                )}
              </div>
            </form>
                ) : (
                  <div className="p-8">
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                        <Lock className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 text-xl font-bold text-slate-800">
                        Registration Locked
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        Please select a plan first. The registration form will
                        open after plan selection.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (registerOnly) {
                            window.location.assign('/cod-registration');
                            return;
                          }
                          planRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }}
                        className="mt-6 inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600">
                        Select a Plan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
          )}
        </>
      )}
      {accountNotFound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Account
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                Account Not Found
              </h3>
              <p className="text-sm text-slate-600 mt-3">
                We could not find your COD account for this email. Please
                register first to continue.
              </p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  setAccountNotFound(false);
                  setRegisterOnly(false);
                  setTimeout(() => {
                    planRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start'
                    });
                  }, 0);
                }}
                className="px-5 py-3 rounded-full bg-orange-500 text-white font-semibold hover:bg-orange-600">
                Register Now
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccountNotFound(false);
                  signOut(auth).catch(() => undefined);
                  navigate('/cod-registration');
                }}
                className="px-5 py-3 rounded-full border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-rose-200 p-6">
            <h3 className="text-2xl font-black text-slate-900">
              Clear Dashboard & Account
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              This will permanently delete your dashboard data, bookings, and
              account record. You will be logged out.
            </p>
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              Warning: This action cannot be undone.
            </div>
            <label className="mt-5 flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={clearConsent}
                onChange={(e) => setClearConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              I understand that all my records will be deleted and I will be
              logged out.
            </label>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowClearModal(false);
                  setClearConsent(false);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearDashboard}
                disabled={!clearConsent}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${
                  clearConsent
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-rose-300 cursor-not-allowed'
                }`}>
                Yes, clear everything
              </button>
            </div>
          </div>
        </div>
      )}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
          <div
            className={`w-full max-w-lg ${loginError ? 'animate-shake' : ''}`}>
            <div
              className="relative rounded-3xl border border-slate-200 bg-white/95 shadow-2xl overflow-hidden animate-fade-up"
              style={{ fontFamily: "'Poppins', 'Inter', system-ui, sans-serif" }}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_55%)]" />
              <div className="relative p-7 sm:p-8">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Secure Access
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                    Welcome Back
                  </h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Sign in to access your dashboard
                  </p>
                </div>

                <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                  <div className="relative">
                    <Mail className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                    <input
                      id="loginEmail"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder=" "
                      className="peer w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-11 py-4 text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <label
                      htmlFor="loginEmail"
                      className="absolute left-11 -top-2 bg-white/90 px-1 text-xs font-semibold text-slate-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:text-xs">
                      Email Address
                    </label>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                    <input
                      id="loginPassword"
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder=" "
                      className="peer w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-11 py-4 text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <label
                      htmlFor="loginPassword"
                      className="absolute left-11 -top-2 bg-white/90 px-1 text-xs font-semibold text-slate-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:text-xs">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <label className="inline-flex items-center gap-2 text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(true);
                        setShowLoginModal(false);
                      }}
                      className="font-semibold text-blue-600 hover:text-blue-700">
                      Forgot password?
                    </button>
                  </div>

                  {loginError && (
                    <div className="text-sm text-rose-600 font-semibold animate-shake">
                      {loginError}
                    </div>
                  )}

                  {loginNotice && (
                    <div
                      className={`text-sm font-semibold ${
                        loginNoticeTone === 'success'
                          ? 'text-emerald-700'
                          : 'text-blue-600'
                      }`}>
                      {loginNotice}
                    </div>
                  )}

                  {loginSuccess && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 font-semibold animate-fade-up">
                      Success! Redirecting to your dashboard...
                    </div>
                  )}

                  {loginAccount && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${planBadgeClass()}`}>
                          {loginAccount.planName}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${accountStatusBadge}`}>
                          {loginAccount.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setShowLoginModal(false)}
                      className="btn-ripple px-5 py-3 rounded-full border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50">
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={isSigningIn}
                      className="btn-ripple px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg shadow-blue-200 hover:-translate-y-0.5 transition">
                      {isSigningIn ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          Signing in
                        </span>
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
          <div className="w-full max-w-lg">
            <div className="relative rounded-3xl border border-slate-200 bg-white/95 shadow-2xl overflow-hidden animate-fade-up">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.1),transparent_55%)]" />
              <div className="relative p-7 sm:p-8">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Password Reset
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                    Forgot Password
                  </h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Enter your email to reset your password.
                  </p>
                </div>

                {forgotStep === 'email' ? (
                  <form className="mt-6 space-y-4" onSubmit={handleForgotLookup}>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-11 py-4 text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                    {forgotError && (
                      <div className="text-sm text-rose-600 font-semibold">
                        {forgotError}
                      </div>
                    )}
                    {forgotSuccess && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 font-semibold animate-fade-up">
                        {forgotSuccess}
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotModal(false);
                          setShowLoginModal(true);
                        }}
                        className="px-5 py-3 rounded-full border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50">
                        Back to Sign In
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 rounded-full bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition">
                        Continue
                      </button>
                    </div>
                  </form>
                ) : (
                  <form className="mt-6 space-y-4" onSubmit={handleForgotReset}>
                    <div className="relative">
                      <Lock className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                      <input
                        type={showForgotPassword ? 'text' : 'password'}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="New password"
                        className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-11 py-4 pr-12 text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword((prev) => !prev)}
                        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
                        {showForgotPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                      <input
                        type={showForgotConfirm ? 'text' : 'password'}
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-11 py-4 pr-12 text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirm((prev) => !prev)}
                        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
                        {showForgotConfirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {forgotError && (
                      <div className="text-sm text-rose-600 font-semibold">
                        {forgotError}
                      </div>
                    )}
                    {forgotSuccess && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 font-semibold animate-fade-up">
                        {forgotSuccess}
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotModal(false);
                          setShowLoginModal(true);
                        }}
                        className="px-5 py-3 rounded-full border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50">
                        Back to Sign In
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 rounded-full bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition">
                        Update Password
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {showFundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
          <div className="w-full max-w-2xl">
            <div className="relative rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_55%)]" />
              <div className="relative p-7 sm:p-8">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Wallet Funding
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                    Add Funds Request
                  </h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Fill your bank details and amount. Admin will approve and add funds.
                  </p>
                </div>

                <form className="mt-6 space-y-4" onSubmit={handleFundSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Amount (Rs.)*
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="e.g. 5000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Bank Name*
                      </label>
                      <input
                        type="text"
                        value={fundBankName}
                        onChange={(e) => setFundBankName(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="Your bank"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Account Title*
                      </label>
                      <input
                        type="text"
                        value={fundAccountTitle}
                        onChange={(e) => setFundAccountTitle(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="Account title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Account Number*
                      </label>
                      <input
                        type="text"
                        value={fundAccountNumber}
                        onChange={(e) => setFundAccountNumber(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="Account number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        IBAN*
                      </label>
                      <input
                        type="text"
                        value={fundIban}
                        onChange={(e) => setFundIban(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="IBAN"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        CNIC
                      </label>
                      <input
                        type="text"
                        value={fundCnic}
                        onChange={(e) => setFundCnic(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="12345-1234567-1"
                      />
                    </div>
                  </div>

                  {fundError && (
                    <div className="text-sm text-rose-600 font-semibold">
                      {fundError}
                    </div>
                  )}
                  {fundSuccess && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 font-semibold">
                      {fundSuccess}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setShowFundModal(false)}
                      className="px-5 py-3 rounded-full border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-full bg-blue-600 text-white font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
                      Send Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {showFundSentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
          <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-amber-50 shadow-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-amber-700">
                  Request Sent
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Fund Request Pending
                </h3>
              </div>
            </div>
            <p className="text-sm text-slate-700 mt-4">
              Fund request pending:{' '}
              <span className="font-semibold">
                Rs. {formatMoney(lastFundAmount ?? 0)}
              </span>
              . Admin will review it soon.
            </p>
            <div className="mt-5 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowFundSentModal(false)}
                className="px-5 py-2.5 rounded-full bg-amber-600 text-white font-semibold hover:bg-amber-700 transition">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-red-200 bg-gradient-to-br from-red-50 via-amber-50 to-amber-100/70">
            <div className="p-8 border-b border-red-200 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white">
              <h3 className="text-2xl md:text-3xl font-black tracking-wide">
                Application Submitted
              </h3>
              <p className="text-base md:text-lg font-bold mt-3">
                Your account has been moved to processing. Our team will
                review and approve it soon.
              </p>
            </div>
            <div className="p-8">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-5 py-3.5 rounded-2xl bg-red-600 text-white hover:bg-red-700 transition-colors font-bold tracking-wide shadow-lg shadow-red-200">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
