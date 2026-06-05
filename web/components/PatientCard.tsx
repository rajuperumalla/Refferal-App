import Link from 'next/link';
import { AdminPatient } from '@/lib/admin-data';
import StatusBadge from './StatusBadge';

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const formatDateTimeCompact = (dateStr?: string) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const day = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
};

export default function PatientCard({ patient: p }: { patient: AdminPatient }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5 space-y-4">
        {/* Header: Name, Phone, Status */}
        <div className="flex items-start justify-between gap-3">
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

        {/* Tags: Specialty, Procedure, City */}
        <div className="flex gap-2 flex-wrap">
          <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-lg">{p.specialty}</span>
          <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-lg">{p.procedure}</span>
          <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-1 rounded-lg">📍 {p.city}</span>
        </div>

        {/* Hospital + OPD/IPD Dates */}
        {p.hospital && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1 font-medium">HOSPITAL & APPOINTMENTS</div>
            <div className="text-sm font-semibold text-gray-900 mb-3">{p.hospital}</div>

            {/* OPD/IPD Dates inline */}
            <div className="flex flex-col gap-2">
              {p.opdScheduledAt && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded whitespace-nowrap">
                    📅 OPD
                  </span>
                  <span className="text-xs text-gray-700 font-medium">{formatDateTimeCompact(p.opdScheduledAt)}</span>
                </div>
              )}
              {p.ipdConfirmedAt && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded whitespace-nowrap">
                    🏥 IPD
                  </span>
                  <span className="text-xs text-gray-700 font-medium">{formatDateTimeCompact(p.ipdConfirmedAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Commission & Package Cost */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-400 mb-1 font-medium">Commission</div>
            <div className="font-bold text-emerald-600">{fmt(p.commission)} <span className="text-gray-400 font-normal text-xs">({p.commPct}%)</span></div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1 font-medium">Package Cost</div>
            <div className="font-semibold text-gray-700">{fmt(p.packageCost)}</div>
          </div>
        </div>
      </div>

      {/* Footer: Contact Buttons */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex gap-2">
          <a href={`tel:${p.phone}`}
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
            ☎️ Call
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
