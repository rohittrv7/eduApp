'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImageIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  useCreateLiveClassMutation,
  useGetTeacherBatchesQuery,
  useGetTeacherBatchDetailQuery,
  useGetChaptersBySubjectQuery,
  type Batch,
} from '@/store/teacherApi';

const YOUTUBE_URL_REGEX =
  /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|live\/|embed\/|shorts\/)[\w-]+|youtu\.be\/[\w-]+)/;

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  batchId: z.string().min(1, 'Please select a batch'),
  subjectId: z.string().optional(),
  chapterId: z.string().optional(),
  scheduledAt: z.string().min(1, 'Please select a date and time'),
  youtubeUrl: z
    .string()
    .min(1, 'YouTube URL is required')
    .regex(YOUTUBE_URL_REGEX, 'Enter a valid YouTube video or live stream URL'),
  thumbnail: z.string().url('Enter a valid image URL').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export default function NewLiveClassPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const { data: batchesRaw } = useGetTeacherBatchesQuery();
  const { data: batchDetail } = useGetTeacherBatchDetailQuery(selectedBatchId, {
    skip: !selectedBatchId,
  });
  const { data: chaptersRaw = [] } = useGetChaptersBySubjectQuery(selectedSubjectId, {
    skip: !selectedSubjectId,
  });
  const [createLiveClass, { isLoading }] = useCreateLiveClassMutation();

  const batches: Batch[] = Array.isArray(batchesRaw) ? batchesRaw : [];
  const subjects = batchDetail?.subjects ?? [];
  const chapters = chaptersRaw;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const thumbnailValue = watch('thumbnail');

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    try {
      await createLiveClass({
        title: values.title,
        description: values.description,
        batch_id: values.batchId,
        subject_id: values.subjectId || undefined,
        chapter_id: values.chapterId || undefined,
        scheduled_at: new Date(values.scheduledAt).toISOString(),
        youtube_url: values.youtubeUrl,
        thumbnail: values.thumbnail || undefined,
      }).unwrap();
      router.push('/teacher/live-classes');
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to schedule class. Please try again.';
      setServerError(msg);
    }
  };

  const minDatetime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Schedule a Live Class</h1>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the details below. The class will be reviewed by an admin before going live.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 rounded-xl border bg-white p-6 shadow-sm"
        >
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              placeholder="e.g. Algebra Basics - Chapter 3"
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
              placeholder="What will you cover in this class?"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            />
          </div>

          {/* Batch */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Batch <span className="text-red-500">*</span>
            </label>
            <select
              {...register('batchId')}
              onChange={(e) => {
                setValue('batchId', e.target.value);
                setValue('subjectId', '');
                setValue('chapterId', '');
                setSelectedBatchId(e.target.value);
                setSelectedSubjectId('');
              }}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            >
              <option value="">Select a batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {errors.batchId && (
              <p className="mt-1 text-xs text-red-600">{errors.batchId.message}</p>
            )}
          </div>

          {/* Subject */}
          {selectedBatchId && subjects.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
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
          )}

          {/* Chapter */}
          {selectedSubjectId && chapters.length > 0 && (
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

          {/* Date & Time */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date &amp; Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              {...register('scheduledAt')}
              min={minDatetime}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            />
            {errors.scheduledAt && (
              <p className="mt-1 text-xs text-red-600">{errors.scheduledAt.message}</p>
            )}
          </div>

          {/* YouTube URL */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              YouTube Live Stream URL <span className="text-red-500">*</span>
            </label>
            <input
              {...register('youtubeUrl')}
              placeholder="https://youtube.com/live/..."
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            />
            {errors.youtubeUrl && (
              <p className="mt-1 text-xs text-red-600">{errors.youtubeUrl.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Accepted: youtube.com/watch?v=..., youtube.com/live/..., youtu.be/...
            </p>
          </div>

          {/* Thumbnail URL + live preview */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Thumbnail Image URL{' '}
              <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <input
              {...register('thumbnail')}
              placeholder="https://example.com/thumbnail.jpg"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            />
            {errors.thumbnail && (
              <p className="mt-1 text-xs text-red-600">{errors.thumbnail.message}</p>
            )}
            {thumbnailValue && !errors.thumbnail && (
              <div className="mt-2">
                <p className="mb-1 text-xs font-medium text-gray-500">Preview:</p>
                <div className="relative aspect-video w-full max-w-xs overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnailValue}
                    alt="Thumbnail preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const next = (e.target as HTMLImageElement).nextElementSibling;
                      if (next) (next as HTMLElement).classList.remove('hidden');
                    }}
                  />
                  <div className="hidden absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                      <ImageIcon size={24} />
                      <span className="text-xs">Could not load image</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {serverError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
          )}

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
              {isLoading ? 'Scheduling...' : 'Schedule Class'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
