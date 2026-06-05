'use client';
import { useState } from 'react';
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
    // Normalise phone to "+91 XXXXX XXXXX" format
    const digits = form.phone.replace(/[\s\-()]/g, '').replace(/^\+91/, '');
    const normPhone = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    const saved = { ...form, phone: normPhone };
    onSave(existing
      ? { ...existing, ...saved }
      : { ...saved, id: previewId, totalLeads: 0, totalEarned: 0, thisMonth: 0, pending: 0, conversionRate: 0, joinedAt: '', lastActive: 'Never' }
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
            {!existing && <div className="text-xs text-gray-400 mt-0.5">Agent ID is auto-generated based on city</div>}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
              <div className="flex gap-2">
                <div className="flex items-center border border-gray-200 rounded-xl px-3 bg-gray-50 text-sm text-gray-700 whitespace-nowrap">🇮🇳 +91</div>
                <input
                  value={form.phone.replace(/^\+91\s?/, '')}
                  onChange={e => {
                    const val = e.target.value.replace(/[^\d\s\-]/g, '');
                    set('phone', val);
                  }}
                  maxLength={13}
                  placeholder="98765 43210"
                  className={`flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
                    errors.phone ? 'border-red-400 focus:ring-red-300 bg-red-50/30' : 'border-gray-200 focus:ring-indigo-500'
                  }`} />
              </div>
              <FieldErr msg={errors.phone} />
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
  const [filter,    setFilter]    = useState<FilterStatus>('all');
  const [search,    setSearch]    = useState('');
  const [modal,     setModal]     = useState<'create' | 'edit' | null>(null);
  const [editing,   setEditing]   = useState<AdminAgent | undefined>();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = agents
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()) || a.city.toLowerCase().includes(search.toLowerCase()) || (a.email ?? '').toLowerCase().includes(search.toLowerCase()));

  const statusCounts: Record<string, number> = { all: agents.length };
  agents.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1; });

  const agentCount = (city: string) => agents.filter(a => a.city === city).length;

  const handleSave = (agent: AdminAgent) => {
    if (editing) updateAgent(agent);
    else createAgent(agent);
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
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Agents',       value: agents.length,                  color: 'text-gray-900' },
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, ID, city or email…"
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={() => { setEditing(undefined); setModal('create'); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap">
            + Create Agent
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
          Showing <strong className="text-gray-900">{filtered.length}</strong> of {agents.length} agents
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Agent','ID','City','Commission','Leads','This Month','Conv.%','Status','Last Active','KYC','Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-5 py-16 text-center text-gray-400"><div className="text-4xl mb-2">👥</div><div className="font-medium">No agents found</div></td></tr>
              ) : filtered.map(a => {
                const badge = STATUS_BADGE[a.status];
                return (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">{a.name[0]}</div>
                        <div>
                          <div className="font-semibold text-gray-900">{a.name}</div>
                          <div className="text-xs text-gray-400">{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><code className="text-xs bg-gray-100 px-2 py-0.5 rounded-md font-mono">{a.id}</code></td>
                    <td className="px-5 py-3.5 text-gray-600">{a.city}</td>
                    <td className="px-5 py-3.5 font-semibold text-indigo-600">{a.commissionRate}%</td>
                    <td className="px-5 py-3.5 text-gray-700">{a.totalLeads}</td>
                    <td className="px-5 py-3.5 font-semibold text-emerald-600">{a.thisMonth > 0 ? fmtINR(a.thisMonth) : '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`font-bold text-sm ${a.conversionRate >= 65 ? 'text-emerald-600' : a.conversionRate >= 40 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {a.conversionRate > 0 ? `${a.conversionRate}%` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.bg} ${badge.color}`}>{badge.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{a.lastActive}</td>
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
