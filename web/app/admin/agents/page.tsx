'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { AdminAgent, AgentStatus, STATUS_BADGE, CITY_CODES, generateAgentId, fmtINR, fmtL } from '@/lib/admin-data';

type FilterStatus = AgentStatus | 'all';
const SPECIALTIES = ['Orthopaedics','Cardiology','Urology','Gynecology','General Surgery','ENT','Neurology','Ophthalmology','Oncology','Gastroenterology','Nephrology','Pulmonology'];
const CITIES = Object.keys(CITY_CODES);

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
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const toggleSpec = (s: string) => set('specialties', form.specialties.includes(s)
    ? form.specialties.filter(x => x !== s) : [...form.specialties, s]);

  const previewId = existing?.id ?? generateAgentId(form.city, agentCount(form.city) + 1);

  const handleSave = () => {
    if (!form.name || !form.phone || !form.email) return;
    onSave(existing
      ? { ...existing, ...form }
      : { ...form, id: previewId, totalLeads: 0, totalEarned: 0, thisMonth: 0, pending: 0, conversionRate: 0, joinedAt: '', lastActive: 'Never' }
    );
  };

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
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Rajesh Sharma"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="agent@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Commission Rate (%)</label>
              <select value={form.commissionRate} onChange={e => set('commissionRate', parseFloat(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {[3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 5].map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank Account</label>
              <input value={form.bank} onChange={e => set('bank', e.target.value)} placeholder="HDFC ••••1234"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">UPI ID</label>
              <input value={form.upi} onChange={e => set('upi', e.target.value)} placeholder="agent@upi"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
          <button onClick={handleSave} disabled={!form.name || !form.phone || !form.email}
            className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-all">
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
    .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()) || a.city.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()));

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
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
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
                {['Agent','ID','City','Commission','Leads','This Month','Conv.%','Status','Last Active','Actions'].map(h => (
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
