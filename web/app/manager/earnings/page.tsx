'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { fmtINR, COMMISSION_BADGE } from '@/lib/admin-data';

export default function ManagerEarningsPage() {
  const { myTeamAgents, myTeamCommissions } = useStore();
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = myTeamCommissions.filter(c => {
    const matchAgent  = filterAgent === 'all' || c.agentId === filterAgent;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchAgent && matchStatus;
  });

  const totalPaid     = myTeamCommissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0);
  const totalApproved = myTeamCommissions.filter(c => c.status === 'approved').reduce((s, c) => s + c.amount, 0);
  const totalPending  = myTeamCommissions.filter(c => c.status === 'pending_approval').reduce((s, c) => s + c.amount, 0);
  const totalRejected = myTeamCommissions.filter(c => c.status === 'rejected').length;

  // Per-agent summary
  const agentSummary = myTeamAgents.map(agent => {
    const comms   = myTeamCommissions.filter(c => c.agentId === agent.id);
    const paid    = comms.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0);
    const pending = comms.filter(c => c.status === 'pending_approval').reduce((s, c) => s + c.amount, 0);
    return { agent, comms: comms.length, paid, pending };
  }).sort((a, b) => b.paid - a.paid);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Team Earnings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Commission overview for your team — finance approval &amp; payout is handled by Admin</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Paid',         value: fmtINR(totalPaid),     color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '✅' },
          { label: 'Awaiting Payment',   value: fmtINR(totalApproved), color: 'text-blue-600',    bg: 'bg-blue-50',    icon: '⏳' },
          { label: 'Pending Approval',   value: fmtINR(totalPending),  color: 'text-amber-600',   bg: 'bg-amber-50',   icon: '📋' },
          { label: 'Rejected',           value: totalRejected.toString(), color: 'text-red-600',  bg: 'bg-red-50',     icon: '❌' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center text-lg mb-3`}>{s.icon}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Per-agent leaderboard */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-900 text-sm">Agent Performance</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {agentSummary.map((row, i) => (
            <div key={row.agent.id} className="px-5 py-3 flex items-center gap-4">
              <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{row.agent.name}</div>
                <div className="text-[10px] text-gray-400">{row.agent.id} · {row.comms} commissions</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-emerald-600">{fmtINR(row.paid)}</div>
                <div className="text-[10px] text-gray-400">paid</div>
              </div>
              {row.pending > 0 && (
                <div className="text-right">
                  <div className="text-sm font-semibold text-amber-600">{fmtINR(row.pending)}</div>
                  <div className="text-[10px] text-gray-400">pending</div>
                </div>
              )}
              <div className="text-right">
                <div className="text-sm font-semibold text-purple-600">{row.agent.commissionRate}%</div>
                <div className="text-[10px] text-gray-400">rate</div>
              </div>
            </div>
          ))}
          {agentSummary.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No commissions yet.</div>
          )}
        </div>
      </div>

      {/* Commission list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
          <h3 className="font-semibold text-gray-900 text-sm flex-1">All Commissions</h3>
          <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 h-8 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="all">All Agents</option>
            {myTeamAgents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 h-8 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="all">All Status</option>
            <option value="pending_approval">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Agent','Patient','Procedure','Amount','Status','Date'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(c => {
              const badge = COMMISSION_BADGE[c.status];
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 text-xs">{c.agentName}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.patientName}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{c.procedure}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{fmtINR(c.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.bg} ${badge.color}`}>{badge.label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{c.createdAt}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-sm text-gray-400">No commissions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        ℹ️ Commission approval and payment is managed by Admin. Contact your admin to approve or process payouts.
      </div>
    </div>
  );
}
