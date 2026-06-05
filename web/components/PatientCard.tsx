import Link from 'next/link';
import { AdminPatient } from '@/lib/admin-data';
import StatusBadge from './StatusBadge';

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const formatDateTimeCompact = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return `${day}, ${time}`;
  } catch {
    return '';
  }
};

export default function PatientCard({ patient: p }: { patient: AdminPatient }) {
  const opdDate = formatDateTimeCompact(p.opdScheduledAt);
  const ipdDate = formatDateTimeCompact(p.ipdConfirmedAt);
  const hasAppointments = (p.opdScheduledAt || p.ipdConfirmedAt);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
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

        {/* Hospital & Appointments Box */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">🏥 Hospital & Appointments</span>
          </div>

          {/* Hospital Name */}
          <div className="text-sm font-bold text-gray-900 mb-3">{p.hospital}</div>

          {/* Appointments - Always visible section */}
          <div className="space-y-2">
            {p.opdScheduledAt ? (
              <div className="flex items-center gap-2 py-1">
                <span className="text-xs font-bold text-blue-700 bg-blue-150 px-2.5 py-1 rounded-md whitespace-nowrap">
                  📅 OPD
                </span>
                <span className="text-xs font-semibold text-gray-800">{opdDate}</span>
              </div>
            ) : null}

            {p.ipdConfirmedAt ? (
              <div className="flex items-center gap-2 py-1">
                <span className="text-xs font-bold text-purple-700 bg-purple-150 px-2.5 py-1 rounded-md whitespace-nowrap">
                  🏥 IPD
                </span>
                <span className="text-xs font-semibold text-gray-800">{ipdDate}</span>
              </div>
            ) : null}

            {!hasAppointments && (
              <div className="text-xs text-gray-500 italic">No appointments scheduled</div>
            )}
          </div>
        </div>

        {/* Commission & Package Cost */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-emerald-50 p-3 rounded-lg">
            <div className="text-xs text-emerald-600 font-bold mb-1">COMMISSION</div>
            <div className="font-bold text-emerald-700">{fmt(p.commission)}</div>
            <div className="text-xs text-emerald-600">({p.commPct}%)</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 font-bold mb-1">PACKAGE</div>
            <div className="font-bold text-blue-700">{fmt(p.packageCost)}</div>
          </div>
        </div>
      </div>

      {/* Footer: Contact Buttons */}
      <div className="px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex items-center justify-between">
        <div className="flex gap-2">
          <a href={`tel:${p.phone}`}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors">
            ☎️ Call
          </a>
          <a href={`https://wa.me/${p.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors">
            💬 WhatsApp
          </a>
        </div>
        <Link href={`/patients/${p.id}`}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700">
          View Details →
        </Link>
      </div>
    </div>
  );
}
