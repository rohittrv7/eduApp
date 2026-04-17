'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Brain, Clock, Star, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import apiClient from '@/../lib/api-client';

interface Quiz {
  id: string;
  title: string;
  subject: string;
  duration_mins: number;
  total_marks: number;
  is_attempted: boolean;
  score?: number;
}

export default function QuizzesPage() {
  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ['quizzes'],
    queryFn: () => apiClient.get('/quizzes').then((r) => r.data),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Brain size={22} className="text-[#1a56db]" />
          <h1 className="text-xl font-bold text-gray-900">Quizzes</h1>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        )}

        {!isLoading && quizzes.length === 0 && (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
            No quizzes available yet.
          </div>
        )}

        {!isLoading && quizzes.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{quiz.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{quiz.subject}</p>
                  </div>
                  {quiz.is_attempted && (
                    <CheckCircle size={18} className="shrink-0 text-green-500" />
                  )}
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {quiz.duration_mins} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={12} /> {quiz.total_marks} marks
                  </span>
                  {quiz.is_attempted && quiz.score !== undefined && (
                    <span className="ml-auto font-semibold text-[#1a56db]">
                      Score: {quiz.score}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <Link
                    href={`/student/quizzes/${quiz.id}`}
                    className="block w-full rounded-lg bg-[#1a56db] py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {quiz.is_attempted ? 'Review' : 'Start Quiz'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
