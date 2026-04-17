import { baseApi } from './api';

export interface TeacherLiveClass {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  status: 'scheduled' | 'pending_approval' | 'approved' | 'rejected' | 'active' | 'ended';
  batchTitle: string;
  batchId: string;
  youtubeUrl?: string;
  subjectName?: string;
}

export interface TeacherVideo {
  id: string;
  title: string;
  thumbnail?: string;
  viewCount: number;
  avgWatchTimeSecs: number;
  durationSeconds: number;
  batchTitle: string;
  chapterName?: string;
  createdAt: string;
}

export interface StudentQuizScore {
  studentId: string;
  studentName: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  attemptedAt: string;
}

export interface VideoEngagement {
  studentId: string;
  studentName: string;
  watchTimeSecs: number;
  lastWatchDate: string;
}

export interface TeacherEarnings {
  totalEarnings: number;
  pendingPayout: number;
  paidOut: number;
  batchBreakdown: {
    batchId: string;
    batchTitle: string;
    enrollments: number;
    earnings: number;
  }[];
}

export interface StudyMaterial {
  id: string;
  title: string;
  type: 'pdf' | 'image' | 'text';
  file_url?: string | null;
  content?: string | null;
  is_free_preview: boolean;
  batch_id?: string | null;
  chapter_id?: string | null;
  folder_name?: string | null;
  created_at: string;
}

export interface CreateStudyMaterialDto {
  title: string;
  type: 'pdf' | 'image' | 'text';
  file_url?: string;
  content?: string;
  batch_id?: string;
  chapter_id?: string;
  folder_name?: string;
  is_free_preview?: boolean;
}

export interface CreateLiveClassDto {
  title: string;
  description?: string;
  batch_id: string;
  subject_id?: string;
  chapter_id?: string;
  scheduled_at: string;
  youtube_url: string;
}

export interface CreateVideoDto {
  youtube_url: string;
  title: string;
  description?: string;
  thumbnail?: string;
  batch_id: string;
  chapter_id?: string;
  language?: string;
}

export interface Quiz {
  id: string;
  title: string;
  videoId?: string;
  videoTitle?: string;
  isMandatory: boolean;
  unlockThreshold: number;
  questionCount: number;
  createdAt: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'true_false' | 'fill_blank';
  options?: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  explanation?: string;
  marks: number;
  negativeMarks: number;
}

export interface CreateQuizDto {
  title: string;
  videoId?: string;
  isMandatory?: boolean;
  unlockThreshold?: number;
}

export interface CreateQuestionDto {
  text: string;
  type: 'mcq' | 'true_false' | 'fill_blank';
  options?: { text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Batch {
  id: string;
  name: string;
}

export interface Chapter {
  id: string;
  name: string;
  subjectId: string;
}

export interface BatchVideo {
  id: string;
  title: string;
  thumbnail?: string | null;
  durationSeconds: number;
  isLocked: boolean;
}

export interface BatchChapter {
  id: string;
  name: string;
  order: number;
  videos: BatchVideo[];
}

export interface BatchSubject {
  id: string;
  name: string;
  chapters: BatchChapter[];
}

export interface TeacherBatchDetail {
  id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string | null;
  price: number;
  is_free: boolean;
  target_exam?: string;
  language?: string;
  subjects: BatchSubject[];
}

export const teacherApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Dashboard
    getTeacherUpcomingClasses: builder.query<TeacherLiveClass[], void>({
      query: () => '/live-classes/mine',
      providesTags: ['TeacherLiveClasses'],
      transformResponse: (response: unknown): TeacherLiveClass[] => {
        if (!Array.isArray(response)) return [];
        return (response as any[]).map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          // Handle both snake_case and camelCase from backend
          scheduledAt: c.scheduled_at ?? c.scheduledAt ?? '',
          status: c.status,
          batchTitle: c.batch?.name ?? c.batchTitle ?? c.batch_id ?? '',
          batchId: c.batch_id ?? c.batchId ?? '',
          youtubeUrl: c.youtube_url ?? c.youtubeUrl,
          subjectName: c.subject?.name ?? c.subjectName,
        }));
      },
    }),
    getTeacherVideos: builder.query<TeacherVideo[], void>({
      query: () => '/videos?role=teacher',
      providesTags: ['TeacherVideos'],
    }),
    getTeacherQuizScores: builder.query<StudentQuizScore[], void>({
      query: () => '/quizzes/student-scores?role=teacher',
      providesTags: ['TeacherQuizzes'],
    }),
    getVideoEngagement: builder.query<VideoEngagement[], string>({
      query: (videoId) => `/videos/${videoId}/engagement`,
    }),

    // Live classes
    createLiveClass: builder.mutation<TeacherLiveClass, CreateLiveClassDto>({
      query: (body) => ({ url: '/live-classes', method: 'POST', body }),
      invalidatesTags: ['TeacherLiveClasses'],
    }),
    deleteLiveClass: builder.mutation<void, string>({
      query: (id) => ({ url: `/live-classes/${id}/delete`, method: 'POST' }),
      invalidatesTags: ['TeacherLiveClasses'],
    }),

    // Videos
    createVideo: builder.mutation<TeacherVideo, CreateVideoDto>({
      query: (body) => ({ url: '/videos', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [
        'TeacherVideos',
        { type: 'TeacherBatchDetail' as any, id: arg.batch_id },
      ],
    }),
    deleteVideo: builder.mutation<void, string>({
      query: (id) => ({ url: `/videos/${id}`, method: 'DELETE' }),
      invalidatesTags: ['TeacherVideos'],
    }),

    // Quizzes
    getTeacherQuizzes: builder.query<Quiz[], void>({
      query: () => '/quizzes?role=teacher',
      providesTags: ['TeacherQuizzes'],
    }),
    createQuiz: builder.mutation<Quiz, CreateQuizDto>({
      query: (body) => ({ url: '/quizzes', method: 'POST', body }),
      invalidatesTags: ['TeacherQuizzes'],
    }),
    updateQuiz: builder.mutation<Quiz, { id: string } & Partial<CreateQuizDto>>({
      query: ({ id, ...body }) => ({ url: `/quizzes/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['TeacherQuizzes'],
    }),
    deleteQuiz: builder.mutation<void, string>({
      query: (id) => ({ url: `/quizzes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['TeacherQuizzes'],
    }),
    getQuizQuestions: builder.query<Question[], string>({
      query: (quizId) => `/quizzes/${quizId}/questions`,
      providesTags: (_r, _e, quizId) => [{ type: 'TeacherQuizQuestions', id: quizId }],
    }),
    addQuestion: builder.mutation<Question, { quizId: string } & CreateQuestionDto>({
      query: ({ quizId, ...body }) => ({ url: `/quizzes/${quizId}/questions`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { quizId }) => [{ type: 'TeacherQuizQuestions', id: quizId }],
    }),
    updateQuestion: builder.mutation<Question, { quizId: string; questionId: string } & Partial<CreateQuestionDto>>({
      query: ({ quizId, questionId, ...body }) => ({ url: `/quizzes/${quizId}/questions/${questionId}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { quizId }) => [{ type: 'TeacherQuizQuestions', id: quizId }],
    }),
    deleteQuestion: builder.mutation<void, { quizId: string; questionId: string }>({
      query: ({ quizId, questionId }) => ({ url: `/quizzes/${quizId}/questions/${questionId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { quizId }) => [{ type: 'TeacherQuizQuestions', id: quizId }],
    }),

    // Earnings
    getTeacherEarnings: builder.query<TeacherEarnings, void>({
      query: () => '/teachers/me/earnings',
    }),

    // Subjects, Batches, Chapters (for form dropdowns)
    getTeacherSubjects: builder.query<Subject[], void>({
      query: () => '/subjects?role=teacher',
      providesTags: ['TeacherSubjects'],
    }),
    createSubject: builder.mutation<Subject, { name: string; description?: string }>({
      query: (body) => ({ url: '/subjects', method: 'POST', body }),
      invalidatesTags: ['TeacherSubjects'],
    }),
    deleteSubject: builder.mutation<void, string>({
      query: (id) => ({ url: `/subjects/${id}`, method: 'DELETE' }),
      invalidatesTags: ['TeacherSubjects'],
    }),
    getTeacherBatches: builder.query<Batch[], void>({
      query: () => '/batches/mine',
      providesTags: ['TeacherBatches'],
      transformResponse: (response: unknown): Batch[] => {
        if (!response || typeof response !== 'object') return [];
        if (Array.isArray(response)) return response as Batch[];
        const r = response as Record<string, unknown>;
        if (Array.isArray(r.batches)) return r.batches as Batch[];
        if (Array.isArray(r.data)) return r.data as Batch[];
        return [];
      },
    }),
    createTeacherBatch: builder.mutation<Batch, {
      name: string; description?: string; target_exam?: string;
      price?: number; is_free?: boolean; language?: string;
      thumbnail?: string; start_date?: string; end_date?: string;
    }>({
      query: (body) => ({ url: '/batches', method: 'POST', body }),
      invalidatesTags: ['TeacherBatches'],
    }),
    // Batch detail with subjects → chapters → videos tree
    getTeacherBatchDetail: builder.query<TeacherBatchDetail, string>({
      query: (batchId) => `/batches/${batchId}`,
      transformResponse: (r: any): TeacherBatchDetail => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        thumbnail: r.thumbnail,
        price: Number(r.price ?? 0),
        is_free: r.is_free ?? false,
        target_exam: r.target_exam,
        language: r.language,
        subjects: r.subjects ?? [],
      }),
      providesTags: (_r, _e, id) => [{ type: 'TeacherBatchDetail' as any, id }],
    }),
    getChaptersBySubject: builder.query<Chapter[], string>({
      query: (subjectId) => `/chapters?subjectId=${subjectId}`,
    }),
    createChapter: builder.mutation<Chapter, { subjectId: string; name: string; description?: string }>({
      query: ({ subjectId, name, description }) => ({
        url: '/chapters',
        method: 'POST',
        body: { subject_id: subjectId, name, description },
      }),
      invalidatesTags: ['TeacherSubjects'],
    }),
    deleteChapter: builder.mutation<void, string>({
      query: (id) => ({ url: `/chapters/${id}`, method: 'DELETE' }),
      invalidatesTags: ['TeacherSubjects'],
    }),

    // Study Materials (PDFs)
    getStudyMaterials: builder.query<StudyMaterial[], string>({
      query: (batchId) => `/study-materials?batchId=${batchId}`,
      providesTags: (_r, _e, batchId) => [{ type: 'StudyMaterials', id: batchId }],
    }),
    uploadStudyMaterialFile: builder.mutation<{ path: string; url: string }, FormData>({
      query: (formData) => ({ url: '/study-materials/upload', method: 'POST', body: formData }),
    }),
    createStudyMaterial: builder.mutation<StudyMaterial, CreateStudyMaterialDto>({
      query: (body) => ({ url: '/study-materials', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'StudyMaterials', id: arg.batch_id }],
    }),
    deleteStudyMaterial: builder.mutation<void, { id: string; batchId: string }>({
      query: ({ id }) => ({ url: `/study-materials/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { batchId }) => [{ type: 'StudyMaterials', id: batchId }],
    }),
    getStudyMaterialUrl: builder.query<{ url: string; expires_at: string }, string>({
      query: (id) => `/study-materials/${id}/url`,
    }),
  }),
});

export const {
  useGetTeacherUpcomingClassesQuery,
  useGetTeacherVideosQuery,
  useGetTeacherQuizScoresQuery,
  useGetVideoEngagementQuery,
  useCreateLiveClassMutation,
  useDeleteLiveClassMutation,
  useCreateVideoMutation,
  useDeleteVideoMutation,
  useGetTeacherQuizzesQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useDeleteQuizMutation,
  useGetQuizQuestionsQuery,
  useAddQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useGetTeacherEarningsQuery,
  useGetTeacherSubjectsQuery,
  useCreateSubjectMutation,
  useDeleteSubjectMutation,
  useGetTeacherBatchesQuery,
  useCreateTeacherBatchMutation,
  useGetTeacherBatchDetailQuery,
  useGetChaptersBySubjectQuery,
  useCreateChapterMutation,
  useDeleteChapterMutation,
  useGetStudyMaterialsQuery,
  useUploadStudyMaterialFileMutation,
  useCreateStudyMaterialMutation,
  useDeleteStudyMaterialMutation,
  useGetStudyMaterialUrlQuery,
} = teacherApi;
