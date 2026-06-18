'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

const STEPS = ['Select Agent', 'Patient Info', 'Medical Details', 'Review & Submit'];

const PACKAGE_COSTS: Record<string, number> = {
  'Orthopaedics': 120000, 'Cardiology': 200000, 'Urology': 80000, 'ENT': 35000,
  'General Surgery': 80000, 'Gynecology': 70000, 'Neurology': 300000, 'Ophthalmology': 50000,
  'Oncology': 250000, 'Gastroenterology': 60000, 'Nephrology': 90000, 'Pulmonology': 75000,
  'Dermatology': 40000, 'Haematology': 180000,
};

const CITIES = ['Hyderabad','Bangalore','Mumbai','Delhi','Chennai','Pune','Kolkata','Ahmedabad'];

const isValidPhone = (v: string) => /^[6-9]\d{9}$/.test(v.replace(/[\s\-()]/g,'').replace(/^\+91/,''));
const isValidName  = (v: string) => v.trim().length >= 2 && /^[a-zA-Z\s\-.']+$/.test(v.trim());

export default function ManagerAddPatientPage() {
  const { myTeamAgents, addPatient, settings } = useStore();
  const router = useRouter();

  const [step,       setStep]       = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [gender,     setGender]     = useState<'M' | 'F'>('M');

  const activeAgents = myTeamAgents.filter(a => a.status === 'active');

  const [form, setForm] = useState({
    agentId:   activeAgents[0]?.id ?? '',
    name:      '',
    phone:     '',
    age:       '',
    specialty: '',
    procedure: '',
    city:      'Hyderabad',
    hospital:  '',
    urgency:   'Normal',
    budget:    '₹50k – ₹1L',
    insurance: '',
  });

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const selectedAgent  = myTeamAgents.find(a => a.id === form.agentId);
  const packageCost    = PACKAGE_COSTS[form.specialty] ?? 0;
  const commPct        = selectedAgent ? (settings.commissionRates[form.specialty] ?? selectedAgent.commissionRate) : 4;
  const estCommission  = packageCost ? Math.round(packageCost * commPct / 100) : 0;

  const canNext = () => {
    if (step === 0) return !!form.agentId;
    if (step === 1) return isValidName(form.name) && isValidPhone(form.phone) && !!form.age && !!form.city;
    if (step === 2) return !!form.specialty && !!form.procedure;
    return true;
  };

  const handleSubmit = () => {
    setSubmitting(true);
    addPatient({
      name: form.name, phone: form.phone, age: parseInt(form.age),
      gender, specialty: form.specialty, procedure: form.procedure,
      city: form.city, hospital: form.hospital || null, urgency: form.urgency,
      packageCost,
      agentIdOverride: form.agentId,
    });
    setTimeout(() => { setSubmitting(false); setDone(true); }, 800);
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto pt-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl mx-auto">✅</div>
        <h2 className="text-xl font-bold text-gray-900">Lead Submitted!</h2>
        <p className="text-sm text-gray-500">
          Patient <strong>{form.name}</strong> has been added under <strong>{selectedAgent?.name}</strong>.
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <button onClick={() => { setDone(false); setStep(0); setForm(f => ({ ...f, name:'', phone:'', age:'', specialty:'', procedure:'', hospital:'' })); }}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Add Another
          </button>
          <button onClick={() => router.push('/manager/patients')}
            className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700">
            View Patients →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Add Patient Lead</h2>
        <p className="text-sm text-gray-500 mt-0.5">Submit a new lead on behalf of an agent in your team</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                i < step  ? 'bg-purple-600 border-purple-600 text-white' :
                i === step ? 'border-purple-600 text-purple-600 bg-white' :
                             'border-gray-200 text-gray-400 bg-white'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] mt-1 font-medium whitespace-nowrap ${i === step ? 'text-purple-600' : 'text-gray-400'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < step ? 'bg-purple-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

        {/* Step 0: Select Agent */}
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Select Agent</h3>
            <p className="text-sm text-gray-500">Choose which agent in your team this lead should be attributed to.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {activeAgents.map(agent => (
                <button key={agent.id} onClick={() => set('agentId', agent.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    form.agentId === agent.id
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-100 hover:border-gray-300 bg-white'
                  }`}>
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-sm font-bold flex-shrink-0">
                    {agent.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{agent.name}</div>
                    <div className="text-[10px] text-gray-400">{agent.id} · {agent.city}</div>
                    <div className="text-[10px] text-purple-600 font-medium">{agent.commissionRate}% commission</div>
                  </div>
                  {form.agentId === agent.id && <span className="ml-auto text-purple-600 flex-shrink-0">✓</span>}
                </button>
              ))}
              {activeAgents.length === 0 && (
                <p className="col-span-2 text-sm text-gray-400 text-center py-8">No active agents in your team.</p>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Patient Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-sm font-bold">{selectedAgent?.name[0]}</div>
              <div>
                <div className="text-xs font-semibold text-purple-900">Submitting for: {selectedAgent?.name}</div>
                <div className="text-[10px] text-purple-600">{selectedAgent?.id} · {selectedAgent?.commissionRate}% commission</div>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Full Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Patient full name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone *</label>
                <div className="flex gap-2">
                  <div className="flex items-center border border-gray-200 rounded-xl px-3 bg-gray-50 text-sm text-gray-700 whitespace-nowrap">🇮🇳 +91</div>
                  <input value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/,'').slice(0,10))}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="98765 43210" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Age *</label>
                <input type="number" value={form.age} onChange={e => set('age', e.target.value)} min={1} max={120}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="45" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Gender</label>
                <div className="flex gap-2">
                  {(['M','F'] as const).map(g => (
                    <button key={g} onClick={() => setGender(g)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${gender===g ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600'}`}>
                      {g === 'M' ? '♂ Male' : '♀ Female'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">City *</label>
                <select value={form.city} onChange={e => set('city', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Medical Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Medical Details</h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Specialty *</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(PACKAGE_COSTS).map(s => (
                  <button key={s} onClick={() => set('specialty', s)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border-2 transition-all text-left ${
                      form.specialty === s ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-100 text-gray-600 hover:border-gray-300'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Procedure *</label>
              <input value={form.procedure} onChange={e => set('procedure', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g. Knee Replacement" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Hospital</label>
                <input value={form.hospital} onChange={e => set('hospital', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Apollo, Manipal…" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Urgency</label>
                <select value={form.urgency} onChange={e => set('urgency', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {['Normal','Urgent','Emergency'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            {form.specialty && (
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
                <div>
                  <div className="text-xs text-purple-600 font-medium">Estimated Commission</div>
                  <div className="text-xl font-bold text-purple-700">₹{estCommission.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-purple-500">for {selectedAgent?.name} at {commPct}%</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Package cost</div>
                  <div className="text-sm font-semibold text-gray-700">₹{packageCost.toLocaleString('en-IN')}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Review & Submit</h3>
            <div className="space-y-3">
              {[
                { label: 'Agent',       value: `${selectedAgent?.name} (${selectedAgent?.id})` },
                { label: 'Patient',     value: `${form.name}, ${form.age}y ${gender === 'M' ? '♂' : '♀'}` },
                { label: 'Phone',       value: `+91 ${form.phone}` },
                { label: 'City',        value: form.city },
                { label: 'Specialty',   value: form.specialty },
                { label: 'Procedure',   value: form.procedure },
                { label: 'Hospital',    value: form.hospital || '—' },
                { label: 'Urgency',     value: form.urgency },
                { label: 'Package',     value: `₹${packageCost.toLocaleString('en-IN')}` },
                { label: 'Est. Commission', value: `₹${estCommission.toLocaleString('en-IN')} (${commPct}%)` },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500">{row.label}</span>
                  <span className="text-sm font-medium text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => step > 0 ? setStep(s => s - 1) : router.push('/manager')}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
          ← Back
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
            className="px-6 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-40 transition-all">
            Next →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
            {submitting
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
              : '✅ Submit Lead'}
          </button>
        )}
      </div>
    </div>
  );
}
