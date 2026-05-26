'use client';
import { use, useState } from 'react';
import { PATIENTS, fmt } from '@/lib/data';
import { STATUS_CONFIG } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const patient = PATIENTS.find(p => p.id === parseInt(id));
  if (!patient) notFound();

  const [tab, setTab] = useState<'overview' | 'timeline' | 'documents' | 'notes'>('overview');
  const p = patient;

  const timeline = [
    { label: 'Lead Created', desc: 'Submitted by you', done: true, date: p.createdAt },
    { label: 'Contacted by Team', desc: `${p.specialty} team assigned`, done: ['contacted','opd_scheduled','ipd_confirmed','completed'].includes(p.status), date: '' },
    { label: 'OPD Scheduled', desc: p.hospital ?? 'Hospital TBD', done: ['opd_scheduled','ipd_confirmed','completed'].includes(p.status), date: p.opd ?? '' },
    { label: 'IPD Confirmed', desc: p.surgeryDate ? `Surgery: ${p.surgeryDate}` : 'Awaiting confirmation', done: ['ipd_confirmed','completed'].includes(p.status), date: '' },
    { label: 'Surgery Completed', desc: p.status === 'completed' ? 'Successful' : 'Scheduled/Awaiting', done: p.status === 'completed', date: p.surgeryDate ?? '' },
    { label: 'Commission Released', desc: fmt(p.commission) + ' to your account', done: p.status === 'completed', date: p.discharge ?? '' },
  ];

  return (
    <div className="max-w-5xl space-y-5">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/patients" className="text-gray-500 hover:text-gray-700">Patients</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-900 font-medium">{p.name}</span>
        </div>
        <div className="flex gap-2">
          <a href={`tel:${p.phone}`} className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors">📞 Call</a>
          <a href={`https://wa.me/${p.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-xl transition-colors">💬 WhatsApp</a>
          <button className="flex items-center gap-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors">🔄 Update Status</button>
        </div>
      </div>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-center gap-5" style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">{p.name[0]}</div>
          <div className="text-white flex-1">
            <div className="text-2xl font-bold mb-1">{p.name}</div>
            <div className="text-white/70 text-sm">{p.phone} · Age {p.age} · {p.gender === 'M' ? 'Male' : 'Female'} · {p.city}</div>
          </div>
          <StatusBadge status={p.status} />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 divide-x divide-gray-100">
          {[
            { label: 'Specialty', value: p.specialty },
            { label: 'Procedure', value: p.procedure },
            { label: 'Commission', value: fmt(p.commission) },
            { label: 'Package Cost', value: fmt(p.packageCost) },
          ].map(s => (
            <div key={s.label} className="px-5 py-4">
              <div className="text-xs text-gray-400 mb-0.5">{s.label}</div>
              <div className="font-semibold text-gray-900 text-sm">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(['overview','timeline','documents','notes'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3.5 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'overview' ? '📋 Overview' : t === 'timeline' ? '📅 Timeline' : t === 'documents' ? '📁 Documents' : '📝 Notes'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {[
                { title: '📱 Contact Details', rows: [['Phone', p.phone], ['Age', `${p.age} years`], ['Gender', p.gender === 'M' ? 'Male' : 'Female'], ['City', p.city]] },
                { title: '🏥 Medical Info', rows: [['Specialty', p.specialty], ['Procedure', p.procedure], ['Hospital', p.hospital ?? 'Not assigned'], ['Doctor', p.doctor ?? 'Not assigned'], ['Urgency', p.urgency]] },
                { title: '💰 Financial', rows: [['Package Cost', fmt(p.packageCost)], ['Commission', `${fmt(p.commission)} (${p.commPct}%)`], ['Budget', p.budget], ['Insurance', p.insurance ? `Yes — ${p.insuranceProv ?? 'Unknown'}` : 'No']] },
                { title: '📅 Key Dates', rows: [['Created', p.createdAt], ...(p.opd ? [['OPD', p.opd]] : []), ...(p.surgeryDate ? [['Surgery', p.surgeryDate]] : []), ...(p.discharge ? [['Discharge', p.discharge]] : [])] as [string,string][] },
              ].map(card => (
                <div key={card.title} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="font-semibold text-sm text-gray-900 mb-3">{card.title}</div>
                  {card.rows.map(([label, val]) => (
                    <div key={label} className="flex py-2 border-b border-gray-100 last:border-0">
                      <div className="w-32 text-xs text-gray-500 flex-shrink-0 pt-0.5">{label}</div>
                      <div className="text-sm font-medium text-gray-800">{val}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {tab === 'timeline' && (
            <div className="max-w-lg">
              {timeline.map((e, i) => (
                <div key={i} className="flex gap-4 pb-6 relative">
                  {i < timeline.length - 1 && (
                    <div className={`absolute left-4 top-9 bottom-0 w-0.5 ${e.done ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 z-10 ${e.done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {e.done ? '✓' : i + 1}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className={`font-semibold text-sm ${e.done ? 'text-gray-900' : 'text-gray-400'}`}>{e.label}</div>
                    {e.desc && <div className="text-xs text-gray-500 mt-0.5">{e.desc}</div>}
                    {e.date && <div className="text-xs text-blue-600 mt-1 font-medium">{e.date}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'documents' && (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📁</div>
              <div className="font-semibold text-gray-800 mb-1">No Documents Yet</div>
              <div className="text-gray-500 text-sm mb-4">Documents are uploaded by the medical coordination team.</div>
              <button className="border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors">Request Documents</button>
            </div>
          )}

          {tab === 'notes' && (
            <div className="space-y-4">
              {p.notes ? (
                <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 text-sm text-gray-700 leading-relaxed">{p.notes}</div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">No notes added yet.</div>
              )}
              <div>
                <textarea rows={3} placeholder="Add a note about this patient..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">Add Note</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
