'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import apiClient from '@/../lib/api-client';

function GoogleSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/student/dashboard';
  const { setUser } = useAuthStore();

  useEffect(() => {
    apiClient.get('/users/me')
      .then((r) => {
        const u = r.data;
        setUser({
          id: u.id,
          fullName: u.full_name ?? '',
          email: u.email ?? undefined,
          mobile: u.mobile?.startsWith('google_') ? undefined : u.mobile,
          role: u.role,
          photo: u.profile_photo ?? undefined,
          skillLevel: u.skill_level ?? undefined,
          streakCount: u.streak_count ?? 0,
        });
        router.replace(redirect);
      })
      .catch(() => {
        router.replace('/login?message=google_failed');
      });
  }, [redirect, router, setUser]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center gap-3 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-400">Signing you in...</p>
      </div>
    </div>
  );
}

export default function GoogleSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    }>
      <GoogleSuccessInner />
    </Suspense>
  );
}
