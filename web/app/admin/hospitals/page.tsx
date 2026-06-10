'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { AdminHospital, HospitalTier, fmtINR, fmtL } from '@/lib/admin-data';

const TIER_CONFIG: Record<HospitalTier, { label: string; bg: string; color: string; border: string }> = {
  preferred: { label: '⭐ Preferred', bg: 'bg-indigo-50',  color: 'text-indigo-700',  border: 'border-indigo-200' },
  standard:  { label: '✅ Standard',  bg: 'bg-emerald-50', color: 'text-emerald-700', border: 'border-emerald-200' },
  basic:     { label: '📋 Basic',     bg: 'bg-gray-100',   color: 'text-gray-600',    border: 'border-gray-200' },
};

const ALL_SPECIALTIES = ['Cardiology','Orthopaedics','Neurology','Oncology','Urology','Gynecology','General Surgery','ENT','Ophthalmology','Gastroenterology','Nephrology','Pediatrics','Cardiothoracic','Pulmonology'];

function HospitalModal({ onClose, onSave, existing }: {
  onClose: () => void;
  onSave: (h: Pick<AdminHospital, 'name' | 'city' | 'state' | 'tier' | 'specialties' | 'contactPerson' | 'contactPhone'> & { id?: number }) => void;
  existing?: AdminHospital;
}) {
  const [form, setForm] = useState({
    name: existing?.name ?? '', city: existing?.city ?? '', state: existing?.state ?? '',
    tier: existing?.tier ?? 'standard' as HospitalTier,
    contactPerson: existing?.contactPerson ?? '', contactPhone: existing?.contactPhone ?? '',
    specialties: existing?.specialties ?? [],
  });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const toggleSpec = (s: string) => set('specialties', form.specialties.includes(s) ? form.specialties.filter(x => x !== s) : [...form.specialties, s]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">{existing ? 'Edit Hospital' : 'Add Hospital Partner'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hospital Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Apollo Hospitals"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
              <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Hyderabad"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
              <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="Telangana"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Partner Tier</label>
              <select value={form.tier} onChange={e => set('tier', e.target.value as HospitalTier)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="preferred">⭐ Preferred</option>
                <option value="standard">✅ Standard</option>
                <option value="basic">📋 Basic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Person</label>
              <input value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} placeholder="Dr. Name"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Phone</label>
            <input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="+91 …"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specialties</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SPECIALTIES.map(s => (
                <button key={s} onClick={() => toggleSpec(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    form.specialties.includes(s) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-2.5 text-sm font-semibold transition-all">Cancel</button>
          <button onClick={() => { if (!form.name || !form.city) return; onSave({ ...form, ...(existing ? { id: existing.id } : {}) }); }}
            disabled={!form.name || !form.city}
            className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-all">
            {existing ? 'Save Changes' : 'Add Hospital'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HospitalsPage() {
  const { hospitals, addHospital, updateHospital } = useStore();
  const [tierFilter, setTierFilter] = useState<HospitalTier | 'all'>('all');
  const [search,     setSearch]     = useState('');
  const [modal,      setModal]      = useState(false);
  const [editing,    setEditing]    = useState<AdminHospital | undefined>();

  const filtered = hospitals
    .filter(h => tierFilter === 'all' || h.tier === tierFilter)
    .filter(h => !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase()));

  const handleSave = (data: Pick<AdminHospital, 'name' | 'city' | 'state' | 'tier' | 'specialties' | 'contactPerson' | 'contactPhone'> & { id?: number }) => {
    if (editing && data.id != null) {
      updateHospital({ ...editing, ...data });
    } else {
      addHospital(data);
    }
    setModal(false); setEditing(undefined);
  };

  const totalRevenue = hospitals.reduce((s, h) => s + h.totalRevenue, 0);
  const totalCases   = hospitals.reduce((s, h) => s + h.totalCases, 0);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Partner Hospitals',  value: hospitals.length,                                     color: 'text-gray-900' },
          { label: 'Preferred Partners', value: hospitals.filter(h => h.tier === 'preferred').length,  color: 'text-indigo-600' },
          { label: 'Total Cases',        value: totalCases,                                            color: 'text-emerald-600' },
          { label: 'Total Revenue',      value: fmtL(totalRevenue),                                   color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hospital or city…"
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={() => { setEditing(undefined); setModal(true); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap">
            + Add Hospital
          </button>
        </div>
        <div className="flex gap-2">
          {(['all','preferred','standard','basic'] as const).map(t => (
            <button key={t} onClick={() => setTierFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
                tierFilter === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}>
              {t === 'all' ? 'All Tiers' : TIER_CONFIG[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(h => {
          const tier = TIER_CONFIG[h.tier];
          return (
            <div key={h.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center text-2xl flex-shrink-0">🏨</div>
                    <div>
                      <div className="font-bold text-gray-900">{h.name}</div>
                      <div className="text-xs text-gray-500">📍 {h.city}, {h.state}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${tier.bg} ${tier.color} ${tier.border}`}>{tier.label}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {h.specialties.slice(0, 4).map(s => <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">{s}</span>)}
                  {h.specialties.length > 4 && <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-md">+{h.specialties.length - 4}</span>}
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="font-bold text-blue-600">{h.activePatients}</div><div className="text-[10px] text-gray-400 mt-0.5">Active</div></div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="font-bold text-gray-900">{h.totalCases}</div><div className="text-[10px] text-gray-400 mt-0.5">Total Cases</div></div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="font-bold text-emerald-600 text-xs">{fmtL(h.totalRevenue)}</div><div className="text-[10px] text-gray-400 mt-0.5">Revenue</div></div>
                </div>
              </div>
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-500">👤 {h.contactPerson} · {h.contactPhone}</div>
                <button onClick={() => { setEditing(h); setModal(true); }} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">Edit →</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <HospitalModal onClose={() => { setModal(false); setEditing(undefined); }} onSave={handleSave} existing={editing} />
      )}
    </div>
  );
}
