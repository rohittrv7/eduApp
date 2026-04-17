'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import apiClient from '@/../lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

const mobileSchema = z.object({
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
});

type MobileForm = z.infer<typeof mobileSchema>;
type OtpForm = z.infer<typeof otpSchema>;

const OTP_EXPIRY_SECS = 5 * 60;

export default function LinkMobilePage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mobileForm = useForm<MobileForm>({ resolver: zodResolver(mobileSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCountdown() {
    setCountdown(OTP_EXPIRY_SECS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function formatCountdown(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  async function onSendOtp(data: MobileForm) {
    setSubmitting(true);
    setApiError('');
    try {
      await apiClient.post('/auth/otp/request', { mobile: data.mobile });
      setMobile(data.mobile);
      setStep('otp');
      startCountdown();
    } catch (err: unknown) {
      setApiError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to send OTP. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerifyOtp(data: OtpForm) {
    setSubmitting(true);
    setApiError('');
    try {
      const res = await apiClient.post('/auth/google/link-mobile', {
        mobile,
        otp: data.otp,
      });

      const { user } = res.data;
      if (user) {
        setUser({
          id: user.id,
          fullName: user.fullName || '',
          role: user.role,
          photo: user.photo,
        });
      }

      router.push('/student/dashboard');
    } catch (err: unknown) {
      setApiError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Invalid or expired OTP. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendOtp() {
    if (countdown > 0) return;
    setApiError('');
    try {
      await apiClient.post('/auth/otp/request', { mobile });
      startCountdown();
      otpForm.reset();
    } catch (err: unknown) {
      setApiError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to resend OTP.'
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-[#1a56db]">
            allEdu
          </Link>
          <h1 className="mt-4 text-xl font-bold text-gray-900">Link Your Mobile Number</h1>
          <p className="mt-1 text-sm text-gray-500">
            One last step — link your mobile number to complete sign up
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border">
          {step === 'mobile' ? (
            <form onSubmit={mobileForm.handleSubmit(onSendOtp)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Mobile Number
                </label>
                <div className="flex">
                  <span className="flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210"
                    {...mobileForm.register('mobile')}
                    className="flex-1 rounded-r-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
                  />
                </div>
                {mobileForm.formState.errors.mobile && (
                  <p className="mt-1 text-xs text-red-500">
                    {mobileForm.formState.errors.mobile.message}
                  </p>
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
          ) : (
            <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => { setStep('mobile'); setApiError(''); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ←
                </button>
                <p className="text-sm text-gray-600">
                  OTP sent to <span className="font-medium text-gray-800">+91 {mobile}</span>
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  {...otpForm.register('otp')}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xl font-mono tracking-widest outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
                />
                {otpForm.formState.errors.otp && (
                  <p className="mt-1 text-xs text-red-500">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {countdown > 0 ? (
                    <>Expires in <span className="font-mono font-semibold">{formatCountdown(countdown)}</span></>
                  ) : (
                    <span className="text-red-500">OTP expired</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0}
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
                {submitting ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
