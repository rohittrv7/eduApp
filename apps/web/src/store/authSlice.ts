import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'student' | 'teacher' | 'admin';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  id: string;
  fullName: string;
  email?: string;
  mobile?: string;
  role: UserRole;
  photo?: string;
  skillLevel?: SkillLevel;
  streakCount?: number;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: true, // true until AuthInitializer fetches /users/me
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserProfile>) {
      state.user = action.payload;
    },
    clearUser(state) {
      state.user = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setUser, clearUser, setLoading } = authSlice.actions;
export default authSlice.reducer;
