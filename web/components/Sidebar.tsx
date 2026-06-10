'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AGENT } from '@/lib/data';

const NAV = [
  { href: '/dashboard',      icon: '🏠', label: 'Dashboard' },
  { href: '/patients',       icon: '👥', label: 'Patients' },
  { href: '/add-patient',    icon: '➕', label: 'Add Patient' },
  { href: '/earnings',       icon: '💰', label: 'Earnings' },
  { href: '/notifications',  icon: '🔔', label: 'Notifications', badge: 2 },
  { href: '/profile',        icon: '👤', label: 'Profile' },
];

export default function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

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
      <div className="px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {AGENT.name[0]}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-800 truncate">{AGENT.name}</div>
            <div className="text-[10px] text-gray-400">{AGENT.id}</div>
          </div>
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
              {item.badge && (
                <span className="bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-gray-400">{AGENT.commissionRate}% Commission Rate</div>
          <div className="text-[10px] font-semibold text-emerald-600">Active ✓</div>
        </div>
        <div className="mt-2 text-[10px] text-gray-400">MediReferral v1.0</div>
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
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`md:hidden fixed inset-y-0 left-0 w-64 bg-white flex flex-col z-50 shadow-xl transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {content}
      </aside>
    </>
  );
}
