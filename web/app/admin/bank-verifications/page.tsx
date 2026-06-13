'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import type { BankVerificationRequest } from '@/lib/store';
import type { KYCRequest } from '@/lib/admin-data';

// ─── Shared styles ─────────────────────────────────────────────────────────────
const BANK_STATUS_BADGE = {
  pending:  { label: '⏳ Pending Review', bg: 'bg-amber-50',   color: 'text-amber-700',   border: 'border-amber-200' },
  approved: { label: '✅ Approved',       bg: 'bg-emerald-50', color: 'text-emerald-700', border: 'border-emerald-200' },
  rejected: { label: '❌ Rejected',       bg: 'bg-red-50',     color: 'text-red-700',     border: 'border-red-200' },
};

const KYC_STATUS_BADGE = {
  pending:  { label: '⏳ Pending Review', bg: 'bg-amber-50',   color: 'text-amber-700',   border: 'border-amber-200' },
  approved: { label: '✅ Approved',       bg: 'bg-emerald-50', color: 'text-emerald-700', border: 'border-emerald-200' },
  rejected: { label: '❌ Rejected',       bg: 'bg-red-50',     color: 'text-red-700',     border: 'border-red-200' },
};

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

// ─── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ name, id, label, onClose, onConfirm }: {
  name: string; id: string; label: string;
  onClose: () => void; onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-gray-900 text-lg mb-1">Reject {label}</h3>
        <p className="text-sm text-gray-500 mb-4">
          Rejecting for <strong>{name}</strong> ({id}). The agent will be notified and asked to resubmit.
        </p>
        <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
          placeholder="e.g. Document unclear, Aadhaar number mismatch…"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-5" />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button onClick={() => { if (reason.trim()) onConfirm(reason.trim()); }}
            disabled={!reason.trim()}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold">
            Reject & Notify
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bank Verifications Tab ────────────────────────────────────────────────────
function BankVerificationsTab() {
  const { bankVerificationRequests, approveBankVerification, rejectBankVerification, adminNotifications, markAdminNotificationRead } = useStore();
  const [subTab, setSubTab]       = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [rejectTarget, setRejectTarget] = useState<BankVerificationRequest | null>(null);
  const [expandedId, setExpandedId]     = useState<number | null>(null);

  const filtered    = subTab === 'all' ? bankVerificationRequests : bankVerificationRequests.filter(r => r.status === subTab);
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
    <>
      <div className="flex border-b border-gray-100">
        {tabs.map(t => (
          <button key={t.k} onClick={() => setSubTab(t.k)}
            className={`flex-1 py-3 text-xs font-medium border-b-2 -mb-px transition-all ${subTab === t.k ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-16 text-center text-gray-400">
          <div className="text-4xl mb-2">🏦</div>
          <div className="font-medium">No {subTab === 'all' ? '' : subTab} bank verification requests</div>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map(req => {
            const badge      = BANK_STATUS_BADGE[req.status];
            const isExpanded = expandedId === req.id;
            return (
              <div key={req.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-lg">{req.agentName[0]}</div>
                    <div>
                      <div className="font-semibold text-gray-900">{req.agentName}</div>
                      <div className="text-xs text-gray-400">{req.agentId} · Submitted {req.submittedAt}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.bg} ${badge.color} ${badge.border}`}>{badge.label}</span>
                    <button onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded-lg hover:bg-indigo-50">{isExpanded ? 'Hide ↑' : 'View ↓'}</button>
                  </div>
                </div>
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
                {isExpanded && (
                  <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-0">
                    <DetailRow icon="👤" label="Account Holder Name" value={req.accountName} />
                    <DetailRow icon="🏛️" label="Account Number"      value={req.accountNumber} mono />
                    <DetailRow icon="🔢" label="IFSC Code"           value={req.ifscCode} mono />
                    <DetailRow icon="💳" label="UPI ID"              value={req.upiId} />
                    <DetailRow icon="📄" label="Attached Document"   value={`${req.documentName} (${req.documentType})`} />
                    {req.rejectionReason && (
                      <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                        <div className="text-xs text-red-500 font-medium">Rejection Reason</div>
                        <div className="text-sm text-red-700 mt-0.5">{req.rejectionReason}</div>
                      </div>
                    )}
                  </div>
                )}
                {req.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => handleApprove(req)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl">✅ Approve & Verify</button>
                    <button onClick={() => setRejectTarget(req)}
                      className="flex-1 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold px-4 py-2.5 rounded-xl">❌ Reject</button>
                  </div>
                )}
                {req.status !== 'pending' && req.reviewedAt && (
                  <div className="mt-3 text-xs text-gray-400">{req.status === 'approved' ? 'Verified' : 'Rejected'} on {req.reviewedAt}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          name={rejectTarget.agentName} id={rejectTarget.agentId} label="Bank Verification"
          onClose={() => setRejectTarget(null)}
          onConfirm={reason => handleReject(rejectTarget, reason)}
        />
      )}
    </>
  );
}

// ─── KYC Verifications Tab ─────────────────────────────────────────────────────
function KYCVerificationsTab() {
  const { kycRequests, approveKYC, rejectKYC } = useStore();
  const [subTab,       setSubTab]       = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [rejectTarget, setRejectTarget] = useState<KYCRequest | null>(null);
  const [expandedId,   setExpandedId]   = useState<number | null>(null);

  const filtered    = subTab === 'all' ? kycRequests : kycRequests.filter(k => k.status === subTab);
  const pendingCount = kycRequests.filter(k => k.status === 'pending').length;

  const tabs = [
    { k: 'pending',  l: `⏳ Pending (${pendingCount})` },
    { k: 'approved', l: '✅ Approved' },
    { k: 'rejected', l: '❌ Rejected' },
    { k: 'all',      l: '📋 All' },
  ] as const;

  return (
    <>
      <div className="flex border-b border-gray-100">
        {tabs.map(t => (
          <button key={t.k} onClick={() => setSubTab(t.k)}
            className={`flex-1 py-3 text-xs font-medium border-b-2 -mb-px transition-all ${subTab === t.k ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-16 text-center text-gray-400">
          <div className="text-4xl mb-2">🪪</div>
          <div className="font-medium">No {subTab === 'all' ? '' : subTab} KYC submissions</div>
          <div className="text-xs mt-1">Agent KYC documents will appear here once submitted</div>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map(req => {
            const badge      = KYC_STATUS_BADGE[req.status];
            const isExpanded = expandedId === req.id;
            return (
              <div key={req.id} className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center font-bold text-violet-700 text-lg">{req.agentName[0]}</div>
                    <div>
                      <div className="font-semibold text-gray-900">{req.agentName}</div>
                      <div className="text-xs text-gray-400">{req.agentId} · {req.phone} · Submitted {req.submittedAt}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.bg} ${badge.color} ${badge.border}`}>{badge.label}</span>
                    <button onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      className="text-xs text-indigo-600 font-medium px-2 py-1 rounded-lg hover:bg-indigo-50">{isExpanded ? 'Hide ↑' : 'View ↓'}</button>
                  </div>
                </div>

                {/* Quick preview */}
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <div className="text-gray-400 mb-0.5">Aadhaar</div>
                    <div className="font-semibold text-gray-800 font-mono">{req.aadhaarNumber}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <div className="text-gray-400 mb-0.5">PAN</div>
                    <div className="font-semibold text-gray-800 font-mono">{req.panNumber}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <div className="text-gray-400 mb-0.5">Photo</div>
                    <div className="font-semibold text-gray-800 truncate">{req.profilePhoto || 'Not uploaded'}</div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-0">
                    <DetailRow icon="🪪" label="Aadhaar Number (masked)" value={req.aadhaarNumber} mono />
                    <DetailRow icon="📇" label="PAN Number (masked)"     value={req.panNumber} mono />
                    <DetailRow icon="📄" label="Aadhaar Document"        value={req.aadhaarDoc} />
                    <DetailRow icon="📄" label="PAN Document"            value={req.panDoc} />
                    {req.profilePhoto && <DetailRow icon="📷" label="Profile Photo" value={req.profilePhoto} />}
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
                    <button onClick={() => approveKYC(req.id, req.agentId)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl">
                      ✅ Approve KYC
                    </button>
                    <button onClick={() => setRejectTarget(req)}
                      className="flex-1 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold px-4 py-2.5 rounded-xl">
                      ❌ Reject
                    </button>
                  </div>
                )}
                {req.status !== 'pending' && req.reviewedAt && (
                  <div className="mt-3 text-xs text-gray-400">
                    {req.status === 'approved' ? 'KYC approved' : 'KYC rejected'} on {req.reviewedAt}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          name={rejectTarget.agentName} id={rejectTarget.agentId} label="KYC"
          onClose={() => setRejectTarget(null)}
          onConfirm={reason => { rejectKYC(rejectTarget.id, rejectTarget.agentId, reason); setRejectTarget(null); }}
        />
      )}
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function VerificationsPage() {
  const { bankVerificationRequests, kycRequests } = useStore();
  const [mainTab, setMainTab] = useState<'bank' | 'kyc'>('bank');

  const bankPending = bankVerificationRequests.filter(r => r.status === 'pending').length;
  const kycPending  = kycRequests.filter(k => k.status === 'pending').length;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Bank Pending',    value: bankPending, color: 'text-amber-600' },
          { label: 'Bank Verified',   value: bankVerificationRequests.filter(r => r.status === 'approved').length, color: 'text-emerald-600' },
          { label: 'KYC Pending',     value: kycPending,  color: kycPending > 0 ? 'text-violet-600' : 'text-gray-400' },
          { label: 'KYC Verified',    value: kycRequests.filter(k => k.status === 'approved').length, color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div suppressHydrationWarning className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main tab switcher */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button onClick={() => setMainTab('bank')}
            className={`flex-1 py-4 text-sm font-semibold transition-all ${mainTab === 'bank' ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px bg-white' : 'text-gray-500 hover:text-gray-700'}`}>
            🏦 Bank Details
            {bankPending > 0 && <span className="ml-2 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{bankPending}</span>}
          </button>
          <button onClick={() => setMainTab('kyc')}
            className={`flex-1 py-4 text-sm font-semibold transition-all ${mainTab === 'kyc' ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px bg-white' : 'text-gray-500 hover:text-gray-700'}`}>
            🪪 KYC Documents
            {kycPending > 0 && <span className="ml-2 bg-violet-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{kycPending}</span>}
          </button>
        </div>

        {mainTab === 'bank' && <BankVerificationsTab />}
        {mainTab === 'kyc'  && <KYCVerificationsTab />}
      </div>
    </div>
  );
}
