'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { STATUS_CONFIG } from '@/lib/types';

export default function ManagerPatientsPage() {
  const { myTeamPatients, myTeamAgents } = useStore();
  const [search, setSearch]   = useState('');
  const [filterStatus, setFilter] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');

  const filtered = myTeamPatients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.specialty.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchAgent  = filterAgent === 'all' || p.agentId === filterAgent;
    return matchSearch && matchStatus && matchAgent;
  });

  const statusCounts = ['new','contacted','opd_scheduled','ipd_confirmed','completed','lost'].reduce((acc, s) => {
    acc[s] = myTeamPatients.filter(p => p.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Team Patients</h2>
        <p className="text-sm text-gray-500 mt-0.5">All patients across your team agents (read-only view)</p>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button key={key} onClick={() => setFilter(filterStatus === key ? 'all' : key)}
            className={`p-3 rounded-2xl border text-center transition-all ${filterStatus === key ? `${cfg.bg} ${cfg.border}` : 'bg-white border-gray-100 hover:border-gray-200'} shadow-sm`}>
            <div className={`text-xl font-bold ${cfg.color}`}>{statusCounts[key] ?? 0}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{cfg.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..."
          className="flex-1 min-w-48 border border-gray-200 rounded-xl px-4 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white" />
        <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
          <option value="all">All Agents</option>
          {myTeamAgents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Patient','Specialty/Procedure','Agent','Status','Commission','Created'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(p => {
              const cfg   = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG];
              const agent = myTeamAgents.find(a => a.id === p.agentId);
              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-[10px] text-gray-400">{p.age}y · {p.gender} · {p.city}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{p.specialty}</div>
                    <div className="text-[10px] text-gray-400">{p.procedure}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-[10px] font-bold">
                        {(agent?.name ?? p.agentId)[0]}
                      </div>
                      <span className="text-gray-700 text-xs">{agent?.name ?? p.agentId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {cfg ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    ) : (
                      <span className="text-xs text-gray-400">{p.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">₹{p.commission.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.createdAt}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-sm text-gray-400">No patients found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        ℹ️ Patient status updates and MOP billing are managed by Admin. You can view team progress here.
      </div>
    </div>
  );
}
