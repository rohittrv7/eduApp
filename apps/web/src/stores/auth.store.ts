/**
 * Backward-compatibility shim.
 * Existing imports of `useAuthStore` continue to work by delegating to Redux.
 */
import { useAppDispatch, useAppSelector } from '@/store/store';
import { setUser, clearUser, setLoading } from '@/store/authSlice';
import { baseApi } from '@/store/api';

export type { UserRole, SkillLevel, UserProfile } from '@/store/authSlice';

export function useAuthStore() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  return {
    user,
    isLoading,
    setUser: (u: Parameters<typeof setUser>[0]) => dispatch(setUser(u)),
    clearUser: () => {
      dispatch(clearUser());
      dispatch(baseApi.util.resetApiState());
    },
    setLoading: (loading: boolean) => dispatch(setLoading(loading)),
  };
}
