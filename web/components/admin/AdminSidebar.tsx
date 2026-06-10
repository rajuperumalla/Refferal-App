'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem { href: string; icon: string; label: string; exact?: boolean }
interface NavGroup { section: string; items: NavItem[] }

const NAV: NavGroup[] = [
  {
    section: 'Overview',
    items: [
      { href: '/admin', icon: '📊', label: 'Dashboard', exact: true },
    ],
  },
  {
    section: 'Management',
    items: [
      { href: '/admin/agents',      icon: '👥', label: 'Agents' },
      { href: '/admin/patients',    icon: '🏥', label: 'Patients' },
      { href: '/admin/commissions', icon: '💰', label: 'Commissions' },
    ],
  },
  {
    section: 'Network',
    items: [
      { href: '/admin/hospitals',          icon: '🏨', label: 'Hospitals' },
      { href: '/admin/bank-verifications', icon: '🏦', label: 'Bank Verifications' },
    ],
  },
  {
    section: 'System',
    items: [
      { href: '/admin/settings', icon: '⚙️', label: 'Settings' },
    ],
  },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const path = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? path === href : path === href || path.startsWith(href + '/');

  return (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl bg-indigo-600">🏥</div>
          <div>
            <div className="font-bold text-white text-sm leading-tight">MediReferral</div>
            <div className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Admin Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {NAV.map(group => (
          <div key={group.section}>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest px-3 mb-1.5">
              {group.section}
            </div>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link key={item.href} href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                      active
                        ? 'bg-slate-700/60 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}>
                    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full" />}
                    <span className="text-base w-5 text-center">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — back to agent portal + admin user */}
      <div className="border-t border-slate-700/50 px-4 py-4 space-y-3">
        <Link href="/dashboard"
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-800/50">
          ← Back to Agent Portal
        </Link>
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">A</div>
          <div>
            <div className="text-xs font-semibold text-white">Admin</div>
            <div className="text-[10px] text-slate-400">admin@medireferral.in</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 bg-slate-900 flex-col z-40">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center text-white shadow-sm"
        onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
        <span className="text-lg">{open ? '✕' : '☰'}</span>
      </button>

      {/* Mobile overlay */}
      {open && <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />}

      {/* Mobile drawer */}
      <aside className={`md:hidden fixed inset-y-0 left-0 w-64 bg-slate-900 flex flex-col z-50 transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent onClose={() => setOpen(false)} />
      </aside>
    </>
  );
}
