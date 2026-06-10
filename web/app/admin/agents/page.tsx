'use client';
import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { AdminAgent, AgentStatus, STATUS_BADGE, CITY_CODES, generateAgentId, fmtINR, fmtL } from '@/lib/admin-data';

type FilterStatus = AgentStatus | 'all';
const SPECIALTIES = ['Orthopaedics','Cardiology','Urology','Gynecology','General Surgery','ENT','Neurology','Ophthalmology','Oncology','Gastroenterology','Nephrology','Pulmonology'];
const CITIES = Object.keys(CITY_CODES);

// ── Validation helpers ────────────────────────────────────────────────────────
const isValidIndianPhone = (raw: string) =>
  /^[6-9]\d{9}$/.test(raw.replace(/[\s\-()]/g, '').replace(/^\+91/, ''));
const isValidName  = (v: string) =>
  v.trim().length >= 2 && v.trim().length <= 60 && /^[a-zA-Z\s\-.']+$/.test(v.trim());
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidUPI   = (v: string) => !v.trim() || /^[\w.\-]+@[\w]+$/.test(v.trim());
const genOTP       = () => String(Math.floor(100000 + Math.random() * 900000));
const OTP_TTL      = 5 * 60;
const fmtTime      = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

type AgentErrors = Partial<Record<'name' | 'phone' | 'email' | 'upi', string>>;

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1 flex items-center gap-1">⚠ {msg}</p>;
}

function AgentModal({ onClose, onSave, existing, agentCount }: {
  onClose: () => void;
  onSave: (agent: AdminAgent) => void;
  existing?: AdminAgent;
  agentCount: (city: string) => number;
}) {
  const [form, setForm] = useState({
    name: existing?.name ?? '', phone: existing?.phone ?? '', email: existing?.email ?? '',
    city: existing?.city ?? 'Hyderabad', state: existing?.state ?? 'Telangana',
    commissionRate: existing?.commissionRate ?? 4,
    bank: existing?.bank ?? '', upi: existing?.upi ?? '',
    specialties: existing?.specialties ?? [],
    status: existing?.status ?? 'pending' as AgentStatus,
  });
  const [errors, setErrors] = useState<AgentErrors>({});

  // ── Phone OTP state (only for new agents) ────────────────────────────────
  const isNew = !existing;
  const alreadyVerified = existing?.phoneVerified ?? false;
  const [phoneVerified, setPhoneVerified] = useState(alreadyVerified);
  const [otpSent,       setOtpSent]       = useState(false);
  const [otpCode,       setOtpCode]       = useState('');
  const [otpInput,      setOtpInput]      = useState('');
  const [otpError,      setOtpError]      = useState('');
  const [countdown,     setCountdown]     = useState(0);
  const [resendWait,    setResendWait]     = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    timerRef.current = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(timerRef.current!); return 0; } return c - 1; });
      setResendWait(r => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [otpSent]);

  // If phone changes after verification, reset verification
  const prevPhoneRef = useRef(form.phone);
  const handlePhoneChange = (val: string) => {
    setForm(f => ({ ...f, phone: val }));
    setErrors(e => ({ ...e, phone: undefined }));
    if (val !== prevPhoneRef.current) {
      prevPhoneRef.current = val;
      setPhoneVerified(false);
      setOtpSent(false);
      setOtpInput('');
      setOtpError('');
    }
  };

  const sendOTP = () => {
    const raw = form.phone.replace(/[\s\-()]/g, '').replace(/^\+91/, '');
    if (!isValidIndianPhone(raw)) {
      setErrors(e => ({ ...e, phone: 'Enter a valid 10-digit Indian mobile number (starts with 6–9)' }));
      return;
    }
    const code = genOTP();
    setOtpCode(code);
    setOtpInput('');
    setOtpError('');
    setOtpSent(true);
    setCountdown(OTP_TTL);
    setResendWait(30);
  };

  const verifyOTP = () => {
    if (countdown <= 0) { setOtpError('OTP expired. Send a new one.'); return; }
    if (otpInput.trim() === otpCode) {
      setPhoneVerified(true);
      setOtpSent(false);
      clearInterval(timerRef.current!);
    } else {
      setOtpError('Incorrect OTP. Please try again.');
    }
  };

  const set = (k: string, v: unknown) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k in (errors as object)) setErrors(e => ({ ...e, [k]: undefined }));
  };
  const toggleSpec = (s: string) => set('specialties', form.specialties.includes(s)
    ? form.specialties.filter(x => x !== s) : [...form.specialties, s]);

  const previewId = existing?.id ?? generateAgentId(form.city, agentCount(form.city) + 1);

  const validate = (): boolean => {
    const errs: AgentErrors = {};
    if (!form.name.trim())
      errs.name = 'Full name is required';
    else if (!isValidName(form.name))
      errs.name = 'Name must be 2–60 characters, letters and spaces only';

    const rawPhone = form.phone.replace(/[\s\-()]/g, '').replace(/^\+91/, '');
    if (!rawPhone)
      errs.phone = 'Phone number is required';
    else if (!isValidIndianPhone(rawPhone))
      errs.phone = 'Enter a valid 10-digit Indian mobile number (starts with 6–9)';

    if (form.email.trim() && !isValidEmail(form.email))
      errs.email = 'Enter a valid email address (e.g. agent@example.com)';
    if (form.upi && !isValidUPI(form.upi))
      errs.upi = 'Enter a valid UPI ID (e.g. agent@hdfc or name@okaxis)';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (isNew && !phoneVerified) {
      setErrors(e => ({ ...e, phone: 'Mobile number must be verified before creating the agent' }));
      return;
    }
    const digits    = form.phone.replace(/[\s\-()]/g, '').replace(/^\+91/, '');
    const normPhone = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    const saved     = { ...form, phone: normPhone };
    onSave(existing
      ? { ...existing, ...saved, phoneVerified: existing.phoneVerified }
      : { ...saved, id: previewId, role: 'agent' as const, phoneVerified: true, totalLeads: 0, totalEarned: 0, thisMonth: 0, pending: 0, conversionRate: 0, joinedAt: '', lastActive: 'Never' }
    );
  };

  const iCls = (field: keyof AgentErrors) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
      errors[field] ? 'border-red-400 focus:ring-red-300 bg-red-50/30' : 'border-gray-200 focus:ring-indigo-500'
    }`;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <div className="font-bold text-gray-900 text-lg">{existing ? 'Edit Agent' : 'Create New Agent'}</div>
            {!existing && <div className="text-xs text-gray-400 mt-0.5">Phone number must be verified before saving</div>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">✕</button>
        </div>
        <div className="p-6 space-y-5">
          {!existing && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-indigo-600 text-lg">🪪</span>
              <div>
                <div className="text-xs text-indigo-600 font-medium">Auto-generated Agent ID</div>
                <div className="font-bold text-indigo-800 text-sm">{previewId}</div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
              <input value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                className={iCls('name')} />
              <FieldErr msg={errors.name} />
            </div>

            {/* ── Phone + OTP Verification ──────────────────────────────── */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mobile Number *
                {phoneVerified && (
                  <span className="ml-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">✅ Verified</span>
                )}
                {isNew && !phoneVerified && (
                  <span className="ml-2 text-xs text-amber-600 font-normal">— must verify via OTP</span>
                )}
              </label>

              {/* Phone input row */}
              <div className="flex gap-2">
                <div className="flex items-center border border-gray-200 rounded-xl px-3 bg-gray-50 text-sm text-gray-700 whitespace-nowrap">🇮🇳 +91</div>
                <input
                  value={form.phone.replace(/^\+91\s?/, '')}
                  onChange={e => handlePhoneChange(e.target.value.replace(/[^\d\s\-]/g, ''))}
                  maxLength={13}
                  placeholder="98765 43210"
                  readOnly={phoneVerified}
                  className={`flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
                    phoneVerified ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800 cursor-not-allowed' :
                    errors.phone  ? 'border-red-400 focus:ring-red-300 bg-red-50/30' : 'border-gray-200 focus:ring-indigo-500'
                  }`} />
                {isNew && !phoneVerified && !otpSent && (
                  <button type="button" onClick={sendOTP}
                    className="whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors">
                    Send OTP
                  </button>
                )}
                {phoneVerified && isNew && (
                  <button type="button" onClick={() => { setPhoneVerified(false); setOtpSent(false); }}
                    className="whitespace-nowrap text-xs text-gray-400 hover:text-gray-600 px-3 py-2.5 border border-gray-200 rounded-xl">
                    Change
                  </button>
                )}
              </div>
              <FieldErr msg={errors.phone} />

              {/* OTP panel */}
              {isNew && otpSent && !phoneVerified && (
                <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-blue-800">📨 OTP sent to +91 {form.phone.replace(/^\+91\s?/, '')}</div>
                      <div className="text-xs text-blue-600 mt-0.5">Valid for {fmtTime(countdown)}</div>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${countdown < 60 ? 'text-red-500' : 'text-blue-600'}`}>{fmtTime(countdown)}</span>
                  </div>
                  {/* Demo OTP */}
                  <div className="flex items-center gap-2 bg-white border border-blue-100 rounded-lg px-3 py-2">
                    <span className="text-[10px] text-blue-400">🔬 Demo OTP:</span>
                    <code className="text-base font-bold font-mono tracking-[0.3em] text-blue-700 select-all">{otpCode}</code>
                  </div>
                  {/* OTP input */}
                  <div className="flex gap-2">
                    <input
                      type="text" inputMode="numeric" maxLength={6} value={otpInput}
                      onChange={e => { setOtpInput(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                      placeholder="Enter 6-digit OTP"
                      className={`flex-1 border-2 rounded-xl px-4 py-2.5 text-center text-lg font-bold font-mono tracking-[0.4em] focus:outline-none transition-colors ${
                        otpError ? 'border-red-400 bg-red-50/30' : 'border-blue-300 focus:border-indigo-500'
                      }`} />
                    <button type="button" onClick={verifyOTP}
                      disabled={otpInput.length !== 6 || countdown <= 0}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl whitespace-nowrap">
                      ✓ Verify
                    </button>
                  </div>
                  {otpError && <p className="text-xs text-red-500">⚠ {otpError}</p>}
                  <div className="flex justify-between text-xs">
                    {resendWait > 0
                      ? <span className="text-gray-400">Resend in {resendWait}s</span>
                      : <button type="button" onClick={sendOTP} className="text-indigo-600 hover:underline font-medium">Resend OTP</button>
                    }
                    <button type="button" onClick={() => { setOtpSent(false); setOtpInput(''); setOtpError(''); }}
                      className="text-gray-400 hover:text-gray-600">← Change number</button>
                  </div>
                </div>
              )}

              {/* Verified confirmation strip */}
              {isNew && phoneVerified && (
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                  <span>✅</span>
                  <span className="font-medium">Mobile number verified — agent will have full access from day one</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="email" value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="agent@example.com"
                className={iCls('email')} />
              <FieldErr msg={errors.email} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
              <select value={form.city} onChange={e => set('city', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
              <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="e.g. Telangana"
                maxLength={50}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Commission Rate (%)</label>
              <select value={form.commissionRate} onChange={e => set('commissionRate', parseFloat(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {[
                  1, 1.5, 2, 2.5, 3, 3.25, 3.5, 3.75,
                  4, 4.25, 4.5, 4.75, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5,
                  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
                ].map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank Account</label>
              <input value={form.bank} onChange={e => set('bank', e.target.value)}
                placeholder="HDFC ••••1234"
                maxLength={50}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">UPI ID <span className="text-gray-400 font-normal">(optional)</span></label>
              <input value={form.upi} onChange={e => set('upi', e.target.value)}
                placeholder="agent@hdfc"
                className={iCls('upi')} />
              <FieldErr msg={errors.upi} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specialties</label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map(s => (
                <button key={s} onClick={() => toggleSpec(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    form.specialties.includes(s) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-2.5 text-sm font-semibold transition-all">Cancel</button>
          <button onClick={handleSave}
            className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-all">
            {existing ? 'Save Changes' : '+ Create Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const { agents, createAgent, updateAgent, approveAgent, suspendAgent, restoreAgent } = useStore();
  const [tab,       setTab]       = useState<'agents' | 'managers'>('agents');
  const [filter,    setFilter]    = useState<FilterStatus>('all');
  const [search,    setSearch]    = useState('');
  const [modal,     setModal]     = useState<'create' | 'edit' | null>(null);
  const [editing,   setEditing]   = useState<AdminAgent | undefined>();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Separate agents and managers
  const onlyAgents   = agents.filter(a => a.role === 'agent' || !a.role);
  const onlyManagers = agents.filter(a => a.role === 'manager');
  const viewList     = tab === 'managers' ? onlyManagers : onlyAgents;

  const filtered = viewList
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()) || a.city.toLowerCase().includes(search.toLowerCase()) || (a.email ?? '').toLowerCase().includes(search.toLowerCase()));

  const statusCounts: Record<string, number> = { all: viewList.length };
  viewList.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1; });

  const agentCount = (city: string) => agents.filter(a => a.city === city && (a.role === 'agent' || !a.role)).length;

  const handleSave = (agent: AdminAgent) => {
    if (editing) updateAgent(agent);
    else createAgent({ ...agent, role: tab === 'managers' ? 'manager' : 'agent' });
    setModal(null); setEditing(undefined);
  };

  const filters: { k: FilterStatus; l: string }[] = [
    { k: 'all',       l: 'All' },
    { k: 'active',    l: '🟢 Active' },
    { k: 'pending',   l: '🟡 Pending' },
    { k: 'inactive',  l: '⚪ Inactive' },
    { k: 'suspended', l: '🔴 Suspended' },
  ];

  return (
    <div className="space-y-5">
      {/* Role tabs */}
      <div className="flex items-center gap-2">
        {([['agents','👥 Agents', onlyAgents.length], ['managers','🧑‍💼 Managers', onlyManagers.length]] as const).map(([t, label, count]) => (
          <button key={t} onClick={() => { setTab(t); setFilter('all'); setSearch(''); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${tab === t ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
            {label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: tab === 'managers' ? 'Total Managers' : 'Total Agents', value: viewList.length,               color: 'text-gray-900' },
          { label: 'Active',             value: statusCounts.active ?? 0,       color: 'text-emerald-600' },
          { label: 'Pending Approval',   value: statusCounts.pending ?? 0,      color: 'text-amber-600' },
          { label: 'Suspended',          value: statusCounts.suspended ?? 0,    color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div suppressHydrationWarning className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab} by name, ID, city or email…`}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={() => { setEditing(undefined); setModal('create'); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap">
            + {tab === 'managers' ? 'Create Manager' : 'Create Agent'}
          </button>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {filters.map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === f.k ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}>
              {f.l} {statusCounts[f.k] !== undefined ? `(${statusCounts[f.k]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 text-sm text-gray-500">
          Showing <strong className="text-gray-900">{filtered.length}</strong> of {viewList.length} {tab}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {(tab === 'agents'
                  ? ['Agent','ID','City','Manager','Commission','Leads','This Month','Conv.%','Status','Last Active','KYC','Actions']
                  : ['Manager','ID','City','Team Agents','Status','Last Active','Actions']
                ).map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={12} className="px-5 py-16 text-center text-gray-400"><div className="text-4xl mb-2">👥</div><div className="font-medium">No {tab} found</div></td></tr>
              ) : filtered.map(a => {
                const badge   = STATUS_BADGE[a.status];
                const manager = a.managerId ? agents.find(m => m.id === a.managerId) : undefined;
                const teamSize = tab === 'managers' ? agents.filter(x => x.managerId === a.id).length : 0;
                return (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${tab === 'managers' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>{a.name[0]}</div>
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                            {a.name}
                            {tab === 'managers' && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">MGR</span>}
                          </div>
                          <div className="text-xs text-gray-400">{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><code className="text-xs bg-gray-100 px-2 py-0.5 rounded-md font-mono">{a.id}</code></td>
                    <td className="px-5 py-3.5 text-gray-600">{a.city}</td>
                    {tab === 'agents' ? (
                      <td className="px-5 py-3.5">
                        {manager
                          ? <span className="text-xs text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full font-medium">{manager.name}</span>
                          : <span className="text-xs text-gray-300">—</span>}
                      </td>
                    ) : (
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-purple-600">{teamSize}</span>
                        <span className="text-xs text-gray-400 ml-1">agents</span>
                      </td>
                    )}
                    {tab === 'agents' && <>
                      <td className="px-5 py-3.5 font-semibold text-indigo-600">{a.commissionRate}%</td>
                      <td className="px-5 py-3.5 text-gray-700">{a.totalLeads}</td>
                      <td className="px-5 py-3.5 font-semibold text-emerald-600">{a.thisMonth > 0 ? fmtINR(a.thisMonth) : '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`font-bold text-sm ${a.conversionRate >= 65 ? 'text-emerald-600' : a.conversionRate >= 40 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {a.conversionRate > 0 ? `${a.conversionRate}%` : '—'}
                        </span>
                      </td>
                    </>}
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.bg} ${badge.color}`}>{badge.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{a.lastActive}</td>
                    {tab === 'agents' && (
                      <td className="px-5 py-3.5">
                        {a.kycStatus === 'approved'  && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">✅ KYC</span>}
                        {a.kycStatus === 'submitted' && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50  text-violet-700  border border-violet-200  whitespace-nowrap">⏳ KYC Pending</span>}
                        {a.kycStatus === 'rejected'  && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50    text-red-600    border border-red-200    whitespace-nowrap">❌ KYC Rejected</span>}
                        {(!a.kycStatus || a.kycStatus === 'not_submitted') && (
                          a.phoneVerified
                            ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">📋 KYC Required</span>
                            : <span className="text-[10px] text-gray-300 whitespace-nowrap">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setEditing(a); setModal('edit'); }} className="text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors">Edit</button>
                        {a.status === 'pending'   && <button onClick={() => approveAgent(a.id)}    className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors">Approve</button>}
                        {a.status === 'active'    && <button onClick={() => setConfirmId(a.id)}    className="text-xs font-medium text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors">Suspend</button>}
                        {a.status === 'suspended' && <button onClick={() => restoreAgent(a.id)}    className="text-xs font-medium text-emerald-700 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors">Restore</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <AgentModal onClose={() => { setModal(null); setEditing(undefined); }} onSave={handleSave} existing={editing} agentCount={agentCount} />
      )}

      {confirmId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setConfirmId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-4 text-center">⛔</div>
            <h3 className="font-bold text-gray-900 text-center text-lg mb-2">Suspend Agent?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will prevent {agents.find(a => a.id === confirmId)?.name} from submitting new leads. You can restore access later.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)} className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={() => { suspendAgent(confirmId); setConfirmId(null); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-all">Suspend</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
