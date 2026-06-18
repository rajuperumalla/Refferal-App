'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { fmtINR, STATUS_BADGE, CITY_CODES, generateAgentId } from '@/lib/admin-data';

const SPECIALTIES = ['Orthopaedics','Cardiology','Neurology','Oncology','General Surgery','Gynecology','Urology','ENT','Ophthalmology','Gastroenterology','Nephrology','Pulmonology','Dermatology','Haematology'];

export default function ManagerAgentsPage() {
  const { myTeamAgents, agents, currentAgentId, createAgent, updateAgent } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editAgent, setEditAgent]   = useState<typeof myTeamAgents[0] | null>(null);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilter]   = useState<string>('all');

  const [form, setForm] = useState({
    name: '', phone: '', email: '', city: 'Hyderabad', state: 'Telangana',
    commissionRate: 5, bank: '', upi: '', specialties: [] as string[],
  });
  const [commRateRaw, setCommRateRaw] = useState('5');

  const resetForm = () => { setForm({ name:'', phone:'', email:'', city:'Hyderabad', state:'Telangana', commissionRate:5, bank:'', upi:'', specialties:[] }); setCommRateRaw('5'); };

  const openCreate = () => { resetForm(); setEditAgent(null); setShowCreate(true); };
  const openEdit   = (a: typeof myTeamAgents[0]) => { setEditAgent(a); setForm({ name:a.name, phone:a.phone, email:a.email??'', city:a.city, state:a.state, commissionRate:a.commissionRate, bank:a.bank, upi:a.upi, specialties:[...a.specialties] }); setCommRateRaw(String(a.commissionRate)); setShowCreate(true); };

  const handleSave = () => {
    if (!form.name || !form.phone) return;
    if (editAgent) {
      updateAgent({ ...editAgent, ...form });
    } else {
      const agentCount = agents.filter(a => a.role === 'agent' && a.city === form.city).length;
      const id = generateAgentId(form.city, agentCount + 1, 'agent');
      createAgent({ ...form, id, role: 'agent', status: 'active', phoneVerified: false, managerId: currentAgentId });
    }
    setShowCreate(false); resetForm();
  };

  const toggleSpecialty = (s: string) =>
    setForm(f => ({ ...f, specialties: f.specialties.includes(s) ? f.specialties.filter(x => x !== s) : [...f.specialties, s] }));

  const filtered = myTeamAgents.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:    myTeamAgents.length,
    active:   myTeamAgents.filter(a => a.status === 'active').length,
    pending:  myTeamAgents.filter(a => a.status === 'pending').length,
    inactive: myTeamAgents.filter(a => a.status === 'inactive').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Agents</h2>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage agents in your team</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm">
          ➕ Add Agent
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total',   value: stats.total,    color: 'text-gray-900' },
          { label: 'Active',  value: stats.active,   color: 'text-emerald-600' },
          { label: 'Pending', value: stats.pending,  color: 'text-amber-600' },
          { label: 'Inactive',value: stats.inactive, color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..."
          className="flex-1 border border-gray-200 rounded-xl px-4 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white" />
        <div className="flex gap-2">
          {['all','active','pending','inactive','suspended'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${filterStatus === s ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Agent','ID','City','Commission %','Leads','This Month','Conv%','Status','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(agent => (
              <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">{agent.name[0]}</div>
                    <div>
                      <div className="font-medium text-gray-900">{agent.name}</div>
                      <div className="text-[10px] text-gray-400">{agent.phone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{agent.id}</td>
                <td className="px-4 py-3 text-gray-600">{agent.city}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-purple-700">{agent.commissionRate}%</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{agent.totalLeads}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{fmtINR(agent.thisMonth)}</td>
                <td className="px-4 py-3 text-gray-600">{agent.conversionRate}%</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGE[agent.status].bg} ${STATUS_BADGE[agent.status].color}`}>
                    {STATUS_BADGE[agent.status].label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(agent)} className="text-xs text-purple-600 hover:underline font-medium">Edit</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="text-center py-10 text-sm text-gray-400">No agents found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{editAgent ? 'Edit Agent' : 'Add New Agent'}</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Agent name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone *</label>
                  <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="+91 98765 43210" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="agent@email.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                  <select value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {Object.keys(CITY_CODES).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Commission Rate * <span className="text-gray-400 font-normal">(5–25%)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={commRateRaw}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^\d.]/g, '');
                        setCommRateRaw(raw);
                        const v = parseFloat(raw);
                        if (!isNaN(v)) setForm(f => ({ ...f, commissionRate: v }));
                      }}
                      onBlur={() => {
                        const v = parseFloat(commRateRaw);
                        const clamped = isNaN(v) ? 5 : Math.min(25, Math.max(5, v));
                        setCommRateRaw(String(clamped));
                        setForm(f => ({ ...f, commissionRate: clamped }));
                      }}
                      placeholder="e.g. 10"
                      className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm font-semibold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bank Account</label>
                  <input value={form.bank} onChange={e => setForm(f => ({...f, bank: e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Bank ••••1234" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">UPI ID</label>
                  <input value={form.upi} onChange={e => setForm(f => ({...f, upi: e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="name@upi" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Specialties</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map(s => (
                    <button key={s} onClick={() => toggleSpecialty(s)}
                      className={`px-2.5 py-1 rounded-full text-xs transition-all ${form.specialties.includes(s) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-purple-50'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl text-purple-700 text-xs">
                ℹ️ Commission rate for this agent: <strong>{form.commissionRate}%</strong>. Finance and payout is managed by Admin.
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={!form.name || !form.phone}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
                {editAgent ? 'Save Changes' : 'Create Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
