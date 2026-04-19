'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import apiClient from '@/../lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

// ─── Config from env ──────────────────────────────────────────────────────────
// LOGIN_IDENTIFIER controls whether the user enters email or mobile
const LOGIN_IDENTIFIER = process.env.NEXT_PUBLIC_LOGIN_IDENTIFIER || 'email';
const isEmailMode = LOGIN_IDENTIFIER === 'email';

// ─── Schemas ──────────────────────────────────────────────────────────────────
const emailSchema = z.object({
  identifier: z.string().email('Enter a valid email address'),
});

const mobileSchema = z.object({
  identifier: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
});

type IdentifierForm = z.infer<typeof emailSchema>;
type OtpForm = z.infer<typeof otpSchema>;

const OTP_EXPIRY_SECS = 5 * 60;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1a56db] border-t-transparent" /></div>}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Decode returnUrl — middleware passes it without encodeURIComponent now
  const rawReturnUrl = searchParams.get('returnUrl') || '';
  const returnUrl = rawReturnUrl ? decodeURIComponent(rawReturnUrl) : '';
  const message = searchParams.get('message');
  const { setUser } = useAuthStore();

  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Firebase phone auth refs (only used when LOGIN_IDENTIFIER=mobile)
  const confirmationRef = useRef<any>(null);
  const recaptchaRef = useRef<any>(null);

  const identifierForm = useForm<IdentifierForm>({
    resolver: zodResolver(isEmailMode ? emailSchema : mobileSchema),
  });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recaptchaRef.current) {
        recaptchaRef.current.clear?.();
        recaptchaRef.current = null;
      }
    };
  }, []);

  function startCountdown() {
    setCountdown(OTP_EXPIRY_SECS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  function formatCountdown(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // ─── Email OTP flow ──────────────────────────────────────────────────────────

  async function onSendEmailOtp(data: IdentifierForm) {
    setSubmitting(true);
    setApiError('');
    try {
      await apiClient.post('/auth/email/request-otp', { email: data.identifier });
      setIdentifier(data.identifier);
      setStep('otp');
      startCountdown();
    } catch (err: any) {
      setApiError(err?.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerifyEmailOtp(data: OtpForm) {
    setSubmitting(true);
    setApiError('');
    try {
      const res = await apiClient.post('/auth/email/verify-otp', { email: identifier, otp: data.otp });
      const { isNewUser, accessToken, refreshToken } = res.data;
      // Store tokens for cross-origin auth (Vercel frontend + Render backend)
      if (accessToken) {
        const { tokenStorage } = await import('@/../lib/api-client');
        tokenStorage.setAccess(accessToken);
        if (refreshToken) tokenStorage.setRefresh(refreshToken);
      }
      await fetchAndSetUser(isNewUser);
    } catch (err: any) {
      const msg = err?.response?.data?.message || '';
      if (msg.includes('expired') || msg.includes('not requested')) {
        setApiError('OTP expired. Please request a new one.');
        setStep('identifier');
      } else if (msg.includes('Invalid OTP')) {
        setApiError('Incorrect OTP. Please try again.');
      } else {
        setApiError(msg || 'Verification failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendEmailOtp() {
    if (countdown > 0) return;
    setApiError('');
    setSubmitting(true);
    try {
      await apiClient.post('/auth/email/request-otp', { email: identifier });
      startCountdown();
      otpForm.reset();
    } catch (err: any) {
      setApiError(err?.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Firebase Phone Auth flow ─────────────────────────────────────────────

  async function onSendPhoneOtp(data: IdentifierForm) {
    setSubmitting(true);
    setApiError('');
    try {
      // Dynamically import Firebase to avoid loading it in email mode
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');

      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      const confirmation = await signInWithPhoneNumber(auth, `+91${data.identifier}`, recaptchaRef.current);
      confirmationRef.current = confirmation;
      setIdentifier(data.identifier);
      setStep('otp');
      startCountdown();
    } catch (err: any) {
      if (recaptchaRef.current) { recaptchaRef.current.clear?.(); recaptchaRef.current = null; }
      const code = err?.code as string | undefined;
      if (code === 'auth/invalid-phone-number') setApiError('Invalid phone number.');
      else if (code === 'auth/too-many-requests') setApiError('Too many attempts. Try again later.');
      else setApiError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerifyPhoneOtp(data: OtpForm) {
    if (!confirmationRef.current) {
      setApiError('Session expired. Please request OTP again.');
      setStep('identifier');
      return;
    }
    setSubmitting(true);
    setApiError('');
    try {
      const result = await confirmationRef.current.confirm(data.otp);
      const idToken = await result.user.getIdToken();
      const res = await apiClient.post('/auth/firebase/verify', { idToken });
      const { isNewUser, accessToken, refreshToken } = res.data;
      if (accessToken) {
        const { tokenStorage } = await import('@/../lib/api-client');
        tokenStorage.setAccess(accessToken);
        if (refreshToken) tokenStorage.setRefresh(refreshToken);
      }
      await fetchAndSetUser(isNewUser);
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === 'auth/invalid-verification-code') setApiError('Incorrect OTP. Please try again.');
      else if (code === 'auth/code-expired') { setApiError('OTP expired. Please request a new one.'); setStep('identifier'); }
      else setApiError(err?.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendPhoneOtp() {
    if (countdown > 0) return;
    setApiError('');
    if (recaptchaRef.current) { recaptchaRef.current.clear?.(); recaptchaRef.current = null; }
    try {
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      const confirmation = await signInWithPhoneNumber(auth, `+91${identifier}`, recaptchaRef.current);
      confirmationRef.current = confirmation;
      startCountdown();
      otpForm.reset();
    } catch (err: any) {
      if (recaptchaRef.current) { recaptchaRef.current.clear?.(); recaptchaRef.current = null; }
      setApiError(err?.message || 'Failed to resend OTP.');
    }
  }

  // ─── Shared helpers ───────────────────────────────────────────────────────

  async function fetchAndSetUser(isNewUser: boolean) {
    let userRole: string | undefined;
    try {
      const meRes = await apiClient.get('/users/me');
      const user = meRes.data;
      if (user) {
        setUser({ id: user.id, fullName: user.full_name || '', role: user.role, photo: user.profile_photo });
        userRole = user.role;
      }
    } catch { /* proceed anyway */ }

    if (isNewUser) router.push('/onboarding');
    else router.push(returnUrl || getDashboardUrl(userRole));
  }

  function handleGoogleLogin() {
    // NEXT_PUBLIC_API_URL already includes /api/v1 (e.g. http://localhost:3001/api/v1)
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').replace(/\/+$/, '');
    window.location.href = `${apiUrl}/auth/google`;
  }

  const onSendOtp = isEmailMode ? onSendEmailOtp : onSendPhoneOtp;
  const onVerifyOtp = isEmailMode ? onVerifyEmailOtp : onVerifyPhoneOtp;
  const handleResendOtp = isEmailMode ? handleResendEmailOtp : handleResendPhoneOtp;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      {/* reCAPTCHA container — only used in phone mode */}
      <div id="recaptcha-container" />

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-[#1a56db]">allEdu</Link>
          <p className="mt-1 text-sm text-gray-500">Learn from India&apos;s Best Teachers</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border">
          {message === 'session_expired' && (
            <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
              Your session expired. Please log in again.
            </div>
          )}

          {step === 'identifier' ? (
            <>
              <h1 className="text-xl font-bold text-gray-900">Login / Sign Up</h1>
              <p className="mt-1 text-sm text-gray-500">
                {isEmailMode ? 'Enter your email to continue' : 'Enter your mobile number to continue'}
              </p>

              <form onSubmit={identifierForm.handleSubmit(onSendOtp)} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {isEmailMode ? 'Email Address' : 'Mobile Number'}
                  </label>
                  {isEmailMode ? (
                    <input
                      type="email"
                      inputMode="email"
                      placeholder="you@example.com"
                      {...identifierForm.register('identifier')}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
                    />
                  ) : (
                    <div className="flex">
                      <span className="flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">+91</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="9876543210"
                        {...identifierForm.register('identifier')}
                        className="flex-1 rounded-r-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
                      />
                    </div>
                  )}
                  {identifierForm.formState.errors.identifier && (
                    <p className="mt-1 text-xs text-red-500">{identifierForm.formState.errors.identifier.message}</p>
                  )}
                </div>

                {apiError && <p className="text-xs text-red-500">{apiError}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#1a56db] py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {submitting ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              <button
                onClick={handleGoogleLogin}
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => { setStep('identifier'); setApiError(''); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >←</button>
                <h1 className="text-xl font-bold text-gray-900">Enter OTP</h1>
              </div>
              <p className="text-sm text-gray-500">
                We sent a 6-digit OTP to{' '}
                <span className="font-medium text-gray-700">
                  {isEmailMode ? identifier : `+91 ${identifier}`}
                </span>
              </p>

              <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    autoComplete="one-time-code"
                    {...otpForm.register('otp')}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xl font-mono tracking-widest outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="mt-1 text-xs text-red-500">{otpForm.formState.errors.otp.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {countdown > 0 ? (
                      <>OTP expires in <span className="font-mono font-semibold text-gray-700">{formatCountdown(countdown)}</span></>
                    ) : (
                      <span className="text-red-500">OTP expired</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || submitting}
                    className="font-medium text-[#1a56db] disabled:text-gray-400 disabled:cursor-not-allowed hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>

                {apiError && <p className="text-xs text-red-500">{apiError}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#1a56db] py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {submitting ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            </>
          )}
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
