'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useStore } from '@/lib/store';

export default function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { currentAgent, unreadCount } = useStore();
  const agent = currentAgent;

  // Verification status summary for profile badge
  const phoneOk = agent?.phoneVerified;
  const emailOk = agent?.emailVerified;
  const kycOk   = agent?.kycStatus === 'approved';
  const kycPending = agent?.kycStatus === 'submitted';
  const allVerified = phoneOk && emailOk && kycOk;
  const pendingSteps = [
    !phoneOk && 'Phone',
    !emailOk && 'Email',
    !kycOk   && 'KYC',
  ].filter(Boolean);

  const NAV = [
    { href: '/dashboard',      icon: '🏠', label: 'Dashboard',     badge: 0 },
    { href: '/patients',       icon: '👥', label: 'Patients',      badge: 0 },
    { href: '/add-patient',    icon: '➕', label: 'Add Patient',   badge: 0 },
    { href: '/earnings',       icon: '💰', label: 'Earnings',      badge: 0 },
    { href: '/notifications',  icon: '🔔', label: 'Notifications', badge: unreadCount },
    { href: '/profile',        icon: '👤', label: 'Profile',       badge: 0,
      extra: allVerified ? '✅' : pendingSteps.length > 0 ? `${pendingSteps.length}` : undefined,
      extraColor: allVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-500 text-white',
    },
  ];

  const content = (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg,#2563EB,#1D4ED8)' }}>🏥</div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-tight">MediReferral</div>
            <div className="text-[10px] text-gray-400">Partner Portal</div>
          </div>
        </div>
      </div>

      {/* Agent chip */}
      <div className="relative px-4 py-3 pb-5 border-b border-gray-50">
        <div className="flex items-center gap-2.5 pt-2">
          <div className="absolute -top-4 left-4 z-10 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 border-2 border-white shadow-sm">
            {agent?.name[0] ?? 'R'}
          </div>
          <div className="min-w-0 flex-1 ml-6">
            <div className="text-xs font-semibold text-gray-800 truncate">{agent?.name ?? 'Agent'}</div>
            <div className="text-[10px] text-gray-400">{agent?.id ?? ''}</div>
          </div>
          {/* Mini verification indicator */}
          {agent && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <span title="Phone" className={`w-2 h-2 rounded-full ${phoneOk ? 'bg-emerald-400' : 'bg-gray-300'}`} />
              <span title="Email" className={`w-2 h-2 rounded-full ${emailOk ? 'bg-emerald-400' : 'bg-gray-300'}`} />
              <span title="KYC"   className={`w-2 h-2 rounded-full ${kycOk ? 'bg-emerald-400' : kycPending ? 'bg-amber-400' : 'bg-gray-300'}`} />
            </div>
          )}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span suppressHydrationWarning className="bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              {/* Profile verification badge */}
              {'extra' in item && item.extra && (
                <span className={`text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${(item as typeof NAV[5]).extraColor}`}>
                  {item.extra}
                </span>
              )}
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer — verification progress + commission */}
      <div className="px-4 py-3 border-t border-gray-100 space-y-2">
        {/* Verification progress bar */}
        {agent && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 font-medium">Verification</span>
              <span className="text-[10px] font-semibold text-gray-600">
                {[phoneOk, emailOk, kycOk].filter(Boolean).length}/3
              </span>
            </div>
            <div className="flex gap-1">
              <div className={`flex-1 h-1.5 rounded-full ${phoneOk ? 'bg-emerald-400' : 'bg-gray-200'}`} title="Phone" />
              <div className={`flex-1 h-1.5 rounded-full ${emailOk ? 'bg-emerald-400' : 'bg-gray-200'}`} title="Email" />
              <div className={`flex-1 h-1.5 rounded-full ${kycOk ? 'bg-emerald-400' : kycPending ? 'bg-amber-400' : 'bg-gray-200'}`} title="KYC" />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-gray-400">Phone</span>
              <span className="text-[9px] text-gray-400">Email</span>
              <span className="text-[9px] text-gray-400">KYC</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-gray-400">{agent?.commissionRate ?? 4}% Commission Rate</div>
          <div suppressHydrationWarning className="text-[10px] font-semibold text-emerald-600">
            {agent?.status === 'active' ? 'Active ✓' : agent?.status === 'suspended' ? 'Suspended' : agent?.status ?? ''}
          </div>
        </div>
        <div className="text-[10px] text-gray-400">MediReferral v1.0</div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 bg-white border-r border-gray-100 flex-col z-40 shadow-sm">
        {content}
      </aside>

      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle menu"
      >
        <span className="text-lg">{open ? '✕' : '☰'}</span>
      </button>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`md:hidden fixed inset-y-0 left-0 w-64 bg-white flex flex-col z-50 shadow-xl transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {content}
      </aside>
    </>
  );
}
