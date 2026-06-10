import ManagerSidebar from '@/components/manager/ManagerSidebar';
import RoleGuard from '@/components/RoleGuard';

export const metadata = { title: 'MediReferral Manager' };

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard required="manager">
      <div className="flex min-h-screen bg-gray-50">
        <ManagerSidebar />
        <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
          <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold text-gray-900">Manager Portal</h1>
              <p className="text-xs text-gray-400">Team overview &amp; agent management</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Manager</span>
          </header>
          <main className="flex-1 p-5 md:p-6">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
