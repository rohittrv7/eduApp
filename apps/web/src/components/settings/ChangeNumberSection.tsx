'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/../lib/api-client';

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

type Step =
  | 'idle'
  | 'verify-current-otp-sent'
  | 'verify-current-otp'
  | 'new-number'
  | 'verify-new-otp-sent'
  | 'verify-new-otp'
  | 'success';

const OTP_EXPIRY_SECS = 5 * 60;

export function ChangeNumberSection() {
  const [step, setStep] = useState<Step>('idle');
  const [newMobile, setNewMobile] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentOtpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });
  const newMobileForm = useForm<MobileForm>({ resolver: zodResolver(mobileSchema) });
  const newOtpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

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

  // Step 1: Request OTP for current number
  async function handleRequestCurrentOtp() {
    setSubmitting(true);
    setApiError('');
    try {
      await apiClient.post('/auth/otp/request-current');
      setStep('verify-current-otp-sent');
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

  // Step 2: Verify current number OTP
  async function onVerifyCurrentOtp(data: OtpForm) {
    setSubmitting(true);
    setApiError('');
    try {
      await apiClient.post('/auth/otp/verify-current', { otp: data.otp });
      setStep('new-number');
      currentOtpForm.reset();
    } catch (err: unknown) {
      setApiError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Invalid or expired OTP.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Step 3: Send OTP to new number
  async function onSendNewOtp(data: MobileForm) {
    setSubmitting(true);
    setApiError('');
    try {
      await apiClient.post('/auth/otp/request', { mobile: data.mobile });
      setNewMobile(data.mobile);
      setStep('verify-new-otp-sent');
      startCountdown();
    } catch (err: unknown) {
      setApiError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to send OTP to new number.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Step 4: Verify new number OTP and update
  async function onVerifyNewOtp(data: OtpForm) {
    setSubmitting(true);
    setApiError('');
    try {
      await apiClient.patch('/users/me/mobile', { mobile: newMobile, otp: data.otp });
      setStep('success');
    } catch (err: unknown) {
      setApiError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to update mobile number.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep('idle');
    setNewMobile('');
    setApiError('');
    currentOtpForm.reset();
    newMobileForm.reset();
    newOtpForm.reset();
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">Mobile Number</h3>
          <p className="mt-0.5 text-sm text-gray-500">Change your registered mobile number</p>
        </div>
        {step === 'idle' && (
          <button
            onClick={handleRequestCurrentOtp}
            disabled={submitting}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {submitting ? 'Sending...' : 'Change Number'}
          </button>
        )}
      </div>

      {apiError && (
        <p className="mt-2 text-xs text-red-500">{apiError}</p>
      )}

      {/* Step: Verify current number OTP */}
      {(step === 'verify-current-otp-sent') && (
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="mb-3 text-sm font-medium text-gray-800">
            Step 1 of 2: Verify your current number
          </p>
          <p className="mb-3 text-xs text-gray-600">
            We sent an OTP to your registered mobile number.
          </p>
          <form onSubmit={currentOtpForm.handleSubmit(onVerifyCurrentOtp)} className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              {...currentOtpForm.register('otp')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-mono tracking-widest text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            />
            {currentOtpForm.formState.errors.otp && (
              <p className="text-xs text-red-500">{currentOtpForm.formState.errors.otp.message}</p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {countdown > 0 ? `Expires in ${formatCountdown(countdown)}` : 'OTP expired'}
              </span>
              <button
                type="button"
                onClick={handleRequestCurrentOtp}
                disabled={countdown > 0}
                className="text-[#1a56db] disabled:text-gray-400 hover:underline"
              >
                Resend
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-[#1a56db] py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step: Enter new number */}
      {step === 'new-number' && (
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="mb-3 text-sm font-medium text-gray-800">
            Step 2 of 2: Enter your new mobile number
          </p>
          <form onSubmit={newMobileForm.handleSubmit(onSendNewOtp)} className="space-y-3">
            <div className="flex">
              <span className="flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-white px-3 text-sm text-gray-500">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="New mobile number"
                {...newMobileForm.register('mobile')}
                className="flex-1 rounded-r-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
              />
            </div>
            {newMobileForm.formState.errors.mobile && (
              <p className="text-xs text-red-500">{newMobileForm.formState.errors.mobile.message}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-[#1a56db] py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? 'Sending OTP...' : 'Send OTP'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step: Verify new number OTP */}
      {step === 'verify-new-otp-sent' && (
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="mb-1 text-sm font-medium text-gray-800">Verify new number</p>
          <p className="mb-3 text-xs text-gray-600">
            OTP sent to <span className="font-medium">+91 {newMobile}</span>
          </p>
          <form onSubmit={newOtpForm.handleSubmit(onVerifyNewOtp)} className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              {...newOtpForm.register('otp')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-mono tracking-widest text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            />
            {newOtpForm.formState.errors.otp && (
              <p className="text-xs text-red-500">{newOtpForm.formState.errors.otp.message}</p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {countdown > 0 ? `Expires in ${formatCountdown(countdown)}` : 'OTP expired'}
              </span>
              <button
                type="button"
                onClick={async () => { await onSendNewOtp({ mobile: newMobile }); }}
                disabled={countdown > 0}
                className="text-[#1a56db] disabled:text-gray-400 hover:underline"
              >
                Resend
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-[#1a56db] py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? 'Updating...' : 'Update Number'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success */}
      {step === 'success' && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">
            ✓ Mobile number updated successfully to +91 {newMobile}
          </p>
          <button
            onClick={reset}
            className="mt-2 text-xs text-green-700 hover:underline"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
