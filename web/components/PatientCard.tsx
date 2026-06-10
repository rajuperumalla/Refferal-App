import Link from 'next/link';
import { AdminPatient } from '@/lib/admin-data';
import StatusBadge from './StatusBadge';

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function PatientCard({ patient: p }: { patient: AdminPatient }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-base flex-shrink-0">
              {p.name[0]}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{p.name}</div>
              <div className="text-sm text-gray-500">{p.phone} · Age {p.age} · {p.gender === 'M' ? 'Male' : 'Female'}</div>
            </div>
          </div>
          <StatusBadge status={p.status as Parameters<typeof StatusBadge>[0]['status']} />
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-lg">{p.specialty}</span>
          <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-lg">{p.procedure}</span>
          <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-1 rounded-lg">📍 {p.city}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Commission</div>
            <div className="font-bold text-emerald-600">{fmt(p.commission)} <span className="text-gray-400 font-normal text-xs">({p.commPct}%)</span></div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Package Cost</div>
            <div className="font-semibold text-gray-700">{fmt(p.packageCost)}</div>
          </div>
          {p.hospital && (
            <div className="col-span-2">
              <div className="text-xs text-gray-400 mb-0.5">Hospital</div>
              <div className="text-sm font-medium text-gray-700">{p.hospital}</div>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex gap-2">
          <a href={`tel:${p.phone}`}
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
            📞 Call
          </a>
          <a href={`https://wa.me/${p.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
            💬 WhatsApp
          </a>
        </div>
        <Link href={`/patients/${p.id}`}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
          View Details →
        </Link>
      </div>
    </div>
  );
}
