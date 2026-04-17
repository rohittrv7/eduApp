'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  useCreateVideoMutation,
  useGetTeacherBatchesQuery,
  useGetTeacherSubjectsQuery,
  useGetChaptersBySubjectQuery,
} from '@/store/teacherApi';

/** Validates YouTube video URL (Req 19.2) */
const YOUTUBE_URL_REGEX =
  /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]{11}/;

const schema = z.object({
  youtubeUrl: z
    .string()
    .min(1, 'YouTube URL is required')
    .regex(YOUTUBE_URL_REGEX, 'Enter a valid YouTube video URL (e.g. youtube.com/watch?v=...)'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  thumbnail: z.string().url('Enter a valid thumbnail URL').optional().or(z.literal('')),
  batchId: z.string().min(1, 'Please select a batch'),
  subjectId: z.string().optional(),
  chapterId: z.string().optional(),
  language: z.enum(['hindi', 'english', 'hinglish']).default('hindi'),
});

type FormValues = z.infer<typeof schema>;

/**
 * Teacher video upload form.
 * - Fields: YouTube URL, title, description, thumbnail, batch, subject tag, chapter assignment
 * - Validates YouTube URL; shows descriptive error on invalid (Req 19.2)
 * - On submit: creates recorded video entry (Req 19.1)
 * Requirements: 19.1, 19.2
 */
export default function NewVideoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBatchId = searchParams.get('batchId') ?? '';
  const [serverError, setServerError] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const { data: batchesRaw } = useGetTeacherBatchesQuery();
  const { data: subjects = [] } = useGetTeacherSubjectsQuery();
  const { data: chapters = [] } = useGetChaptersBySubjectQuery(selectedSubjectId, {
    skip: !selectedSubjectId,
  });
  const [createVideo, { isLoading }] = useCreateVideoMutation();

  const batches = Array.isArray(batchesRaw) ? batchesRaw : [];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Pre-select batch if batchId query param is present
  useEffect(() => {
    if (preselectedBatchId) {
      setValue('batchId', preselectedBatchId);
    }
  }, [preselectedBatchId, setValue]);

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    try {
      await createVideo({
        youtube_url: values.youtubeUrl,
        title: values.title,
        description: values.description,
        thumbnail: values.thumbnail || undefined,
        batch_id: values.batchId,
        chapter_id: values.chapterId || undefined,
        language: values.language,
      }).unwrap();
      // If came from batch detail page, go back there
      if (preselectedBatchId) {
        router.push(`/teacher/batches/${preselectedBatchId}`);
      } else {
        router.push('/teacher/dashboard');
      }
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to add video. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Add Recorded Video</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a YouTube video to your batch content library.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">

          {/* YouTube URL */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              YouTube Video URL <span className="text-red-500">*</span>
            </label>
            <input
              {...register('youtubeUrl')}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            />
            {errors.youtubeUrl && (
              <p className="mt-1 text-xs text-red-600">{errors.youtubeUrl.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Accepted: youtube.com/watch?v=..., youtube.com/embed/..., youtu.be/...
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              placeholder="e.g. Introduction to Algebra"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="What does this video cover?"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            />
          </div>

          {/* Thumbnail URL */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Thumbnail URL</label>
            <input
              {...register('thumbnail')}
              placeholder="https://... (optional)"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            />
            {errors.thumbnail && (
              <p className="mt-1 text-xs text-red-600">{errors.thumbnail.message}</p>
            )}
          </div>

          {/* Batch */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Batch <span className="text-red-500">*</span>
            </label>
            <select
              {...register('batchId')}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            >
              <option value="">Select a batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {errors.batchId && <p className="mt-1 text-xs text-red-600">{errors.batchId.message}</p>}
          </div>

          {/* Subject tag */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Subject Tag</label>
            <select
              {...register('subjectId')}
              onChange={(e) => {
                setValue('subjectId', e.target.value);
                setValue('chapterId', '');
                setSelectedSubjectId(e.target.value);
              }}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            >
              <option value="">Select a subject (optional)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter assignment */}
          {selectedSubjectId && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Chapter</label>
              <select
                {...register('chapterId')}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
              >
                <option value="">Select a chapter (optional)</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Language */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Language</label>
            <select
              {...register('language')}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            >
              <option value="hindi">Hindi</option>
              <option value="english">English</option>
              <option value="hinglish">Hinglish</option>
            </select>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-lg bg-[#1a56db] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Video'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
