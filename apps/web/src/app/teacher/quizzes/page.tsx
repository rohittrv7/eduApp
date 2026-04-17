'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardSectionSkeleton } from '@/components/ui/SkeletonLoader';
import { QuestionEditor } from './QuestionEditor';
import {
  useGetTeacherQuizzesQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useDeleteQuizMutation,
  useGetQuizQuestionsQuery,
  useDeleteQuestionMutation,
  useGetTeacherVideosQuery,
  type Quiz,
  type Question,
} from '@/store/teacherApi';

const quizSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  videoId: z.string().optional(),
  isMandatory: z.boolean().default(false),
  unlockThreshold: z.coerce.number().min(0).max(100).default(90),
});

type QuizFormValues = z.infer<typeof quizSchema>;

/** Expandable quiz row showing questions and management actions */
function QuizRow({ quiz }: { quiz: Quiz }) {
  const [expanded, setExpanded] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const { data: questions = [], isLoading: loadingQ } = useGetQuizQuestionsQuery(quiz.id, {
    skip: !expanded,
  });
  const [deleteQuestion] = useDeleteQuestionMutation();
  const [deleteQuiz] = useDeleteQuizMutation();

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      {/* Quiz header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
          aria-expanded={expanded}
        >
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          <div>
            <p className="font-semibold text-gray-900">{quiz.title}</p>
            <p className="text-xs text-gray-500">
              {quiz.questionCount} question{quiz.questionCount !== 1 ? 's' : ''} ·{' '}
              Unlock at {quiz.unlockThreshold}% watch
              {quiz.isMandatory && ' · Mandatory'}
            </p>
          </div>
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Delete quiz "${quiz.title}"? This cannot be undone.`)) {
              deleteQuiz(quiz.id);
            }
          }}
          className="text-gray-400 hover:text-red-500"
          aria-label="Delete quiz"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Expanded questions */}
      {expanded && (
        <div className="border-t px-4 py-3 space-y-3">
          {loadingQ ? (
            <p className="text-sm text-gray-400">Loading questions...</p>
          ) : questions.length === 0 ? (
            <p className="text-sm text-gray-500">No questions yet.</p>
          ) : (
            <div className="space-y-2">
              {questions.map((q, idx) => (
                <div key={q.id} className="flex items-start gap-2 rounded-lg border bg-gray-50 p-3">
                  <span className="mt-0.5 text-xs font-bold text-gray-400">{idx + 1}.</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{q.text}</p>
                    <p className="mt-0.5 text-xs text-gray-500 capitalize">
                      {q.type.replace('_', ' ')} · {q.marks} mark{q.marks !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingQuestion(q)}
                      className="text-gray-400 hover:text-[#1a56db]"
                      aria-label="Edit question"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this question?')) {
                          deleteQuestion({ quizId: quiz.id, questionId: q.id });
                        }
                      }}
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Delete question"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit question inline */}
          {editingQuestion && (
            <QuestionEditor
              quizId={quiz.id}
              question={editingQuestion}
              onDone={() => setEditingQuestion(null)}
              onCancel={() => setEditingQuestion(null)}
            />
          )}

          {/* Add question inline */}
          {addingQuestion ? (
            <QuestionEditor
              quizId={quiz.id}
              onDone={() => setAddingQuestion(false)}
              onCancel={() => setAddingQuestion(false)}
            />
          ) : (
            !editingQuestion && (
              <button
                onClick={() => setAddingQuestion(true)}
                className="flex items-center gap-1.5 text-sm text-[#1a56db] hover:underline"
              >
                <Plus size={14} /> Add Question
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Teacher quiz management page.
 * - Create/edit/delete quizzes linked to videos (Req 20.3)
 * - Add questions with type selector (MCQ, true/false, fill-in-the-blank), options, correct answer, explanation (Req 25.2, 25.3)
 * Requirements: 20.3, 25.2, 25.3
 */
export default function TeacherQuizzesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [serverError, setServerError] = useState('');

  const { data: quizzes = [], isLoading } = useGetTeacherQuizzesQuery();
  const { data: videos = [] } = useGetTeacherVideosQuery();
  const [createQuiz, { isLoading: creating }] = useCreateQuizMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuizFormValues>({ resolver: zodResolver(quizSchema) });

  const onCreateQuiz = async (values: QuizFormValues) => {
    setServerError('');
    try {
      await createQuiz({
        title: values.title,
        videoId: values.videoId || undefined,
        isMandatory: values.isMandatory,
        unlockThreshold: values.unlockThreshold,
      }).unwrap();
      reset();
      setShowCreateForm(false);
    } catch (err: unknown) {
      setServerError(
        (err as { data?: { message?: string } })?.data?.message ?? 'Failed to create quiz.'
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Quizzes</h1>
          <button
            onClick={() => setShowCreateForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-[#1a56db] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            New Quiz
          </button>
        </div>

        {/* Create quiz form */}
        {showCreateForm && (
          <form
            onSubmit={handleSubmit(onCreateQuiz)}
            className="space-y-4 rounded-xl border bg-white p-5 shadow-sm"
          >
            <h2 className="text-sm font-semibold text-gray-800">Create New Quiz</h2>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Quiz Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register('title')}
                placeholder="e.g. Chapter 3 Quiz"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a56db]"
              />
              {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Link to Video</label>
              <select
                {...register('videoId')}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a56db]"
              >
                <option value="">No video (standalone quiz)</option>
                {videos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Unlock Threshold (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  {...register('unlockThreshold')}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a56db]"
                />
                <p className="mt-0.5 text-xs text-gray-400">% watch-time required to unlock</p>
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="isMandatory"
                  {...register('isMandatory')}
                  className="h-4 w-4 accent-[#1a56db]"
                />
                <label htmlFor="isMandatory" className="text-sm text-gray-700">
                  Mandatory for certificate
                </label>
              </div>
            </div>

            {serverError && (
              <p className="text-xs text-red-600">{serverError}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowCreateForm(false); reset(); }}
                className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex-1 rounded-lg bg-[#1a56db] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Quiz'}
              </button>
            </div>
          </form>
        )}

        {/* Quiz list */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <DashboardSectionSkeleton key={i} />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="rounded-xl border bg-white p-12 text-center text-sm text-gray-500">
            No quizzes yet. Create your first quiz above.
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <QuizRow key={quiz.id} quiz={quiz} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
