'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Brain, Clock, Star, CheckCircle, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import apiClient from '@/../lib/api-client';

interface Quiz {
  id: string;
  title: string;
  subject: string;
  duration_mins: number;
  total_marks: number;
  question_count?: number;
  is_attempted: boolean;
  is_mandatory?: boolean;
  score?: number;
}

function QuizCard({ quiz }: { quiz: Quiz }) {
  const attempted = quiz.is_attempted;

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
        attempted ? 'border-green-100' : 'border-gray-100'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
            attempted ? 'bg-green-50' : 'bg-blue-50'
          }`}
        >
          {attempted ? (
            <CheckCircle size={18} className="text-green-500" />
          ) : (
            <Brain size={18} className="text-[#1a56db]" />
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {quiz.is_mandatory && (
            <span className="rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-500">
              Must
            </span>
          )}
          {attempted && quiz.score !== undefined && (
            <span className="rounded-xl bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-600">
              {quiz.score}/{quiz.total_marks}
            </span>
          )}
        </div>
      </div>

      {/* Title + subject */}
      <div className="mt-3 flex-1">
        <h3 className="line-clamp-2 text-[13px] font-bold text-gray-900">{quiz.title}</h3>
        {quiz.subject && (
          <p className="mt-0.5 text-[11px] font-semibold text-[#1a56db]">{quiz.subject}</p>
        )}
      </div>

      {/* Meta chips */}
      <div className="mt-2.5 flex flex-wrap gap-2">
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <Clock size={10} />
          {quiz.duration_mins}m
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <Star size={10} />
          {quiz.total_marks} marks
        </div>
        {quiz.question_count != null && (
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <Brain size={10} />
            {quiz.question_count}Q
          </div>
        )}
      </div>

      {/* CTA */}
      <Link
        href={`/student/quizzes/${quiz.id}`}
        className={`mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-bold transition-colors ${
          attempted
            ? 'border border-[#1a56db] text-[#1a56db] hover:bg-blue-50'
            : 'bg-[#1a56db] text-white hover:bg-blue-700'
        }`}
      >
        {attempted ? 'Review' : 'Start'}
        <ChevronRight size={13} />
      </Link>
    </div>
  );
}

export default function QuizzesPage() {
  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ['quizzes'],
    queryFn: () => apiClient.get('/quizzes').then((r) => r.data),
  });

  const attempted = quizzes.filter((q) => q.is_attempted);
  const unattempted = quizzes.filter((q) => !q.is_attempted);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-[#1a56db]" />
          <h1 className="text-[18px] font-bold text-gray-900">Quizzes</h1>
        </div>

        {/* Summary pills */}
        {!isLoading && quizzes.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Total', value: quizzes.length, color: 'bg-blue-50 text-[#1a56db]' },
              { label: 'Done', value: attempted.length, color: 'bg-green-50 text-green-600' },
              {
                label: 'Pending',
                value: unattempted.length,
                color: 'bg-orange-50 text-orange-500',
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className={`rounded-2xl border border-transparent p-3 text-center ${color}`}
              >
                <p className="text-[18px] font-extrabold leading-tight">{value}</p>
                <p className="text-[10px] font-semibold opacity-80">{label}</p>
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        )}

        {!isLoading && quizzes.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <Brain size={40} className="text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No quizzes available yet</p>
          </div>
        )}

        {/* Pending */}
        {!isLoading && unattempted.length > 0 && (
          <section>
            <h2 className="mb-2.5 text-[13px] font-bold text-gray-700">
              Pending{' '}
              <span className="ml-1 rounded-full bg-orange-100 px-2 py-0.5 text-orange-500">
                {unattempted.length}
              </span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {unattempted.map((q) => (
                <QuizCard key={q.id} quiz={q} />
              ))}
            </div>
          </section>
        )}

        {/* Attempted */}
        {!isLoading && attempted.length > 0 && (
          <section>
            <h2 className="mb-2.5 text-[13px] font-bold text-gray-700">
              Completed{' '}
              <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-green-600">
                {attempted.length}
              </span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {attempted.map((q) => (
                <QuizCard key={q.id} quiz={q} />
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
