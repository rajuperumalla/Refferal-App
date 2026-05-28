import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export const metadata = { title: 'MediReferral Admin' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-5 md:p-6">{children}</main>
      </div>
    </div>
  );
}
