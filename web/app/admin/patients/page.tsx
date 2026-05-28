'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { fmtINR } from '@/lib/admin-data';
import { STATUS_CONFIG } from '@/lib/types';

const STATUSES = ['all','new','contacted','opd_scheduled','ipd_confirmed','completed','lost'] as const;

export default function AdminPatientsPage() {
  const { patients, agents } = useStore();
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter,  setAgentFilter]  = useState('all');
  const [sort,         setSort]         = useState<'recent' | 'commission' | 'name'>('recent');

  const activeAgents = agents.filter(a => a.status === 'active');

  const filtered = patients
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p => agentFilter === 'all' || p.agentId === agentFilter)
    .filter(p => !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.specialty.toLowerCase().includes(search.toLowerCase()) ||
      p.agentName.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'name')       return a.name.localeCompare(b.name);
      if (sort === 'commission') return b.commission - a.commission;
      return b.id - a.id;
    });

  const statusCounts: Record<string, number> = {};
  patients.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1; });
  const totalCommission = patients.reduce((s, p) => s + p.commission, 0);
  const completedCount  = patients.filter(p => p.status === 'completed').length;

  const statusLabels: Record<string, string> = {
    all: 'All', new: 'New', contacted: 'Contacted',
    opd_scheduled: 'OPD', ipd_confirmed: 'IPD', completed: 'Completed', lost: 'Lost',
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Patients',        value: patients.length,                                                             color: 'text-gray-900' },
          { label: 'Completed Cases',       value: completedCount,                                                              color: 'text-emerald-600' },
          { label: 'Active Pipeline',       value: patients.filter(p => !['completed','lost'].includes(p.status)).length,      color: 'text-blue-600' },
          { label: 'Total Commission Pool', value: fmtINR(totalCommission),                                                     color: 'text-indigo-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient, specialty, agent or city…"
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="all">All Agents</option>
            {activeAgents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="recent">Most Recent</option>
            <option value="name">Name A–Z</option>
            <option value="commission">Highest Commission</option>
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => {
            const count = s === 'all' ? patients.length : (statusCounts[s] ?? 0);
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}>
                {statusLabels[s]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Showing <strong className="text-gray-900">{filtered.length}</strong> of {patients.length} patients
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Patient','Phone / Age','Specialty & Procedure','City','Agent','Commission','Package','Status','Added'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center text-gray-400"><div className="text-4xl mb-2">🏥</div><div className="font-medium">No patients found</div></td></tr>
              ) : filtered.map(p => {
                const cfg = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG];
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">{p.name[0]}</div>
                        <span className="font-semibold text-gray-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500"><div>{p.phone}</div><div>Age {p.age} · {p.gender === 'M' ? 'M' : 'F'}</div></td>
                    <td className="px-5 py-3.5"><div className="font-medium text-gray-900 text-xs">{p.specialty}</div><div className="text-xs text-gray-500">{p.procedure}</div></td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">{p.city}</td>
                    <td className="px-5 py-3.5"><div className="text-xs font-medium text-gray-900">{p.agentName}</div><div className="text-[10px] text-gray-400">{p.agentId}</div></td>
                    <td className="px-5 py-3.5 font-semibold text-emerald-600 text-xs">{fmtINR(p.commission)} <span className="text-gray-400 font-normal">({p.commPct}%)</span></td>
                    <td className="px-5 py-3.5 text-xs font-medium text-gray-700">{fmtINR(p.packageCost)}</td>
                    <td className="px-5 py-3.5">
                      {cfg && (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{p.createdAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
