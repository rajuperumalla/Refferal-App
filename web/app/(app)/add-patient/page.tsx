'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

const STEPS = ['Basic Info', 'Medical Details', 'Financial & Other'];

const PACKAGE_COSTS: Record<string, number> = {
  'Orthopaedics': 120000, 'Cardiology': 200000, 'Urology': 80000, 'ENT': 35000,
  'General Surgery': 80000, 'Gynecology': 70000, 'Neurology': 300000, 'Ophthalmology': 50000,
  'Oncology': 250000, 'Gastroenterology': 60000, 'Nephrology': 90000, 'Pulmonology': 75000,
};

export default function AddPatientPage() {
  const { addPatient, settings } = useStore();
  const [step, setStep]           = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);
  const [gender, setGender]       = useState<'M' | 'F'>('M');
  const router = useRouter();

  const [form, setForm] = useState({
    name: '', phone: '', age: '',
    specialty: '', city: '', urgency: '', hospital: '', procedure: '',
    budget: '₹50k – ₹1L', insurance: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      addPatient({
        name:        form.name        || 'New Patient',
        phone:       form.phone ? `+91 ${form.phone}` : '+91 00000 00000',
        age:         parseInt(form.age) || 30,
        gender,
        specialty:   form.specialty   || 'General Surgery',
        procedure:   form.procedure   || 'Consultation',
        city:        form.city        || 'Hyderabad',
        packageCost: PACKAGE_COSTS[form.specialty] ?? 80000,
        hospital:    form.hospital    || null,
        urgency:     form.urgency     || 'Flexible',
      });
      setSubmitting(false);
      setDone(true);
      setTimeout(() => router.push('/patients'), 2000);
    }, 1200);
  };

  if (done) return (
    <div className="max-w-md mx-auto mt-24 text-center">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Lead Submitted!</h2>
      <p className="text-gray-500">Our medical team will contact the patient within 24 hours. Redirecting…</p>
    </div>
  );

  return (
    <div className="max-w-2xl">
      {/* Step bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex gap-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col gap-1.5">
              <div className={`h-1.5 rounded-full transition-all ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`text-xs font-medium ${i <= step ? 'text-blue-600' : 'text-gray-400'}`}>Step {i + 1} — {s}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="font-bold text-gray-900 text-lg">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient Full Name *</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Ramesh Kumar"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <div className="flex gap-2">
                  <div className="flex items-center border border-gray-200 rounded-xl px-3 bg-gray-50 text-sm text-gray-700 whitespace-nowrap">🇮🇳 +91</div>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="98765 43210"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
                <input type="number" value={form.age} onChange={e => set('age', e.target.value)} placeholder="e.g. 45"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                <div className="flex gap-3">
                  {(['Male', 'Female'] as const).map(g => (
                    <button key={g} onClick={() => setGender(g === 'Male' ? 'M' : 'F')}
                      className={`flex-1 border rounded-xl py-3 text-sm font-medium transition-all ${
                        gender === (g === 'Male' ? 'M' : 'F')
                          ? 'border-blue-500 text-blue-600 bg-blue-50'
                          : 'border-gray-200 text-gray-600 hover:border-blue-300'
                      }`}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-bold text-gray-900 text-lg">Medical Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialty *</label>
                <select value={form.specialty} onChange={e => set('specialty', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Select specialty…</option>
                  {Object.keys(PACKAGE_COSTS).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <select value={form.city} onChange={e => set('city', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Select city…</option>
                  {['Hyderabad','Bangalore','Mumbai','Delhi','Chennai','Pune','Kolkata'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency *</label>
                <select value={form.urgency} onChange={e => set('urgency', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Select urgency…</option>
                  {['Immediate','Within a week','Within a month','Flexible'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Hospital</label>
                <input type="text" value={form.hospital} onChange={e => set('hospital', e.target.value)} placeholder="e.g. Apollo Hospitals"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Procedure Interest</label>
                <textarea rows={3} value={form.procedure} onChange={e => set('procedure', e.target.value)} placeholder="Describe the procedure the patient is interested in..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-bold text-gray-900 text-lg">Financial &amp; Other</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
                <select value={form.budget} onChange={e => set('budget', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option>Below ₹50,000</option><option>₹50k – ₹1L</option><option>₹1L – ₹2L</option><option>Above ₹2L</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Provider</label>
                <input type="text" value={form.insurance} onChange={e => set('insurance', e.target.value)} placeholder="e.g. Star Health (leave blank if none)"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {form.specialty && (
                <div className="col-span-2 bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex gap-3">
                  <span className="text-lg">💰</span>
                  <div className="text-sm text-emerald-800">
                    Estimated commission for <strong>{form.specialty}</strong>:
                    &nbsp;<strong>₹{Math.round((PACKAGE_COSTS[form.specialty] ?? 80000) * (settings.commissionRates[form.specialty] ?? 4) / 100).toLocaleString('en-IN')}</strong> (~{settings.commissionRates[form.specialty] ?? 4}%)
                  </div>
                </div>
              )}
              <div className="col-span-2 bg-blue-50 rounded-xl p-4 flex gap-3 text-blue-700 text-sm border border-blue-100">
                <span className="text-lg">ℹ️</span>
                <div>Our medical coordination team will reach out within <strong>24 hours</strong> of submission.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3">
        <button onClick={() => step === 0 ? router.push('/patients') : setStep(step - 1)}
          className="flex-1 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-3 text-sm font-semibold transition-all">
          {step === 0 ? '✕ Cancel' : '← Back'}
        </button>
        <button onClick={() => step < 2 ? setStep(step + 1) : handleSubmit()} disabled={submitting}
          className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70">
          {submitting
            ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
            : step < 2 ? 'Next →' : '📤 Submit Lead'}
        </button>
      </div>
    </div>
  );
}
