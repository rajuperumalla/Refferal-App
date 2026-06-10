'use client';
import { useStore } from '@/lib/store';
import { fmtINR, fmtL, STATUS_BADGE } from '@/lib/admin-data';
import Link from 'next/link';

export default function ManagerDashboard() {
  const { currentAgent, myTeamAgents, myTeamPatients, myTeamCommissions } = useStore();

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalAgents     = myTeamAgents.length;
  const activeAgents    = myTeamAgents.filter(a => a.status === 'active').length;
  const pendingAgents   = myTeamAgents.filter(a => a.status === 'pending').length;
  const totalLeads      = myTeamPatients.length;
  const activePatients  = myTeamPatients.filter(p => !['completed','lost'].includes(p.status)).length;
  const completedCases  = myTeamPatients.filter(p => p.status === 'completed').length;
  const ipdCases        = myTeamPatients.filter(p => p.status === 'ipd_confirmed').length;
  const conversionRate  = totalLeads > 0 ? Math.round((completedCases / totalLeads) * 100) : 0;

  const teamThisMonth   = myTeamAgents.reduce((s, a) => s + a.thisMonth, 0);
  const teamTotalEarned = myTeamAgents.reduce((s, a) => s + a.totalEarned, 0);
  const teamPending     = myTeamCommissions.filter(c => c.status === 'pending_approval').reduce((s, c) => s + c.amount, 0);
  const teamPaid        = myTeamCommissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0);

  // ── Top performers ─────────────────────────────────────────────────────────
  const topPerformers = [...myTeamAgents]
    .filter(a => a.status === 'active')
    .sort((a, b) => b.thisMonth - a.thisMonth)
    .slice(0, 5);

  // ── Status breakdown ───────────────────────────────────────────────────────
  const statusBreakdown = [
    { label: 'New',          count: myTeamPatients.filter(p => p.status==='new').length,          color:'bg-blue-500' },
    { label: 'Contacted',    count: myTeamPatients.filter(p => p.status==='contacted').length,    color:'bg-amber-500' },
    { label: 'OPD Scheduled',count: myTeamPatients.filter(p => p.status==='opd_scheduled').length,color:'bg-green-500' },
    { label: 'IPD Confirmed',count: myTeamPatients.filter(p => p.status==='ipd_confirmed').length,color:'bg-purple-500' },
    { label: 'Completed',    count: myTeamPatients.filter(p => p.status==='completed').length,    color:'bg-emerald-600' },
    { label: 'Lost',         count: myTeamPatients.filter(p => p.status==='lost').length,         color:'bg-red-400' },
  ];
  const maxCount = Math.max(...statusBreakdown.map(s => s.count), 1);

  // ── Recent patients ────────────────────────────────────────────────────────
  const recentPatients = [...myTeamPatients].sort((a, b) => b.id - a.id).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Welcome, {currentAgent?.name?.split(' ')[0] ?? 'Manager'} 👋</h2>
          <p className="text-sm text-gray-500 mt-0.5">{currentAgent?.id} · {currentAgent?.city} — managing {totalAgents} agents</p>
        </div>
        <Link href="/manager/add-patient"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm">
          ➕ Add Patient Lead
        </Link>
      </div>

      {/* KPI cards row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Active Agents',    value:activeAgents,           sub:`${totalAgents} total${pendingAgents>0?`, ${pendingAgents} pending`:''}`, icon:'👥', c:'text-purple-600', bg:'bg-purple-50' },
          { label:'Active Patients',  value:activePatients,         sub:`${totalLeads} total leads`,    icon:'🏥', c:'text-blue-600',   bg:'bg-blue-50' },
          { label:'IPD Conversions',  value:ipdCases,               sub:`${completedCases} completed`,  icon:'🔄', c:'text-indigo-600', bg:'bg-indigo-50' },
          { label:'Conversion Rate',  value:`${conversionRate}%`,   sub:`${completedCases}/${totalLeads} cases`, icon:'📈', c:'text-emerald-600', bg:'bg-emerald-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center text-lg mb-3`}>{k.icon}</div>
            <div className={`text-2xl font-bold ${k.c}`}>{k.value}</div>
            <div className="text-xs font-medium text-gray-700 mt-0.5">{k.label}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* KPI cards row 2 — financials */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'This Month',        value:fmtL(teamThisMonth),   icon:'📅', c:'text-amber-600',   bg:'bg-amber-50' },
          { label:'Total Earned',      value:fmtL(teamTotalEarned), icon:'🏆', c:'text-gray-900',    bg:'bg-gray-50' },
          { label:'Pending Approval',  value:fmtL(teamPending),     icon:'⏳', c:'text-orange-600',  bg:'bg-orange-50' },
          { label:'Total Paid Out',    value:fmtL(teamPaid),        icon:'✅', c:'text-emerald-600', bg:'bg-emerald-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center text-xl flex-shrink-0`}>{k.icon}</div>
            <div>
              <div className={`text-xl font-bold ${k.c}`}>{k.value}</div>
              <div className="text-xs text-gray-500">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">🏆 Top Performers</h3>
            <Link href="/manager/agents" className="text-xs text-purple-600 font-medium hover:underline">All agents →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {topPerformers.map((agent, i) => (
              <div key={agent.id} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i===0?'bg-amber-100 text-amber-700':i===1?'bg-gray-100 text-gray-600':'bg-gray-50 text-gray-400'}`}>
                  {i+1}
                </div>
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold flex-shrink-0">
                  {agent.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-900 truncate">{agent.name}</div>
                  <div className="text-[10px] text-gray-400">{agent.city} · {agent.conversionRate}% conv.</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold text-emerald-600">{fmtINR(agent.thisMonth)}</div>
                  <div className="text-[10px] text-gray-400">this month</div>
                </div>
              </div>
            ))}
            {topPerformers.length === 0 && (
              <div className="px-5 py-8 text-center text-xs text-gray-400">No active agents yet.</div>
            )}
          </div>
        </div>

        {/* Patient Pipeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Patient Pipeline</h3>
            <Link href="/manager/patients" className="text-xs text-purple-600 font-medium hover:underline">View all →</Link>
          </div>
          <div className="px-5 py-4 space-y-3">
            {statusBreakdown.map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-28 text-xs text-gray-500 flex-shrink-0">{s.label}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className={`h-2 rounded-full ${s.color} transition-all`} style={{ width: `${(s.count/maxCount)*100}%` }} />
                </div>
                <div className="w-7 text-right text-xs font-semibold text-gray-700">{s.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Full agents list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">All Agents ({totalAgents})</h3>
            <Link href="/manager/agents" className="text-xs text-purple-600 font-medium hover:underline">Manage →</Link>
          </div>
          <div className="overflow-y-auto max-h-72 divide-y divide-gray-50">
            {myTeamAgents.map(agent => (
              <div key={agent.id} className="px-5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">
                    {agent.name[0]}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-900">{agent.name}</div>
                    <div className="text-[10px] text-gray-400">{agent.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-gray-900">{fmtINR(agent.thisMonth)}</div>
                    <div className="text-[10px] text-purple-600">{agent.commissionRate}%</div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${STATUS_BADGE[agent.status].bg} ${STATUS_BADGE[agent.status].color}`}>
                    {STATUS_BADGE[agent.status].label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent patients */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Recent Patients</h3>
            <div className="flex items-center gap-3">
              <Link href="/manager/add-patient" className="text-xs text-purple-600 font-medium hover:underline">+ Add →</Link>
              <Link href="/manager/patients" className="text-xs text-gray-400 font-medium hover:underline">All →</Link>
            </div>
          </div>
          <div className="overflow-y-auto max-h-72 divide-y divide-gray-50">
            {recentPatients.map(p => {
              const agent = myTeamAgents.find(a => a.id === p.agentId);
              return (
                <div key={p.id} className="px-5 py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-gray-900">{p.name}</div>
                    <div className="text-[10px] text-gray-400">{p.specialty} · {agent?.name ?? p.agentId}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                    p.status==='completed'    ?'bg-emerald-50 text-emerald-700':
                    p.status==='ipd_confirmed'?'bg-purple-50 text-purple-700':
                    p.status==='opd_scheduled'?'bg-blue-50 text-blue-700':
                    p.status==='contacted'    ?'bg-amber-50 text-amber-700':
                    p.status==='lost'         ?'bg-red-50 text-red-700':
                                               'bg-gray-100 text-gray-600'
                  }`}>
                    {p.status.replace('_',' ')}
                  </span>
                </div>
              );
            })}
            {recentPatients.length===0 && (
              <div className="px-5 py-8 text-center text-xs text-gray-400">No patients yet. Add the first lead!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
