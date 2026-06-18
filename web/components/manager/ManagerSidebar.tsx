'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useStore } from '@/lib/store';

export default function ManagerSidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { currentAgent, myTeamAgents } = useStore();

  const activeAgents = myTeamAgents.filter(a => a.status === 'active').length;

  const NAV = [
    { href: '/manager',              icon: '🏠', label: 'Dashboard',       badge: 0 },
    { href: '/manager/agents',       icon: '👥', label: 'My Agents',       badge: activeAgents },
    { href: '/manager/add-patient',  icon: '➕', label: 'Add Patient Lead', badge: 0 },
    { href: '/manager/patients',     icon: '🏥', label: 'Team Patients',   badge: 0 },
    { href: '/manager/earnings',     icon: '💰', label: 'Team Earnings',   badge: 0 },
  ];

  const content = (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}>🏥</div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-tight">MediReferral</div>
            <div className="text-[10px] text-purple-600 font-semibold">Manager Portal</div>
          </div>
        </div>
      </div>

      {/* Manager chip */}
      <div className="px-3 py-3 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm ring-2 ring-white">
            {currentAgent?.name?.[0] ?? 'M'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-gray-900 truncate">{currentAgent?.name ?? 'Manager'}</div>
            <div className="text-[10px] text-gray-500 truncate">{currentAgent?.id ?? ''}</div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700 flex-shrink-0">MGR</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = path === item.href || (item.href !== '/manager' && path.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                active ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="bg-purple-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-purple-600 rounded-r-full" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400">Team size</span>
          <span className="text-[10px] font-semibold text-purple-600">{myTeamAgents.length} agents</span>
        </div>
        <Link href="/" className="block w-full text-center text-[10px] text-gray-400 hover:text-red-500 transition-colors">
          Sign out
        </Link>
        <div className="text-[10px] text-gray-400">MediReferral v1.0</div>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 bg-white border-r border-gray-100 flex-col z-40 shadow-sm">
        {content}
      </aside>
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-lg">{open ? '✕' : '☰'}</span>
      </button>
      {open && <div className="md:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setOpen(false)} />}
      <aside className={`md:hidden fixed inset-y-0 left-0 w-64 bg-white flex flex-col z-50 shadow-xl transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {content}
      </aside>
    </>
  );
}
