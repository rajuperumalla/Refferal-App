import Link from 'next/link';
import { PATIENTS, NOTIFICATIONS, MONTHLY_EARNINGS, AGENT, fmt, fmtL } from '@/lib/data';
import StatusBadge from '@/components/StatusBadge';

export default function DashboardPage() {
  const thisMonth = MONTHLY_EARNINGS[MONTHLY_EARNINGS.length - 1].amount;
  const lastMonth = MONTHLY_EARNINGS[MONTHLY_EARNINGS.length - 2].amount;
  const growth = (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1);
  const unread = NOTIFICATIONS.filter(n => !n.read).length;
  const maxBar = Math.max(...MONTHLY_EARNINGS.map(m => m.amount));

  const stats = [
    { icon: '👥', label: 'Active Patients', value: PATIENTS.filter(p => !['completed','lost'].includes(p.status)).length.toString(), color: '#2563EB', bg: '#EFF6FF' },
    { icon: '🏥', label: 'Pending Surgeries', value: PATIENTS.filter(p => p.status === 'ipd_confirmed').length.toString(), color: '#D97706', bg: '#FFFBEB' },
    { icon: '📈', label: 'Conversion Rate', value: `${AGENT.conversionRate}%`, color: '#10B981', bg: '#ECFDF5' },
    { icon: '💵', label: 'Avg Commission', value: fmtL(Math.round(PATIENTS.reduce((a,p) => a + p.commission, 0) / PATIENTS.length)), color: '#8B5CF6', bg: '#F5F3FF' },
  ];

  const recentActivity = [
    { icon: '✅', text: 'Ramesh Kumar — Surgery completed', time: '2h ago', color: '#ECFDF5' },
    { icon: '📅', text: 'Priya Sharma — OPD scheduled at Manipal', time: '5h ago', color: '#F5F3FF' },
    { icon: '₹', text: 'Commission ₹4,200 credited to account', time: '1d ago', color: '#EFF6FF' },
    { icon: '🏥', text: 'Suresh Rao — IPD admission confirmed', time: '1d ago', color: '#FFFBEB' },
  ];

  return (
    <div className="space-y-6">
      {/* Top cards row */}
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
              <div className="text-xl font-bold text-amber-300">{fmtL(AGENT.totalEarned)}</div>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-3">
              <div className="text-white/60 text-xs mb-1">Pending</div>
              <div className="text-xl font-bold">{fmt(AGENT.pending)}</div>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-3">
              <div className="text-white/60 text-xs mb-1">Total Leads</div>
              <div className="text-xl font-bold">{AGENT.totalLeads}</div>
            </div>
          </div>
        </div>

        {/* Mini bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="font-semibold text-gray-900 mb-4">📊 6-Month Trend</div>
          <div className="flex items-end gap-2 h-28">
            {MONTHLY_EARNINGS.map((m, i) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[9px] font-semibold text-gray-500">{fmtL(m.amount)}</div>
                <div className="w-full rounded-t-md" style={{
                  height: `${(m.amount / maxBar) * 90}%`,
                  background: i === MONTHLY_EARNINGS.length - 1 ? '#2563EB' : '#BFDBFE',
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background: s.bg }}>
              {s.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bottom row: activity + recent patients */}
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
            {recentActivity.map((a, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: a.color }}>
                  {a.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-800">{a.text}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent patients */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-gray-900">👥 Recent Patients</div>
            <Link href="/patients" className="text-blue-600 text-xs font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {PATIENTS.slice(0, 4).map(p => (
              <Link key={p.id} href={`/patients/${p.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors -mx-1">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {p.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{p.name}</div>
                  <div className="text-xs text-gray-500 truncate">{p.specialty} · {p.procedure}</div>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
