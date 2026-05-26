'use client';
import { useState } from 'react';
import { AGENT, MONTHLY_EARNINGS, fmt } from '@/lib/data';

export default function ProfilePage() {
  const [notifs, setNotifs] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const Toggle = ({ val, set }: { val: boolean; set: (v: boolean) => void }) => (
    <div onClick={() => set(!val)}
      className={`w-11 h-6 rounded-full cursor-pointer transition-all relative flex-shrink-0 ${val ? 'bg-blue-600' : 'bg-gray-200'}`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${val ? 'right-0.5' : 'left-0.5'}`} />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-5">
      {/* Profile hero */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-28 relative" style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white, transparent)' }} />
        </div>
        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-md">
                {AGENT.name[0]}
              </div>
              <div className="pb-1">
                <div className="text-xl font-bold text-gray-900">{AGENT.name}</div>
                <div className="text-sm text-gray-500">{AGENT.email}</div>
              </div>
            </div>
            <div className="flex gap-2 pb-1">
              <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full">ID: {AGENT.id}</span>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">{AGENT.commissionRate}% Commission</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="font-semibold text-gray-900 mb-4">📊 Performance Overview</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Leads', value: AGENT.totalLeads, color: 'text-blue-600' },
            { label: 'Conversion Rate', value: `${AGENT.conversionRate}%`, color: 'text-emerald-600' },
            { label: 'Total Earned', value: fmt(AGENT.totalEarned), color: 'text-amber-600' },
            { label: 'This Month', value: fmt(AGENT.thisMonth), color: 'text-purple-600' },
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
            { icon: '👤', label: 'Full Name', value: AGENT.name },
            { icon: '📱', label: 'Phone', value: AGENT.phone },
            { icon: '📧', label: 'Email', value: AGENT.email },
            { icon: '📍', label: 'City', value: AGENT.city },
            { icon: '🆔', label: 'Agent ID', value: AGENT.id },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-sm flex-shrink-0">{f.icon}</div>
              <div className="flex-1">
                <div className="text-xs text-gray-400">{f.label}</div>
                <div className="text-sm font-medium text-gray-800">{f.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bank details */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-gray-900">🏦 Bank Details</div>
              <button className="text-blue-600 text-xs font-medium hover:underline">Update</button>
            </div>
            {[
              { icon: '🏛️', label: 'Bank Account', value: AGENT.bank },
              { icon: '💳', label: 'UPI ID', value: AGENT.upi },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-sm flex-shrink-0">{f.icon}</div>
                <div>
                  <div className="text-xs text-gray-400">{f.label}</div>
                  <div className="text-sm font-medium text-gray-800">{f.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* App settings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="font-semibold text-gray-900 mb-4">⚙️ App Settings</div>
            {[
              { label: 'Push Notifications', icon: '🔔', val: notifs, set: setNotifs },
              { label: 'Email Alerts', icon: '📧', val: emailAlerts, set: setEmailAlerts },
              { label: 'Biometric Login', icon: '🔐', val: biometric, set: setBiometric },
              { label: 'Dark Mode', icon: '🌙', val: darkMode, set: setDarkMode },
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

      {/* Support + logout */}
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
