'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'teacher' && user.role !== 'admin') {
      router.replace(`/${user.role}/dashboard`);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1a56db] border-t-transparent" />
      </div>
    );
  }

  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) return null;

  return <>{children}</>;
}
