'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => router.push('/dashboard'), 1000);
  };

  const filledOtp = otp.join('');

  return (
    <div className="min-h-screen flex">
      {/* Left branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 60%, #1e40af 100%)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fff, transparent)', transform: 'translate(40%, -40%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fff, transparent)', transform: 'translate(-40%, 40%)' }} />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-2xl">🏥</div>
          <div>
            <div className="font-bold text-lg">MediReferral</div>
            <div className="text-white/70 text-xs">by Mediciti Healthcare</div>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-4 leading-tight">Your referrals,<br />your earnings,<br />all in one place.</h2>
          <p className="text-white/80 text-base mb-10">Manage patient leads, track surgery journeys, and get paid transparently.</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '👥', label: 'Active Patients', value: '12' },
              { icon: '💰', label: 'This Month', value: '₹45,230' },
              { icon: '📈', label: 'Conversion Rate', value: '68%' },
              { icon: '⚡', label: 'Avg Response', value: '< 2 hrs' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-lg font-bold">{s.value}</div>
                <div className="text-white/60 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-white/40 text-xs relative z-10">© 2024 Mediciti Healthcare. All rights reserved.</div>
      </div>

      {/* Right login */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg,#2563EB,#1D4ED8)' }}>🏥</div>
            <div className="font-bold text-xl text-gray-900">MediReferral</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            {step === 'phone' ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back 👋</h1>
                <p className="text-gray-500 text-sm mb-6">Enter your registered phone number.</p>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center border border-gray-200 rounded-xl px-3 bg-gray-50 text-sm text-gray-700 whitespace-nowrap h-12 font-medium">🇮🇳 +91</div>
                    <input type="tel" maxLength={10} value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                      placeholder="98765 43210"
                      className="flex-1 border border-gray-200 rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
                <button onClick={() => phone.length === 10 && setStep('otp')}
                  className={`w-full h-12 rounded-xl font-semibold text-sm transition-all ${phone.length === 10 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                  📤 Send OTP
                </button>
                <div className="mt-6 space-y-3">
                  {[
                    { icon: '🔒', t: 'Secure OTP Login', s: 'No passwords needed' },
                    { icon: '📊', t: 'Real-time Tracking', s: 'Live patient updates' },
                    { icon: '💸', t: 'Commission Transparency', s: 'Track every payment' },
                  ].map(f => (
                    <div key={f.t} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-sm">{f.icon}</div>
                      <div><div className="text-sm font-semibold text-gray-800">{f.t}</div><div className="text-xs text-gray-500">{f.s}</div></div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setStep('phone')} className="flex items-center gap-1 text-gray-500 text-sm mb-5 hover:text-gray-700">← Back</button>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Enter OTP 💬</h1>
                <p className="text-gray-500 text-sm mb-6">Sent to <strong className="text-gray-800">+91 {phone}</strong></p>
                <div className="flex gap-2 mb-5">
                  {otp.map((v, i) => (
                    <input key={i} id={`otp-${i}`} type="text" maxLength={1} value={v}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/,'');
                        const next = [...otp]; next[i] = val; setOtp(next);
                        if (val && i < 5) (document.getElementById(`otp-${i+1}`) as HTMLInputElement)?.focus();
                      }}
                      className="flex-1 h-14 border-2 border-gray-200 rounded-xl text-center text-xl font-bold focus:outline-none focus:border-blue-500 text-gray-900 transition-all"
                    />
                  ))}
                </div>
                <button onClick={handleVerify} disabled={filledOtp.length !== 6 || loading}
                  className={`w-full h-12 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${filledOtp.length === 6 && !loading ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                  {loading ? <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" /> : <>✅ Verify &amp; Login</>}
                </button>
                <div className="mt-4 p-3 bg-amber-50 rounded-xl text-amber-700 text-xs border border-amber-100">ℹ️ Demo: any 6-digit OTP works.</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
