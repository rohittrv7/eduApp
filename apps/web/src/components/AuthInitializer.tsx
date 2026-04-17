'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { setUser, clearUser, setLoading } from '@/store/authSlice';
import apiClient from '@/../lib/api-client';

export function AuthInitializer() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    dispatch(setLoading(true));

    apiClient
      .get('/users/me')
      .then((r) => {
        const u = r.data;
        dispatch(
          setUser({
            id: u.id,
            fullName: u.full_name ?? '',
            email: u.email ?? undefined,
            mobile:
              u.mobile?.startsWith('email_') || u.mobile?.startsWith('google_')
                ? undefined
                : u.mobile,
            role: u.role,
            photo: u.profile_photo ?? undefined,
            skillLevel: u.skill_level ?? undefined,
            streakCount: u.streak_count ?? 0,
          }),
        );
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          dispatch(clearUser());
        }
      })
      .finally(() => {
        dispatch(setLoading(false));
      });
  }, [dispatch]);

  return null;
}
