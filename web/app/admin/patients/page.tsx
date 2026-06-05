'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { fmtINR, MOP_CONFIG, MopType, calcExpectedPaymentDate } from '@/lib/admin-data';
import { STATUS_CONFIG } from '@/lib/types';

const STATUSES = ['all','new','contacted','opd_scheduled','ipd_confirmed','completed','lost'] as const;
type PatientStatus = Exclude<typeof STATUSES[number], 'all'>;

const STATUS_LABELS: Record<string, string> = {
  all: 'All', new: 'New', contacted: 'Contacted',
  opd_scheduled: 'OPD Scheduled', ipd_confirmed: 'IPD Confirmed',
  completed: 'Completed', lost: 'Lost',
};

const STATUS_FLOW: Record<PatientStatus, PatientStatus[]> = {
  new:           ['contacted', 'lost'],
  contacted:     ['opd_scheduled', 'lost'],
  opd_scheduled: ['ipd_confirmed', 'lost'],
  ipd_confirmed: ['completed', 'lost'],
  completed:     [],
  lost:          ['new'],
};

type MopForm = {
  mop: MopType;
  ticketSize: number;
  implantCost: number;
  pharmacyCost: number;
  labCost: number;
  discount: number;
  otherDeductions: number;
};

const EMPTY_FORM: MopForm = {
  mop: 'cash', ticketSize: 0, implantCost: 0,
  pharmacyCost: 0, labCost: 0, discount: 0, otherDeductions: 0,
};

export default function AdminPatientsPage() {
  const { patients, agents, updatePatientStatus, setMOP } = useStore();

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter,  setAgentFilter]  = useState('all');
  const [sort,         setSort]         = useState<'recent' | 'commission' | 'name'>('recent');
  const [editingId,    setEditingId]    = useState<number | null>(null);
  const [mopPatientId, setMopPatientId] = useState<number | null>(null);
  const [mopForm,      setMopForm]      = useState<MopForm>(EMPTY_FORM);
  const [toast,        setToast]        = useState<string | null>(null);

  const activeAgents = agents.filter(a => a.status === 'active');

  const filtered = patients
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p => agentFilter === 'all' || p.agentId === agentFilter)
    .filter(p => !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.specialty.toLowerCase().includes(search.toLowerCase()) ||
      p.agentName.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'name')       return a.name.localeCompare(b.name);
      if (sort === 'commission') return b.commission - a.commission;
      return b.id - a.id;
    });

  const statusCounts: Record<string, number> = {};
  patients.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1; });
  const totalCommission = patients.reduce((s, p) => s + p.commission, 0);
  const completedCount  = patients.filter(p => p.status === 'completed').length;
  const mopPending      = patients.filter(p => p.status === 'completed' && !p.mop).length;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleStatusChange = (patientId: number, newStatus: string, patientName: string) => {
    updatePatientStatus(patientId, newStatus);
    setEditingId(null);
    const msg = newStatus === 'ipd_confirmed'
      ? `✅ ${patientName} → IPD Confirmed. Commission queued for approval!`
      : newStatus === 'completed'
      ? `🎉 ${patientName} → Completed. Now set MOP & ticket size.`
      : newStatus === 'lost'
      ? `❌ ${patientName} marked as Lost.`
      : `📋 ${patientName} → ${STATUS_LABELS[newStatus] ?? newStatus}`;
    showToast(msg);
  };

  const openMopPanel = (patientId: number) => {
    const p = patients.find(x => x.id === patientId)!;
    setMopForm({
      mop:             p.mop            ?? 'cash',
      ticketSize:      p.ticketSize     ?? p.packageCost,
      implantCost:     p.implantCost    ?? 0,
      pharmacyCost:    p.pharmacyCost   ?? 0,
      labCost:         p.labCost        ?? 0,
      discount:        p.discount       ?? 0,
      otherDeductions: p.otherDeductions ?? 0,
    });
    setMopPatientId(patientId);
    setEditingId(null);
  };

  const confirmMOP = (patientId: number, patientName: string) => {
    const { mop, ticketSize, implantCost, pharmacyCost, labCost, discount, otherDeductions } = mopForm;
    setMOP(patientId, mop, ticketSize, implantCost, pharmacyCost, labCost, discount, otherDeductions);
    // Capture preview values before closing the panel (previewShareable / previewComm are
    // computed at render time from mopForm, so they are always in sync with what the admin saw)
    const confirmedShareable = previewShareable;
    const confirmedComm      = previewComm;
    const confirmedDate      = previewDate;
    setMopPatientId(null);
    const cfg = MOP_CONFIG[mop];
    showToast(`💳 MOP set — ${cfg.icon} ${cfg.label} · Share ₹${confirmedShareable.toLocaleString('en-IN')} · Commission ₹${confirmedComm.toLocaleString('en-IN')} · Due ${confirmedDate}`);
  };

  // Live preview while MOP panel is open
  const totalDed        = mopForm.implantCost + mopForm.pharmacyCost + mopForm.labCost + mopForm.discount + mopForm.otherDeductions;
  const previewShareable = Math.max(0, mopForm.ticketSize - totalDed);
  const mopPatient       = mopPatientId ? patients.find(p => p.id === mopPatientId) : null;
  const previewComm      = mopPatient ? Math.round(previewShareable * mopPatient.commPct / 100) : 0;
  const previewDate      = calcExpectedPaymentDate(mopForm.mop);

  // Input helper
  const numInput = (field: keyof MopForm, label: string, hint: string, borderColor: string) => (
    <div>
      <label className="text-xs font-semibold text-gray-600 block mb-1">
        {label}
        <span className="ml-1 font-normal text-gray-400 text-[11px]">— {hint}</span>
      </label>
      <input
        type="number" min={0}
        value={(mopForm[field] as number) === 0 ? '' : (mopForm[field] as number)}
        placeholder="0"
        onChange={e => setMopForm(f => ({ ...f, [field]: Number(e.target.value) || 0 }))}
        className={`w-40 border-2 ${borderColor} rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none bg-white focus:ring-0 transition-colors`}
      />
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-2xl shadow-2xl">
          {toast}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total Patients',  value: patients.length,                                                          color: 'text-gray-900' },
          { label: 'Completed Cases', value: completedCount,                                                           color: 'text-emerald-600' },
          { label: 'Active Pipeline', value: patients.filter(p => !['completed','lost'].includes(p.status)).length,   color: 'text-blue-600' },
          { label: 'Commission Pool', value: fmtINR(totalCommission),                                                  color: 'text-indigo-600' },
          { label: 'MOP Pending',     value: mopPending,                                                               color: mopPending > 0 ? 'text-orange-600' : 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* MOP pending banner */}
      {mopPending > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-3 flex items-center gap-3">
          <span className="text-xl">💳</span>
          <div>
            <span className="text-sm font-semibold text-orange-800">{mopPending} completed case{mopPending > 1 ? 's' : ''} awaiting MOP & Ticket Size</span>
            <span className="text-xs text-orange-600 ml-2">— set payment mode to finalise agent commission</span>
          </div>
          <button onClick={() => setStatusFilter('completed')}
            className="ml-auto text-xs font-semibold text-orange-700 bg-orange-100 hover:bg-orange-200 border border-orange-200 px-3 py-1.5 rounded-lg transition-colors">
            View Completed →
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient, specialty, agent or city…"
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="all">All Agents</option>
            {activeAgents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="recent">Most Recent</option>
            <option value="name">Name A–Z</option>
            <option value="commission">Highest Commission</option>
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => {
            const count = s === 'all' ? patients.length : (statusCounts[s] ?? 0);
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}>
                {STATUS_LABELS[s]} ({count})
                {s === 'completed' && mopPending > 0 && (
                  <span className="ml-1.5 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{mopPending}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing <strong className="text-gray-900">{filtered.length}</strong> of {patients.length} patients
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-2">
          <span>✏️ Click status to update</span>
          <span>·</span>
          <span>💳 Click Completed to set MOP</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Patient','Phone / Age','Specialty & Procedure','City','Agent','Commission','Ticket / MOP','Status','Added'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center text-gray-400"><div className="text-4xl mb-2">🏥</div><div className="font-medium">No patients found</div></td></tr>
              ) : filtered.map(p => {
                const cfg          = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG];
                const nextStatuses = STATUS_FLOW[p.status as PatientStatus] ?? [];
                const isEditing    = editingId === p.id;
                const isMopOpen    = mopPatientId === p.id;
                const mopCfg       = p.mop ? MOP_CONFIG[p.mop] : null;

                return (
                  <>
                    <tr key={p.id} className={`transition-colors ${isMopOpen ? 'bg-blue-50/40' : 'hover:bg-gray-50/50'}`}>

                      {/* Patient */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">{p.name[0]}</div>
                          <span className="font-semibold text-gray-900 whitespace-nowrap">{p.name}</span>
                        </div>
                      </td>

                      {/* Phone / Age */}
                      <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        <div>{p.phone}</div>
                        <div>Age {p.age} · {p.gender === 'M' ? 'M' : 'F'}</div>
                      </td>

                      {/* Specialty */}
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-900 text-xs">{p.specialty}</div>
                        <div className="text-xs text-gray-500">{p.procedure}</div>
                      </td>

                      {/* City */}
                      <td className="px-5 py-3.5 text-xs text-gray-600 whitespace-nowrap">{p.city}</td>

                      {/* Agent */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">{p.agentName}</div>
                        <div className="text-[10px] text-gray-400">{p.agentId}</div>
                      </td>

                      {/* Commission */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-emerald-600 text-xs">{fmtINR(p.commission)}</div>
                        <div className="text-[10px] text-gray-400">{p.commPct}% rate</div>
                      </td>

                      {/* Ticket / MOP */}
                      <td className="px-5 py-3.5 min-w-[170px]">
                        {p.status === 'completed' ? (
                          mopCfg ? (
                            <div className="space-y-1">
                              <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${mopCfg.bg} ${mopCfg.color} ${mopCfg.border}`}>
                                {mopCfg.icon} {mopCfg.label}
                              </div>
                              <div className="text-[10px] text-gray-500">Bill: {fmtINR(p.ticketSize!)}</div>
                              {(p.totalDeductions ?? 0) > 0 && (
                                <div className="text-[10px] text-red-500">− Deductions: {fmtINR(p.totalDeductions!)}</div>
                              )}
                              <div className="text-[10px] font-semibold text-indigo-600">Share: {fmtINR(p.shareableAmount!)}</div>
                              <div className="text-[10px] text-gray-400">Due: {p.expectedPaymentDate}</div>
                              <button onClick={() => openMopPanel(p.id)} className="text-[10px] text-indigo-500 hover:text-indigo-700 underline">Edit MOP</button>
                            </div>
                          ) : (
                            <button onClick={() => openMopPanel(p.id)}
                              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors shadow-sm whitespace-nowrap">
                              💳 Set MOP
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">{fmtINR(p.packageCost)}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <div className="flex flex-col gap-1 min-w-[150px]">
                            <div className="text-[10px] text-gray-400 mb-0.5">Move to:</div>
                            <div className="flex flex-wrap gap-1">
                              {nextStatuses.length === 0 ? (
                                <span className="text-[10px] text-gray-400 italic">Terminal</span>
                              ) : nextStatuses.map(ns => {
                                const ncfg = STATUS_CONFIG[ns as keyof typeof STATUS_CONFIG];
                                return (
                                  <button key={ns} onClick={() => handleStatusChange(p.id, ns, p.name)}
                                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all hover:scale-105 ${ncfg?.bg ?? 'bg-gray-100'} ${ncfg?.color ?? 'text-gray-700'} ${ncfg?.border ?? 'border-gray-200'}`}>
                                    → {STATUS_LABELS[ns]}
                                  </button>
                                );
                              })}
                            </div>
                            <button onClick={() => setEditingId(null)} className="text-[10px] text-gray-400 hover:text-gray-600 mt-0.5">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => nextStatuses.length > 0 ? setEditingId(p.id) : undefined}
                            className={`group flex items-center gap-1.5 ${nextStatuses.length > 0 ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}>
                            {cfg && (
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                              </span>
                            )}
                            {nextStatuses.length > 0 && (
                              <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
                            )}
                          </button>
                        )}
                      </td>

                      {/* Added */}
                      <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{p.createdAt}</td>
                    </tr>

                    {/* ── MOP Expansion Panel ─────────────────────────────────── */}
                    {isMopOpen && (
                      <tr key={`mop-${p.id}`}>
                        <td colSpan={9} className="px-6 py-5 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-blue-100">
                          <div className="space-y-5">

                            {/* Panel header */}
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg flex-shrink-0">💳</div>
                              <div>
                                <div className="text-sm font-bold text-gray-900">
                                  Mode of Payment & Bill Breakdown — <span className="text-indigo-600">{p.name}</span>
                                </div>
                                <div className="text-xs text-gray-500">{p.specialty} · {p.procedure} · Agent: {p.agentName} · Rate: {p.commPct}%</div>
                              </div>
                              <button onClick={() => setMopPatientId(null)} className="ml-auto text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
                            </div>

                            <div className="flex flex-wrap gap-6">

                              {/* Left column: MOP + inputs */}
                              <div className="flex-1 min-w-0 space-y-4">

                                {/* MOP selector */}
                                <div>
                                  <div className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Mode of Payment</div>
                                  <div className="flex flex-wrap gap-2">
                                    {(Object.keys(MOP_CONFIG) as MopType[]).map(m => {
                                      const mc = MOP_CONFIG[m];
                                      const active = mopForm.mop === m;
                                      return (
                                        <button key={m} onClick={() => setMopForm(f => ({ ...f, mop: m }))}
                                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                                            active
                                              ? `${mc.bg} ${mc.color} ${mc.border} shadow-sm scale-[1.02]`
                                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                          }`}>
                                          <span className="text-base">{mc.icon}</span>
                                          <div className="text-left">
                                            <div>{mc.label}</div>
                                            <div className={`text-[10px] font-normal ${active ? 'opacity-70' : 'text-gray-400'}`}>{mc.note}</div>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Bill inputs — grid layout */}
                                <div>
                                  <div className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Bill Components</div>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">

                                    {/* Total Bill — highlighted */}
                                    <div className="col-span-2 sm:col-span-1">
                                      <label className="text-xs font-bold text-gray-800 block mb-1">
                                        Total Bill Amount (₹)
                                        <span className="ml-1 text-[10px] font-normal text-blue-500">admin editable</span>
                                      </label>
                                      <input
                                        type="number" min={0}
                                        value={mopForm.ticketSize === 0 ? '' : mopForm.ticketSize}
                                        placeholder="0"
                                        onChange={e => setMopForm(f => ({ ...f, ticketSize: Number(e.target.value) || 0 }))}
                                        className="w-full border-2 border-indigo-300 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none bg-white"
                                      />
                                    </div>

                                    {/* Deductions */}
                                    <div>
                                      <label className="text-xs font-semibold text-gray-600 block mb-1">
                                        Implants / Equipment (₹)
                                        <span className="ml-1 text-[10px] font-normal text-red-400">excluded</span>
                                      </label>
                                      <input type="number" min={0}
                                        value={mopForm.implantCost === 0 ? '' : mopForm.implantCost} placeholder="0"
                                        onChange={e => setMopForm(f => ({ ...f, implantCost: Number(e.target.value) || 0 }))}
                                        className="w-full border-2 border-red-200 focus:border-red-400 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none bg-white"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-xs font-semibold text-gray-600 block mb-1">
                                        Pharmacy / Medicines (₹)
                                        <span className="ml-1 text-[10px] font-normal text-red-400">excluded</span>
                                      </label>
                                      <input type="number" min={0}
                                        value={mopForm.pharmacyCost === 0 ? '' : mopForm.pharmacyCost} placeholder="0"
                                        onChange={e => setMopForm(f => ({ ...f, pharmacyCost: Number(e.target.value) || 0 }))}
                                        className="w-full border-2 border-red-200 focus:border-red-400 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none bg-white"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-xs font-semibold text-gray-600 block mb-1">
                                        Lab & Diagnostics (₹)
                                        <span className="ml-1 text-[10px] font-normal text-red-400">excluded</span>
                                      </label>
                                      <input type="number" min={0}
                                        value={mopForm.labCost === 0 ? '' : mopForm.labCost} placeholder="0"
                                        onChange={e => setMopForm(f => ({ ...f, labCost: Number(e.target.value) || 0 }))}
                                        className="w-full border-2 border-red-200 focus:border-red-400 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none bg-white"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-xs font-semibold text-gray-600 block mb-1">
                                        Hospital Discount (₹)
                                        <span className="ml-1 text-[10px] font-normal text-amber-500">deducted</span>
                                      </label>
                                      <input type="number" min={0}
                                        value={mopForm.discount === 0 ? '' : mopForm.discount} placeholder="0"
                                        onChange={e => setMopForm(f => ({ ...f, discount: Number(e.target.value) || 0 }))}
                                        className="w-full border-2 border-amber-200 focus:border-amber-400 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none bg-white"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-xs font-semibold text-gray-600 block mb-1">
                                        Other Deductions (₹)
                                        <span className="ml-1 text-[10px] font-normal text-gray-400">misc.</span>
                                      </label>
                                      <input type="number" min={0}
                                        value={mopForm.otherDeductions === 0 ? '' : mopForm.otherDeductions} placeholder="0"
                                        onChange={e => setMopForm(f => ({ ...f, otherDeductions: Number(e.target.value) || 0 }))}
                                        className="w-full border-2 border-gray-200 focus:border-gray-400 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none bg-white"
                                      />
                                    </div>

                                  </div>
                                </div>
                              </div>

                              {/* Right column: live preview */}
                              <div className="w-72 flex-shrink-0">
                                <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden">
                                  <div className="bg-indigo-600 px-4 py-3">
                                    <div className="text-white text-xs font-bold uppercase tracking-wide">📊 Commission Preview</div>
                                  </div>
                                  <div className="p-4 space-y-2 text-xs">

                                    {/* Bill breakdown */}
                                    <div className="flex justify-between py-1">
                                      <span className="text-gray-500">Total Bill</span>
                                      <span className="font-bold text-gray-900">{fmtINR(mopForm.ticketSize)}</span>
                                    </div>

                                    {mopForm.implantCost > 0 && (
                                      <div className="flex justify-between text-red-600">
                                        <span>− Implants / Equipment</span>
                                        <span className="font-semibold">− {fmtINR(mopForm.implantCost)}</span>
                                      </div>
                                    )}
                                    {mopForm.pharmacyCost > 0 && (
                                      <div className="flex justify-between text-red-600">
                                        <span>− Pharmacy / Medicines</span>
                                        <span className="font-semibold">− {fmtINR(mopForm.pharmacyCost)}</span>
                                      </div>
                                    )}
                                    {mopForm.labCost > 0 && (
                                      <div className="flex justify-between text-red-600">
                                        <span>− Lab & Diagnostics</span>
                                        <span className="font-semibold">− {fmtINR(mopForm.labCost)}</span>
                                      </div>
                                    )}
                                    {mopForm.discount > 0 && (
                                      <div className="flex justify-between text-amber-600">
                                        <span>− Hospital Discount</span>
                                        <span className="font-semibold">− {fmtINR(mopForm.discount)}</span>
                                      </div>
                                    )}
                                    {mopForm.otherDeductions > 0 && (
                                      <div className="flex justify-between text-gray-500">
                                        <span>− Other Deductions</span>
                                        <span className="font-semibold">− {fmtINR(mopForm.otherDeductions)}</span>
                                      </div>
                                    )}

                                    {totalDed > 0 && (
                                      <div className="flex justify-between border-t border-dashed border-red-100 pt-2 text-red-600">
                                        <span className="font-medium">Total Deductions</span>
                                        <span className="font-bold">− {fmtINR(totalDed)}</span>
                                      </div>
                                    )}

                                    <div className="flex justify-between border-t-2 border-indigo-100 pt-2">
                                      <span className="font-bold text-gray-800">Shareable Amount</span>
                                      <span className="font-bold text-indigo-700 text-sm">{fmtINR(previewShareable)}</span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Agent Rate</span>
                                      <span className="font-semibold">{mopPatient?.commPct ?? 0}%</span>
                                    </div>

                                    <div className="flex justify-between border-t border-gray-100 pt-2">
                                      <span className="font-bold text-gray-900 text-sm">Agent Commission</span>
                                      <span className="font-bold text-emerald-600 text-lg">{fmtINR(previewComm)}</span>
                                    </div>

                                    {/* Payment timeline */}
                                    <div className={`flex items-center gap-2 mt-3 p-3 rounded-xl border ${MOP_CONFIG[mopForm.mop].bg} ${MOP_CONFIG[mopForm.mop].border}`}>
                                      <span className="text-base">{MOP_CONFIG[mopForm.mop].icon}</span>
                                      <div>
                                        <div className={`text-xs font-bold ${MOP_CONFIG[mopForm.mop].color}`}>Due by {previewDate}</div>
                                        <div className="text-[10px] text-gray-400">{MOP_CONFIG[mopForm.mop].note}</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action buttons */}
                                  <div className="px-4 pb-4 space-y-2">
                                    <button onClick={() => confirmMOP(p.id, p.name)}
                                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
                                      ✓ Confirm MOP
                                    </button>
                                    <button onClick={() => setMopPatientId(null)}
                                      className="w-full py-2 text-gray-400 hover:text-gray-600 text-xs">
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>

                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
