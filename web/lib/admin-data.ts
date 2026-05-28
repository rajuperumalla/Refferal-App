// ─── Types ───────────────────────────────────────────────────────────────────

export type AgentStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type HospitalTier = 'preferred' | 'standard' | 'basic';

export interface AdminAgent {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  status: AgentStatus;
  commissionRate: number;
  totalLeads: number;
  totalEarned: number;
  thisMonth: number;
  pending: number;
  conversionRate: number;
  joinedAt: string;
  lastActive: string;
  bank: string;
  upi: string;
  specialties: string[];
}

export interface AdminPatient {
  id: number;
  name: string;
  phone: string;
  age: number;
  gender: 'M' | 'F';
  specialty: string;
  procedure: string;
  status: string;
  commission: number;
  commPct: number;
  packageCost: number;
  city: string;
  hospital: string | null;
  agentId: string;
  agentName: string;
  createdAt: string;
}

export interface AdminCommission {
  id: number;
  agentId: string;
  agentName: string;
  patientName: string;
  procedure: string;
  amount: number;
  status: 'pending_approval' | 'approved' | 'paid' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
  rejectedReason?: string;
  utr?: string;
  method?: string;
}

export interface AdminHospital {
  id: number;
  name: string;
  city: string;
  state: string;
  tier: HospitalTier;
  specialties: string[];
  activePatients: number;
  totalCases: number;
  totalRevenue: number;
  status: 'active' | 'inactive';
  contactPerson: string;
  contactPhone: string;
  joinedAt: string;
}

export interface ActivityLog {
  id: number;
  type: 'agent_created' | 'commission_approved' | 'patient_added' | 'commission_paid' | 'agent_suspended' | 'commission_rejected' | 'bank_verified' | 'bank_rejected';
  title: string;
  detail: string;
  time: string;
  actor: string;
}

// ─── City → Code map ────────────────────────────────────────────────────────

export const CITY_CODES: Record<string, string> = {
  'Hyderabad': 'HYD', 'Bangalore': 'BLR', 'Mumbai': 'MUM', 'Delhi': 'DEL',
  'Chennai': 'CHN', 'Pune': 'PNE', 'Kolkata': 'KOL', 'Ahmedabad': 'AMD',
};

export function generateAgentId(city: string, seq: number): string {
  const code = CITY_CODES[city] ?? 'GEN';
  return `AG-${code}-${String(seq).padStart(3, '0')}`;
}

// ─── Agents ─────────────────────────────────────────────────────────────────

export const ADMIN_AGENTS: AdminAgent[] = [
  {
    id: 'AG-HYD-001', name: 'Rajesh Sharma', phone: '+91 98765 43210',
    email: 'rajesh@medireferral.in', city: 'Hyderabad', state: 'Telangana',
    status: 'active', commissionRate: 4, totalLeads: 45, totalEarned: 230000,
    thisMonth: 45230, pending: 8400, conversionRate: 68, joinedAt: '12 Jan 2024',
    lastActive: 'Today', bank: 'HDFC ••••4521', upi: 'rajesh@hdfc',
    specialties: ['Orthopaedics', 'Cardiology', 'Urology'],
  },
  {
    id: 'AG-BLR-001', name: 'Preethi Nair', phone: '+91 97654 32109',
    email: 'preethi.nair@gmail.com', city: 'Bangalore', state: 'Karnataka',
    status: 'active', commissionRate: 3.5, totalLeads: 38, totalEarned: 185000,
    thisMonth: 38400, pending: 6200, conversionRate: 72, joinedAt: '5 Feb 2024',
    lastActive: 'Yesterday', bank: 'SBI ••••7832', upi: 'preethi@sbi',
    specialties: ['Gynecology', 'General Surgery', 'ENT'],
  },
  {
    id: 'AG-MUM-001', name: 'Amit Patel', phone: '+91 96543 21098',
    email: 'amit.patel@referralnet.in', city: 'Mumbai', state: 'Maharashtra',
    status: 'active', commissionRate: 4, totalLeads: 52, totalEarned: 312000,
    thisMonth: 58200, pending: 11400, conversionRate: 75, joinedAt: '20 Jan 2024',
    lastActive: 'Today', bank: 'ICICI ••••2341', upi: 'amit@icici',
    specialties: ['Cardiology', 'Neurology', 'Orthopaedics'],
  },
  {
    id: 'AG-DEL-001', name: 'Sunita Verma', phone: '+91 95432 10987',
    email: 'sunita.verma@healthlink.in', city: 'Delhi', state: 'Delhi',
    status: 'active', commissionRate: 3.75, totalLeads: 41, totalEarned: 198000,
    thisMonth: 41800, pending: 7500, conversionRate: 66, joinedAt: '8 Mar 2024',
    lastActive: '2 days ago', bank: 'Axis ••••9012', upi: 'sunita@axisbank',
    specialties: ['Oncology', 'Cardiology', 'Pulmonology'],
  },
  {
    id: 'AG-CHN-001', name: 'Karthik Raja', phone: '+91 94321 09876',
    email: 'karthik.raja@medconnect.in', city: 'Chennai', state: 'Tamil Nadu',
    status: 'active', commissionRate: 4, totalLeads: 29, totalEarned: 142000,
    thisMonth: 29600, pending: 5100, conversionRate: 62, joinedAt: '15 Mar 2024',
    lastActive: 'Today', bank: 'IOB ••••5567', upi: 'karthik@upi',
    specialties: ['ENT', 'Ophthalmology', 'Dermatology'],
  },
  {
    id: 'AG-PNE-001', name: 'Meera Joshi', phone: '+91 93210 98765',
    email: 'meera.joshi@patientsbridge.in', city: 'Pune', state: 'Maharashtra',
    status: 'active', commissionRate: 3.5, totalLeads: 23, totalEarned: 108000,
    thisMonth: 22400, pending: 3800, conversionRate: 60, joinedAt: '2 Apr 2024',
    lastActive: '3 days ago', bank: 'PNB ••••3345', upi: 'meera@pnb',
    specialties: ['Urology', 'Nephrology'],
  },
  {
    id: 'AG-HYD-002', name: 'Ravi Kumar', phone: '+91 92109 87654',
    email: 'ravi.kumar@hyperefhyd.in', city: 'Hyderabad', state: 'Telangana',
    status: 'active', commissionRate: 4, totalLeads: 34, totalEarned: 167000,
    thisMonth: 34100, pending: 5900, conversionRate: 64, joinedAt: '10 Apr 2024',
    lastActive: 'Yesterday', bank: 'HDFC ••••8823', upi: 'ravi.kumar@hdfc',
    specialties: ['General Surgery', 'Gastroenterology'],
  },
  {
    id: 'AG-BLR-002', name: 'Ananya Singh', phone: '+91 91098 76543',
    email: 'ananya.s@gmail.com', city: 'Bangalore', state: 'Karnataka',
    status: 'inactive', commissionRate: 3.5, totalLeads: 12, totalEarned: 48000,
    thisMonth: 0, pending: 2400, conversionRate: 41, joinedAt: '22 Apr 2024',
    lastActive: '14 days ago', bank: 'Kotak ••••1234', upi: 'ananya@kotak',
    specialties: ['Gynecology'],
  },
  {
    id: 'AG-MUM-002', name: 'Vikram Mehta', phone: '+91 90987 65432',
    email: 'vikram.mehta@gmail.com', city: 'Mumbai', state: 'Maharashtra',
    status: 'pending', commissionRate: 4, totalLeads: 0, totalEarned: 0,
    thisMonth: 0, pending: 0, conversionRate: 0, joinedAt: '20 May 2024',
    lastActive: 'Never', bank: 'HDFC ••••6789', upi: 'vikram@hdfc',
    specialties: [],
  },
  {
    id: 'AG-CHN-002', name: 'Deepa Nandakumar', phone: '+91 89876 54321',
    email: 'deepa.n@medreferral.in', city: 'Chennai', state: 'Tamil Nadu',
    status: 'suspended', commissionRate: 3.75, totalLeads: 18, totalEarned: 72000,
    thisMonth: 0, pending: 0, conversionRate: 50, joinedAt: '1 Mar 2024',
    lastActive: '30 days ago', bank: 'Canara ••••4456', upi: 'deepa@upi',
    specialties: ['Oncology', 'Haematology'],
  },
];

// ─── Patients (cross-agent view) ─────────────────────────────────────────────

export const ADMIN_PATIENTS: AdminPatient[] = [
  { id: 101, name: 'Ramesh Kumar', phone: '+91 98765 43210', age: 45, gender: 'M', specialty: 'Orthopaedics', procedure: 'Knee Replacement', status: 'ipd_confirmed', commission: 4500, commPct: 3.75, packageCost: 120000, city: 'Hyderabad', hospital: 'Apollo Hospitals', agentId: 'AG-HYD-001', agentName: 'Rajesh Sharma', createdAt: '10 May 2024' },
  { id: 102, name: 'Priya Sharma', phone: '+91 97654 32109', age: 35, gender: 'F', specialty: 'Urology', procedure: 'Stone Removal', status: 'opd_scheduled', commission: 3900, commPct: 4.0, packageCost: 80000, city: 'Bangalore', hospital: 'Manipal Hospital', agentId: 'AG-HYD-001', agentName: 'Rajesh Sharma', createdAt: '12 May 2024' },
  { id: 103, name: 'Suresh Rao', phone: '+91 96543 21098', age: 52, gender: 'M', specialty: 'Cardiology', procedure: 'Angioplasty', status: 'new', commission: 8000, commPct: 4.0, packageCost: 200000, city: 'Chennai', hospital: null, agentId: 'AG-HYD-001', agentName: 'Rajesh Sharma', createdAt: '18 May 2024' },
  { id: 104, name: 'Meena Devi', phone: '+91 95432 10987', age: 28, gender: 'F', specialty: 'Gynecology', procedure: 'Laparoscopy', status: 'contacted', commission: 2800, commPct: 4.0, packageCost: 70000, city: 'Mumbai', hospital: 'Kokilaben Hospital', agentId: 'AG-HYD-001', agentName: 'Rajesh Sharma', createdAt: '20 May 2024' },
  { id: 105, name: 'Vijay Patel', phone: '+91 94321 09876', age: 60, gender: 'M', specialty: 'General Surgery', procedure: 'Gallbladder Removal', status: 'completed', commission: 3200, commPct: 4.0, packageCost: 80000, city: 'Delhi', hospital: 'Fortis Hospital', agentId: 'AG-HYD-001', agentName: 'Rajesh Sharma', createdAt: '22 Apr 2024' },
  { id: 106, name: 'Kavitha Reddy', phone: '+91 93210 98765', age: 42, gender: 'F', specialty: 'ENT', procedure: 'Tonsillectomy', status: 'lost', commission: 1500, commPct: 4.0, packageCost: 35000, city: 'Hyderabad', hospital: null, agentId: 'AG-HYD-001', agentName: 'Rajesh Sharma', createdAt: '5 May 2024' },
  { id: 107, name: 'Arjun Nair', phone: '+91 88765 43210', age: 38, gender: 'M', specialty: 'Cardiology', procedure: 'Bypass Surgery', status: 'ipd_confirmed', commission: 12000, commPct: 3.5, packageCost: 350000, city: 'Bangalore', hospital: 'Narayana Health', agentId: 'AG-BLR-001', agentName: 'Preethi Nair', createdAt: '8 May 2024' },
  { id: 108, name: 'Lakshmi Iyer', phone: '+91 87654 32109', age: 55, gender: 'F', specialty: 'Gynecology', procedure: 'Hysterectomy', status: 'opd_scheduled', commission: 4900, commPct: 3.5, packageCost: 140000, city: 'Bangalore', hospital: 'Manipal Hospital', agentId: 'AG-BLR-001', agentName: 'Preethi Nair', createdAt: '14 May 2024' },
  { id: 109, name: 'Mohammed Irfan', phone: '+91 86543 21098', age: 48, gender: 'M', specialty: 'Neurology', procedure: 'Brain Tumour Surgery', status: 'completed', commission: 18000, commPct: 4.0, packageCost: 450000, city: 'Mumbai', hospital: 'Kokilaben Hospital', agentId: 'AG-MUM-001', agentName: 'Amit Patel', createdAt: '2 Apr 2024' },
  { id: 110, name: 'Seema Kapoor', phone: '+91 85432 10987', age: 32, gender: 'F', specialty: 'Orthopaedics', procedure: 'Hip Replacement', status: 'ipd_confirmed', commission: 6800, commPct: 4.0, packageCost: 170000, city: 'Delhi', hospital: 'Max Hospital', agentId: 'AG-DEL-001', agentName: 'Sunita Verma', createdAt: '10 May 2024' },
  { id: 111, name: 'Ganesh Babu', phone: '+91 84321 09876', age: 65, gender: 'M', specialty: 'Cardiology', procedure: 'Valve Replacement', status: 'contacted', commission: 15000, commPct: 3.75, packageCost: 400000, city: 'Chennai', hospital: null, agentId: 'AG-CHN-001', agentName: 'Karthik Raja', createdAt: '15 May 2024' },
  { id: 112, name: 'Pooja Menon', phone: '+91 83210 98765', age: 25, gender: 'F', specialty: 'ENT', procedure: 'Cochlear Implant', status: 'new', commission: 8500, commPct: 4.0, packageCost: 212000, city: 'Chennai', hospital: null, agentId: 'AG-CHN-001', agentName: 'Karthik Raja', createdAt: '19 May 2024' },
  { id: 113, name: 'Santosh Desai', phone: '+91 82109 87654', age: 50, gender: 'M', specialty: 'Urology', procedure: 'Prostate Surgery', status: 'opd_scheduled', commission: 5200, commPct: 3.5, packageCost: 148000, city: 'Pune', hospital: 'Ruby Hall Clinic', agentId: 'AG-PNE-001', agentName: 'Meera Joshi', createdAt: '17 May 2024' },
  { id: 114, name: 'Anita Rao', phone: '+91 81098 76543', age: 44, gender: 'F', specialty: 'General Surgery', procedure: 'Appendectomy', status: 'completed', commission: 2100, commPct: 4.0, packageCost: 52000, city: 'Hyderabad', hospital: 'Yashoda Hospital', agentId: 'AG-HYD-002', agentName: 'Ravi Kumar', createdAt: '5 Apr 2024' },
  { id: 115, name: 'Rohit Malhotra', phone: '+91 80987 65432', age: 37, gender: 'M', specialty: 'Gastroenterology', procedure: 'Colonoscopy + Polypectomy', status: 'ipd_confirmed', commission: 3800, commPct: 4.0, packageCost: 95000, city: 'Hyderabad', hospital: 'KIMS Hospital', agentId: 'AG-HYD-002', agentName: 'Ravi Kumar', createdAt: '12 May 2024' },
];

// ─── Commissions ────────────────────────────────────────────────────────────

export const ADMIN_COMMISSIONS: AdminCommission[] = [
  { id: 1, agentId: 'AG-HYD-001', agentName: 'Rajesh Sharma', patientName: 'Ramesh Kumar', procedure: 'Knee Replacement', amount: 4500, status: 'pending_approval', createdAt: '24 May 2024' },
  { id: 2, agentId: 'AG-BLR-001', agentName: 'Preethi Nair', patientName: 'Arjun Nair', procedure: 'Bypass Surgery', amount: 12000, status: 'pending_approval', createdAt: '23 May 2024' },
  { id: 3, agentId: 'AG-DEL-001', agentName: 'Sunita Verma', patientName: 'Seema Kapoor', procedure: 'Hip Replacement', amount: 6800, status: 'pending_approval', createdAt: '22 May 2024' },
  { id: 4, agentId: 'AG-HYD-002', agentName: 'Ravi Kumar', patientName: 'Rohit Malhotra', procedure: 'Colonoscopy + Polypectomy', amount: 3800, status: 'pending_approval', createdAt: '21 May 2024' },
  { id: 5, agentId: 'AG-PNE-001', agentName: 'Meera Joshi', patientName: 'Santosh Desai', procedure: 'Prostate Surgery', amount: 5200, status: 'approved', createdAt: '18 May 2024', approvedAt: '20 May 2024' },
  { id: 6, agentId: 'AG-MUM-001', agentName: 'Amit Patel', patientName: 'Mohammed Irfan', procedure: 'Brain Tumour Surgery', amount: 18000, status: 'paid', createdAt: '5 Apr 2024', approvedAt: '7 Apr 2024', paidAt: '10 Apr 2024', utr: 'HDFC240410XXXX', method: 'Bank Transfer' },
  { id: 7, agentId: 'AG-HYD-001', agentName: 'Rajesh Sharma', patientName: 'Vijay Patel', procedure: 'Gallbladder Removal', amount: 3200, status: 'paid', createdAt: '28 Apr 2024', approvedAt: '30 Apr 2024', paidAt: '2 May 2024', utr: 'HDFC240502XXXX', method: 'Bank Transfer' },
  { id: 8, agentId: 'AG-HYD-002', agentName: 'Ravi Kumar', patientName: 'Anita Rao', procedure: 'Appendectomy', amount: 2100, status: 'paid', createdAt: '8 Apr 2024', approvedAt: '9 Apr 2024', paidAt: '12 Apr 2024', utr: 'UPI240412XXXX', method: 'UPI' },
  { id: 9, agentId: 'AG-BLR-001', agentName: 'Preethi Nair', patientName: 'Lakshmi Iyer', procedure: 'Hysterectomy', amount: 4900, status: 'approved', createdAt: '19 May 2024', approvedAt: '21 May 2024' },
  { id: 10, agentId: 'AG-CHN-002', agentName: 'Deepa Nandakumar', patientName: 'Naveen Kumar', procedure: 'Chemotherapy Support', amount: 6000, status: 'rejected', createdAt: '10 May 2024', rejectedReason: 'Agent account suspended — pending investigation.' },
];

// ─── Hospitals ───────────────────────────────────────────────────────────────

export const ADMIN_HOSPITALS: AdminHospital[] = [
  { id: 1, name: 'Apollo Hospitals', city: 'Hyderabad', state: 'Telangana', tier: 'preferred', specialties: ['Cardiology','Orthopaedics','Neurology','Oncology'], activePatients: 8, totalCases: 42, totalRevenue: 980000, status: 'active', contactPerson: 'Dr. Ramana Murthy', contactPhone: '+91 40 2360 7777', joinedAt: 'Jan 2024' },
  { id: 2, name: 'Manipal Hospital', city: 'Bangalore', state: 'Karnataka', tier: 'preferred', specialties: ['Urology','Gynecology','General Surgery'], activePatients: 6, totalCases: 31, totalRevenue: 620000, status: 'active', contactPerson: 'Ms. Kavya Rao', contactPhone: '+91 80 2502 4444', joinedAt: 'Jan 2024' },
  { id: 3, name: 'Kokilaben Hospital', city: 'Mumbai', state: 'Maharashtra', tier: 'preferred', specialties: ['Neurology','Cardiology','Oncology'], activePatients: 5, totalCases: 28, totalRevenue: 840000, status: 'active', contactPerson: 'Mr. Suresh Nair', contactPhone: '+91 22 3066 1234', joinedAt: 'Feb 2024' },
  { id: 4, name: 'Max Hospital', city: 'Delhi', state: 'Delhi', tier: 'standard', specialties: ['Orthopaedics','Cardiology'], activePatients: 4, totalCases: 19, totalRevenue: 420000, status: 'active', contactPerson: 'Dr. Anil Gupta', contactPhone: '+91 11 4055 4055', joinedAt: 'Mar 2024' },
  { id: 5, name: 'Fortis Hospital', city: 'Delhi', state: 'Delhi', tier: 'standard', specialties: ['General Surgery','ENT','Ophthalmology'], activePatients: 3, totalCases: 24, totalRevenue: 310000, status: 'active', contactPerson: 'Ms. Priya Khanna', contactPhone: '+91 11 4277 6222', joinedAt: 'Feb 2024' },
  { id: 6, name: 'Narayana Health', city: 'Bangalore', state: 'Karnataka', tier: 'preferred', specialties: ['Cardiology','Pediatrics','Cardiothoracic'], activePatients: 7, totalCases: 35, totalRevenue: 750000, status: 'active', contactPerson: 'Dr. Smitha Rao', contactPhone: '+91 80 7122 2200', joinedAt: 'Jan 2024' },
  { id: 7, name: 'KIMS Hospital', city: 'Hyderabad', state: 'Telangana', tier: 'standard', specialties: ['Gastroenterology','Nephrology'], activePatients: 4, totalCases: 18, totalRevenue: 280000, status: 'active', contactPerson: 'Mr. Vijay Kumar', contactPhone: '+91 40 4488 5000', joinedAt: 'Mar 2024' },
  { id: 8, name: 'Yashoda Hospital', city: 'Hyderabad', state: 'Telangana', tier: 'basic', specialties: ['General Surgery','ENT'], activePatients: 2, totalCases: 11, totalRevenue: 145000, status: 'active', contactPerson: 'Dr. Sridhar Reddy', contactPhone: '+91 40 4567 4567', joinedAt: 'Apr 2024' },
];

// ─── Monthly Revenue (12 months) ────────────────────────────────────────────

export const ADMIN_MONTHLY_REVENUE = [
  { month: 'Jun', year: '2023', revenue: 215400, commissions: 86160, agents: 4 },
  { month: 'Jul', year: '2023', revenue: 242800, commissions: 97120, agents: 5 },
  { month: 'Aug', year: '2023', revenue: 278500, commissions: 111400, agents: 5 },
  { month: 'Sep', year: '2023', revenue: 305200, commissions: 122080, agents: 6 },
  { month: 'Oct', year: '2023', revenue: 298400, commissions: 119360, agents: 7 },
  { month: 'Nov', year: '2023', revenue: 322100, commissions: 128840, agents: 7 },
  { month: 'Dec', year: '2023', revenue: 345600, commissions: 138240, agents: 8 },
  { month: 'Jan', year: '2024', revenue: 318900, commissions: 127560, agents: 8 },
  { month: 'Feb', year: '2024', revenue: 356200, commissions: 142480, agents: 9 },
  { month: 'Mar', year: '2024', revenue: 372800, commissions: 149120, agents: 9 },
  { month: 'Apr', year: '2024', revenue: 389500, commissions: 155800, agents: 10 },
  { month: 'May', year: '2024', revenue: 421300, commissions: 168520, agents: 10 },
];

// ─── Activity Log ─────────────────────────────────────────────────────────────

export const ACTIVITY_LOG: ActivityLog[] = [
  { id: 1, type: 'commission_approved', title: 'Commission Approved', detail: '₹5,200 for Santosh Desai (Meera Joshi)', time: '2h ago', actor: 'Admin' },
  { id: 2, type: 'agent_created', title: 'New Agent Registered', detail: 'Vikram Mehta — AG-MUM-002 (Mumbai) pending approval', time: '5h ago', actor: 'System' },
  { id: 3, type: 'patient_added', title: 'Patient Lead Added', detail: 'Pooja Menon — Cochlear Implant via Karthik Raja', time: '8h ago', actor: 'AG-CHN-001' },
  { id: 4, type: 'commission_paid', title: 'Commission Disbursed', detail: '₹18,000 to Amit Patel via Bank Transfer', time: '1d ago', actor: 'Admin' },
  { id: 5, type: 'agent_suspended', title: 'Agent Suspended', detail: 'Deepa Nandakumar (AG-CHN-002) — policy violation', time: '2d ago', actor: 'Admin' },
  { id: 6, type: 'commission_approved', title: 'Commission Approved', detail: '₹4,900 for Lakshmi Iyer (Preethi Nair)', time: '2d ago', actor: 'Admin' },
  { id: 7, type: 'patient_added', title: 'Patient Lead Added', detail: 'Rohit Malhotra — Gastroenterology via Ravi Kumar', time: '3d ago', actor: 'AG-HYD-002' },
];

// ─── Summary Stats ─────────────────────────────────────────────────────────

export const getAdminStats = () => {
  const activeAgents = ADMIN_AGENTS.filter(a => a.status === 'active').length;
  const totalPatients = ADMIN_PATIENTS.length;
  const pendingCommissions = ADMIN_COMMISSIONS.filter(c => c.status === 'pending_approval');
  const pendingAmount = pendingCommissions.reduce((s, c) => s + c.amount, 0);
  const thisMonthRevenue = ADMIN_MONTHLY_REVENUE[ADMIN_MONTHLY_REVENUE.length - 1].revenue;
  const lastMonthRevenue = ADMIN_MONTHLY_REVENUE[ADMIN_MONTHLY_REVENUE.length - 2].revenue;
  const revenueGrowth = (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1);
  return { activeAgents, totalPatients, pendingCommissions: pendingCommissions.length, pendingAmount, thisMonthRevenue, revenueGrowth };
};

// ─── Formatters ──────────────────────────────────────────────────────────────

export const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;
export const fmtL = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;

export const STATUS_BADGE: Record<AgentStatus, { label: string; bg: string; color: string }> = {
  active:    { label: 'Active',    bg: 'bg-emerald-50', color: 'text-emerald-700' },
  inactive:  { label: 'Inactive',  bg: 'bg-gray-100',   color: 'text-gray-600' },
  pending:   { label: 'Pending',   bg: 'bg-amber-50',   color: 'text-amber-700' },
  suspended: { label: 'Suspended', bg: 'bg-red-50',     color: 'text-red-700' },
};

export const COMMISSION_BADGE: Record<AdminCommission['status'], { label: string; bg: string; color: string }> = {
  pending_approval: { label: 'Pending',  bg: 'bg-amber-50',   color: 'text-amber-700' },
  approved:         { label: 'Approved', bg: 'bg-blue-50',    color: 'text-blue-700' },
  paid:             { label: 'Paid',     bg: 'bg-emerald-50', color: 'text-emerald-700' },
  rejected:         { label: 'Rejected', bg: 'bg-red-50',     color: 'text-red-700' },
};
