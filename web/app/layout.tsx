import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MediReferral — Partner Portal',
  description: 'Manage patient referrals, track surgeries, and monitor commissions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-gray-50">{children}</body>
    </html>
  );
}
