'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/patients':      'My Patients',
  '/add-patient':   'Add Patient Lead',
  '/earnings':      'Commissions & Earnings',
  '/notifications': 'Notifications',
  '/profile':       'Profile & Settings',
};

export default function Header() {
  const path = usePathname();
  const { unreadCount, currentAgent } = useStore();
  const title = PAGE_TITLES[path] ?? (path.startsWith('/patients/') ? 'Patient Details' : 'MediReferral');

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-6 pl-14 md:pl-6 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-400 -mt-0.5">Mediciti Healthcare Partner Portal</p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/add-patient"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <span className="text-base">+</span> Add Patient
        </Link>
        <Link href="/notifications" className="relative w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <span className="text-lg">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full text-white text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>
          )}
        </Link>
        <Link href="/admin"
          className="hidden sm:flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-colors border border-indigo-100">
          🛡️ Admin
        </Link>
        <Link href="/profile" className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm hover:bg-blue-700 transition-colors">
          {currentAgent?.name[0] ?? 'R'}
        </Link>
      </div>
    </header>
  );
}
