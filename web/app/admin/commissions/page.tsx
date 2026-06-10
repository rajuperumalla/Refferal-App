'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { COMMISSION_BADGE, fmtINR } from '@/lib/admin-data';

export default function CommissionsPage() {
  const { commissions, approveCommission, rejectCommission, markCommissionPaid, approveAllCommissions } = useStore();
  const [tab,          setTab]          = useState<'all' | 'pending_approval' | 'approved' | 'paid' | 'rejected'>('pending_approval');
  const [selected,     setSelected]     = useState<Set<number>>(new Set());
  const [rejectModal,  setRejectModal]  = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered     = tab === 'all' ? commissions : commissions.filter(c => c.status === tab);
  const pendingCount = commissions.filter(c => c.status === 'pending_approval').length;
  const pendingAmount= commissions.filter(c => c.status === 'pending_approval').reduce((s, c) => s + c.amount, 0);
  const paidAmount   = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0);

  const handleApproveAll = () => {
    const ids = selected.size > 0 ? [...selected] : undefined;
    approveAllCommissions(ids);
    setSelected(new Set());
  };

  const handleReject = () => {
    if (!rejectModal) return;
    rejectCommission(rejectModal, rejectReason);
    setRejectModal(null); setRejectReason('');
  };

  const toggleSelect = (id: number) => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const tabOptions = [
    { k: 'pending_approval', l: `⏳ Pending (${pendingCount})` },
    { k: 'approved',         l: '✅ Approved' },
    { k: 'paid',             l: '💰 Paid' },
    { k: 'rejected',         l: '❌ Rejected' },
    { k: 'all',              l: '📋 All' },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending Approval',           value: fmtINR(pendingAmount), sub: `${pendingCount} cases`,                                                          color: 'text-amber-600' },
          { label: 'Total Paid (All Time)',       value: fmtINR(paidAmount),    sub: `${commissions.filter(c => c.status === 'paid').length} cases`,                  color: 'text-emerald-600' },
          { label: 'Approved (Awaiting Payment)', value: fmtINR(commissions.filter(c => c.status === 'approved').reduce((s, c) => s + c.amount, 0)), sub: `${commissions.filter(c => c.status === 'approved').length} cases`, color: 'text-blue-600' },
          { label: 'Rejected',                   value: commissions.filter(c => c.status === 'rejected').length.toString(), sub: 'Cases rejected',                    color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            <div className="text-xs text-gray-400">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabOptions.map(t => (
            <button key={t.k} onClick={() => { setTab(t.k); setSelected(new Set()); }}
              className={`flex-1 py-3.5 text-xs font-medium border-b-2 -mb-px transition-all ${tab === t.k ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.l}
            </button>
          ))}
        </div>

        {tab === 'pending_approval' && pendingCount > 0 && (
          <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 border-b border-amber-100">
            <span className="text-sm text-amber-800 font-medium">
              {selected.size > 0 ? `${selected.size} selected` : `${pendingCount} pending`} — {fmtINR(pendingAmount)} total
            </span>
            <button onClick={handleApproveAll} className="ml-auto text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors">
              ✅ Approve {selected.size > 0 ? `Selected (${selected.size})` : 'All'}
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {tab === 'pending_approval' && <th className="px-5 py-3 w-10"></th>}
                {['Agent','Patient','Procedure','Amount','Status','Date','Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center text-gray-400"><div className="text-4xl mb-2">💰</div><div className="font-medium">No commissions in this category</div></td></tr>
              ) : filtered.map(c => {
                const badge = COMMISSION_BADGE[c.status];
                return (
                  <tr key={c.id} className={`hover:bg-gray-50/50 transition-colors ${selected.has(c.id) ? 'bg-indigo-50/30' : ''}`}>
                    {tab === 'pending_approval' && (
                      <td className="px-5 py-3.5">
                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                      </td>
                    )}
                    <td className="px-5 py-3.5"><div className="font-medium text-gray-900">{c.agentName}</div><div className="text-xs text-gray-400">{c.agentId}</div></td>
                    <td className="px-5 py-3.5 font-medium text-gray-800">{c.patientName}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{c.procedure}</td>
                    <td className="px-5 py-3.5 font-bold text-emerald-600">{fmtINR(c.amount)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.bg} ${badge.color}`}>{badge.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {c.status === 'paid'     && c.paidAt     ? <><div>Paid: {c.paidAt}</div><div className="text-[10px] font-mono text-gray-300">{c.utr}</div></> :
                       c.status === 'approved' && c.approvedAt ? `Approved: ${c.approvedAt}` :
                       c.status === 'rejected'                 ? <span className="text-red-400">{c.rejectedReason}</span> : c.createdAt}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {c.status === 'pending_approval' && (
                          <>
                            <button onClick={() => approveCommission(c.id)} className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors">Approve</button>
                            <button onClick={() => setRejectModal(c.id)}    className="text-xs font-medium text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors">Reject</button>
                          </>
                        )}
                        {c.status === 'approved' && (
                          <button onClick={() => markCommissionPaid(c.id)} className="text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors">Mark Paid</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Reject Commission</h3>
            <p className="text-sm text-gray-500 mb-4">
              Rejecting {fmtINR(commissions.find(c => c.id === rejectModal)?.amount ?? 0)} for {commissions.find(c => c.id === rejectModal)?.patientName}.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason (optional)</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Describe the reason…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-5" />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleReject} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-all">Reject Commission</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
