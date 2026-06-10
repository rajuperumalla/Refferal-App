'use client';
import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { AdminAgent, AgentStatus, STATUS_BADGE, CITY_CODES, generateAgentId, fmtINR, fmtL } from '@/lib/admin-data';

const CITIES = Object.keys(CITY_CODES);
const CITY_STATE: Record<string, string> = {
  'Hyderabad': 'Telangana', 'Bangalore': 'Karnataka', 'Mumbai': 'Maharashtra',
  'Delhi': 'Delhi', 'Chennai': 'Tamil Nadu', 'Pune': 'Maharashtra',
  'Kolkata': 'West Bengal', 'Ahmedabad': 'Gujarat',
};

const isValidIndianPhone = (raw: string) =>
  /^[6-9]\d{9}$/.test(raw.replace(/[\s\-()]/g, '').replace(/^\+91/, ''));
const isValidName  = (v: string) =>
  v.trim().length >= 2 && v.trim().length <= 60 && /^[a-zA-Z\s\-.']+$/.test(v.trim());
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const genOTP       = () => String(Math.floor(100000 + Math.random() * 900000));
const OTP_TTL      = 5 * 60;
const fmtTime      = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1 flex items-center gap-1">⚠ {msg}</p>;
}

// ── Manager Modal ─────────────────────────────────────────────────────────────
function ManagerModal({ onClose, onSave, existing, managerCount }: {
  onClose: () => void;
  onSave: (agent: AdminAgent) => void;
  existing?: AdminAgent;
  managerCount: (city: string) => number;
}) {
  const isNew = !existing;
  const [form, setForm] = useState({
    name:  existing?.name  ?? '',
    phone: existing?.phone ?? '',
    email: existing?.email ?? '',
    city:  existing?.city  ?? 'Hyderabad',
    state: existing?.state ?? 'Telangana',
  });
  const [errors, setErrors] = useState<Partial<Record<'name' | 'phone' | 'email', string>>>({});

  const alreadyVerified = existing?.phoneVerified ?? false;
  const [phoneVerified, setPhoneVerified] = useState(alreadyVerified);
  const [otpSent,    setOtpSent]    = useState(false);
  const [otpCode,    setOtpCode]    = useState('');
  const [otpInput,   setOtpInput]   = useState('');
  const [otpError,   setOtpError]   = useState('');
  const [countdown,  setCountdown]  = useState(0);
  const [resendWait, setResendWait] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    timerRef.current = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(timerRef.current!); return 0; } return c - 1; });
      setResendWait(r => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [otpSent]);

  const prevPhoneRef = useRef(form.phone);
  const handlePhoneChange = (val: string) => {
    setForm(f => ({ ...f, phone: val }));
    setErrors(e => ({ ...e, phone: undefined }));
    if (val !== prevPhoneRef.current) {
      prevPhoneRef.current = val;
      setPhoneVerified(false); setOtpSent(false); setOtpInput(''); setOtpError('');
    }
  };

  const sendOTP = () => {
    const raw = form.phone.replace(/[\s\-()]/g, '').replace(/^\+91/, '');
    if (!isValidIndianPhone(raw)) {
      setErrors(e => ({ ...e, phone: 'Enter a valid 10-digit Indian mobile number' }));
      return;
    }
    const code = genOTP();
    setOtpCode(code); setOtpInput(''); setOtpError('');
    setOtpSent(true); setCountdown(OTP_TTL); setResendWait(30);
  };

  const verifyOTP = () => {
    if (countdown <= 0) { setOtpError('OTP expired. Send a new one.'); return; }
    if (otpInput.trim() === otpCode) {
      setPhoneVerified(true); setOtpSent(false); clearInterval(timerRef.current!);
    } else {
      setOtpError('Incorrect OTP. Please try again.');
    }
  };

  const setCity = (city: string) => setForm(f => ({ ...f, city, state: CITY_STATE[city] ?? f.state }));
  const previewId = existing?.id ?? generateAgentId(form.city, managerCount(form.city) + 1, 'manager');

  const handleSave = () => {
    const errs: typeof errors = {};
    if (!form.name.trim() || !isValidName(form.name))
      errs.name = !form.name.trim() ? 'Full name is required' : 'Name must be 2–60 characters, letters only';
    const rawPhone = form.phone.replace(/[\s\-()]/g, '').replace(/^\+91/, '');
    if (!rawPhone) errs.phone = 'Phone number is required';
    else if (!isValidIndianPhone(rawPhone)) errs.phone = 'Enter a valid 10-digit Indian mobile number';
    if (form.email.trim() && !isValidEmail(form.email)) errs.email = 'Enter a valid email address';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (isNew && !phoneVerified) {
      setErrors(e => ({ ...e, phone: 'Mobile number must be verified before creating the manager' }));
      return;
    }
    const digits    = form.phone.replace(/[\s\-()]/g, '').replace(/^\+91/, '');
    const normPhone = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    onSave(existing
      ? { ...existing, name: form.name, phone: normPhone, email: form.email, city: form.city, state: form.state }
      : {
          id: previewId, role: 'manager' as const,
          name: form.name, phone: normPhone, email: form.email,
          city: form.city, state: form.state,
          phoneVerified: true, commissionRate: 0,
          bank: '', upi: '', specialties: [],
          status: 'active' as const,
          totalLeads: 0, totalEarned: 0, thisMonth: 0, pending: 0,
          conversionRate: 0, joinedAt: '', lastActive: 'Never',
        }
    );
  };

  const iCls = (f: 'name' | 'phone' | 'email') =>
    `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
      errors[f] ? 'border-red-400 focus:ring-red-300 bg-red-50/30' : 'border-gray-200 focus:ring-purple-500'
    }`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 rounded-t-2xl"
          style={{ background: 'linear-gradient(135deg,#faf5ff,#ede9fe)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-600 flex items-center justify-center text-white text-xl shadow-sm">🧑‍💼</div>
              <div>
                <div className="font-bold text-gray-900">{existing ? 'Edit Manager' : 'Add New Manager'}</div>
                <div className="text-xs text-gray-500 mt-0.5">{existing ? `ID: ${existing.id}` : 'Employee — phone verification required'}</div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/60 flex items-center justify-center text-gray-500 text-lg transition-colors">✕</button>
          </div>

          {/* Employee tag */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200 tracking-wide uppercase">Employee</span>
            <span className="text-[10px] text-gray-500">Managed internally · Salary-based · Not commission-driven</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Auto ID */}
          {!existing && (
            <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
              <span className="text-purple-500 text-lg">🪪</span>
              <div>
                <div className="text-[10px] text-purple-500 font-semibold uppercase tracking-wider">Auto-generated Manager ID</div>
                <div className="font-bold text-purple-800 font-mono text-sm">{previewId}</div>
              </div>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
            <input value={form.name}
              onChange={e => { setForm(f => ({...f, name: e.target.value})); setErrors(e2 => ({...e2, name: undefined})); }}
              placeholder="e.g. Vikram Reddy" className={iCls('name')} />
            <FieldErr msg={errors.name} />
          </div>

          {/* Phone + OTP */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Mobile Number *
              {phoneVerified && <span className="ml-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">✅ Verified</span>}
              {isNew && !phoneVerified && <span className="ml-2 text-xs text-amber-600 font-normal">— OTP required</span>}
            </label>
            <div className="flex gap-2">
              <div className="flex items-center border border-gray-200 rounded-xl px-3 bg-gray-50 text-sm text-gray-700 whitespace-nowrap font-medium">🇮🇳 +91</div>
              <input
                value={form.phone.replace(/^\+91\s?/, '')}
                onChange={e => handlePhoneChange(e.target.value.replace(/[^\d\s\-]/g, ''))}
                maxLength={13} placeholder="98765 43210" readOnly={phoneVerified}
                className={`flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
                  phoneVerified ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800 cursor-not-allowed'
                    : errors.phone ? 'border-red-400 focus:ring-red-300 bg-red-50/30' : 'border-gray-200 focus:ring-purple-500'}`} />
              {isNew && !phoneVerified && !otpSent && (
                <button type="button" onClick={sendOTP}
                  className="whitespace-nowrap bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
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
              <div className="mt-3 bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-purple-800">📨 OTP sent to +91 {form.phone.replace(/^\+91\s?/, '')}</div>
                    <div className="text-xs text-purple-500 mt-0.5">Expires in {fmtTime(countdown)}</div>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${countdown < 60 ? 'text-red-500' : 'text-purple-600'}`}>{fmtTime(countdown)}</span>
                </div>
                <div className="flex items-center gap-2 bg-white border border-purple-100 rounded-lg px-3 py-2">
                  <span className="text-[10px] text-purple-400">🔬 Demo OTP:</span>
                  <code className="text-base font-bold font-mono tracking-[0.35em] text-purple-700 select-all">{otpCode}</code>
                </div>
                <div className="flex gap-2">
                  <input type="text" inputMode="numeric" maxLength={6} value={otpInput}
                    onChange={e => { setOtpInput(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                    placeholder="Enter 6-digit OTP"
                    className={`flex-1 border-2 rounded-xl px-4 py-2.5 text-center text-xl font-bold font-mono tracking-[0.4em] focus:outline-none transition-colors ${
                      otpError ? 'border-red-400 bg-red-50/30' : 'border-purple-200 focus:border-purple-500'}`} />
                  <button type="button" onClick={verifyOTP} disabled={otpInput.length !== 6 || countdown <= 0}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold px-5 rounded-xl whitespace-nowrap transition-colors">
                    ✓ Verify
                  </button>
                </div>
                {otpError && <p className="text-xs text-red-500 flex items-center gap-1">⚠ {otpError}</p>}
                <div className="flex justify-between text-xs">
                  {resendWait > 0
                    ? <span className="text-gray-400">Resend in {resendWait}s</span>
                    : <button type="button" onClick={sendOTP} className="text-purple-600 hover:underline font-medium">Resend OTP</button>}
                  <button type="button" onClick={() => { setOtpSent(false); setOtpInput(''); setOtpError(''); }}
                    className="text-gray-400 hover:text-gray-600">← Change number</button>
                </div>
              </div>
            )}
            {isNew && phoneVerified && (
              <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                ✅ <span className="font-medium">Verified — manager account will be active immediately</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
              Email
              <span className="font-normal text-gray-400 text-xs">(optional)</span>
              <span className="text-[10px] text-blue-500 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">manager can verify later</span>
            </label>
            <input type="email" value={form.email}
              onChange={e => { setForm(f => ({...f, email: e.target.value})); setErrors(e2 => ({...e2, email: undefined})); }}
              placeholder="name@medireferral.in" className={iCls('email')} />
            <FieldErr msg={errors.email} />
          </div>

          {/* State + City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">State *</label>
              <input value={form.state}
                onChange={e => setForm(f => ({...f, state: e.target.value}))}
                placeholder="e.g. Telangana"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">District / City *</label>
              <select value={form.city} onChange={e => setCity(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-2.5 text-sm font-semibold transition-all">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-sm">
            {existing ? '✓ Save Changes' : '+ Add Manager'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ManagersPage() {
  const { agents, patients, commissions, createAgent, updateAgent, approveAgent, suspendAgent, restoreAgent } = useStore();
  const [modal,     setModal]     = useState<'create' | 'edit' | null>(null);
  const [editing,   setEditing]   = useState<AdminAgent | undefined>();
  const [search,    setSearch]    = useState('');
  const [confirmId, setConfirmId] = useState<{ id: string; action: 'suspend' | 'restore' } | null>(null);

  const managers = agents.filter(a => a.role === 'manager');
  const managerCount = (city: string) => managers.filter(a => a.city === city).length;

  const filtered = managers.filter(m =>
    !search ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase()) ||
    m.city.toLowerCase().includes(search.toLowerCase()) ||
    (m.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Per-manager computed stats
  const mgrStats = (mgr: AdminAgent) => {
    const team      = agents.filter(a => a.role === 'agent' && a.managerId === mgr.id);
    const teamIds   = team.map(a => a.id);
    const teamPats  = patients.filter(p => teamIds.includes(p.agentId));
    const teamComms = commissions.filter(c => teamIds.includes(c.agentId));
    const active    = team.filter(a => a.status === 'active').length;
    const pending   = team.filter(a => a.status === 'pending').length;
    const thisMonth = team.reduce((s, a) => s + a.thisMonth, 0);
    const totalEarned = team.reduce((s, a) => s + a.totalEarned, 0);
    const completed = teamPats.filter(p => p.status === 'completed').length;
    const ipd       = teamPats.filter(p => p.status === 'ipd_confirmed').length;
    const convRate  = teamPats.length > 0 ? Math.round((completed / teamPats.length) * 100) : 0;
    const pendAmt   = teamComms.filter(c => c.status === 'pending_approval').reduce((s, c) => s + c.amount, 0);
    const topAgent  = [...team].sort((a, b) => b.thisMonth - a.thisMonth)[0];
    return { team, active, pending, thisMonth, totalEarned, teamPats, completed, ipd, convRate, pendAmt, topAgent };
  };

  const handleSave = (agent: AdminAgent) => {
    if (editing) updateAgent(agent);
    else createAgent({ ...agent, role: 'manager' });
    setModal(null); setEditing(undefined);
  };

  const totalTeamRevenue = managers.reduce((s, m) => {
    const team = agents.filter(a => a.role === 'agent' && a.managerId === m.id);
    return s + team.reduce((ts, a) => ts + a.thisMonth, 0);
  }, 0);
  const totalAgentsUnder = agents.filter(a => a.role === 'agent' && managers.some(m => m.id === a.managerId)).length;

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Managers</h2>
          <p className="text-sm text-gray-500 mt-0.5">Internal employees · Manage agent teams · Performance-tracked</p>
        </div>
        <button onClick={() => { setEditing(undefined); setModal('create'); }}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
          + Add Manager
        </button>
      </div>

      {/* Distinction banner */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-start gap-3 bg-purple-50 border border-purple-100 rounded-2xl p-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 text-xl flex-shrink-0">🧑‍💼</div>
          <div>
            <div className="font-semibold text-purple-900 text-sm">Managers — Our Employees</div>
            <div className="text-xs text-purple-600 mt-0.5 leading-relaxed">Internal staff. Paid salaries based on team performance. Responsible for recruiting &amp; managing agents, submitting patient leads, and hitting team targets.</div>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl flex-shrink-0">👥</div>
          <div>
            <div className="font-semibold text-indigo-900 text-sm">Agents — External Referrers</div>
            <div className="text-xs text-indigo-600 mt-0.5 leading-relaxed">Independent referral partners. Earn commission per converted patient. No fixed salary. Managed via the Agents section.</div>
          </div>
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Managers',     value: managers.length,                                                                    color: 'text-purple-700', bg: 'bg-purple-50',  icon: '🧑‍💼' },
          { label: 'Active',             value: managers.filter(m => m.status === 'active').length,                                 color: 'text-emerald-600',bg: 'bg-emerald-50', icon: '✅' },
          { label: 'Agents Under Mgmt',  value: totalAgentsUnder,                                                                   color: 'text-blue-600',   bg: 'bg-blue-50',    icon: '👥' },
          { label: 'Team Revenue (Month)',value: fmtL(totalTeamRevenue),                                                             color: 'text-gray-900',   bg: 'bg-gray-50',    icon: '💰' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center text-lg flex-shrink-0`}>{s.icon}</div>
            <div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search managers by name, ID, city or email…"
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
      </div>

      {/* Manager cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <div className="text-5xl mb-3">🧑‍💼</div>
          <div className="font-semibold text-gray-700 mb-1">{search ? 'No managers match your search' : 'No managers yet'}</div>
          <div className="text-sm text-gray-400 mb-4">{search ? 'Try a different keyword' : 'Add your first manager to get started'}</div>
          {!search && (
            <button onClick={() => { setEditing(undefined); setModal('create'); }}
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              + Add First Manager
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(mgr => {
            const { team, active, pending, thisMonth, totalEarned, teamPats, completed, ipd, convRate, pendAmt, topAgent } = mgrStats(mgr);
            const badge = STATUS_BADGE[mgr.status];
            const joinDate = mgr.joinedAt || '—';

            return (
              <div key={mgr.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all overflow-hidden">

                {/* Card header */}
                <div className="p-5 flex items-start justify-between"
                  style={{ background: 'linear-gradient(135deg,#faf5ff 0%,#f5f3ff 100%)' }}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                        {mgr.name[0]}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${mgr.status === 'active' ? 'bg-emerald-400' : mgr.status === 'pending' ? 'bg-amber-400' : 'bg-red-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{mgr.name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 tracking-wider uppercase">Employee</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 font-mono">{mgr.id}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{mgr.city}, {mgr.state}</div>
                      {mgr.email && <div className="text-[10px] text-gray-400">{mgr.email}</div>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.bg} ${badge.color}`}>{badge.label}</span>
                    <span className="text-[10px] text-gray-400">Joined {joinDate}</span>
                  </div>
                </div>

                {/* Performance metrics */}
                <div className="px-5 py-3 grid grid-cols-4 gap-2 border-b border-gray-50">
                  {[
                    { icon: '👥', label: 'Agents',    value: team.length,       sub: `${active} active`,  color: 'text-blue-600',    bg: 'bg-blue-50' },
                    { icon: '🏥', label: 'Patients',  value: teamPats.length,   sub: `${ipd} IPD`,        color: 'text-indigo-600',  bg: 'bg-indigo-50' },
                    { icon: '📈', label: 'Conversion',value: `${convRate}%`,    sub: `${completed} done`, color: convRate >= 60 ? 'text-emerald-600' : 'text-amber-600', bg: convRate >= 60 ? 'bg-emerald-50' : 'bg-amber-50' },
                    { icon: '⏳', label: 'Pending',   value: fmtL(pendAmt),     sub: 'to approve',        color: 'text-orange-600',  bg: 'bg-orange-50' },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-2 text-center`}>
                      <div className="text-sm mb-0.5">{s.icon}</div>
                      <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-[9px] text-gray-500 font-medium">{s.label}</div>
                      <div className="text-[9px] text-gray-400">{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Revenue row */}
                <div className="px-5 py-3 flex items-center justify-between border-b border-gray-50">
                  <div>
                    <div className="text-xs text-gray-500">Team Revenue This Month</div>
                    <div className="text-lg font-bold text-purple-700">{fmtINR(thisMonth)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total Team Earned</div>
                    <div className="text-sm font-bold text-gray-700">{fmtL(totalEarned)}</div>
                  </div>
                  {pending > 0 && (
                    <div className="text-right">
                      <div className="text-xs text-amber-600 font-medium">{pending} agent{pending > 1 ? 's' : ''}</div>
                      <div className="text-[10px] text-gray-400">pending approval</div>
                    </div>
                  )}
                </div>

                {/* Top agent */}
                {topAgent ? (
                  <div className="px-5 py-2.5 flex items-center justify-between bg-amber-50/60 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏆</span>
                      <div>
                        <span className="text-xs font-semibold text-gray-800">{topAgent.name}</span>
                        <span className="text-[10px] text-gray-400 ml-1.5">Best performer</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-600">{fmtINR(topAgent.thisMonth)}</div>
                      <div className="text-[10px] text-gray-400">{topAgent.conversionRate}% conv.</div>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-2.5 text-xs text-gray-400 italic border-b border-gray-50">No agents in team yet</div>
                )}

                {/* Actions */}
                <div className="px-5 py-3 flex items-center gap-2">
                  <button onClick={() => { setEditing(mgr); setModal('edit'); }}
                    className="flex-1 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-xl transition-colors">
                    ✏️ Edit
                  </button>
                  {mgr.status === 'active' && (
                    <button onClick={() => setConfirmId({ id: mgr.id, action: 'suspend' })}
                      className="flex-1 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors">
                      ⛔ Suspend
                    </button>
                  )}
                  {mgr.status === 'suspended' && (
                    <button onClick={() => restoreAgent(mgr.id)}
                      className="flex-1 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors">
                      ✅ Restore
                    </button>
                  )}
                  {mgr.status === 'pending' && (
                    <button onClick={() => approveAgent(mgr.id)}
                      className="flex-1 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors">
                      ✅ Approve
                    </button>
                  )}
                  <div className="flex-1 text-center text-[10px] text-gray-400 font-mono bg-gray-50 px-2 py-2 rounded-xl leading-tight">
                    {mgr.phone}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {(modal === 'create' || modal === 'edit') && (
        <ManagerModal onClose={() => { setModal(null); setEditing(undefined); }} onSave={handleSave} existing={editing} managerCount={managerCount} />
      )}

      {confirmId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setConfirmId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3 text-center">⛔</div>
            <h3 className="font-bold text-gray-900 text-center text-lg mb-2">Suspend Manager?</h3>
            <p className="text-sm text-gray-500 text-center mb-1">
              {agents.find(a => a.id === confirmId.id)?.name} and their{' '}
              {agents.filter(a => a.managerId === confirmId.id).length} agents will lose portal access.
            </p>
            <p className="text-xs text-amber-600 text-center bg-amber-50 rounded-xl px-3 py-2 mb-5">
              Agent data is preserved. You can restore access at any time.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)} className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={() => { suspendAgent(confirmId.id); setConfirmId(null); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-sm font-semibold">Suspend</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
