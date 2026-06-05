'use client';
import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import type { BankDetails } from '@/lib/store';

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const VERIFICATION_BADGE: Record<BankDetails['verificationStatus'], { label: string; bg: string; color: string }> = {
  unverified: { label: '⚠️ Not Verified',        bg: 'bg-amber-50',  color: 'text-amber-700' },
  pending:    { label: '⏳ Verification Pending', bg: 'bg-blue-50',   color: 'text-blue-700' },
  verified:   { label: '✅ Verified',             bg: 'bg-emerald-50',color: 'text-emerald-700' },
  rejected:   { label: '❌ Rejected — Resubmit',  bg: 'bg-red-50',    color: 'text-red-700' },
};

// ── OTP helpers ───────────────────────────────────────────────────────────────
const genOTP = () => String(Math.floor(100000 + Math.random() * 900000));
const OTP_TTL = 5 * 60; // 5 minutes in seconds
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function ProfilePage() {
  const { currentAgent, bankDetails, updateBankDetails, submitBankVerification, verifyEmail } = useStore();
  const agent = currentAgent;

  const [notifs,      setNotifs]      = useState(true);
  const [biometric,   setBiometric]   = useState(false);
  const [darkMode,    setDarkMode]    = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);

  // ── Email OTP state ─────────────────────────────────────────────────────────
  const [emailInput,   setEmailInput]   = useState(agent?.email ?? '');
  const [otpSent,      setOtpSent]      = useState(false);
  const [otpCode,      setOtpCode]      = useState('');
  const [otpInput,     setOtpInput]     = useState('');
  const [otpError,     setOtpError]     = useState('');
  const [otpSuccess,   setOtpSuccess]   = useState(false);
  const [countdown,    setCountdown]    = useState(0);   // seconds remaining
  const [resendWait,   setResendWait]   = useState(0);   // seconds until resend allowed
  const [emailErr,     setEmailErr]     = useState('');
  const [changingEmail,setChangingEmail]= useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown ticker
  useEffect(() => {
    if (countdown <= 0) return;
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(countdownRef.current!); return 0; }
        return c - 1;
      });
      setResendWait(r => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(countdownRef.current!);
  }, [otpSent]); // re-arm when OTP is (re-)sent

  const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleSendOTP = () => {
    if (!isValidEmail(emailInput)) {
      setEmailErr('Enter a valid email address (e.g. agent@example.com)');
      return;
    }
    setEmailErr('');
    const code = genOTP();
    setOtpCode(code);
    setOtpInput('');
    setOtpError('');
    setOtpSent(true);
    setOtpSuccess(false);
    setCountdown(OTP_TTL);
    setResendWait(30); // 30s before resend allowed
  };

  const handleVerifyOTP = () => {
    if (countdown <= 0) { setOtpError('OTP expired. Please request a new one.'); return; }
    if (otpInput.trim() === otpCode) {
      verifyEmail(agent!.id, emailInput.trim());
      setOtpSuccess(true);
      setOtpSent(false);
      setChangingEmail(false);
      clearInterval(countdownRef.current!);
    } else {
      setOtpError('Incorrect OTP. Please try again.');
    }
  };

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
        {/* Banner */}
        <div className="h-24 relative" style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white, transparent)' }} />
        </div>
        {/* Avatar row — pulled up to overlap banner */}
        <div className="px-5 pb-5">
          {/* Avatar + edit button */}
          <div className="-mt-10 mb-3 flex items-end justify-between">
            <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-md flex-shrink-0">
              {agent.name[0]}
            </div>
            <div className="flex flex-wrap justify-end gap-2 mt-12">
              <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">ID: {agent.id}</span>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">{agent.commissionRate}% Commission</span>
              {isSuspended && <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-full">Suspended</span>}
              {isPending   && <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">Pending</span>}
            </div>
          </div>
          {/* Name / email */}
          <div>
            <div className="text-xl font-bold text-gray-900">{agent.name}</div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-sm text-gray-500 truncate">{agent.email || 'No email set'}</span>
              {agent.email && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${agent.emailVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {agent.emailVerified ? '✅ Verified' : '⚠️ Unverified'}
                </span>
              )}
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
            { icon: '👤', label: 'Full Name', value: agent.name,                             extra: null },
            { icon: '📱', label: 'Phone',     value: agent.phone,                            extra: null },
            { icon: '📧', label: 'Email',     value: agent.email || '—',                     extra: agent.email ? (agent.emailVerified ? '✅ Verified' : '⚠️ Unverified') : null },
            { icon: '📍', label: 'City',      value: `${agent.city}, ${agent.state}`,        extra: null },
            { icon: '🆔', label: 'Agent ID',  value: agent.id,                               extra: null },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-sm flex-shrink-0">{f.icon}</div>
              <div className="flex-1">
                <div className="text-xs text-gray-400">{f.label}</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{f.value}</span>
                  {f.extra && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${f.extra.includes('✅') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {f.extra}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-5">

          {/* ── Email Verification card ──────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-gray-900">📧 Email Verification</div>
              {agent.emailVerified && !changingEmail && (
                <button onClick={() => { setChangingEmail(true); setEmailInput(''); setOtpSent(false); setOtpSuccess(false); }}
                  className="text-blue-600 text-xs font-medium hover:underline">Change Email</button>
              )}
            </div>

            {/* Already verified and not changing */}
            {agent.emailVerified && !changingEmail ? (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <span className="text-2xl">✅</span>
                <div>
                  <div className="text-sm font-semibold text-emerald-800">{agent.email}</div>
                  <div className="text-xs text-emerald-600 mt-0.5">Email verified successfully</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">

                {/* Unverified email notice */}
                {agent.email && !agent.emailVerified && !changingEmail && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                    <span>⚠️</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-amber-800">Email not verified</div>
                      <div className="text-xs text-amber-600 truncate">{agent.email}</div>
                    </div>
                    <button onClick={() => { setEmailInput(agent.email ?? ''); setOtpSent(false); }}
                      className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg whitespace-nowrap">
                      Verify now
                    </button>
                  </div>
                )}

                {/* Email input */}
                {(!otpSent || changingEmail) && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      {changingEmail ? 'New Email Address' : 'Your Email Address'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={e => { setEmailInput(e.target.value); setEmailErr(''); }}
                        placeholder="agent@example.com"
                        className={`flex-1 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
                          emailErr ? 'border-red-400 focus:ring-red-300 bg-red-50/30' : 'border-gray-200 focus:ring-blue-500'
                        }`}
                      />
                      <button onClick={handleSendOTP}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl whitespace-nowrap transition-colors">
                        Send OTP
                      </button>
                    </div>
                    {emailErr && <p className="text-xs text-red-500 mt-1.5">⚠ {emailErr}</p>}
                  </div>
                )}

                {/* OTP sent state */}
                {otpSent && (
                  <div className="space-y-3">

                    {/* Sent confirmation + demo OTP */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                      <div className="flex items-start gap-2">
                        <span className="text-base mt-0.5">📨</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-blue-800">OTP sent to {emailInput}</div>
                          <div className="text-xs text-blue-600 mt-0.5">Valid for {fmtCountdown(countdown)}</div>
                        </div>
                        <span className={`text-xs font-bold tabular-nums ${countdown < 60 ? 'text-red-500' : 'text-blue-600'}`}>
                          {fmtCountdown(countdown)}
                        </span>
                      </div>
                      {/* Demo hint */}
                      <div className="mt-2 pt-2 border-t border-blue-100 flex items-center gap-2">
                        <span className="text-[10px] text-blue-400">🔬 Demo OTP:</span>
                        <code className="text-sm font-bold font-mono tracking-[0.25em] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-lg select-all">{otpCode}</code>
                      </div>
                    </div>

                    {/* OTP input */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Enter 6-digit OTP</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otpInput}
                          onChange={e => { setOtpInput(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                          placeholder="• • • • • •"
                          className={`flex-1 border-2 rounded-xl px-4 py-2.5 text-center text-lg font-bold font-mono tracking-[0.5em] focus:outline-none transition-colors ${
                            otpError ? 'border-red-400 bg-red-50/30' : 'border-blue-200 focus:border-blue-500'
                          }`}
                        />
                        <button
                          onClick={handleVerifyOTP}
                          disabled={otpInput.length !== 6 || countdown <= 0}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl whitespace-nowrap transition-colors">
                          ✓ Verify
                        </button>
                      </div>
                      {otpError && <p className="text-xs text-red-500 mt-1.5">⚠ {otpError}</p>}
                      {countdown <= 0 && (
                        <p className="text-xs text-red-500 mt-1.5">⚠ OTP expired. Click Resend to get a new one.</p>
                      )}
                    </div>

                    {/* Resend + change email links */}
                    <div className="flex items-center justify-between text-xs">
                      {resendWait > 0 ? (
                        <span className="text-gray-400">Resend in {resendWait}s</span>
                      ) : (
                        <button onClick={handleSendOTP} className="text-blue-600 hover:underline font-medium">
                          Resend OTP
                        </button>
                      )}
                      <button onClick={() => { setOtpSent(false); setOtpInput(''); setOtpError(''); }}
                        className="text-gray-400 hover:text-gray-600">
                        ← Change email
                      </button>
                    </div>
                  </div>
                )}

                {/* Success flash (just verified) */}
                {otpSuccess && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                    <span>✅</span>
                    <div className="text-xs font-semibold text-emerald-700">Email verified successfully!</div>
                  </div>
                )}

              </div>
            )}
          </div>

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
