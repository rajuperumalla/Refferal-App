'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { PatientStatus } from '@/lib/types';
import PatientCard from '@/components/PatientCard';
import Link from 'next/link';

const FILTERS: { k: PatientStatus | 'all'; l: string }[] = [
  { k: 'all', l: 'All' },
  { k: 'new', l: '🔵 New' },
  { k: 'contacted', l: '🟡 Contacted' },
  { k: 'opd_scheduled', l: '🟢 OPD' },
  { k: 'ipd_confirmed', l: '🟣 IPD' },
  { k: 'completed', l: '✅ Completed' },
  { k: 'lost', l: '❌ Lost' },
];

export default function PatientsPage() {
  const { myPatients } = useStore();
  const [filter, setFilter] = useState<PatientStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort]   = useState<'recent' | 'name' | 'commission'>('recent');

  const filtered = myPatients
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search) || p.specialty.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'name')       return a.name.localeCompare(b.name);
      if (sort === 'commission') return b.commission - a.commission;
      return b.id - a.id;
    });

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone, specialty..."
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="recent">Most Recent</option>
            <option value="name">Name A–Z</option>
            <option value="commission">Highest Commission</option>
          </select>
          <Link href="/add-patient"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap">
            ➕ Add Patient
          </Link>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === f.k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}>{f.l}</button>
          ))}
        </div>
      </div>

      <div className="text-sm text-gray-500 font-medium">
        Showing <strong className="text-gray-800">{filtered.length}</strong> of {myPatients.length} patients
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="text-5xl mb-3">👥</div>
          <div className="font-semibold text-gray-800 mb-1">No patients found</div>
          <div className="text-gray-500 text-sm">Try a different filter or <Link href="/add-patient" className="text-blue-600 hover:underline">add a patient</Link></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => <PatientCard key={p.id} patient={p} />)}
        </div>
      )}
    </div>
  );
}
