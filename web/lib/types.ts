export type PatientStatus = 'new' | 'contacted' | 'opd_scheduled' | 'ipd_confirmed' | 'completed' | 'lost';

export interface Patient {
  id: number;
  name: string;
  phone: string;
  age: number;
  gender: 'M' | 'F';
  specialty: string;
  procedure: string;
  status: PatientStatus;
  commission: number;
  commPct: number;
  packageCost: number;
  city: string;
  hospital: string | null;
  doctor: string | null;
  urgency: string;
  budget: string;
  insurance: boolean;
  insuranceProv?: string;
  notes: string;
  opd: string | null;
  surgeryDate: string | null;
  discharge: string | null;
  createdAt: string;
}

export interface Notification {
  id: number;
  type: 'commission' | 'patient' | 'appointment' | 'alert';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export interface Commission {
  id: number;
  patientName: string;
  procedure: string;
  amount: number;
  status: 'pending' | 'paid';
  stage?: string;
  estimatedDate?: string;
  paidDate?: string;
  method?: string;
  utr?: string;
  cases?: number;
}

export const STATUS_CONFIG: Record<PatientStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  new:           { label: 'New',           color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-500' },
  contacted:     { label: 'Contacted',     color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-500' },
  opd_scheduled: { label: 'OPD Scheduled', color: 'text-green-700',   bg: 'bg-green-50',   border: 'border-green-200',  dot: 'bg-green-500' },
  ipd_confirmed: { label: 'IPD Confirmed', color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200', dot: 'bg-purple-500' },
  completed:     { label: 'Completed',     color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',dot: 'bg-emerald-500' },
  lost:          { label: 'Lost',          color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',    dot: 'bg-red-500' },
};
