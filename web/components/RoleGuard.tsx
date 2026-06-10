'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { UserRole } from '@/lib/admin-data';

interface Props {
  required: UserRole;
  redirectTo?: string;
  children: React.ReactNode;
}

const ROLE_HOME: Record<UserRole, string> = {
  agent:   '/dashboard',
  manager: '/manager',
  admin:   '/admin',
};

export default function RoleGuard({ required, redirectTo, children }: Props) {
  const { currentRole } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (currentRole !== required) {
      router.replace(redirectTo ?? ROLE_HOME[currentRole]);
    }
  }, [currentRole, required, redirectTo, router]);

  if (currentRole !== required) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🔒</div>
          <div className="text-sm text-gray-500">Redirecting…</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
