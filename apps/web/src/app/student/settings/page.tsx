'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAppSelector, useAppDispatch } from '@/store/store';
import { setUser } from '@/store/authSlice';
import apiClient from '@/../lib/api-client';
import { User, Mail, Phone, CheckCircle } from 'lucide-react';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const nameSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
});

const emailOtpSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

const mobileSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type NameForm = z.infer<typeof nameSchema>;
type EmailForm = z.infer<typeof emailOtpSchema>;
type MobileForm = z.infer<typeof mobileSchema>;
type OtpForm = z.infer<typeof otpSchema>;

// ─── Name Section ─────────────────────────────────────────────────────────────

function NameSection() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: { fullName: user?.fullName ?? '' },
  });

  async function onSubmit(data: NameForm) {
    setApiError('');
    try {
      const res = await apiClient.patch('/users/me', { fullName: data.fullName });
      dispatch(setUser({ ...user!, fullName: res.data.full_name }));
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      setApiError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update name');
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User size={18} className="text-[#1a56db]" />
          <div>
            <p className="font-medium text-gray-900">Display Name</p>
            <p className="text-sm text-gray-500">{user?.fullName || '—'}</p>
          </div>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-sm text-[#1a56db] hover:underline">
            Edit
          </button>
        )}
      </div>

      {success && (
        <p className="mt-2 flex items-center gap-1 text-sm text-green-600">
          <CheckCircle size={14} /> Name updated
        </p>
      )}

      {editing && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
          <input
            {...register('fullName')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1a56db]"
            placeholder="Your full name"
          />
          {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
          {apiError && <p className="text-xs text-red-500">{apiError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-[#1a56db] py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Email Section ────────────────────────────────────────────────────────────

function EmailSection() {
  const user = useAppSelector((s) => s.auth.user);
  const [step, setStep] = useState<'idle' | 'enter-email' | 'verify-otp' | 'success'>('idle');
  const [pendingEmail, setPendingEmail] = useState('');
  const [apiError, setApiError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailOtpSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  function startCountdown() {
    setCountdown(300);
    const t = setInterval(() => {
      setCountdown((p) => {
        if (p <= 1) { clearInterval(t); return 0; }
        return p - 1;
      });
    }, 1000);
  }

  async function onSendOtp(data: EmailForm) {
    setApiError('');
    try {
      await apiClient.post('/auth/email/request-otp', { email: data.email });
      setPendingEmail(data.email);
      setStep('verify-otp');
      startCountdown();
    } catch (e: unknown) {
      setApiError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send OTP');
    }
  }

  async function onVerifyOtp(data: OtpForm) {
    setApiError('');
    try {
      await apiClient.patch('/users/me/email', { email: pendingEmail, otp: data.otp });
      setStep('success');
    } catch (e: unknown) {
      setApiError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Invalid OTP');
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail size={18} className="text-[#1a56db]" />
          <div>
            <p className="font-medium text-gray-900">Email Address</p>
            <p className="text-sm text-gray-500">{user?.email ?? 'Not set'}</p>
          </div>
        </div>
        {step === 'idle' && (
          <button onClick={() => setStep('enter-email')} className="text-sm text-[#1a56db] hover:underline">
            Change
          </button>
        )}
      </div>

      {step === 'success' && (
        <p className="mt-3 flex items-center gap-1 text-sm text-green-600">
          <CheckCircle size={14} /> Email updated to {pendingEmail}
        </p>
      )}

      {step === 'enter-email' && (
        <form onSubmit={emailForm.handleSubmit(onSendOtp)} className="mt-4 space-y-3">
          <input
            {...emailForm.register('email')}
            type="email"
            placeholder="New email address"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1a56db]"
          />
          {emailForm.formState.errors.email && (
            <p className="text-xs text-red-500">{emailForm.formState.errors.email.message}</p>
          )}
          {apiError && <p className="text-xs text-red-500">{apiError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={emailForm.formState.isSubmitting}
              className="flex-1 rounded-lg bg-[#1a56db] py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {emailForm.formState.isSubmitting ? 'Sending OTP...' : 'Send OTP'}
            </button>
            <button type="button" onClick={() => setStep('idle')} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">
              Cancel
            </button>
          </div>
        </form>
      )}

      {step === 'verify-otp' && (
        <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="mt-4 space-y-3">
          <p className="text-xs text-gray-500">OTP sent to <span className="font-medium">{pendingEmail}</span></p>
          <input
            {...otpForm.register('otp')}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-mono tracking-widest text-sm outline-none focus:border-[#1a56db]"
          />
          {otpForm.formState.errors.otp && (
            <p className="text-xs text-red-500">{otpForm.formState.errors.otp.message}</p>
          )}
          {apiError && <p className="text-xs text-red-500">{apiError}</p>}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{countdown > 0 ? `Expires in ${formatTime(countdown)}` : 'OTP expired'}</span>
            <button type="button" onClick={() => emailForm.handleSubmit(onSendOtp)()} disabled={countdown > 0} className="text-[#1a56db] disabled:text-gray-400 hover:underline">
              Resend
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={otpForm.formState.isSubmitting}
              className="flex-1 rounded-lg bg-[#1a56db] py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {otpForm.formState.isSubmitting ? 'Verifying...' : 'Verify & Update'}
            </button>
            <button type="button" onClick={() => setStep('idle')} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Mobile Section ───────────────────────────────────────────────────────────

function MobileSection() {
  const user = useAppSelector((s) => s.auth.user);
  const [step, setStep] = useState<'idle' | 'enter-mobile' | 'verify-otp' | 'success'>('idle');
  const [pendingMobile, setPendingMobile] = useState('');
  const [apiError, setApiError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const mobileForm = useForm<MobileForm>({ resolver: zodResolver(mobileSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  function startCountdown() {
    setCountdown(300);
    const t = setInterval(() => {
      setCountdown((p) => {
        if (p <= 1) { clearInterval(t); return 0; }
        return p - 1;
      });
    }, 1000);
  }

  async function onSendOtp(data: MobileForm) {
    setApiError('');
    try {
      await apiClient.post('/auth/otp/request', { mobile: data.mobile });
      setPendingMobile(data.mobile);
      setStep('verify-otp');
      startCountdown();
    } catch (e: unknown) {
      setApiError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send OTP');
    }
  }

  async function onVerifyOtp(data: OtpForm) {
    setApiError('');
    try {
      await apiClient.patch('/users/me/mobile', { mobile: pendingMobile, otp: data.otp });
      setStep('success');
    } catch (e: unknown) {
      setApiError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Invalid OTP');
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Phone size={18} className="text-[#1a56db]" />
          <div>
            <p className="font-medium text-gray-900">Mobile Number</p>
            <p className="text-sm text-gray-500">{user?.mobile ? `+91 ${user.mobile}` : 'Not linked'}</p>
          </div>
        </div>
        {step === 'idle' && (
          <button onClick={() => setStep('enter-mobile')} className="text-sm text-[#1a56db] hover:underline">
            {user?.mobile ? 'Change' : 'Add'}
          </button>
        )}
      </div>

      {step === 'success' && (
        <p className="mt-3 flex items-center gap-1 text-sm text-green-600">
          <CheckCircle size={14} /> Mobile +91 {pendingMobile} linked successfully
        </p>
      )}

      {step === 'enter-mobile' && (
        <form onSubmit={mobileForm.handleSubmit(onSendOtp)} className="mt-4 space-y-3">
          <div className="flex">
            <span className="flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">+91</span>
            <input
              {...mobileForm.register('mobile')}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile number"
              className="flex-1 rounded-r-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1a56db]"
            />
          </div>
          {mobileForm.formState.errors.mobile && (
            <p className="text-xs text-red-500">{mobileForm.formState.errors.mobile.message}</p>
          )}
          {apiError && <p className="text-xs text-red-500">{apiError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={mobileForm.formState.isSubmitting}
              className="flex-1 rounded-lg bg-[#1a56db] py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {mobileForm.formState.isSubmitting ? 'Sending OTP...' : 'Send OTP'}
            </button>
            <button type="button" onClick={() => setStep('idle')} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">
              Cancel
            </button>
          </div>
        </form>
      )}

      {step === 'verify-otp' && (
        <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="mt-4 space-y-3">
          <p className="text-xs text-gray-500">OTP sent to <span className="font-medium">+91 {pendingMobile}</span></p>
          <input
            {...otpForm.register('otp')}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-mono tracking-widest text-sm outline-none focus:border-[#1a56db]"
          />
          {otpForm.formState.errors.otp && (
            <p className="text-xs text-red-500">{otpForm.formState.errors.otp.message}</p>
          )}
          {apiError && <p className="text-xs text-red-500">{apiError}</p>}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{countdown > 0 ? `Expires in ${formatTime(countdown)}` : 'OTP expired'}</span>
            <button type="button" onClick={() => mobileForm.handleSubmit(onSendOtp)()} disabled={countdown > 0} className="text-[#1a56db] disabled:text-gray-400 hover:underline">
              Resend
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={otpForm.formState.isSubmitting}
              className="flex-1 rounded-lg bg-[#1a56db] py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {otpForm.formState.isSubmitting ? 'Verifying...' : 'Verify & Link'}
            </button>
            <button type="button" onClick={() => setStep('idle')} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentSettingsPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <NameSection />
        <EmailSection />
        <MobileSection />
      </div>
    </DashboardLayout>
  );
}
