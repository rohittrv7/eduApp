'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import apiClient from '@/../lib/api-client';
import { CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Send } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type QuestionType = 'mcq' | 'true_false' | 'fill_blank';

interface TestOption {
  id: string;
  text: string;
}

interface TestQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: TestOption[];
  subject?: string;
  marks: number;
  negative_marks: number;
}

interface MockTest {
  id: string;
  title: string;
  subject?: string;
  duration_mins: number;
  total_marks: number;
  negative_marking_rules?: { per_wrong: number };
  questions: TestQuestion[];
}

interface AnswerResult {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
  timeSpentSecs: number;
}

interface SubjectBreakdown {
  subject: string;
  score: number;
  total: number;
  accuracy: number;
}

interface AttemptResult {
  score: number;
  totalMarks: number;
  percentage: number;
  rank: number;
  answers: AnswerResult[];
  subjectBreakdown: SubjectBreakdown[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── QuestionRenderer ────────────────────────────────────────────────────────

interface QuestionRendererProps {
  question: TestQuestion;
  index: number;
  selected: string;
  onChange: (questionId: string, value: string) => void;
  answerResult?: AnswerResult;
  showResult: boolean;
  disabled: boolean;
}

function QuestionRenderer({
  question,
  index,
  selected,
  onChange,
  answerResult,
  showResult,
  disabled,
}: QuestionRendererProps) {
  const optionClass = (optId: string) => {
    const base = 'w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors';
    if (showResult && answerResult) {
      if (optId === answerResult.correctAnswer) {
        return base + ' border-green-500 bg-green-50 text-green-700';
      }
      if (optId === selected && !answerResult.isCorrect) {
        return base + ' border-red-400 bg-red-50 text-red-700';
      }
      return base + ' border-gray-200 text-gray-500';
    }
    return (
      base +
      (selected === optId
        ? ' border-[#1a56db] bg-blue-50 text-[#1a56db]'
        : ' border-gray-200 hover:border-gray-300 text-gray-700')
    );
  };

  const opts: TestOption[] =
    question.type === 'true_false'
      ? [{ id: 'true', text: 'True' }, { id: 'false', text: 'False' }]
      : (question.options ?? []);

  return (
    <div className="space-y-4">
      <p className="font-medium text-gray-900 leading-relaxed">
        <span className="mr-2 text-gray-400 font-normal">Q{index + 1}.</span>
        {question.text}
      </p>

      {question.type === 'fill_blank' ? (
        <input
          type="text"
          value={selected}
          onChange={(e) => !disabled && onChange(question.id, e.target.value)}
          disabled={disabled}
          placeholder="Type your answer…"
          className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-[#1a56db] ${
            showResult && answerResult
              ? answerResult.isCorrect
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-red-400 bg-red-50 text-red-700'
              : 'border-gray-300'
          }`}
        />
      ) : (
        <div className="space-y-2">
          {opts.map((opt) => (
            <button
              key={opt.id}
              onClick={() => !disabled && onChange(question.id, opt.id)}
              disabled={disabled}
              className={optionClass(opt.id)}
            >
              <div className="flex items-center justify-between">
                <span>{opt.text}</span>
                {showResult && answerResult && opt.id === answerResult.correctAnswer && (
                  <CheckCircle size={16} className="text-green-500 shrink-0" />
                )}
                {showResult && answerResult && opt.id === selected && !answerResult.isCorrect && (
                  <XCircle size={16} className="text-red-500 shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showResult && answerResult && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            {answerResult.isCorrect ? (
              <span className="text-green-600 font-medium flex items-center gap-1">
                <CheckCircle size={14} /> Correct
              </span>
            ) : (
              <span className="text-red-600 font-medium flex items-center gap-1">
                <XCircle size={14} /> Incorrect
              </span>
            )}
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <Clock size={12} /> {answerResult.timeSpentSecs}s
            </span>
          </div>
          {answerResult.explanation && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              <span className="font-semibold">Explanation: </span>
              {answerResult.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MockTestPage() {
  const { testId } = useParams<{ testId: string }>();
  const router = useRouter();

  // answers: questionId → selected option/value
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // per-question time tracking (seconds spent on each question)
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);
  const questionStartRef = useRef<number>(Date.now());

  const { data: test, isLoading } = useQuery<MockTest>({
    queryKey: ['mock-test', testId],
    queryFn: () => apiClient.get(`/tests/${testId}`).then((r) => r.data),
  });

  // Initialise timer once test loads
  useEffect(() => {
    if (!test) return;
    setTimeLeft(test.duration_mins * 60);
  }, [test]);

  const submitMutation = useMutation({
    mutationFn: (payload: { answers: Record<string, string>; questionTimes: Record<string, number> }) =>
      apiClient.post(`/tests/${testId}/attempt`, payload).then((r) => r.data),
    onSuccess: (data: AttemptResult) => {
      setResult(data);
      if (timerRef.current) clearInterval(timerRef.current);
    },
  });

  const handleSubmit = useCallback(
    (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      // capture time for current question
      const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000);
      const updatedTimes = { ...questionTimes };
      if (test?.questions[currentQ]) {
        const qId = test.questions[currentQ].id;
        updatedTimes[qId] = (updatedTimes[qId] ?? 0) + elapsed;
      }
      setQuestionTimes(updatedTimes);
      submitMutation.mutate({ answers, questionTimes: updatedTimes });
      if (auto) {
        // brief visual cue that time ran out
      }
    },
    [answers, questionTimes, currentQ, test, submitMutation]
  );

  // Countdown timer
  useEffect(() => {
    if (!test || result) return;
    if (timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test, result]);

  // Track time per question
  const handleNavigate = (idx: number) => {
    if (!test) return;
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000);
    const qId = test.questions[currentQ].id;
    setQuestionTimes((prev) => ({ ...prev, [qId]: (prev[qId] ?? 0) + elapsed }));
    questionStartRef.current = Date.now();
    setCurrentQ(idx);
  };

  const handleSelect = (questionId: string, value: string) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4 max-w-3xl mx-auto">
          <div className="h-8 w-1/2 rounded bg-gray-200" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-200" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (!test) return null;

  const questions = test.questions;
  const answeredCount = questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== '').length;

  // ── Results View ──
  if (result) {
    const correctCount = result.answers.filter((a) => a.isCorrect).length;
    const incorrectCount = result.answers.filter((a) => !a.isCorrect).length;
    const unattempted = questions.length - correctCount - incorrectCount;
    const maxTime = Math.max(...result.answers.map((a) => a.timeSpentSecs), 1);

    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl space-y-6 pb-10">
          {/* Score Summary */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900 mb-4">{test.title} — Results</h1>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-2xl font-bold text-[#1a56db]">
                  {result.score}/{result.totalMarks}
                </p>
                <p className="text-xs text-gray-500 mt-1">Score</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-3">
                <p className="text-2xl font-bold text-purple-600">{result.percentage.toFixed(0)}%</p>
                <p className="text-xs text-gray-500 mt-1">Percentage</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3">
                <p className="text-2xl font-bold text-green-600">{correctCount}</p>
                <p className="text-xs text-gray-500 mt-1">Correct</p>
              </div>
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-2xl font-bold text-red-500">{incorrectCount}</p>
                <p className="text-xs text-gray-500 mt-1">Incorrect</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600 border-t pt-4">
              <span>Unattempted: <strong>{unattempted}</strong></span>
              <span className="flex items-center gap-1 font-semibold text-[#1a56db]">
                🏆 Rank #{result.rank}
              </span>
            </div>
          </div>

          {/* Subject-wise Breakdown */}
          {result.subjectBreakdown && result.subjectBreakdown.length > 0 && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4">Subject-wise Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium">Subject</th>
                      <th className="pb-2 font-medium text-right">Score</th>
                      <th className="pb-2 font-medium text-right">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {result.subjectBreakdown.map((sb) => (
                      <tr key={sb.subject}>
                        <td className="py-2 text-gray-800">{sb.subject}</td>
                        <td className="py-2 text-right text-gray-700">
                          {sb.score}/{sb.total}
                        </td>
                        <td className="py-2 text-right">
                          <span
                            className={`font-medium ${
                              sb.accuracy >= 70
                                ? 'text-green-600'
                                : sb.accuracy >= 40
                                ? 'text-yellow-600'
                                : 'text-red-500'
                            }`}
                          >
                            {sb.accuracy.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Time Management Graph (CSS bar chart) */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4">Time per Question</h2>
            <div className="space-y-2">
              {result.answers.map((a, idx) => {
                const pct = Math.round((a.timeSpentSecs / maxTime) * 100);
                return (
                  <div key={a.questionId} className="flex items-center gap-3 text-xs">
                    <span className="w-6 shrink-0 text-gray-500 text-right">Q{idx + 1}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                      <div
                        className={`h-full rounded transition-all ${
                          a.isCorrect ? 'bg-green-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-gray-500">{a.timeSpentSecs}s</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-gray-400">Green = correct, Red = incorrect</p>
          </div>

          {/* Per-question Results */}
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-gray-900">Answer Review</h2>
            {questions.map((q, idx) => {
              const ar = result.answers.find((a) => a.questionId === q.id);
              return (
                <div key={q.id} className="border-b pb-5 last:border-0 last:pb-0">
                  <QuestionRenderer
                    question={q}
                    index={idx}
                    selected={answers[q.id] ?? ''}
                    onChange={() => {}}
                    answerResult={ar}
                    showResult
                    disabled
                  />
                </div>
              );
            })}
          </div>

          <button
            onClick={() => router.push('/student/tests')}
            className="w-full rounded-xl bg-[#1a56db] py-3 font-semibold text-white"
          >
            Back to Tests
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Test Attempt View ──
  const currentQuestion = questions[currentQ];
  const isAnswered = (idx: number) =>
    answers[questions[idx].id] !== undefined && answers[idx] !== '';

  return (
    <DashboardLayout>
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-4 flex items-center justify-between bg-white border-b px-4 py-3 shadow-sm">
        <h1 className="text-sm font-semibold text-gray-900 truncate max-w-[60%]">{test.title}</h1>
        <div
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums ${
            timeLeft <= 60 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-[#1a56db]'
          }`}
        >
          <Clock size={14} />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4">
        {/* Progress */}
        <p className="text-xs text-gray-500">
          {answeredCount} of {questions.length} answered
        </p>

        {/* Navigation Grid */}
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-3">Questions</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const answered = answers[q.id] !== undefined && answers[q.id] !== '';
              const isCurrent = idx === currentQ;
              return (
                <button
                  key={q.id}
                  onClick={() => handleNavigate(idx)}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-[#1a56db] text-white'
                      : answered
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-[#1a56db]" /> Current
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-green-100 border border-green-300" /> Answered
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-gray-100" /> Unanswered
            </span>
          </div>
        </div>

        {/* Question Card */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          {currentQuestion.subject && (
            <span className="mb-3 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-[#1a56db]">
              {currentQuestion.subject}
            </span>
          )}
          <div className="flex items-center justify-between mb-1 text-xs text-gray-400">
            <span>Marks: +{currentQuestion.marks}</span>
            {currentQuestion.negative_marks > 0 && (
              <span className="text-red-400">Negative: -{currentQuestion.negative_marks}</span>
            )}
          </div>
          <QuestionRenderer
            question={currentQuestion}
            index={currentQ}
            selected={answers[currentQuestion.id] ?? ''}
            onChange={handleSelect}
            showResult={false}
            disabled={false}
          />
        </div>

        {/* Prev / Next / Submit */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => handleNavigate(currentQ - 1)}
            disabled={currentQ === 0}
            className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronLeft size={16} /> Prev
          </button>

          {currentQ < questions.length - 1 ? (
            <button
              onClick={() => handleNavigate(currentQ + 1)}
              className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => handleSubmit()}
              disabled={submitMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-[#1a56db] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Send size={14} />
              {submitMutation.isPending ? 'Submitting…' : 'Submit Test'}
            </button>
          )}
        </div>

        {/* Submit button always visible on last question or when all answered */}
        {currentQ < questions.length - 1 && answeredCount === questions.length && (
          <button
            onClick={() => handleSubmit()}
            disabled={submitMutation.isPending}
            className="w-full rounded-xl bg-[#1a56db] py-3 font-semibold text-white disabled:opacity-50"
          >
            {submitMutation.isPending ? 'Submitting…' : 'Submit Test'}
          </button>
        )}
      </div>
    </DashboardLayout>
  );
}
