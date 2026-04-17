'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface BatchFiltersProps {
  examType?: string;
  language?: string;
  price?: string;
  subject?: string;
}

const EXAM_TYPES = ['JEE', 'NEET', 'UPSC', 'SSC', 'Other'];
const LANGUAGES = ['Hindi', 'English', 'Both'];
const PRICE_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Free', value: 'free' },
  { label: 'Paid', value: 'paid' },
];

export function BatchFilters({ examType, language, price, subject }: BatchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/batches?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="rounded-xl border bg-white p-5 space-y-5">
      <h2 className="font-semibold text-gray-900">Filters</h2>

      {/* Exam Type */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Exam Type
        </label>
        <select
          value={examType || ''}
          onChange={(e) => updateFilter('examType', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
        >
          <option value="">All Exams</option>
          {EXAM_TYPES.map((exam) => (
            <option key={exam} value={exam}>
              {exam}
            </option>
          ))}
        </select>
      </div>

      {/* Language */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Language
        </label>
        <div className="flex flex-col gap-2">
          {LANGUAGES.map((lang) => (
            <label key={lang} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="language"
                value={lang}
                checked={language === lang}
                onChange={() => updateFilter('language', lang)}
                className="accent-[#1a56db]"
              />
              {lang}
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="language"
              value=""
              checked={!language}
              onChange={() => updateFilter('language', '')}
              className="accent-[#1a56db]"
            />
            Any
          </label>
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Price
        </label>
        <div className="flex flex-col gap-2">
          {PRICE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="price"
                value={opt.value}
                checked={(price || 'all') === opt.value}
                onChange={() => updateFilter('price', opt.value)}
                className="accent-[#1a56db]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Subject
        </label>
        <input
          type="text"
          defaultValue={subject}
          placeholder="e.g. Physics, Maths"
          onBlur={(e) => updateFilter('subject', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateFilter('subject', (e.target as HTMLInputElement).value);
            }
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
        />
      </div>

      {/* Clear Filters */}
      {(examType || language || price || subject) && (
        <button
          onClick={() => router.push('/batches')}
          className="w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
