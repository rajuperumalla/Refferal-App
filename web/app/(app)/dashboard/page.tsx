'use client';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';

const fmt  = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const fmtL = (n: number) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(0)}K` : `₹${n}`;

export default function DashboardPage() {
  const { currentAgent, myPatients, myNotifications, agentMonthlyEarnings } = useStore();
  const agent = currentAgent;

  const thisMonth = agentMonthlyEarnings[agentMonthlyEarnings.length - 1]?.amount ?? 0;
  const lastMonth = agentMonthlyEarnings[agentMonthlyEarnings.length - 2]?.amount ?? 0;
  const growth    = lastMonth > 0 ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1) : '0';
  const maxBar    = Math.max(...agentMonthlyEarnings.map(m => m.amount), 1);
  const unread    = myNotifications.filter(n => !n.read).length;

  const stats = [
    { icon: '👥', label: 'Active Patients',    value: myPatients.filter(p => !['completed','lost'].includes(p.status)).length.toString(), color: '#2563EB', bg: '#EFF6FF' },
    { icon: '🏥', label: 'Pending Surgeries',  value: myPatients.filter(p => p.status === 'ipd_confirmed').length.toString(),            color: '#D97706', bg: '#FFFBEB' },
    { icon: '📈', label: 'Conversion Rate',    value: `${agent?.conversionRate ?? 0}%`,                                                  color: '#10B981', bg: '#ECFDF5' },
    { icon: '💵', label: 'Avg Commission',      value: myPatients.length > 0 ? fmtL(Math.round(myPatients.reduce((a,p) => a + p.commission, 0) / myPatients.length)) : '₹0', color: '#8B5CF6', bg: '#F5F3FF' },
  ];

  const recentActivity = myNotifications.slice(0, 4).map(n => ({
    icon: n.type === 'commission' ? '₹' : n.type === 'patient' ? '👤' : n.type === 'appointment' ? '📅' : '⚠️',
    text: n.body,
    time: n.time,
    color: n.type === 'commission' ? '#ECFDF5' : n.type === 'patient' ? '#EFF6FF' : n.type === 'appointment' ? '#F5F3FF' : '#FFFBEB',
  }));

  return (
    <div className="space-y-6">
      {/* Top row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Earnings hero */}
        <div className="lg:col-span-2 rounded-2xl p-6 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle,#fff,transparent)', transform: 'translate(30%,-30%)' }} />
          <div className="text-white/70 text-sm mb-1">This Month&apos;s Earnings</div>
          <div className="text-4xl font-bold mb-1">{fmt(thisMonth)}</div>
          <div className="flex items-center gap-2 mb-5">
            <span className="bg-emerald-400/30 text-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full">↑ {growth}% from last month</span>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/15 rounded-xl px-4 py-3">
              <div className="text-white/60 text-xs mb-1">Total Earned</div>
              <div className="text-xl font-bold text-amber-300">{fmtL(agent?.totalEarned ?? 0)}</div>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-3">
              <div className="text-white/60 text-xs mb-1">Pending</div>
              <div className="text-xl font-bold">{fmt(agent?.pending ?? 0)}</div>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-3">
              <div className="text-white/60 text-xs mb-1">Total Leads</div>
              <div className="text-xl font-bold">{agent?.totalLeads ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Mini bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="font-semibold text-gray-900 mb-4">📊 6-Month Trend</div>
          <div className="flex items-end gap-2 h-28">
            {agentMonthlyEarnings.map((m, i) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[9px] font-semibold text-gray-500">{fmtL(m.amount)}</div>
                <div className="w-full rounded-t-md" style={{
                  height: `${(m.amount / maxBar) * 90}%`,
                  background: i === agentMonthlyEarnings.length - 1 ? '#2563EB' : '#BFDBFE',
                }} />
                <div className="text-[9px] text-gray-400">{m.month}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background: s.bg }}>{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-gray-900">🔔 Recent Activity</div>
            <Link href="/notifications" className="text-blue-600 text-xs font-medium hover:underline">
              View all {unread > 0 && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full ml-1">{unread}</span>}
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.length > 0 ? recentActivity.map((a, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: a.color }}>{a.icon}</div>
                <div className="flex-1">
                  <div className="text-sm text-gray-800">{a.text}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{a.time}</div>
                </div>
              </div>
            )) : (
              <div className="text-sm text-gray-400 text-center py-4">No recent activity</div>
            )}
          </div>
        </div>

        {/* Recent patients */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-gray-900">👥 Recent Patients</div>
            <Link href="/patients" className="text-blue-600 text-xs font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {myPatients.slice(0, 4).map(p => (
              <Link key={p.id} href={`/patients/${p.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors -mx-1">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {p.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{p.name}</div>
                  <div className="text-xs text-gray-500 truncate">{p.specialty} · {p.procedure}</div>
                </div>
                <StatusBadge status={p.status as Parameters<typeof StatusBadge>[0]['status']} />
              </Link>
            ))}
            {myPatients.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-4">No patients yet. <Link href="/add-patient" className="text-blue-600 hover:underline">Add one →</Link></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
