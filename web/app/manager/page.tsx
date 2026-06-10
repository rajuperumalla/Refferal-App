'use client';
import { useStore } from '@/lib/store';
import { fmtINR, STATUS_BADGE } from '@/lib/admin-data';
import Link from 'next/link';

export default function ManagerDashboard() {
  const { currentAgent, myTeamAgents, myTeamPatients, myTeamCommissions } = useStore();

  const activeAgents    = myTeamAgents.filter(a => a.status === 'active').length;
  const totalLeads      = myTeamPatients.length;
  const completedCases  = myTeamPatients.filter(p => p.status === 'completed').length;
  const activePatients  = myTeamPatients.filter(p => !['completed', 'lost'].includes(p.status)).length;
  const conversionRate  = totalLeads > 0 ? Math.round((completedCases / totalLeads) * 100) : 0;
  const teamThisMonth   = myTeamAgents.reduce((s, a) => s + a.thisMonth, 0);
  const teamPending     = myTeamCommissions.filter(c => c.status === 'pending_approval').reduce((s, c) => s + c.amount, 0);
  const teamPaid        = myTeamCommissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0);

  const recentPatients  = [...myTeamPatients].sort((a, b) => b.id - a.id).slice(0, 5);

  const KPI = [
    { label: 'Active Agents',    value: activeAgents,             sub: `${myTeamAgents.length} total`, icon: '👥', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Active Patients',  value: activePatients,           sub: `${totalLeads} total leads`,    icon: '🏥', color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Conversion Rate',  value: `${conversionRate}%`,     sub: `${completedCases} completed`,  icon: '📈', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Team This Month',  value: fmtINR(teamThisMonth),    sub: `${fmtINR(teamPending)} pending`, icon: '💰', color: 'text-amber-600',  bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Welcome, {currentAgent?.name?.split(' ')[0] ?? 'Manager'} 👋</h2>
        <p className="text-sm text-gray-500 mt-0.5">Here&apos;s your team&apos;s performance overview.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI.map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center text-lg mb-3`}>{k.icon}</div>
            <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs font-medium text-gray-700 mt-0.5">{k.label}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team agents summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">My Agents</h3>
            <Link href="/manager/agents" className="text-xs text-purple-600 font-medium hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {myTeamAgents.slice(0, 5).map(agent => (
              <div key={agent.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">
                    {agent.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                    <div className="text-[10px] text-gray-400">{agent.id} · {agent.city}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-gray-900">{fmtINR(agent.thisMonth)}</div>
                    <div className="text-[10px] text-gray-400">this month</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGE[agent.status].bg} ${STATUS_BADGE[agent.status].color}`}>
                    {STATUS_BADGE[agent.status].label}
                  </span>
                </div>
              </div>
            ))}
            {myTeamAgents.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No agents in your team yet.</div>
            )}
          </div>
        </div>

        {/* Recent patients */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Recent Patients</h3>
            <Link href="/manager/patients" className="text-xs text-purple-600 font-medium hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentPatients.map(p => {
              const agent = myTeamAgents.find(a => a.id === p.agentId);
              return (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{p.name}</div>
                    <div className="text-[10px] text-gray-400">{p.specialty} · via {agent?.name ?? p.agentId}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      p.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                      p.status === 'ipd_confirmed' ? 'bg-purple-50 text-purple-700' :
                      p.status === 'opd_scheduled' ? 'bg-blue-50 text-blue-700' :
                      p.status === 'contacted' ? 'bg-amber-50 text-amber-700' :
                      p.status === 'lost' ? 'bg-red-50 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
            {recentPatients.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No patients in your team yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Commission summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Team Paid Out', value: fmtINR(teamPaid), color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '✅' },
          { label: 'Pending Approval', value: fmtINR(teamPending), color: 'text-amber-600', bg: 'bg-amber-50', icon: '⏳' },
          { label: 'Total Commissions', value: myTeamCommissions.length.toString(), color: 'text-blue-600', bg: 'bg-blue-50', icon: '📋' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center text-lg flex-shrink-0`}>{s.icon}</div>
            <div>
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
