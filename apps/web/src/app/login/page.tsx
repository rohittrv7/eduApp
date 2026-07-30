'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import apiClient, { tokenStorage } from '@/../lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

// ─── Schemas ──────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1a56db] border-t-transparent" />
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnUrl = searchParams.get('returnUrl') || '';
  const returnUrl = rawReturnUrl ? decodeURIComponent(rawReturnUrl) : '';
  const message = searchParams.get('message');
  const { setUser } = useAuthStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // ─── Handlers ────────────────────────────────────────────────────────────────

  async function onLogin(data: LoginForm) {
    setSubmitting(true);
    setApiError('');
    try {
      const res = await apiClient.post('/auth/login', {
        email: data.email,
        password: data.password,
      });
      const { isNewUser, accessToken, refreshToken } = res.data;
      if (accessToken) {
        tokenStorage.setAccess(accessToken);
        if (refreshToken) tokenStorage.setRefresh(refreshToken);
      }
      await fetchAndSetUser(isNewUser);
    } catch (err: any) {
      setApiError(err?.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onRegister(data: RegisterForm) {
    setSubmitting(true);
    setApiError('');
    try {
      const res = await apiClient.post('/auth/register', {
        email: data.email,
        password: data.password,
        full_name: data.fullName,
      });
      const { isNewUser, accessToken, refreshToken } = res.data;
      if (accessToken) {
        tokenStorage.setAccess(accessToken);
        if (refreshToken) tokenStorage.setRefresh(refreshToken);
      }
      await fetchAndSetUser(isNewUser);
    } catch (err: any) {
      setApiError(err?.response?.data?.message || 'Registration failed. An account with this email may already exist.');
    } finally {
      setSubmitting(false);
    }
  }

  async function fetchAndSetUser(isNewUser: boolean) {
    let userRole: string | undefined;
    try {
      const meRes = await apiClient.get('/users/me');
      const user = meRes.data;
      if (user) {
        setUser({
          id: user.id,
          fullName: user.full_name || '',
          email: user.email || undefined,
          mobile: user.mobile || undefined,
          role: user.role,
          photo: user.profile_photo,
        });
        userRole = user.role;
      }
    } catch { /* proceed anyway */ }

    if (isNewUser) router.push('/onboarding');
    else router.push(returnUrl || getDashboardUrl(userRole));
  }

  function handleGoogleLogin() {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');
    window.location.href = `${apiUrl}/auth/google`;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-extrabold text-[#1a56db]">allEdu</Link>
          <p className="mt-1 text-sm text-gray-500">Learn from India&apos;s Best Teachers</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border">
          {message === 'session_expired' && (
            <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs font-medium text-amber-800 flex items-start gap-2">
              <span className="text-base">⚠️</span>
              <span>Your session expired or your account was logged in from another device. Please log in again.</span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => { setMode('signin'); setApiError(''); }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                mode === 'signin'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setApiError(''); }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {mode === 'signin' ? (
            /* Sign In Form */
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  placeholder="name@domain.com"
                  {...loginForm.register('email')}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-500">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...loginForm.register('password')}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-500">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              {apiError && <p className="text-xs font-medium text-red-500">{apiError}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#1a56db] py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            /* Create Account Form */
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  placeholder="Rahul Kumar"
                  {...registerForm.register('fullName')}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
                />
                {registerForm.formState.errors.fullName && (
                  <p className="mt-1 text-xs text-red-500">{registerForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  placeholder="name@domain.com"
                  {...registerForm.register('email')}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
                />
                {registerForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-500">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  {...registerForm.register('password')}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
                />
                {registerForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-500">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              {apiError && <p className="text-xs font-medium text-red-500">{apiError}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#1a56db] py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {submitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs font-medium text-gray-400">or</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-[#1a56db] hover:underline">Terms</Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-[#1a56db] hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

function getDashboardUrl(role?: string): string {
  switch (role) {
    case 'teacher': return '/teacher/dashboard';
    case 'admin': return '/admin/dashboard';
    default: return '/student/dashboard';
  }
}
