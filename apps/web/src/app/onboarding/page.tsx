'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import apiClient from '@/../lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

const onboardingSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  grade: z.enum(['9th', '10th', '11th', '12th', 'Dropper', 'Graduate'], {
    required_error: 'Please select your class/grade',
  }),
  targetExam: z.enum(['JEE', 'NEET', 'UPSC', 'SSC', 'Other'], {
    required_error: 'Please select your target exam',
  }),
  preferredLanguage: z.enum(['Hindi', 'English'], {
    required_error: 'Please select your preferred language',
  }),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

const GRADES = ['9th', '10th', '11th', '12th', 'Dropper', 'Graduate'] as const;
const EXAMS = ['JEE', 'NEET', 'UPSC', 'SSC', 'Other'] as const;
const LANGUAGES = ['Hindi', 'English'] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { setUser, user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: user?.fullName || '',
    },
  });

  async function onSubmit(data: OnboardingForm) {
    setSubmitting(true);
    setApiError('');
    try {
      const res = await apiClient.patch('/users/me', {
        fullName: data.fullName,
        classGrade: data.grade,
        targetExam: data.targetExam,
        languagePref: data.preferredLanguage.toLowerCase(),
      });

      const updatedUser = res.data;
      if (updatedUser) {
        setUser({
          id: updatedUser.id,
          fullName: updatedUser.fullName,
          role: updatedUser.role,
          photo: updatedUser.photo,
        });
      }

      router.push('/student/dashboard');
    } catch (err: unknown) {
      setApiError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to save your details. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-[#1a56db]">
            allEdu
          </Link>
          <h1 className="mt-4 text-xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            Help us personalize your learning experience
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                {...register('fullName')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
              )}
            </div>

            {/* Class / Grade */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Class / Grade <span className="text-red-500">*</span>
              </label>
              <select
                {...register('grade')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] bg-white"
              >
                <option value="">Select your class</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              {errors.grade && (
                <p className="mt-1 text-xs text-red-500">{errors.grade.message}</p>
              )}
            </div>

            {/* Target Exam */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Target Exam <span className="text-red-500">*</span>
              </label>
              <select
                {...register('targetExam')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db] bg-white"
              >
                <option value="">Select your target exam</option>
                {EXAMS.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
              {errors.targetExam && (
                <p className="mt-1 text-xs text-red-500">{errors.targetExam.message}</p>
              )}
            </div>

            {/* Preferred Language */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Preferred Language <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                {LANGUAGES.map((lang) => (
                  <label key={lang} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      value={lang}
                      {...register('preferredLanguage')}
                      className="accent-[#1a56db]"
                    />
                    {lang}
                  </label>
                ))}
              </div>
              {errors.preferredLanguage && (
                <p className="mt-1 text-xs text-red-500">{errors.preferredLanguage.message}</p>
              )}
            </div>

            {apiError && (
              <p className="text-xs text-red-500">{apiError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#1a56db] py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Saving...' : 'Start Learning →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
