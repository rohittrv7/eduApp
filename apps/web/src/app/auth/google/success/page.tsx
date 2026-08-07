'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import apiClient, { tokenStorage } from '@/../lib/api-client';

/**
 * Handles both:
 *  - POST body form submission (new secure flow — tokens never in URL)
 *  - GET query params (fallback for old links — immediately cleaned from URL)
 */
function GoogleSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    // Tokens come via POST body (hidden form) — read from sessionStorage staging area
    // The form POST causes a page load; we read what the server embedded
    // Fallback: still handle URL params (old clients) but strip immediately
    const accessToken =
      (typeof window !== 'undefined' && sessionStorage.getItem('_ga_token')) ||
      searchParams.get('access_token');
    const refreshToken =
      (typeof window !== 'undefined' && sessionStorage.getItem('_gr_token')) ||
      searchParams.get('refresh_token');
    const redirect = searchParams.get('redirect') || '/student/dashboard';

    // Clear URL params immediately to prevent tokens staying in history
    if (searchParams.get('access_token') || searchParams.get('refresh_token')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('_ga_token');
      sessionStorage.removeItem('_gr_token');
    }

    if (accessToken) tokenStorage.setAccess(accessToken);
    if (refreshToken) tokenStorage.setRefresh(refreshToken);

    const token = accessToken || tokenStorage.getAccess();
    if (!token) {
      router.replace('/login?message=google_failed');
      return;
    }

    apiClient
      .get('/users/me', { headers: { Authorization: `Bearer ${token}` } })
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
        tokenStorage.clear();
        router.replace('/login?message=google_failed');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-900">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      }
    >
      <GoogleSuccessInner />
    </Suspense>
  );
}
