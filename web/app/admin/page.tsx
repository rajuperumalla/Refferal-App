'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { STATUS_BADGE, fmtINR, fmtL } from '@/lib/admin-data';

const activityIcon: Record<string, string> = {
  commission_approved: '✅', agent_created: '👤', patient_added: '🏥',
  commission_paid: '💰', agent_suspended: '⛔',
};

export default function AdminDashboard() {
  const { agents, patients, commissions, monthlyRevenue, activityLog } = useStore();
  const [expandedMgr, setExpandedMgr] = useState<string | null>(null);

  const activeAgents    = agents.filter(a => a.status === 'active').length;
  const pendingAgents   = agents.filter(a => a.status === 'pending').length;
  const pendingComms    = commissions.filter(c => c.status === 'pending_approval');
  const pendingAmount   = pendingComms.reduce((s, c) => s + c.amount, 0);
  const thisMonthRev    = monthlyRevenue[monthlyRevenue.length - 1]?.revenue ?? 0;
  const lastMonthRev    = monthlyRevenue[monthlyRevenue.length - 2]?.revenue ?? 0;
  const revenueGrowth   = lastMonthRev > 0 ? (((thisMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(1) : '0';
  const maxRev          = Math.max(...monthlyRevenue.map(m => m.revenue), 1);

  const leaderboard = [...agents]
    .filter(a => a.status === 'active')
    .sort((a, b) => b.thisMonth - a.thisMonth)
    .slice(0, 6);

  const pipeline = [
    { label: 'New',       key: 'new',          color: 'bg-blue-500' },
    { label: 'Contacted', key: 'contacted',     color: 'bg-amber-500' },
    { label: 'OPD',       key: 'opd_scheduled', color: 'bg-green-500' },
    { label: 'IPD',       key: 'ipd_confirmed', color: 'bg-purple-500' },
    { label: 'Completed', key: 'completed',     color: 'bg-emerald-600' },
    { label: 'Lost',      key: 'lost',          color: 'bg-red-400' },
  ].map(p => ({ ...p, count: patients.filter(pt => pt.status === p.key).length }));

  const totalPipeline = pipeline.reduce((s, p) => s + p.count, 0);

  const cityMap: Record<string, number> = {};
  patients.forEach(p => { cityMap[p.city] = (cityMap[p.city] ?? 0) + 1; });
  const cities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]);
  const maxCity = Math.max(...cities.map(([, n]) => n), 1);

  // ── Manager metrics ───────────────────────────────────────────────────────
  const managers = agents.filter(a => a.role === 'manager');
  const managerStats = managers.map(mgr => {
    const team        = agents.filter(a => a.role === 'agent' && a.managerId === mgr.id);
    const teamIds     = team.map(a => a.id);
    const teamPats    = patients.filter(p => teamIds.includes(p.agentId));
    const teamComms   = commissions.filter(c => teamIds.includes(c.agentId));
    const active      = team.filter(a => a.status === 'active').length;
    const pending_ap  = team.filter(a => a.status === 'pending').length;
    const thisMonth   = team.reduce((s, a) => s + a.thisMonth, 0);
    const totalEarned = team.reduce((s, a) => s + a.totalEarned, 0);
    const completed   = teamPats.filter(p => p.status === 'completed').length;
    const ipd         = teamPats.filter(p => p.status === 'ipd_confirmed').length;
    const opd         = teamPats.filter(p => p.status === 'opd_scheduled').length;
    const newLeads    = teamPats.filter(p => p.status === 'new').length;
    const convRate    = teamPats.length > 0 ? Math.round((completed / teamPats.length) * 100) : 0;
    const pendAmt     = teamComms.filter(c => c.status === 'pending_approval').reduce((s, c) => s + c.amount, 0);
    const paidAmt     = teamComms.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0);
    const topAgent    = [...team].sort((a, b) => b.thisMonth - a.thisMonth)[0];
    const statusBreak = [
      { key: 'new', label: 'New', count: newLeads, color: 'bg-blue-400' },
      { key: 'opd_scheduled', label: 'OPD', count: opd, color: 'bg-green-400' },
      { key: 'ipd_confirmed', label: 'IPD', count: ipd, color: 'bg-purple-400' },
      { key: 'completed', label: 'Done', count: completed, color: 'bg-emerald-500' },
    ];
    return { mgr, team, teamPats, active, pending_ap, thisMonth, totalEarned, completed, ipd, opd, newLeads, convRate, pendAmt, paidAmt, topAgent, statusBreak };
  });
  const maxMgrRevenue = Math.max(...managerStats.map(m => m.thisMonth), 1);
  const totalMgrRevenue = managerStats.reduce((s, m) => s + m.thisMonth, 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '💵', label: 'Revenue This Month',    value: fmtL(thisMonthRev),         sub: `↑ ${revenueGrowth}% vs last month`,             subColor: 'text-emerald-600', bg: 'bg-indigo-50',  iconColor: 'text-indigo-600' },
          { icon: '👥', label: 'Active Agents',         value: activeAgents.toString(),    sub: `${pendingAgents} pending approval`,              subColor: 'text-amber-600',   bg: 'bg-blue-50',    iconColor: 'text-blue-600' },
          { icon: '🏥', label: 'Total Patients',        value: patients.length.toString(), sub: `Across ${activeAgents} agents`,                  subColor: 'text-gray-500',    bg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
          { icon: '⏳', label: 'Pending Commissions',   value: fmtL(pendingAmount),        sub: `${pendingComms.length} cases awaiting approval`, subColor: 'text-amber-600',   bg: 'bg-amber-50',   iconColor: 'text-amber-600' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${card.bg}`}>
              <span className={card.iconColor}>{card.icon}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
            <div className={`text-xs mt-1 font-medium ${card.subColor}`}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Manager Performance ─────────────────────────────────────── */}
      {managers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Section header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg,#faf5ff 0%,#f3e8ff 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white text-base shadow-sm">👔</div>
              <div>
                <div className="font-bold text-gray-900">Manager Performance</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {managers.length} managers · {managerStats.reduce((s, m) => s + m.team.length, 0)} agents · {fmtL(totalMgrRevenue)} team revenue this month
                </div>
              </div>
            </div>
            <Link href="/admin/agents"
              className="text-xs font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-lg transition-colors">
              Manage All →
            </Link>
          </div>

          {/* Manager cards */}
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {managerStats.map(({ mgr, team, teamPats, active, pending_ap, thisMonth, totalEarned, convRate, pendAmt, paidAmt, topAgent, statusBreak }) => {
              const isExpanded = expandedMgr === mgr.id;
              const badge = STATUS_BADGE[mgr.status];
              const totalPats = teamPats.length;
              const maxBreak  = Math.max(...statusBreak.map(s => s.count), 1);

              return (
                <div key={mgr.id}
                  className={`border rounded-2xl overflow-hidden transition-all duration-200 ${isExpanded ? 'border-purple-300 shadow-md shadow-purple-100' : 'border-gray-100 hover:border-purple-200 hover:shadow-sm'}`}>

                  {/* Card header */}
                  <div className="p-4 flex items-start justify-between"
                    style={{ background: 'linear-gradient(135deg,#f9f5ff 0%,#fdf4ff 100%)' }}>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xl font-bold shadow-sm">
                          {mgr.name[0]}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{mgr.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-200 text-purple-800 tracking-wide">MGR</span>
                        </div>
                        <div className="text-xs text-gray-500">{mgr.id} · {mgr.city}</div>
                        {mgr.email && <div className="text-[10px] text-gray-400 mt-0.5">{mgr.email}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.color}`}>{badge.label}</span>
                      <button onClick={() => setExpandedMgr(isExpanded ? null : mgr.id)}
                        className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-all text-xs shadow-sm">
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="px-4 py-3 grid grid-cols-4 gap-2 border-b border-gray-50">
                    {[
                      { icon: '👥', label: 'Agents',    value: team.length,    sub: `${active} active`, color: 'text-blue-600',    bg: 'bg-blue-50' },
                      { icon: '🏥', label: 'Patients',  value: totalPats,      sub: `${teamPats.filter(p=>p.status==='ipd_confirmed').length} IPD`, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                      { icon: '📈', label: 'Conv. Rate', value: `${convRate}%`, sub: `${teamPats.filter(p=>p.status==='completed').length} done`, color: convRate >= 60 ? 'text-emerald-600' : 'text-amber-600', bg: convRate >= 60 ? 'bg-emerald-50' : 'bg-amber-50' },
                      { icon: '💰', label: 'This Month', value: fmtL(thisMonth), sub: `↓${fmtL(pendAmt)} pend`, color: 'text-purple-700', bg: 'bg-purple-50' },
                    ].map(s => (
                      <div key={s.label} className={`${s.bg} rounded-xl px-2 py-2.5 text-center`}>
                        <div className="text-sm mb-0.5">{s.icon}</div>
                        <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-[9px] text-gray-500 font-medium">{s.label}</div>
                        <div className="text-[9px] text-gray-400">{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Revenue bar */}
                  <div className="px-4 py-3 border-b border-gray-50">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium text-gray-600">Team Revenue Share</span>
                      <span className="text-xs font-bold text-purple-700">{fmtINR(thisMonth)}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(thisMonth / maxMgrRevenue) * 100}%`, background: 'linear-gradient(90deg,#7C3AED,#A855F7)' }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      <span>Total earned: {fmtL(totalEarned)}</span>
                      <span>Paid out: {fmtL(paidAmt)}</span>
                    </div>
                  </div>

                  {/* Top agent strip */}
                  {topAgent && (
                    <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-50 bg-amber-50/40">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🏆</span>
                        <div>
                          <span className="text-xs font-semibold text-gray-800">{topAgent.name}</span>
                          <span className="text-[10px] text-gray-400 ml-1.5">Top performer</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-600">{fmtINR(topAgent.thisMonth)}</div>
                        <div className="text-[10px] text-gray-400">{topAgent.conversionRate}% conv.</div>
                      </div>
                    </div>
                  )}

                  {/* Expanded: Patient pipeline breakdown + all-agents list */}
                  {isExpanded && (
                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 space-y-3">
                      <div className="text-xs font-semibold text-gray-700 mb-2">Patient Pipeline Breakdown</div>
                      {statusBreak.map(s => (
                        <div key={s.key} className="flex items-center gap-2">
                          <span className="w-14 text-[10px] text-gray-500">{s.label}</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${s.color} transition-all`}
                              style={{ width: `${(s.count / maxBreak) * 100}%` }} />
                          </div>
                          <span className="w-5 text-right text-[10px] font-bold text-gray-700">{s.count}</span>
                        </div>
                      ))}

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs font-semibold text-gray-700 mb-2">
                          All Agents ({team.length}) {pending_ap > 0 && <span className="text-amber-600 font-normal">· {pending_ap} pending approval</span>}
                        </div>
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                          {[...team].sort((a, b) => b.thisMonth - a.thisMonth).map(ag => (
                            <div key={ag.id} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5 border border-gray-100">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-[9px] font-bold flex-shrink-0">
                                  {ag.name[0]}
                                </div>
                                <div>
                                  <div className="text-[10px] font-medium text-gray-900">{ag.name}</div>
                                  <div className="text-[9px] text-gray-400">{ag.city}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-emerald-600">{fmtINR(ag.thisMonth)}</span>
                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_BADGE[ag.status].bg} ${STATUS_BADGE[ag.status].color}`}>
                                  {STATUS_BADGE[ag.status].label}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="px-4 py-3 flex gap-2">
                    <Link href="/admin/agents"
                      className="flex-1 text-center text-[11px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-2 rounded-xl transition-colors">
                      👥 Team
                    </Link>
                    <Link href="/admin/patients"
                      className="flex-1 text-center text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-2 rounded-xl transition-colors">
                      🏥 Patients
                    </Link>
                    <Link href="/admin/commissions"
                      className="flex-1 text-center text-[11px] font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-2 rounded-xl transition-colors">
                      💰 Earnings
                    </Link>
                    <button onClick={() => setExpandedMgr(isExpanded ? null : mgr.id)}
                      className="flex-1 text-center text-[11px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-2 rounded-xl transition-colors">
                      {isExpanded ? '▲ Less' : '▼ Details'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cross-manager comparison footer */}
          <div className="px-5 pb-4">
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="text-xs font-semibold text-gray-700 mb-3">Team Revenue Comparison</div>
              <div className="space-y-2">
                {[...managerStats].sort((a, b) => b.thisMonth - a.thisMonth).map(({ mgr, thisMonth, team, convRate }) => (
                  <div key={mgr.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                      {mgr.name[0]}
                    </div>
                    <span className="w-28 text-xs font-medium text-gray-700 truncate">{mgr.name.split(' ')[0]}'s Team</span>
                    <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(thisMonth / maxMgrRevenue) * 100}%`, background: 'linear-gradient(90deg,#7C3AED,#A855F7)' }} />
                    </div>
                    <span className="text-xs font-bold text-purple-700 w-14 text-right">{fmtL(thisMonth)}</span>
                    <span className="text-[10px] text-gray-500 w-12 text-right">{team.length} agents</span>
                    <span className={`text-[10px] font-semibold w-10 text-right ${convRate >= 60 ? 'text-emerald-600' : 'text-amber-600'}`}>{convRate}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Chart + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="font-bold text-gray-900">Revenue Trend</div>
              <div className="text-xs text-gray-400 mt-0.5">12-month hospital package revenue</div>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" />Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-200 inline-block" />Commission</span>
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-36">
            {monthlyRevenue.map((m, i) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-0.5" style={{ height: `${(m.revenue / maxRev) * 100}%` }}>
                  <div className="flex-1 rounded-t-md" style={{ background: i === monthlyRevenue.length - 1 ? '#4F46E5' : '#A5B4FC' }} />
                </div>
                <div className="text-[9px] text-gray-400">{m.month}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Total Revenue (12m)',    value: fmtL(monthlyRevenue.reduce((s, m) => s + m.revenue, 0)) },
              { label: 'Total Commissions (12m)',value: fmtL(monthlyRevenue.reduce((s, m) => s + m.commissions, 0)) },
              { label: 'Avg Monthly Revenue',    value: fmtL(Math.round(monthlyRevenue.reduce((s, m) => s + m.revenue, 0) / 12)) },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-0.5">{s.label}</div>
                <div className="font-bold text-gray-900">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="font-bold text-gray-900 mb-1">Patient Pipeline</div>
          <div className="text-xs text-gray-400 mb-4">{totalPipeline} total patients</div>
          <div className="space-y-3">
            {pipeline.map(p => (
              <div key={p.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{p.label}</span>
                  <span className="text-xs font-bold text-gray-900">{p.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${p.color}`}
                    style={{ width: totalPipeline > 0 ? `${(p.count / totalPipeline) * 100}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
          <Link href="/admin/patients" className="mt-5 flex items-center justify-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 border border-indigo-100 bg-indigo-50 rounded-xl py-2.5 transition-colors">
            View All Patients →
          </Link>
        </div>
      </div>

      {/* Leaderboard + City + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="font-bold text-gray-900">Agent Leaderboard</div>
            <Link href="/admin/agents" className="text-xs font-semibold text-indigo-600 hover:underline">Manage all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {['#','Agent','City','This Month','Total Earned','Conv.%','Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((a, i) => {
                  const badge = STATUS_BADGE[a.status];
                  return (
                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-bold text-gray-400">#{i + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">{a.name[0]}</div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{a.name}</div>
                            <div className="text-xs text-gray-400">{a.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{a.city}</td>
                      <td className="px-5 py-3.5 font-semibold text-emerald-600">{fmtINR(a.thisMonth)}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-700">{fmtL(a.totalEarned)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-bold ${a.conversionRate >= 65 ? 'text-emerald-600' : a.conversionRate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{a.conversionRate}%</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.color}`}>{badge.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="font-bold text-gray-900 mb-4">Patients by City</div>
            <div className="space-y-2.5">
              {cities.map(([city, count]) => (
                <div key={city}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{city}</span>
                    <span className="font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(count / maxCity) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {pendingComms.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <div className="font-semibold text-amber-800 text-sm mb-1">⏳ {pendingComms.length} Pending Approvals</div>
              <div className="text-xs text-amber-700 mb-3">{fmtINR(pendingAmount)} awaiting your review</div>
              <Link href="/admin/commissions" className="text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors inline-block">
                Review Now →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="font-bold text-gray-900">Recent Activity</div>
          <span className="text-xs text-gray-400">Last {Math.min(activityLog.length, 10)} events</span>
        </div>
        <div className="divide-y divide-gray-50">
          {activityLog.slice(0, 10).map(log => (
            <div key={log.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                {activityIcon[log.type] ?? '📋'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900">{log.title}</div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">{log.detail}</div>
              </div>
              <div className="text-xs text-gray-400 whitespace-nowrap">{log.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
