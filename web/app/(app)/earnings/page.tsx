'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { MOP_CONFIG, MopType } from '@/lib/admin-data';

const fmt  = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const fmtL = (n: number) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(0)}K` : `₹${n}`;

const COMM_STATUS: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pending_approval: { label: 'Awaiting Admin Approval', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-400' },
  approved:         { label: 'Approved — Awaiting Payment', color: 'text-blue-700', bg: 'bg-blue-50',   border: 'border-blue-200',    dot: 'bg-blue-500' },
  paid:             { label: 'Paid',                    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  rejected:         { label: 'Rejected',                color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-500' },
};

const TOP_PROCEDURES = [
  { proc: 'Knee Replacement',    amt: 18200 },
  { proc: 'Gallbladder Surgery', amt: 9600 },
  { proc: 'Cataract Surgery',    amt: 7200 },
  { proc: 'Stone Removal',       amt: 6800 },
  { proc: 'Laparoscopy',         amt: 5400 },
];

export default function EarningsPage() {
  const { myCommissions, currentAgent, agentMonthlyEarnings, myPendingAmount, myApprovedAmount } = useStore();
  const [tab, setTab] = useState<'overview' | 'pending' | 'paid'>('overview');

  const pending  = myCommissions.filter(c => c.status === 'pending_approval' || c.status === 'approved');
  const paid     = myCommissions.filter(c => c.status === 'paid');
  const rejected = myCommissions.filter(c => c.status === 'rejected');

  const totalPending = myPendingAmount + myApprovedAmount;

  const maxBar    = Math.max(...agentMonthlyEarnings.map(m => m.amount), 1);
  const thisMonth = agentMonthlyEarnings[agentMonthlyEarnings.length - 1]?.amount ?? 0;
  const lastMonth = agentMonthlyEarnings[agentMonthlyEarnings.length - 2]?.amount ?? 0;
  const growth    = lastMonth > 0 ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {([
            ['overview', '📊 Overview'],
            ['pending',  `⏳ Pending (${pending.length})`],
            ['paid',     `✅ Paid (${paid.length})`],
          ] as const).map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-4 text-sm font-medium border-b-2 -mb-px transition-all ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ── Overview ─────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Hero earnings card */}
              <div className="lg:col-span-2 rounded-2xl text-white p-6 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#2563EB,#1D4ED8)' }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                  style={{ background: 'radial-gradient(circle,#fff,transparent)', transform: 'translate(30%,-30%)' }} />
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-white/70 text-sm">This Month</span>
                  <span className="bg-emerald-400/30 text-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full">↑ {growth}%</span>
                </div>
                <div className="text-4xl font-bold mb-5">{fmt(thisMonth)}</div>
                <div className="flex gap-4 flex-wrap">
                  <div className="bg-white/15 rounded-xl px-4 py-3">
                    <div className="text-white/60 text-xs mb-1">Total Earned</div>
                    <div className="text-xl font-bold text-amber-300">{fmtL(currentAgent?.totalEarned ?? 0)}</div>
                  </div>
                  <div className="bg-white/15 rounded-xl px-4 py-3">
                    <div className="text-white/60 text-xs mb-1">Pending</div>
                    <div className="text-xl font-bold">{fmt(myPendingAmount)}</div>
                    {myApprovedAmount > 0 && (
                      <div className="text-[10px] text-emerald-300 mt-0.5">+{fmt(myApprovedAmount)} approved</div>
                    )}
                  </div>
                  <div className="bg-white/15 rounded-xl px-4 py-3">
                    <div className="text-white/60 text-xs mb-1">Total Leads</div>
                    <div className="text-xl font-bold">{currentAgent?.totalLeads ?? 0}</div>
                  </div>
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

          {/* ── Pending ──────────────────────────────────────────────── */}
          {tab === 'pending' && (
            <div className="space-y-4">

              {/* Pending summary bar */}
              {pending.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <div className="text-xs text-amber-600 font-medium mb-0.5">Awaiting Approval</div>
                    <div className="text-xl font-bold text-amber-700">{fmt(myPendingAmount)}</div>
                    <div className="text-xs text-amber-500 mt-0.5">{myCommissions.filter(c=>c.status==='pending_approval').length} commission{myCommissions.filter(c=>c.status==='pending_approval').length !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <div className="text-xs text-blue-600 font-medium mb-0.5">Approved — In Queue</div>
                    <div className="text-xl font-bold text-blue-700">{fmt(myApprovedAmount)}</div>
                    <div className="text-xs text-blue-500 mt-0.5">{myCommissions.filter(c=>c.status==='approved').length} commission{myCommissions.filter(c=>c.status==='approved').length !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 sm:col-span-1 col-span-2">
                    <div className="text-xs text-indigo-600 font-medium mb-0.5">Total In Pipeline</div>
                    <div className="text-xl font-bold text-indigo-700">{fmt(totalPending)}</div>
                    <div className="text-xs text-indigo-400 mt-0.5">across {pending.length} case{pending.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              )}

              {pending.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No pending commissions 🎉</div>
              ) : pending.map(c => {
                const s    = COMM_STATUS[c.status];
                const mCfg = c.mop ? MOP_CONFIG[c.mop as MopType] : null;
                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                    {/* Card header */}
                    <div className="px-5 py-4 flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                          {c.patientName[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{c.patientName}</div>
                          <div className="text-sm text-gray-500 truncate">{c.procedure}</div>
                          <div className="text-xs text-gray-400 mt-0.5">Submitted: {c.createdAt}</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-emerald-600">{fmt(c.amount)}</div>
                        {c.shareableAmount && c.shareableAmount !== c.ticketSize && (
                          <div className="text-xs text-gray-400 mt-0.5">on {fmt(c.shareableAmount)} shareable</div>
                        )}
                      </div>
                    </div>

                    {/* Ticket breakdown (if MOP set) */}
                    {c.mop && c.ticketSize ? (
                      <div className="mx-5 mb-4 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
                        <div className="px-4 py-2 bg-gray-100/50 border-b border-gray-100 text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                          💰 Ticket Breakdown
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 divide-x divide-gray-100">
                          <div className="px-4 py-3">
                            <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Total Ticket</div>
                            <div className="text-sm font-bold text-gray-900">{fmt(c.ticketSize)}</div>
                          </div>
                          {(c.implantCost ?? 0) > 0 && (
                            <div className="px-4 py-3">
                              <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Implants (excl.)</div>
                              <div className="text-sm font-bold text-red-500">− {fmt(c.implantCost!)}</div>
                            </div>
                          )}
                          <div className="px-4 py-3">
                            <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Your Share On</div>
                            <div className="text-sm font-bold text-indigo-700">{fmt(c.shareableAmount!)}</div>
                          </div>
                          <div className="px-4 py-3">
                            <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Commission</div>
                            <div className="text-sm font-bold text-emerald-600">{fmt(c.amount)}</div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Footer: status + MOP + due date */}
                    <div className="px-5 pb-4 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${s.bg} ${s.border} ${s.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
                      </span>
                      {mCfg ? (
                        <>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full border ${mCfg.bg} ${mCfg.border} ${mCfg.color}`}>
                            {mCfg.icon} {mCfg.label}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            📅 Expected: <strong className="text-gray-700">{c.expectedPaymentDate}</strong>
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-orange-500 bg-orange-50 border border-orange-200 px-2.5 py-1.5 rounded-full font-medium">
                          ⏳ MOP not set by admin yet
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Rejected section */}
              {rejected.length > 0 && (
                <>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Rejected</div>
                  {rejected.map(c => (
                    <div key={c.id} className="bg-red-50 rounded-2xl border border-red-100 p-5 flex justify-between items-start gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{c.patientName}</div>
                        <div className="text-sm text-gray-500">{c.procedure}</div>
                        <span className="inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                          ❌ {c.rejectedReason ?? 'Rejected by admin'}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-red-400 flex-shrink-0">{fmt(c.amount)}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── Paid ─────────────────────────────────────────────────── */}
          {tab === 'paid' && (
            <div className="space-y-4">
              {paid.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No paid commissions yet</div>
              ) : paid.map(c => {
                const mCfg = c.mop ? MOP_CONFIG[c.mop as MopType] : null;
                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl flex-shrink-0">✅</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{c.patientName}</div>
                        <div className="text-sm text-gray-500 truncate">{c.procedure}</div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-xs text-gray-400">Paid: {c.paidAt}</span>
                          {c.method && <span className="text-xs text-gray-400">· {c.method}</span>}
                          {c.utr && <span className="text-xs text-gray-400">· UTR: {c.utr}</span>}
                          {mCfg && (
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${mCfg.bg} ${mCfg.border} ${mCfg.color}`}>
                              {mCfg.icon} {mCfg.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-emerald-600 flex-shrink-0">{fmt(c.amount)}</div>
                    </div>
                    {c.mop && c.ticketSize ? (
                      <div className="mx-5 mb-4 rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 grid grid-cols-3 gap-3 text-xs">
                        <div><div className="text-gray-400 mb-0.5">Ticket Size</div><div className="font-semibold text-gray-900">{fmt(c.ticketSize)}</div></div>
                        {(c.implantCost ?? 0) > 0 && <div><div className="text-gray-400 mb-0.5">Implants excl.</div><div className="font-semibold text-red-500">− {fmt(c.implantCost!)}</div></div>}
                        <div><div className="text-gray-400 mb-0.5">Paid On</div><div className="font-semibold text-emerald-600">{fmt(c.shareableAmount!)}</div></div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
