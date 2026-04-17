'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import apiClient from '@/../lib/api-client';
import { Lock, CheckCircle, XCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType = 'mcq' | 'true_false' | 'fill_blank';

interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface QuizQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: QuizOption[];   // mcq / true_false
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

interface QuizResult {
  score: number;
  totalMarks: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  answers: Record<string, { isCorrect: boolean; correctOptionId?: string }>;
}

interface LockInfo {
  message: string;
  watchPercent: number;   // 0-100, how much the student has watched
}

// ─── QuestionRenderer ─────────────────────────────────────────────────────────

interface QuestionRendererProps {
  question: QuizQuestion;
  index: number;
  selected: string;
  onChange: (questionId: string, value: string) => void;
  result: QuizResult | null;
  disabled: boolean;
}

function QuestionRenderer({
  question,
  index,
  selected,
  onChange,
  result,
  disabled,
}: QuestionRendererProps) {
  const qResult = result?.answers[question.id];

  const optionClass = (optId: string) => {
    let base =
      'w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors';
    if (result) {
      if (optId === qResult?.correctOptionId) {
        return base + ' border-green-500 bg-green-50 text-green-700';
      }
      if (optId === selected && !qResult?.isCorrect) {
        return base + ' border-red-400 bg-red-50 text-red-700';
      }
      return base + ' border-gray-200 text-gray-700';
    }
    return (
      base +
      (selected === optId
        ? ' border-[#1a56db] bg-blue-50 text-[#1a56db]'
        : ' border-gray-200 hover:border-gray-300 text-gray-700')
    );
  };

  const renderOptions = () => {
    if (question.type === 'fill_blank') {
      return (
        <input
          type="text"
          value={selected}
          onChange={(e) => !disabled && onChange(question.id, e.target.value)}
          disabled={disabled}
          placeholder="Type your answer…"
          className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-[#1a56db] ${
            result
              ? qResult?.isCorrect
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-red-400 bg-red-50 text-red-700'
              : 'border-gray-300'
          }`}
        />
      );
    }

    const opts: QuizOption[] =
      question.type === 'true_false'
        ? [
            { id: 'true', text: 'True' },
            { id: 'false', text: 'False' },
          ]
        : (question.options ?? []);

    return (
      <div className="space-y-2">
        {opts.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(question.id, opt.id)}
            disabled={disabled}
            className={optionClass(opt.id)}
          >
            <div className="flex items-center justify-between">
              <span>{opt.text}</span>
              {result && opt.id === qResult?.correctOptionId && (
                <CheckCircle size={16} className="text-green-500" />
              )}
              {result && opt.id === selected && !qResult?.isCorrect && (
                <XCircle size={16} className="text-red-500" />
              )}
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="mb-3 font-medium text-gray-900">
        <span className="mr-2 text-gray-400">{index + 1}.</span>
        {question.text}
      </p>
      {renderOptions()}
      {result && question.explanation && (
        <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <span className="font-semibold">Explanation: </span>
          {question.explanation}
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuizAttemptPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null);

  const {
    data: quiz,
    isLoading,
    error,
  } = useQuery<Quiz>({
    queryKey: ['quiz', quizId],
    queryFn: () => apiClient.get(`/quizzes/${quizId}`).then((r) => r.data),
    retry: false,
  });

  // Handle 403 locked state (Req 6.2, 6.5)
  useEffect(() => {
    if (!error) return;
    const e = error as { response?: { status: number; data?: { message?: string; watchPercent?: number } } };
    if (e?.response?.status === 403) {
      setLockInfo({
        message: e.response.data?.message ?? 'Watch more of the video to unlock this quiz.',
        watchPercent: e.response.data?.watchPercent ?? 0,
      });
    }
  }, [error]);

  const submitMutation = useMutation({
    mutationFn: (payload: { answers: Record<string, string> }) =>
      apiClient.post(`/quizzes/${quizId}/attempt`, payload).then((r) => r.data),
    onSuccess: (data: QuizResult) => setResult(data),
  });

  const handleSelect = (questionId: string, value: string) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/2 rounded bg-gray-200" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-200" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  // ── Locked state with progress indicator (Req 6.2) ──
  if (lockInfo) {
    const remaining = Math.max(0, 90 - lockInfo.watchPercent);
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Lock size={48} className="mb-4 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-900">Quiz Locked</h2>
          <p className="mt-2 max-w-sm text-gray-500">{lockInfo.message}</p>

          {/* Watch progress indicator */}
          <div className="mt-6 w-full max-w-xs">
            <div className="mb-1 flex justify-between text-xs text-gray-500">
              <span>Watch progress</span>
              <span>{lockInfo.watchPercent}% / 90% required</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#1a56db] transition-all"
                style={{ width: `${Math.min(100, (lockInfo.watchPercent / 90) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Watch {remaining.toFixed(0)}% more to unlock
            </p>
          </div>

          <button
            onClick={() => router.back()}
            className="mt-8 rounded-lg bg-[#1a56db] px-6 py-2 text-sm font-semibold text-white"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!quiz) return null;

  const allAnswered = quiz.questions.every((q) => {
    const ans = answers[q.id];
    return ans !== undefined && ans !== '';
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>

        {/* Result Summary (Req 6.3) */}
        {result && (
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Results</h2>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#1a56db]">
                  {result.score}/{result.totalMarks}
                </p>
                <p className="text-xs text-gray-500">Score</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1a56db]">
                  {result.percentage.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500">Percentage</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{result.correctCount}</p>
                <p className="text-xs text-gray-500">Correct</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{result.incorrectCount}</p>
                <p className="text-xs text-gray-500">Incorrect</p>
              </div>
            </div>
          </div>
        )}

        {/* Questions */}
        {quiz.questions.map((q, idx) => (
          <QuestionRenderer
            key={q.id}
            question={q}
            index={idx}
            selected={answers[q.id] ?? ''}
            onChange={handleSelect}
            result={result}
            disabled={!!result}
          />
        ))}

        {/* Submit (Req 6.3) */}
        {!result && (
          <button
            onClick={() => submitMutation.mutate({ answers })}
            disabled={submitMutation.isPending || !allAnswered}
            className="w-full rounded-xl bg-[#1a56db] py-3 font-semibold text-white disabled:opacity-50"
          >
            {submitMutation.isPending ? 'Submitting…' : 'Submit Quiz'}
          </button>
        )}
      </div>
    </DashboardLayout>
  );
}
