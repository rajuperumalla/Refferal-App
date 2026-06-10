'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';

const fmt  = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const fmtL = (n: number) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(0)}K` : `₹${n}`;

const TOP_PROCEDURES = [
  { proc: 'Knee Replacement',    amt: 18200 },
  { proc: 'Gallbladder Surgery', amt: 9600 },
  { proc: 'Cataract Surgery',    amt: 7200 },
  { proc: 'Stone Removal',       amt: 6800 },
  { proc: 'Laparoscopy',         amt: 5400 },
];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending_approval: { label: '⏳ Awaiting Admin Approval', color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-100' },
  approved:         { label: '✅ Approved — Awaiting Payment', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
  paid:             { label: '✅ Paid',                      color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
  rejected:         { label: '❌ Rejected',                  color: 'text-red-700',    bg: 'bg-red-50 border-red-100' },
};

export default function EarningsPage() {
  const { myCommissions, currentAgent, agentMonthlyEarnings } = useStore();
  const [tab, setTab] = useState<'overview' | 'pending' | 'paid'>('overview');

  const pending  = myCommissions.filter(c => c.status === 'pending_approval' || c.status === 'approved');
  const paid     = myCommissions.filter(c => c.status === 'paid');
  const rejected = myCommissions.filter(c => c.status === 'rejected');

  const maxBar    = Math.max(...agentMonthlyEarnings.map(m => m.amount), 1);
  const thisMonth = agentMonthlyEarnings[agentMonthlyEarnings.length - 1]?.amount ?? 0;
  const lastMonth = agentMonthlyEarnings[agentMonthlyEarnings.length - 2]?.amount ?? 0;
  const growth    = lastMonth > 0 ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex border-b border-gray-100">
          {([
            ['overview', '📊 Overview'],
            ['pending',  `⏳ Pending (${pending.length})`],
            ['paid',     `✅ Paid (${paid.length})`],
          ] as const).map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-4 text-sm font-medium capitalize border-b-2 -mb-px transition-all ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Hero */}
              <div className="lg:col-span-2 rounded-2xl text-white p-6 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#2563EB,#1D4ED8)' }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: 'radial-gradient(circle,#fff,transparent)', transform: 'translate(30%,-30%)' }} />
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-white/70 text-sm">This Month</span>
                  <span className="bg-emerald-400/30 text-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full">↑ {growth}%</span>
                </div>
                <div className="text-4xl font-bold mb-5">{fmt(thisMonth)}</div>
                <div className="flex gap-4">
                  {[
                    { label: 'Total Earned', value: fmtL(currentAgent?.totalEarned ?? 0), color: 'text-amber-300' },
                    { label: 'Pending',      value: fmt(currentAgent?.pending ?? 0),       color: 'text-white' },
                    { label: 'Total Leads',  value: String(currentAgent?.totalLeads ?? 0), color: 'text-white' },
                  ].map(s => (
                    <div key={s.label} className="bg-white/15 rounded-xl px-4 py-3">
                      <div className="text-white/60 text-xs mb-1">{s.label}</div>
                      <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top procedures */}
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                <div className="font-semibold text-gray-900 mb-4">🏆 Top Procedures</div>
                {TOP_PROCEDURES.map((p, i) => (
                  <div key={p.proc} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-orange-50 text-orange-600'}`}>{i + 1}</div>
                    <div className="flex-1 text-sm text-gray-700 truncate">{p.proc}</div>
                    <div className="text-sm font-bold text-emerald-600">{fmt(p.amt)}</div>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div className="lg:col-span-3 bg-gray-50 rounded-2xl border border-gray-100 p-5">
                <div className="font-semibold text-gray-900 mb-5">📈 Monthly Earnings Breakdown</div>
                <div className="flex items-end gap-4 h-36">
                  {agentMonthlyEarnings.map((m, i) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="text-xs font-semibold text-gray-600">{fmtL(m.amount)}</div>
                      <div className="w-full rounded-t-lg transition-all"
                        style={{ height: `${(m.amount / maxBar) * 100}%`, background: i === agentMonthlyEarnings.length - 1 ? '#2563EB' : '#BFDBFE' }} />
                      <div className="text-xs text-gray-500">{m.month}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'pending' && (
            <div className="space-y-3">
              {pending.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No pending commissions 🎉</div>
              ) : pending.map(c => {
                const s = STATUS_LABELS[c.status];
                return (
                  <div key={c.id} className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">{c.patientName}</div>
                        <div className="text-sm text-gray-500">{c.procedure}</div>
                      </div>
                      <div className="text-xl font-bold text-emerald-600">{fmt(c.amount)}</div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${s.bg} ${s.color}`}>{s.label}</span>
                      <span className="text-xs text-gray-400">Submitted: {c.createdAt}</span>
                    </div>
                  </div>
                );
              })}
              {rejected.length > 0 && (
                <>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Rejected</div>
                  {rejected.map(c => (
                    <div key={c.id} className="bg-red-50 rounded-xl border border-red-100 p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">{c.patientName}</div>
                          <div className="text-sm text-gray-500">{c.procedure}</div>
                        </div>
                        <div className="text-xl font-bold text-red-400">{fmt(c.amount)}</div>
                      </div>
                      <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                        ❌ {c.rejectedReason ?? 'Rejected by admin'}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === 'paid' && (
            <div className="space-y-3">
              {paid.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No paid commissions yet</div>
              ) : paid.map(c => (
                <div key={c.id} className="bg-gray-50 rounded-xl border border-gray-100 p-5 flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl flex-shrink-0">✅</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{c.patientName}</div>
                    <div className="text-sm text-gray-500">{c.paidAt} · {c.method}</div>
                    {c.utr && <div className="text-xs text-gray-400 mt-0.5">UTR: {c.utr}</div>}
                  </div>
                  <div className="text-xl font-bold text-emerald-600">{fmt(c.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
