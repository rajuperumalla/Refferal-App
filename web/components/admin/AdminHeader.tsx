'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';

const TITLES: Record<string, { title: string; sub: string }> = {
  '/admin':                    { title: 'Analytics Dashboard',    sub: 'Real-time overview of all agents and revenue' },
  '/admin/agents':             { title: 'Agent Management',       sub: 'Create, manage and monitor all referral agents' },
  '/admin/patients':           { title: 'Patient Overview',       sub: 'All patients across every agent' },
  '/admin/commissions':        { title: 'Commission Control',     sub: 'Approve, reject and disburse commissions' },
  '/admin/hospitals':          { title: 'Hospital Network',       sub: 'Partner hospitals and their performance' },
  '/admin/bank-verifications': { title: 'Bank Verifications',     sub: 'Review and approve agent bank account details' },
  '/admin/settings':           { title: 'System Settings',        sub: 'Configure platform defaults and preferences' },
};

export default function AdminHeader() {
  const path = usePathname();
  const { adminUnreadCount } = useStore();
  const info = TITLES[path] ?? { title: 'Admin', sub: 'MediReferral Admin Portal' };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 pl-14 md:pl-6 sticky top-0 z-30">
      <div>
        <h1 className="text-base font-bold text-gray-900 leading-tight">{info.title}</h1>
        <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{info.sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-400 w-48">
          <span>🔍</span><span>Search…</span>
        </div>
        <Link href="/admin/bank-verifications" className="relative w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors">
          <span className="text-lg">🔔</span>
          {adminUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
              {adminUnreadCount > 9 ? '9+' : adminUnreadCount}
            </span>
          )}
        </Link>
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-indigo-700 transition-colors">A</div>
      </div>
    </header>
  );
}
