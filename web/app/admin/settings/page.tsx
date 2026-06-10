'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';

function Toggle({ val, set }: { val: boolean; set: (v: boolean) => void }) {
  return (
    <div onClick={() => set(!val)}
      className={`w-12 h-6 rounded-full cursor-pointer transition-all relative flex-shrink-0 ${val ? 'bg-indigo-600' : 'bg-gray-200'}`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${val ? 'right-0.5' : 'left-0.5'}`} />
    </div>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings } = useStore();
  const [saved, setSaved] = useState(false);

  // Local copies for editing (synced from store on mount)
  const [appName,      setAppName]      = useState(settings.appName);
  const [timezone,     setTimezone]     = useState(settings.timezone);
  const [currency,     setCurrency]     = useState(settings.currency);
  const [autoApproveAgents,       setAutoApproveAgents]       = useState(settings.autoApproveAgents);
  const [idFormat,     setIdFormat]     = useState('AG-{CITY}-{SEQ}');
  const [minCommission,setMinCommission]= useState(settings.minCommission);
  const [maxCommission,setMaxCommission]= useState(settings.maxCommission);
  const [autoApproveCommissions,  setAutoApproveCommissions]  = useState(settings.autoApproveCommissions);
  const [paymentCycle, setPaymentCycle] = useState(settings.paymentCycle);
  const [minPayout,    setMinPayout]    = useState(settings.minPayout);
  const [rates,        setRates]        = useState(settings.commissionRates);
  const [emailAlerts,  setEmailAlerts]  = useState(true);
  const [smsAlerts,    setSmsAlerts]    = useState(true);
  const [whatsappAlerts,setWhatsappAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

  const handleSave = () => {
    updateSettings({
      appName, timezone, currency,
      autoApproveAgents, autoApproveCommissions,
      paymentCycle, minPayout, minCommission, maxCommission,
      commissionRates: rates,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Save button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Changes are saved to the platform configuration.</p>
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
          {saved ? '✅ Saved!' : '💾 Save Settings'}
        </button>
      </div>

      {/* General */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50"><h2 className="font-bold text-gray-900">🌐 General Settings</h2></div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Platform Name</label>
            <input value={appName} onChange={e => setAppName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
            <select value={timezone} onChange={e => setTimezone(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="Asia/Kolkata">IST — Asia/Kolkata (UTC+5:30)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="INR">INR — Indian Rupee (₹)</option>
              <option value="USD">USD — US Dollar ($)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Agent Settings */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50"><h2 className="font-bold text-gray-900">👥 Agent Settings</h2></div>
        <div className="divide-y divide-gray-50">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800 text-sm">Auto-approve new agents</div>
              <div className="text-xs text-gray-500 mt-0.5">New registrations are approved automatically without admin review</div>
            </div>
            <Toggle val={autoApproveAgents} set={setAutoApproveAgents} />
          </div>
          <div className="px-6 py-4">
            <div className="font-medium text-gray-800 text-sm mb-3">Agent ID Format</div>
            <div className="flex gap-3 items-center">
              <input value={idFormat} onChange={e => setIdFormat(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
              <div className="text-xs text-gray-400 bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-100 whitespace-nowrap">
                Preview: <strong className="text-gray-700">AG-HYD-001</strong>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Tokens: {'{CITY}'} — city code, {'{SEQ}'} — 3-digit sequence</p>
          </div>
          <div className="px-6 py-4">
            <div className="font-medium text-gray-800 text-sm mb-3">Commission Rate Limits (%)</div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                <input type="number" step="0.25" min="0" max="10" value={minCommission} onChange={e => setMinCommission(parseFloat(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                <input type="number" step="0.25" min="0" max="10" value={maxCommission} onChange={e => setMaxCommission(parseFloat(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commission Settings */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50"><h2 className="font-bold text-gray-900">💰 Commission Settings</h2></div>
        <div className="divide-y divide-gray-50">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800 text-sm">Auto-approve commissions</div>
              <div className="text-xs text-gray-500 mt-0.5">Commissions approved automatically upon surgery completion</div>
            </div>
            <Toggle val={autoApproveCommissions} set={setAutoApproveCommissions} />
          </div>
          <div className="px-6 py-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Cycle</label>
              <select value={paymentCycle} onChange={e => setPaymentCycle(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="immediate">Immediate (after approval)</option>
                <option value="weekly">Weekly batch</option>
                <option value="monthly">Monthly batch</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum Payout (₹)</label>
              <input type="number" value={minPayout} onChange={e => setMinPayout(parseInt(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="font-medium text-gray-800 text-sm mb-3">Default Commission Rates by Specialty</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(rates).map(([specialty, rate]) => (
                <div key={specialty} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 flex-1 truncate">{specialty}</span>
                  <div className="flex items-center gap-1">
                    <input type="number" step="0.25" min="0" max="10" value={rate}
                      onChange={e => setRates(r => ({ ...r, [specialty]: parseFloat(e.target.value) }))}
                      className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50"><h2 className="font-bold text-gray-900">🔔 Notification Preferences</h2></div>
        <div className="divide-y divide-gray-50">
          {[
            { label: 'Email Alerts',            sub: 'Send admin alerts and summaries by email',                             val: emailAlerts,   set: setEmailAlerts   },
            { label: 'SMS Alerts',              sub: 'Critical alerts via SMS (agent registrations, large commissions)',     val: smsAlerts,     set: setSmsAlerts     },
            { label: 'WhatsApp Notifications',  sub: 'Send WhatsApp messages to agents on status changes',                  val: whatsappAlerts,set: setWhatsappAlerts },
            { label: 'Weekly Report',           sub: 'Auto-generate and email the weekly performance summary',              val: weeklyReport,  set: setWeeklyReport  },
          ].map(item => (
            <div key={item.label} className="px-6 py-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-800 text-sm">{item.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.sub}</div>
              </div>
              <Toggle val={item.val} set={item.set} />
            </div>
          ))}
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100 bg-red-50/30"><h2 className="font-bold text-red-700">⚠️ Danger Zone</h2></div>
        <div className="p-6 space-y-4">
          {[
            { label: 'Export All Data',   sub: 'Download a full CSV export of all agents, patients and commissions', btn: 'Export CSV',    btnClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
            { label: 'Reset Analytics',  sub: 'Clear all cached analytics. Data will be recalculated from source records.', btn: 'Reset Cache', btnClass: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="font-medium text-gray-800 text-sm">{item.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.sub}</div>
              </div>
              <button className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${item.btnClass}`}>{item.btn}</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
