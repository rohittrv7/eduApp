'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/store';
import { setUser as setReduxUser, clearUser as clearReduxUser, setLoading } from '@/store/authSlice';
import { useAuthStore } from '@/stores/auth.store';
import apiClient, { tokenStorage } from '@/../lib/api-client';

export function AuthInitializer() {
  const { setUser: setAuthUser, clearUser: clearAuthUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const storedToken = tokenStorage.getAccess();
    if (!storedToken) {
      clearAuthUser();
      return;
    }
    tokenStorage.setAccess(storedToken);

    apiClient
      .get('/users/me')
      .then((r) => {
        const u = r.data;
        const userData = {
          id: u.id,
          fullName: u.full_name ?? u.email?.split('@')[0] ?? 'User',
          email: u.email ?? undefined,
          mobile:
            u.mobile?.startsWith('email_') || u.mobile?.startsWith('google_') || u.mobile?.startsWith('admin_')
              ? undefined
              : u.mobile,
          role: u.role,
          photo: u.profile_photo ?? undefined,
          skillLevel: u.skill_level ?? undefined,
          streakCount: u.streak_count ?? 0,
        };

        // Sync to auth store
        setAuthUser(userData);

        // Auto-redirect if role in DB changed (e.g. student promoted to admin/teacher)
        if (u.role === 'admin' && (pathname.startsWith('/student') || pathname === '/login')) {
          router.replace('/admin/dashboard');
        } else if (u.role === 'teacher' && (pathname.startsWith('/student') || pathname === '/login')) {
          router.replace('/teacher/dashboard');
        }
      })
      .catch(() => {
        clearAuthUser();
        tokenStorage.clear();
      });
  }, [pathname, router, setAuthUser, clearAuthUser]);

  return null;
}
