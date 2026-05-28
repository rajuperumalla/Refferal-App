'use client';
import { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import type { BankDetails } from '@/lib/store';

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const VERIFICATION_BADGE: Record<BankDetails['verificationStatus'], { label: string; bg: string; color: string }> = {
  unverified: { label: '⚠️ Not Verified',        bg: 'bg-amber-50',  color: 'text-amber-700' },
  pending:    { label: '⏳ Verification Pending', bg: 'bg-blue-50',   color: 'text-blue-700' },
  verified:   { label: '✅ Verified',             bg: 'bg-emerald-50',color: 'text-emerald-700' },
  rejected:   { label: '❌ Rejected — Resubmit',  bg: 'bg-red-50',    color: 'text-red-700' },
};

export default function ProfilePage() {
  const { currentAgent, bankDetails, updateBankDetails, submitBankVerification } = useStore();
  const agent = currentAgent;

  const [notifs,      setNotifs]      = useState(true);
  const [biometric,   setBiometric]   = useState(false);
  const [darkMode,    setDarkMode]    = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);

  // Bank details form
  const [bankForm, setBankForm] = useState<BankDetails>(bankDetails);
  const [bankEditing, setBankEditing] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  const [showAccNo, setShowAccNo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setBank = (k: keyof BankDetails, v: string) =>
    setBankForm(f => ({ ...f, [k]: v }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const docType: BankDetails['documentType'] =
      file.name.toLowerCase().includes('statement') ? 'statement' : 'passbook';
    setBankForm(f => ({ ...f, documentName: file.name, documentType: docType }));
  };

  const handleBankSave = () => {
    const updated: BankDetails = {
      ...bankForm,
      verificationStatus: 'pending',
      rejectionReason: undefined,
    };
    updateBankDetails(updated);
    submitBankVerification(updated);
    setBankForm(updated);
    setBankEditing(false);
    setBankSaved(true);
    setTimeout(() => setBankSaved(false), 4000);
  };

  const maskedAccNo = bankForm.accountNumber
    ? bankForm.accountNumber.replace(/.(?=.{4})/g, '•')
    : '';

  const Toggle = ({ val, set }: { val: boolean; set: (v: boolean) => void }) => (
    <div onClick={() => set(!val)}
      className={`w-11 h-6 rounded-full cursor-pointer transition-all relative flex-shrink-0 ${val ? 'bg-blue-600' : 'bg-gray-200'}`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${val ? 'right-0.5' : 'left-0.5'}`} />
    </div>
  );

  if (!agent) return <div className="text-center py-20 text-gray-400">Loading…</div>;

  // Status banner if suspended
  const isSuspended = agent.status === 'suspended';
  const isPending   = agent.status === 'pending';

  return (
    <div className="max-w-4xl space-y-5">
      {isSuspended && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 items-start">
          <span className="text-xl">⛔</span>
          <div>
            <div className="font-semibold text-red-800">Account Suspended</div>
            <div className="text-sm text-red-600 mt-0.5">Your account has been suspended by admin. Contact support at support@medireferral.in</div>
          </div>
        </div>
      )}
      {isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
          <span className="text-xl">⏳</span>
          <div>
            <div className="font-semibold text-amber-800">Account Pending Approval</div>
            <div className="text-sm text-amber-600 mt-0.5">Your account is awaiting admin approval. You&apos;ll be notified once activated.</div>
          </div>
        </div>
      )}

      {/* Profile hero */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-28 relative" style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white, transparent)' }} />
        </div>
        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-md">
                {agent.name[0]}
              </div>
              <div className="pb-1">
                <div className="text-xl font-bold text-gray-900">{agent.name}</div>
                <div className="text-sm text-gray-500">{agent.email}</div>
              </div>
            </div>
            <div className="flex gap-2 pb-1">
              <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full">ID: {agent.id}</span>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">{agent.commissionRate}% Commission</span>
              {isSuspended && <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-full">Suspended</span>}
              {isPending   && <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">Pending</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Performance stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="font-semibold text-gray-900 mb-4">📊 Performance Overview</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Leads',      value: agent.totalLeads,             color: 'text-blue-600' },
            { label: 'Conversion Rate',  value: `${agent.conversionRate}%`,    color: 'text-emerald-600' },
            { label: 'Total Earned',     value: fmt(agent.totalEarned),        color: 'text-amber-600' },
            { label: 'This Month',       value: fmt(agent.thisMonth),          color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="text-center p-4 bg-gray-50 rounded-xl">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-gray-900">👤 Profile Information</div>
            <button className="text-blue-600 text-xs font-medium hover:underline">Edit</button>
          </div>
          {[
            { icon: '👤', label: 'Full Name', value: agent.name },
            { icon: '📱', label: 'Phone',     value: agent.phone },
            { icon: '📧', label: 'Email',     value: agent.email },
            { icon: '📍', label: 'City',      value: `${agent.city}, ${agent.state}` },
            { icon: '🆔', label: 'Agent ID',  value: agent.id },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-sm flex-shrink-0">{f.icon}</div>
              <div className="flex-1">
                <div className="text-xs text-gray-400">{f.label}</div>
                <div className="text-sm font-medium text-gray-800">{f.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          {/* Bank details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold text-gray-900">🏦 Bank Details</div>
              {!bankEditing && (
                <button onClick={() => setBankEditing(true)} className="text-blue-600 text-xs font-medium hover:underline">
                  {bankForm.accountNumber ? 'Update' : 'Add Details'}
                </button>
              )}
            </div>

            {/* Verification badge */}
            {(() => {
              const badge = VERIFICATION_BADGE[bankForm.verificationStatus];
              return (
                <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${badge.bg} ${badge.color}`}>
                  {badge.label}
                </div>
              );
            })()}

            {bankSaved && (
              <div className="mb-3 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-xs text-emerald-700 font-medium">
                ✅ Details submitted. Admin will review and notify you within 24 hours.
              </div>
            )}

            {/* Rejection banner — always visible when rejected */}
            {bankDetails.verificationStatus === 'rejected' && !bankEditing && (
              <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-3 flex items-start gap-2.5">
                <span className="text-lg mt-0.5">❌</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-red-800">Bank Verification Rejected</div>
                  {bankDetails.rejectionReason && (
                    <div className="text-xs text-red-600 mt-0.5">Reason: {bankDetails.rejectionReason}</div>
                  )}
                  <button onClick={() => { setBankForm({ ...bankDetails }); setBankEditing(true); }}
                    className="mt-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors">
                    Resubmit Bank Details →
                  </button>
                </div>
              </div>
            )}

            {!bankEditing ? (
              /* ── Read-only view ── */
              <div className="space-y-0">
                {[
                  { icon: '👤', label: 'Account Holder', value: bankForm.accountName || '—' },
                  { icon: '🏛️', label: 'Account Number',  value: bankForm.accountNumber ? maskedAccNo : '—' },
                  { icon: '🔢', label: 'IFSC Code',        value: bankForm.ifscCode || '—' },
                  { icon: '💳', label: 'UPI ID',           value: bankForm.upiId || agent.upi || '—' },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-sm flex-shrink-0">{f.icon}</div>
                    <div>
                      <div className="text-xs text-gray-400">{f.label}</div>
                      <div className="text-sm font-medium text-gray-800 font-mono">{f.value}</div>
                    </div>
                  </div>
                ))}
                {bankForm.documentName && (
                  <div className="flex items-center gap-3 py-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-sm flex-shrink-0">📄</div>
                    <div>
                      <div className="text-xs text-gray-400">Attached Document</div>
                      <div className="text-sm font-medium text-blue-700 truncate max-w-[180px]">{bankForm.documentName}</div>
                      <div className="text-[10px] text-gray-400 capitalize">{bankForm.documentType}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Edit form ── */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Account Holder Name *</label>
                  <input value={bankForm.accountName} onChange={e => setBank('accountName', e.target.value)}
                    placeholder="As printed on passbook"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Account Number *</label>
                  <div className="relative">
                    <input
                      type={showAccNo ? 'text' : 'password'}
                      value={bankForm.accountNumber}
                      onChange={e => setBank('accountNumber', e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter account number"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 font-mono" />
                    <button type="button" onClick={() => setShowAccNo(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                      {showAccNo ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">IFSC Code *</label>
                  <input value={bankForm.ifscCode} onChange={e => setBank('ifscCode', e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234" maxLength={11}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">UPI ID</label>
                  <input value={bankForm.upiId} onChange={e => setBank('upiId', e.target.value)}
                    placeholder="e.g. name@upi"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* File upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bank Passbook / Statement *</label>
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl py-4 flex flex-col items-center gap-1.5 transition-colors group">
                    <span className="text-2xl">{bankForm.documentName ? '📄' : '📎'}</span>
                    {bankForm.documentName ? (
                      <>
                        <span className="text-xs font-medium text-blue-700 truncate max-w-[200px]">{bankForm.documentName}</span>
                        <span className="text-[10px] text-gray-400">Tap to replace</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-gray-600 group-hover:text-blue-600">Attach Passbook or Bank Statement</span>
                        <span className="text-[10px] text-gray-400">PDF, JPG, PNG — max 5 MB</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={() => setBankEditing(false)}
                    className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-xs font-semibold hover:bg-gray-50 transition-all">
                    Cancel
                  </button>
                  <button onClick={handleBankSave}
                    disabled={!bankForm.accountName || !bankForm.accountNumber || !bankForm.ifscCode}
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-xs font-semibold transition-all">
                    💾 Save Bank Details
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* App settings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="font-semibold text-gray-900 mb-4">⚙️ App Settings</div>
            {[
              { label: 'Push Notifications', icon: '🔔', val: notifs,      set: setNotifs      },
              { label: 'Email Alerts',        icon: '📧', val: emailAlerts, set: setEmailAlerts },
              { label: 'Biometric Login',     icon: '🔐', val: biometric,   set: setBiometric   },
              { label: 'Dark Mode',           icon: '🌙', val: darkMode,    set: setDarkMode    },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-sm flex-shrink-0">{s.icon}</div>
                <div className="flex-1 text-sm font-medium text-gray-800">{s.label}</div>
                <Toggle val={s.val} set={s.set} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="font-semibold text-gray-900 mb-4">💬 Support & Help</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: '❓', label: 'FAQ' },
            { icon: '🎧', label: 'Contact Support' },
            { icon: '📚', label: 'Training Materials' },
            { icon: '📄', label: 'Terms & Conditions' },
          ].map(s => (
            <button key={s.label} className="flex items-center gap-2.5 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
              <span className="text-base">{s.icon}</span> {s.label}
            </button>
          ))}
        </div>
      </div>

      <button className="w-full border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2">
        🚪 Logout from MediReferral
      </button>
      <div className="text-center text-xs text-gray-400 pb-2">MediReferral v1.0.0 · Mediciti Healthcare © 2024</div>
    </div>
  );
}
