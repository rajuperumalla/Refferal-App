'use client';
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  AdminAgent, AdminPatient, AdminCommission, AdminHospital, ActivityLog,
  ADMIN_AGENTS, ADMIN_PATIENTS, ADMIN_COMMISSIONS, ADMIN_HOSPITALS,
  ADMIN_MONTHLY_REVENUE, ACTIVITY_LOG,
} from './admin-data';
import { Notification } from './types';
import { NOTIFICATIONS, MONTHLY_EARNINGS } from './data';

// ─── Extended types ────────────────────────────────────────────────────────────

export interface AgentNotification extends Notification {
  agentId: string;
}

export interface AppSettings {
  appName: string;
  timezone: string;
  currency: string;
  autoApproveAgents: boolean;
  autoApproveCommissions: boolean;
  paymentCycle: string;
  minPayout: number;
  minCommission: number;
  maxCommission: number;
  commissionRates: Record<string, number>;
}

export type MonthlyEarning = { month: string; amount: number };

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  documentName: string;
  documentType: 'passbook' | 'statement' | '';
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
}

export interface BankVerificationRequest {
  id: number;
  agentId: string;
  agentName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  documentName: string;
  documentType: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface AdminNotification {
  id: number;
  type: 'bank_verification' | 'new_agent' | 'alert';
  title: string;
  body: string;
  time: string;
  read: boolean;
  refId?: number;
}

// ─── State ────────────────────────────────────────────────────────────────────

interface AppState {
  agents: AdminAgent[];
  patients: AdminPatient[];
  commissions: AdminCommission[];
  hospitals: AdminHospital[];
  notifications: AgentNotification[];
  activityLog: ActivityLog[];
  monthlyRevenue: typeof ADMIN_MONTHLY_REVENUE;
  agentMonthlyEarnings: MonthlyEarning[];
  settings: AppSettings;
  currentAgentId: string;
  bankDetails: BankDetails;
  bankVerificationRequests: BankVerificationRequest[];
  adminNotifications: AdminNotification[];
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD_PATIENT'; patient: AdminPatient; commission: AdminCommission; notification: AgentNotification; log: ActivityLog }
  | { type: 'APPROVE_COMMISSION'; id: number; notification: AgentNotification; log: ActivityLog }
  | { type: 'REJECT_COMMISSION'; id: number; reason: string; notification: AgentNotification; log: ActivityLog }
  | { type: 'MARK_COMMISSION_PAID'; id: number; utr: string; notification: AgentNotification; log: ActivityLog }
  | { type: 'APPROVE_ALL_COMMISSIONS'; ids: number[]; log: ActivityLog }
  | { type: 'CREATE_AGENT'; agent: AdminAgent; log: ActivityLog }
  | { type: 'UPDATE_AGENT'; agent: AdminAgent }
  | { type: 'APPROVE_AGENT'; id: string; log: ActivityLog }
  | { type: 'SUSPEND_AGENT'; id: string; log: ActivityLog }
  | { type: 'RESTORE_AGENT'; id: string; log: ActivityLog }
  | { type: 'ADD_HOSPITAL'; hospital: AdminHospital }
  | { type: 'UPDATE_HOSPITAL'; hospital: AdminHospital }
  | { type: 'MARK_NOTIFICATION_READ'; id: number }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ'; agentId: string }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<AppSettings> }
  | { type: 'UPDATE_BANK_DETAILS'; details: BankDetails }
  | { type: 'SUBMIT_BANK_VERIFICATION'; request: BankVerificationRequest; adminNotif: AdminNotification }
  | { type: 'APPROVE_BANK_VERIFICATION'; id: number; notification: AgentNotification; log: ActivityLog }
  | { type: 'REJECT_BANK_VERIFICATION'; id: number; reason: string; notification: AgentNotification; log: ActivityLog }
  | { type: 'MARK_ADMIN_NOTIFICATION_READ'; id: number };

function reducer(state: AppState, action: Action): AppState {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  switch (action.type) {
    case 'ADD_PATIENT':
      return {
        ...state,
        patients: [action.patient, ...state.patients],
        commissions: [action.commission, ...state.commissions],
        notifications: [action.notification, ...state.notifications],
        activityLog: [action.log, ...state.activityLog],
      };

    case 'APPROVE_COMMISSION':
      return {
        ...state,
        commissions: state.commissions.map(c =>
          c.id === action.id ? { ...c, status: 'approved' as const, approvedAt: today } : c
        ),
        notifications: [action.notification, ...state.notifications],
        activityLog: [action.log, ...state.activityLog],
      };

    case 'REJECT_COMMISSION':
      return {
        ...state,
        commissions: state.commissions.map(c =>
          c.id === action.id ? { ...c, status: 'rejected' as const, rejectedReason: action.reason } : c
        ),
        notifications: [action.notification, ...state.notifications],
        activityLog: [action.log, ...state.activityLog],
      };

    case 'MARK_COMMISSION_PAID':
      return {
        ...state,
        commissions: state.commissions.map(c =>
          c.id === action.id
            ? { ...c, status: 'paid' as const, paidAt: today, utr: action.utr, method: 'Bank Transfer' }
            : c
        ),
        notifications: [action.notification, ...state.notifications],
        activityLog: [action.log, ...state.activityLog],
      };

    case 'APPROVE_ALL_COMMISSIONS':
      return {
        ...state,
        commissions: state.commissions.map(c =>
          action.ids.includes(c.id) && c.status === 'pending_approval'
            ? { ...c, status: 'approved' as const, approvedAt: today }
            : c
        ),
        activityLog: [action.log, ...state.activityLog],
      };

    case 'CREATE_AGENT':
      return {
        ...state,
        agents: [...state.agents, action.agent],
        activityLog: [action.log, ...state.activityLog],
      };

    case 'UPDATE_AGENT':
      return { ...state, agents: state.agents.map(a => a.id === action.agent.id ? action.agent : a) };

    case 'APPROVE_AGENT':
      return {
        ...state,
        agents: state.agents.map(a => a.id === action.id ? { ...a, status: 'active' as const } : a),
        activityLog: [action.log, ...state.activityLog],
      };

    case 'SUSPEND_AGENT':
      return {
        ...state,
        agents: state.agents.map(a => a.id === action.id ? { ...a, status: 'suspended' as const } : a),
        activityLog: [action.log, ...state.activityLog],
      };

    case 'RESTORE_AGENT':
      return {
        ...state,
        agents: state.agents.map(a => a.id === action.id ? { ...a, status: 'active' as const } : a),
        activityLog: [action.log, ...state.activityLog],
      };

    case 'ADD_HOSPITAL':
      return { ...state, hospitals: [...state.hospitals, action.hospital] };

    case 'UPDATE_HOSPITAL':
      return { ...state, hospitals: state.hospitals.map(h => h.id === action.hospital.id ? action.hospital : h) };

    case 'MARK_NOTIFICATION_READ':
      return { ...state, notifications: state.notifications.map(n => n.id === action.id ? { ...n, read: true } : n) };

    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => n.agentId === action.agentId ? { ...n, read: true } : n),
      };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case 'UPDATE_BANK_DETAILS':
      return { ...state, bankDetails: action.details };

    case 'SUBMIT_BANK_VERIFICATION':
      return {
        ...state,
        bankDetails: { ...state.bankDetails, verificationStatus: 'pending', rejectionReason: undefined },
        bankVerificationRequests: [action.request, ...state.bankVerificationRequests.filter(r => r.agentId !== action.request.agentId || r.status !== 'pending')],
        adminNotifications: [action.adminNotif, ...state.adminNotifications],
      };

    case 'APPROVE_BANK_VERIFICATION': {
      const req = state.bankVerificationRequests.find(r => r.id === action.id);
      return {
        ...state,
        bankDetails: req && req.agentId === state.currentAgentId
          ? { ...state.bankDetails, verificationStatus: 'verified', rejectionReason: undefined }
          : state.bankDetails,
        bankVerificationRequests: state.bankVerificationRequests.map(r =>
          r.id === action.id ? { ...r, status: 'approved', reviewedAt: today } : r
        ),
        notifications: [action.notification, ...state.notifications],
        activityLog: [action.log, ...state.activityLog],
        adminNotifications: state.adminNotifications.map(n => n.refId === action.id ? { ...n, read: true } : n),
      };
    }

    case 'REJECT_BANK_VERIFICATION': {
      const req = state.bankVerificationRequests.find(r => r.id === action.id);
      return {
        ...state,
        bankDetails: req && req.agentId === state.currentAgentId
          ? { ...state.bankDetails, verificationStatus: 'rejected', rejectionReason: action.reason }
          : state.bankDetails,
        bankVerificationRequests: state.bankVerificationRequests.map(r =>
          r.id === action.id ? { ...r, status: 'rejected', rejectionReason: action.reason, reviewedAt: today } : r
        ),
        notifications: [action.notification, ...state.notifications],
        activityLog: [action.log, ...state.activityLog],
        adminNotifications: state.adminNotifications.map(n => n.refId === action.id ? { ...n, read: true } : n),
      };
    }

    case 'MARK_ADMIN_NOTIFICATION_READ':
      return { ...state, adminNotifications: state.adminNotifications.map(n => n.id === action.id ? { ...n, read: true } : n) };

    default:
      return state;
  }
}

// ─── Initial state ─────────────────────────────────────────────────────────────

const CURRENT_AGENT_ID = 'AG-HYD-001';

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'MediReferral',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  autoApproveAgents: false,
  autoApproveCommissions: false,
  paymentCycle: 'monthly',
  minPayout: 1000,
  minCommission: 3.0,
  maxCommission: 5.0,
  commissionRates: {
    'Cardiology': 4.0, 'Neurology': 4.0, 'Orthopaedics': 3.75, 'Oncology': 4.5,
    'General Surgery': 4.0, 'Gynecology': 3.5, 'Urology': 3.5, 'ENT': 4.0,
    'Ophthalmology': 3.75, 'Gastroenterology': 4.0, 'Nephrology': 3.5, 'Pulmonology': 3.75,
  },
};

const DEFAULT_BANK_DETAILS: BankDetails = {
  accountName: '', accountNumber: '', ifscCode: '', upiId: '',
  documentName: '', documentType: '', verificationStatus: 'unverified',
  rejectionReason: undefined,
};

const INITIAL_STATE: AppState = {
  agents: ADMIN_AGENTS,
  patients: ADMIN_PATIENTS,
  commissions: ADMIN_COMMISSIONS,
  hospitals: ADMIN_HOSPITALS,
  notifications: NOTIFICATIONS.map(n => ({ ...n, agentId: CURRENT_AGENT_ID })),
  activityLog: ACTIVITY_LOG,
  monthlyRevenue: ADMIN_MONTHLY_REVENUE,
  agentMonthlyEarnings: MONTHLY_EARNINGS,
  settings: DEFAULT_SETTINGS,
  currentAgentId: CURRENT_AGENT_ID,
  bankDetails: DEFAULT_BANK_DETAILS,
  bankVerificationRequests: [],
  adminNotifications: [],
};

// ─── Context ──────────────────────────────────────────────────────────────────

export interface StoreContextType extends AppState {
  currentAgent: AdminAgent | undefined;
  myPatients: AdminPatient[];
  myCommissions: AdminCommission[];
  myNotifications: AgentNotification[];
  unreadCount: number;

  addPatient(data: {
    name: string; phone: string; age: number; gender: 'M' | 'F';
    specialty: string; procedure: string; city: string;
    packageCost: number; hospital?: string | null; urgency?: string;
  }): void;
  approveCommission(id: number): void;
  rejectCommission(id: number, reason: string): void;
  markCommissionPaid(id: number): void;
  approveAllCommissions(ids?: number[]): void;
  createAgent(data: Omit<AdminAgent, 'totalLeads' | 'totalEarned' | 'thisMonth' | 'pending' | 'conversionRate' | 'joinedAt' | 'lastActive'>): void;
  updateAgent(agent: AdminAgent): void;
  approveAgent(id: string): void;
  suspendAgent(id: string): void;
  restoreAgent(id: string): void;
  addHospital(data: Pick<AdminHospital, 'name' | 'city' | 'state' | 'tier' | 'specialties' | 'contactPerson' | 'contactPhone'>): void;
  updateHospital(h: AdminHospital): void;
  markNotificationRead(id: number): void;
  markAllNotificationsRead(): void;
  updateSettings(s: Partial<AppSettings>): void;
  updateBankDetails(details: BankDetails): void;
  submitBankVerification(details: BankDetails): void;
  approveBankVerification(id: number): void;
  rejectBankVerification(id: number, reason: string): void;
  markAdminNotificationRead(id: number): void;
  adminUnreadCount: number;
}

const StoreCtx = createContext<StoreContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

const LS_KEY = 'medireferral_store_v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, (init) => {
    if (typeof window === 'undefined') return init;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return { ...init, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return init;
  });

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const today = () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const nextNotifId = () => Math.max(0, ...state.notifications.map(n => n.id)) + 1;
  const nextLogId   = () => Math.max(0, ...state.activityLog.map(l => l.id)) + 1;
  const currentAgent = state.agents.find(a => a.id === state.currentAgentId);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const addPatient = (data: {
    name: string; phone: string; age: number; gender: 'M' | 'F';
    specialty: string; procedure: string; city: string;
    packageCost: number; hospital?: string | null; urgency?: string;
  }) => {
    if (!currentAgent) return;
    const commPct    = state.settings.commissionRates[data.specialty] ?? currentAgent.commissionRate;
    const commission = Math.round(data.packageCost * commPct / 100);
    const patientId  = Math.max(0, ...state.patients.map(p => p.id)) + 1;
    const commId     = Math.max(0, ...state.commissions.map(c => c.id)) + 1;

    dispatch({
      type: 'ADD_PATIENT',
      patient: {
        id: patientId, name: data.name, phone: data.phone, age: data.age, gender: data.gender,
        specialty: data.specialty, procedure: data.procedure, status: 'new',
        commission, commPct, packageCost: data.packageCost,
        city: data.city, hospital: data.hospital ?? null,
        agentId: currentAgent.id, agentName: currentAgent.name, createdAt: today(),
      },
      commission: {
        id: commId, agentId: currentAgent.id, agentName: currentAgent.name,
        patientName: data.name, procedure: data.procedure || 'TBD',
        amount: commission, status: 'pending_approval', createdAt: today(),
      },
      notification: {
        id: nextNotifId(), agentId: currentAgent.id, type: 'patient',
        title: 'Lead Submitted', body: `${data.name} — our team will contact them within 24h.`,
        time: 'Just now', read: false,
      },
      log: {
        id: nextLogId(), type: 'patient_added', title: 'Patient Lead Added',
        detail: `${data.name} — ${data.specialty} via ${currentAgent.name}`,
        time: 'Just now', actor: currentAgent.id,
      },
    });
  };

  const approveCommission = (id: number) => {
    const c = state.commissions.find(x => x.id === id);
    if (!c) return;
    dispatch({
      type: 'APPROVE_COMMISSION', id,
      notification: {
        id: nextNotifId(), agentId: c.agentId, type: 'commission',
        title: 'Commission Approved',
        body: `₹${c.amount.toLocaleString('en-IN')} for ${c.patientName} approved. Awaiting payment.`,
        time: 'Just now', read: false,
      },
      log: {
        id: nextLogId(), type: 'commission_approved', title: 'Commission Approved',
        detail: `₹${c.amount.toLocaleString('en-IN')} for ${c.patientName} (${c.agentName})`,
        time: 'Just now', actor: 'Admin',
      },
    });
  };

  const rejectCommission = (id: number, reason: string) => {
    const c = state.commissions.find(x => x.id === id);
    if (!c) return;
    dispatch({
      type: 'REJECT_COMMISSION', id, reason: reason || 'Rejected by admin.',
      notification: {
        id: nextNotifId(), agentId: c.agentId, type: 'alert',
        title: 'Commission Rejected',
        body: `₹${c.amount.toLocaleString('en-IN')} for ${c.patientName} was rejected. ${reason || ''}`.trim(),
        time: 'Just now', read: false,
      },
      log: {
        id: nextLogId(), type: 'commission_approved', title: 'Commission Rejected',
        detail: `₹${c.amount.toLocaleString('en-IN')} for ${c.patientName} (${c.agentName})`,
        time: 'Just now', actor: 'Admin',
      },
    });
  };

  const markCommissionPaid = (id: number) => {
    const c = state.commissions.find(x => x.id === id);
    if (!c) return;
    const utr = `UTR${Date.now().toString().slice(-8)}`;
    dispatch({
      type: 'MARK_COMMISSION_PAID', id, utr,
      notification: {
        id: nextNotifId(), agentId: c.agentId, type: 'commission',
        title: 'Commission Credited',
        body: `₹${c.amount.toLocaleString('en-IN')} for ${c.patientName} credited. UTR: ${utr}`,
        time: 'Just now', read: false,
      },
      log: {
        id: nextLogId(), type: 'commission_paid', title: 'Commission Disbursed',
        detail: `₹${c.amount.toLocaleString('en-IN')} to ${c.agentName} via Bank Transfer`,
        time: 'Just now', actor: 'Admin',
      },
    });
  };

  const approveAllCommissions = (ids?: number[]) => {
    const targetIds = ids ?? state.commissions.filter(c => c.status === 'pending_approval').map(c => c.id);
    dispatch({
      type: 'APPROVE_ALL_COMMISSIONS', ids: targetIds,
      log: {
        id: nextLogId(), type: 'commission_approved', title: 'Bulk Commissions Approved',
        detail: `${targetIds.length} commissions approved`, time: 'Just now', actor: 'Admin',
      },
    });
  };

  const createAgent = (data: Omit<AdminAgent, 'totalLeads' | 'totalEarned' | 'thisMonth' | 'pending' | 'conversionRate' | 'joinedAt' | 'lastActive'>) => {
    const agent: AdminAgent = {
      ...data,
      totalLeads: 0, totalEarned: 0, thisMonth: 0, pending: 0, conversionRate: 0,
      joinedAt: today(), lastActive: 'Never',
    };
    dispatch({
      type: 'CREATE_AGENT', agent,
      log: {
        id: nextLogId(), type: 'agent_created', title: 'New Agent Registered',
        detail: `${data.name} — ${data.id} (${data.city})`, time: 'Just now', actor: 'Admin',
      },
    });
  };

  const updateAgent  = (agent: AdminAgent) => dispatch({ type: 'UPDATE_AGENT', agent });

  const approveAgent = (id: string) => {
    const a = state.agents.find(x => x.id === id);
    dispatch({
      type: 'APPROVE_AGENT', id,
      log: { id: nextLogId(), type: 'agent_created', title: 'Agent Approved', detail: `${a?.name ?? id} (${id}) activated`, time: 'Just now', actor: 'Admin' },
    });
  };

  const suspendAgent = (id: string) => {
    const a = state.agents.find(x => x.id === id);
    dispatch({
      type: 'SUSPEND_AGENT', id,
      log: { id: nextLogId(), type: 'agent_suspended', title: 'Agent Suspended', detail: `${a?.name ?? id} (${id}) — suspended by admin`, time: 'Just now', actor: 'Admin' },
    });
  };

  const restoreAgent = (id: string) => {
    const a = state.agents.find(x => x.id === id);
    dispatch({
      type: 'RESTORE_AGENT', id,
      log: { id: nextLogId(), type: 'agent_created', title: 'Agent Restored', detail: `${a?.name ?? id} (${id}) — account restored`, time: 'Just now', actor: 'Admin' },
    });
  };

  const addHospital = (data: Pick<AdminHospital, 'name' | 'city' | 'state' | 'tier' | 'specialties' | 'contactPerson' | 'contactPhone'>) => {
    dispatch({
      type: 'ADD_HOSPITAL',
      hospital: {
        ...data, id: Math.max(0, ...state.hospitals.map(h => h.id)) + 1,
        activePatients: 0, totalCases: 0, totalRevenue: 0, status: 'active', joinedAt: today(),
      },
    });
  };

  const updateHospital         = (h: AdminHospital) => dispatch({ type: 'UPDATE_HOSPITAL', hospital: h });
  const markNotificationRead   = (id: number) => dispatch({ type: 'MARK_NOTIFICATION_READ', id });
  const markAllNotificationsRead = () => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ', agentId: state.currentAgentId });
  const updateSettings         = (s: Partial<AppSettings>) => dispatch({ type: 'UPDATE_SETTINGS', settings: s });
  const updateBankDetails      = (details: BankDetails) => dispatch({ type: 'UPDATE_BANK_DETAILS', details });

  const submitBankVerification = (details: BankDetails) => {
    if (!currentAgent) return;
    const reqId = Math.max(0, ...state.bankVerificationRequests.map(r => r.id)) + 1;
    const notifId = Math.max(0, ...state.adminNotifications.map(n => n.id)) + 1;
    dispatch({
      type: 'SUBMIT_BANK_VERIFICATION',
      request: {
        id: reqId, agentId: currentAgent.id, agentName: currentAgent.name,
        accountName: details.accountName, accountNumber: details.accountNumber,
        ifscCode: details.ifscCode, upiId: details.upiId,
        documentName: details.documentName, documentType: details.documentType,
        status: 'pending', submittedAt: today(),
      },
      adminNotif: {
        id: notifId, type: 'bank_verification', read: false, refId: reqId,
        title: 'Bank Verification Request',
        body: `${currentAgent.name} (${currentAgent.id}) submitted bank details for verification.`,
        time: 'Just now',
      },
    });
  };

  const approveBankVerification = (id: number) => {
    const req = state.bankVerificationRequests.find(r => r.id === id);
    if (!req) return;
    dispatch({
      type: 'APPROVE_BANK_VERIFICATION', id,
      notification: {
        id: nextNotifId(), agentId: req.agentId, type: 'commission',
        title: '✅ Bank Details Verified',
        body: 'Your bank account has been verified. Commissions will be paid to this account.',
        time: 'Just now', read: false,
      },
      log: {
        id: nextLogId(), type: 'bank_verified', title: 'Bank Details Verified',
        detail: `${req.agentName} (${req.agentId}) — ${req.accountName} / ${req.ifscCode}`,
        time: 'Just now', actor: 'admin',
      },
    });
  };

  const rejectBankVerification = (id: number, reason: string) => {
    const req = state.bankVerificationRequests.find(r => r.id === id);
    if (!req) return;
    dispatch({
      type: 'REJECT_BANK_VERIFICATION', id, reason,
      notification: {
        id: nextNotifId(), agentId: req.agentId, type: 'alert',
        title: '❌ Bank Verification Rejected',
        body: reason ? `Reason: ${reason}. Please resubmit with correct details.` : 'Please resubmit with correct details.',
        time: 'Just now', read: false,
      },
      log: {
        id: nextLogId(), type: 'bank_rejected', title: 'Bank Verification Rejected',
        detail: `${req.agentName} — ${reason || 'No reason given'}`,
        time: 'Just now', actor: 'admin',
      },
    });
  };

  const markAdminNotificationRead = (id: number) => dispatch({ type: 'MARK_ADMIN_NOTIFICATION_READ', id });

  // ── Computed ──────────────────────────────────────────────────────────────────

  const myPatients        = state.patients.filter(p => p.agentId === state.currentAgentId);
  const myCommissions     = state.commissions.filter(c => c.agentId === state.currentAgentId);
  const myNotifications   = state.notifications.filter(n => n.agentId === state.currentAgentId);
  const unreadCount       = myNotifications.filter(n => !n.read).length;
  const adminUnreadCount  = state.adminNotifications.filter(n => !n.read).length;

  return (
    <StoreCtx.Provider value={{
      ...state, currentAgent, myPatients, myCommissions, myNotifications, unreadCount,
      addPatient, approveCommission, rejectCommission, markCommissionPaid, approveAllCommissions,
      createAgent, updateAgent, approveAgent, suspendAgent, restoreAgent,
      addHospital, updateHospital, markNotificationRead, markAllNotificationsRead, updateSettings,
      updateBankDetails, submitBankVerification, approveBankVerification, rejectBankVerification,
      markAdminNotificationRead, adminUnreadCount,
    }}>
      {children}
    </StoreCtx.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStore(): StoreContextType {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
