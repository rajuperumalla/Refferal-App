import { Patient, Notification, Commission } from './types';

export const PATIENTS: Patient[] = [
  {
    id: 101, name: 'Ramesh Kumar', phone: '+91 98765 43210', age: 45, gender: 'M',
    specialty: 'Orthopaedics', procedure: 'Knee Replacement', status: 'ipd_confirmed',
    commission: 4500, commPct: 3.75, packageCost: 120000,
    city: 'Hyderabad', hospital: 'Apollo Hospitals', doctor: 'Dr. Suresh Reddy',
    urgency: 'Within a week', budget: '1L–2L', insurance: false,
    notes: 'Patient prefers morning slot. Has diabetes — needs special care.',
    opd: '15 May 2024', surgeryDate: '25 May 2024', discharge: '28 May 2024',
    createdAt: '10 May 2024',
  },
  {
    id: 102, name: 'Priya Sharma', phone: '+91 97654 32109', age: 35, gender: 'F',
    specialty: 'Urology', procedure: 'Stone Removal', status: 'opd_scheduled',
    commission: 3900, commPct: 4.0, packageCost: 80000,
    city: 'Bangalore', hospital: 'Manipal Hospital', doctor: 'Dr. Anil Mehta',
    urgency: 'Within a month', budget: '50k–1L', insurance: true, insuranceProv: 'Star Health',
    notes: '',
    opd: '22 May 2024', surgeryDate: null, discharge: null,
    createdAt: '12 May 2024',
  },
  {
    id: 103, name: 'Suresh Rao', phone: '+91 96543 21098', age: 52, gender: 'M',
    specialty: 'Cardiology', procedure: 'Angioplasty', status: 'new',
    commission: 8000, commPct: 4.0, packageCost: 200000,
    city: 'Chennai', hospital: null, doctor: null,
    urgency: 'Immediate', budget: 'Above 2L', insurance: true, insuranceProv: 'HDFC ERGO',
    notes: 'Urgent — chest pain reported.',
    opd: null, surgeryDate: null, discharge: null,
    createdAt: '18 May 2024',
  },
  {
    id: 104, name: 'Meena Devi', phone: '+91 95432 10987', age: 28, gender: 'F',
    specialty: 'Gynecology', procedure: 'Laparoscopy', status: 'contacted',
    commission: 2800, commPct: 4.0, packageCost: 70000,
    city: 'Mumbai', hospital: 'Kokilaben Hospital', doctor: null,
    urgency: 'Flexible', budget: '50k–1L', insurance: false,
    notes: '',
    opd: null, surgeryDate: null, discharge: null,
    createdAt: '20 May 2024',
  },
  {
    id: 105, name: 'Vijay Patel', phone: '+91 94321 09876', age: 60, gender: 'M',
    specialty: 'General Surgery', procedure: 'Gallbladder Removal', status: 'completed',
    commission: 3200, commPct: 4.0, packageCost: 80000,
    city: 'Delhi', hospital: 'Fortis Hospital', doctor: 'Dr. Ravi Gupta',
    urgency: 'Within a week', budget: '50k–1L', insurance: false,
    notes: 'Surgery successful. Patient recovering well.',
    opd: '28 Apr 2024', surgeryDate: '1 May 2024', discharge: '3 May 2024',
    createdAt: '22 Apr 2024',
  },
  {
    id: 106, name: 'Kavitha Reddy', phone: '+91 93210 98765', age: 42, gender: 'F',
    specialty: 'ENT', procedure: 'Tonsillectomy', status: 'lost',
    commission: 1500, commPct: 4.0, packageCost: 35000,
    city: 'Hyderabad', hospital: null, doctor: null,
    urgency: 'Within a month', budget: 'Below 50k', insurance: false,
    notes: 'Patient opted for government hospital.',
    opd: null, surgeryDate: null, discharge: null,
    createdAt: '5 May 2024',
  },
];

export const NOTIFICATIONS: Notification[] = [
  { id: 1, type: 'commission', title: 'Commission Credited', body: '₹4,500 for Ramesh Kumar credited to your account.', time: '2h ago', read: false },
  { id: 2, type: 'patient', title: 'Patient Status Update', body: 'Priya Sharma — OPD scheduled at Manipal Hospital.', time: '5h ago', read: false },
  { id: 3, type: 'appointment', title: 'OPD Reminder', body: 'Suresh Rao has OPD tomorrow at Apollo, 10:00 AM.', time: '12h ago', read: true },
  { id: 4, type: 'alert', title: 'Action Required', body: 'Upload documents for Meena Devi to proceed with IPD admission.', time: '1d ago', read: true },
  { id: 5, type: 'commission', title: 'Commission Processed', body: '₹12,300 for 3 cases paid. UTR: HDFC240520XXXX.', time: '2d ago', read: true },
  { id: 6, type: 'patient', title: 'New Lead Assigned', body: 'Follow up with Suresh Rao regarding Cardiology consult.', time: '3d ago', read: true },
];

export const COMMISSIONS: Commission[] = [
  { id: 1, patientName: 'Ramesh Kumar', procedure: 'Knee Replacement', amount: 4500, status: 'pending', stage: 'Awaiting bill verification', estimatedDate: '5 Jun 2024' },
  { id: 2, patientName: 'Priya Sharma', procedure: 'Stone Removal', amount: 3900, status: 'pending', stage: 'Awaiting finance approval', estimatedDate: '8 Jun 2024' },
  { id: 3, patientName: 'Vijay Patel', procedure: 'Gallbladder Removal', amount: 3200, status: 'paid', paidDate: '20 May 2024', method: 'Bank Transfer', utr: 'HDFC240520XXXX' },
  { id: 4, patientName: 'Multiple (3 cases)', procedure: 'May Batch', amount: 12300, status: 'paid', paidDate: '20 May 2024', method: 'Bank Transfer', utr: 'HDFC240520XXXX', cases: 3 },
  { id: 5, patientName: 'Multiple (2 cases)', procedure: 'Apr Batch', amount: 8700, status: 'paid', paidDate: '5 May 2024', method: 'UPI', utr: 'UPI240505XXXX', cases: 2 },
];

export const MONTHLY_EARNINGS = [
  { month: 'Dec', amount: 28000 },
  { month: 'Jan', amount: 32000 },
  { month: 'Feb', amount: 35500 },
  { month: 'Mar', amount: 38200 },
  { month: 'Apr', amount: 40400 },
  { month: 'May', amount: 45230 },
];

export const AGENT = {
  name: 'Rajesh Sharma',
  id: 'AG-HYD-001',
  phone: '+91 98765 43210',
  email: 'rajesh@medireferral.in',
  city: 'Hyderabad',
  commissionRate: 4,
  bank: 'HDFC Bank ••••4521',
  upi: 'rajesh@hdfc',
  totalLeads: 45,
  conversionRate: 68,
  totalEarned: 230000,
  thisMonth: 45230,
  pending: 8400,
};

export const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
export const fmtL = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;
