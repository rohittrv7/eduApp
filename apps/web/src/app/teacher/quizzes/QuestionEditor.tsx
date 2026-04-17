'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Check } from 'lucide-react';
import {
  useAddQuestionMutation,
  useUpdateQuestionMutation,
  type Question,
  type CreateQuestionDto,
} from '@/store/teacherApi';

const optionSchema = z.object({
  text: z.string().min(1, 'Option text required'),
  isCorrect: z.boolean().default(false),
});

const schema = z.object({
  text: z.string().min(3, 'Question text required'),
  type: z.enum(['mcq', 'true_false', 'fill_blank']),
  options: z.array(optionSchema).optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  marks: z.coerce.number().min(0.5).default(1),
  negativeMarks: z.coerce.number().min(0).default(0),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  quizId: string;
  question?: Question;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Inline question editor for MCQ, true/false, and fill-in-the-blank questions.
 * Supports 2–6 options for MCQ (Req 6.4, 25.3).
 */
export function QuestionEditor({ quizId, question, onDone, onCancel }: Props) {
  const [serverError, setServerError] = useState('');
  const [addQuestion, { isLoading: adding }] = useAddQuestionMutation();
  const [updateQuestion, { isLoading: updating }] = useUpdateQuestionMutation();
  const isLoading = adding || updating;

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: question
      ? {
          text: question.text,
          type: question.type,
          options: question.options?.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) ?? [],
          correctAnswer: question.correctAnswer ?? '',
          explanation: question.explanation ?? '',
          marks: question.marks,
          negativeMarks: question.negativeMarks,
        }
      : {
          type: 'mcq',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
          ],
          marks: 1,
          negativeMarks: 0,
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'options' });
  const questionType = watch('type');

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    const payload: CreateQuestionDto = {
      text: values.text,
      type: values.type,
      explanation: values.explanation,
      marks: values.marks,
      negativeMarks: values.negativeMarks,
    };

    if (values.type === 'mcq') {
      payload.options = values.options?.map((o) => ({ text: o.text, isCorrect: o.isCorrect }));
    } else if (values.type === 'true_false') {
      payload.options = [
        { text: 'True', isCorrect: values.correctAnswer === 'true' },
        { text: 'False', isCorrect: values.correctAnswer === 'false' },
      ];
    } else {
      payload.correctAnswer = values.correctAnswer;
    }

    try {
      if (question) {
        await updateQuestion({ quizId, questionId: question.id, ...payload }).unwrap();
      } else {
        await addQuestion({ quizId, ...payload }).unwrap();
      }
      onDone();
    } catch (err: unknown) {
      setServerError(
        (err as { data?: { message?: string } })?.data?.message ?? 'Failed to save question.'
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-[#1a56db]/30 bg-blue-50/30 p-4"
    >
      <h3 className="text-sm font-semibold text-gray-800">
        {question ? 'Edit Question' : 'Add Question'}
      </h3>

      {/* Question type */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Type</label>
        <select
          {...register('type')}
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#1a56db]"
        >
          <option value="mcq">Multiple Choice (MCQ)</option>
          <option value="true_false">True / False</option>
          <option value="fill_blank">Fill in the Blank</option>
        </select>
      </div>

      {/* Question text */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Question <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('text')}
          rows={2}
          placeholder="Enter the question..."
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#1a56db]"
        />
        {errors.text && <p className="mt-1 text-xs text-red-600">{errors.text.message}</p>}
      </div>

      {/* MCQ options (2–6) */}
      {questionType === 'mcq' && (
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-600">
            Options (2–6) — check the correct answer(s)
          </label>
          <div className="space-y-2">
            {fields.map((field, idx) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register(`options.${idx}.isCorrect`)}
                  className="h-4 w-4 rounded accent-[#1a56db]"
                  title="Mark as correct"
                />
                <input
                  {...register(`options.${idx}.text`)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 rounded-lg border bg-white px-3 py-1.5 text-sm outline-none focus:border-[#1a56db]"
                />
                {fields.length > 2 && (
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="text-gray-400 hover:text-red-500"
                    aria-label="Remove option"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {fields.length < 6 && (
            <button
              type="button"
              onClick={() => append({ text: '', isCorrect: false })}
              className="mt-2 flex items-center gap-1 text-xs text-[#1a56db] hover:underline"
            >
              <Plus size={12} /> Add option
            </button>
          )}
        </div>
      )}

      {/* True/False */}
      {questionType === 'true_false' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Correct Answer</label>
          <select
            {...register('correctAnswer')}
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#1a56db]"
          >
            <option value="">Select correct answer</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </div>
      )}

      {/* Fill in the blank */}
      {questionType === 'fill_blank' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Correct Answer</label>
          <input
            {...register('correctAnswer')}
            placeholder="Enter the correct answer"
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#1a56db]"
          />
        </div>
      )}

      {/* Explanation */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Explanation (optional)</label>
        <textarea
          {...register('explanation')}
          rows={2}
          placeholder="Explain the correct answer..."
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#1a56db]"
        />
      </div>

      {/* Marks */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Marks</label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            {...register('marks')}
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#1a56db]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Negative Marks</label>
          <input
            type="number"
            step="0.25"
            min="0"
            {...register('negativeMarks')}
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#1a56db]"
          />
        </div>
      </div>

      {serverError && (
        <p className="text-xs text-red-600">{serverError}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#1a56db] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Check size={14} />
          {isLoading ? 'Saving...' : 'Save Question'}
        </button>
      </div>
    </form>
  );
}
