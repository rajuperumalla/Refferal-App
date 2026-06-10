'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import type { BankVerificationRequest } from '@/lib/store';

const STATUS_BADGE = {
  pending:  { label: '⏳ Pending Review', bg: 'bg-amber-50',   color: 'text-amber-700',   border: 'border-amber-200' },
  approved: { label: '✅ Approved',       bg: 'bg-emerald-50', color: 'text-emerald-700', border: 'border-emerald-200' },
  rejected: { label: '❌ Rejected',       bg: 'bg-red-50',     color: 'text-red-700',     border: 'border-red-200' },
};

function RejectModal({ req, onClose, onConfirm }: {
  req: BankVerificationRequest;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-gray-900 text-lg mb-1">Reject Bank Verification</h3>
        <p className="text-sm text-gray-500 mb-4">
          Rejecting bank details for <strong>{req.agentName}</strong> ({req.agentId}). The agent will be notified and asked to resubmit.
        </p>
        <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Rejection *</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
          placeholder="e.g. Account number mismatch, IFSC code invalid, document unclear…"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-5" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50 transition-all">Cancel</button>
          <button onClick={() => { if (reason.trim()) onConfirm(reason.trim()); }}
            disabled={!reason.trim()}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-all">
            Reject & Notify Agent
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value, mono }: { icon: string; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">{icon}</div>
      <div>
        <div className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</div>
        <div className={`text-sm font-medium text-gray-800 ${mono ? 'font-mono' : ''}`}>{value || '—'}</div>
      </div>
    </div>
  );
}

export default function BankVerificationsPage() {
  const { bankVerificationRequests, approveBankVerification, rejectBankVerification, adminNotifications, markAdminNotificationRead } = useStore();
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [rejectTarget, setRejectTarget] = useState<BankVerificationRequest | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = tab === 'all' ? bankVerificationRequests : bankVerificationRequests.filter(r => r.status === tab);
  const pendingCount = bankVerificationRequests.filter(r => r.status === 'pending').length;

  const handleApprove = (req: BankVerificationRequest) => {
    approveBankVerification(req.id);
    adminNotifications.filter(n => n.refId === req.id).forEach(n => markAdminNotificationRead(n.id));
  };

  const handleReject = (req: BankVerificationRequest, reason: string) => {
    rejectBankVerification(req.id, reason);
    adminNotifications.filter(n => n.refId === req.id).forEach(n => markAdminNotificationRead(n.id));
    setRejectTarget(null);
  };

  const tabs = [
    { k: 'pending',  l: `⏳ Pending (${pendingCount})` },
    { k: 'approved', l: '✅ Approved' },
    { k: 'rejected', l: '❌ Rejected' },
    { k: 'all',      l: '📋 All' },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending Review',  value: bankVerificationRequests.filter(r => r.status === 'pending').length,  color: 'text-amber-600' },
          { label: 'Verified Agents', value: bankVerificationRequests.filter(r => r.status === 'approved').length, color: 'text-emerald-600' },
          { label: 'Rejected',        value: bankVerificationRequests.filter(r => r.status === 'rejected').length, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`flex-1 py-3.5 text-xs font-medium border-b-2 -mb-px transition-all ${tab === t.k ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.l}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center text-gray-400">
            <div className="text-4xl mb-2">🏦</div>
            <div className="font-medium">No {tab === 'all' ? '' : tab} verification requests</div>
            <div className="text-xs mt-1">Agent bank submissions will appear here</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(req => {
              const badge = STATUS_BADGE[req.status];
              const isExpanded = expandedId === req.id;
              return (
                <div key={req.id} className="p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-lg flex-shrink-0">
                        {req.agentName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{req.agentName}</div>
                        <div className="text-xs text-gray-400">{req.agentId} · Submitted {req.submittedAt}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.bg} ${badge.color} ${badge.border}`}>
                        {badge.label}
                      </span>
                      <button onClick={() => setExpandedId(isExpanded ? null : req.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors">
                        {isExpanded ? 'Hide ↑' : 'View ↓'}
                      </button>
                    </div>
                  </div>

                  {/* Quick preview (always visible) */}
                  <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-gray-50 rounded-xl px-3 py-2">
                      <div className="text-gray-400 mb-0.5">Account Holder</div>
                      <div className="font-semibold text-gray-800 truncate">{req.accountName}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2">
                      <div className="text-gray-400 mb-0.5">IFSC</div>
                      <div className="font-semibold text-gray-800 font-mono">{req.ifscCode}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2">
                      <div className="text-gray-400 mb-0.5">Document</div>
                      <div className="font-semibold text-gray-800 truncate">{req.documentType || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-0">
                      <DetailRow icon="👤" label="Account Holder Name" value={req.accountName} />
                      <DetailRow icon="🏛️" label="Account Number" value={req.accountNumber} mono />
                      <DetailRow icon="🔢" label="IFSC Code" value={req.ifscCode} mono />
                      <DetailRow icon="💳" label="UPI ID" value={req.upiId} />
                      <DetailRow icon="📄" label="Attached Document" value={`${req.documentName} (${req.documentType})`} />
                      {req.rejectionReason && (
                        <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                          <div className="text-xs text-red-500 font-medium">Rejection Reason</div>
                          <div className="text-sm text-red-700 mt-0.5">{req.rejectionReason}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {req.status === 'pending' && (
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => handleApprove(req)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors">
                        ✅ Approve & Verify
                      </button>
                      <button onClick={() => setRejectTarget(req)}
                        className="flex-1 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors">
                        ❌ Reject
                      </button>
                    </div>
                  )}
                  {req.status === 'approved' && req.reviewedAt && (
                    <div className="mt-3 text-xs text-gray-400">Verified on {req.reviewedAt}</div>
                  )}
                  {req.status === 'rejected' && req.reviewedAt && (
                    <div className="mt-3 text-xs text-gray-400">Rejected on {req.reviewedAt}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {rejectTarget && (
        <RejectModal
          req={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={(reason) => handleReject(rejectTarget, reason)}
        />
      )}
    </div>
  );
}
