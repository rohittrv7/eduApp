import { baseApi } from './api';

export interface Video {
  id: string;
  title: string;
  thumbnail?: string;
  durationSeconds: number;
  progressPercent?: number;
  isLocked?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  name?: string;
  order: number;
  videos: Video[];
}

export interface Subject {
  id: string;
  title: string;
  name?: string;
  chapters: Chapter[];
}

export interface BatchSummary {
  id: string;
  name: string;
  slug: string;
  thumbnail?: string | null;
  price: number;
  is_free: boolean;
  description?: string;
  target_exam?: string;
  language?: string;
}

export interface BatchDetail {
  id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string | null;
  price: number;
  is_free: boolean;
  target_exam?: string;
  language?: string;
  isEnrolled: boolean;
  subjects?: Subject[];
  progressPercent?: number;
}

export interface LiveClass {
  id: string;
  title: string;
  description?: string | null;
  youtube_url?: string | null;
  youtube_video_id?: string | null;
  scheduled_at: string;
  started_at?: string | null;
  ended_at?: string | null;
  status: string;
  recording_url?: string | null;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  transactionId: string;
}

export interface StudyMaterialItem {
  id: string;
  title: string;
  type: 'pdf' | 'image' | 'text';
  file_url?: string | null;
  is_free_preview: boolean;
  created_at: string;
}

export const batchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // All batches (explore)
    getAllBatches: builder.query<BatchSummary[], void>({
      query: () => '/batches',
      transformResponse: (r: any) => r.data ?? [],
      providesTags: ['Batch' as any],
    }),

    // Enrolled batches for current student
    getEnrolledBatches: builder.query<BatchSummary[], void>({
      query: () => '/batches/enrolled',
      transformResponse: (r: any) => (Array.isArray(r) ? r : r.data ?? []),
      providesTags: ['EnrolledBatch' as any],
    }),

    // Batch detail by slug or id
    getBatchDetail: builder.query<BatchDetail, string>({
      query: (slugOrId) => `/batches/${slugOrId}`,
      transformResponse: (r: any): BatchDetail => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        thumbnail: r.thumbnail,
        price: Number(r.price ?? 0),
        is_free: r.is_free ?? false,
        target_exam: r.target_exam,
        language: r.language,
        isEnrolled: r.isEnrolled ?? false,
        subjects: r.subjects ?? [],
        progressPercent: r.progressPercent ?? 0,
      }),
      providesTags: (_r, _e, id) => [{ type: 'BatchDetail' as any, id }],
    }),

    // Live classes for a batch
    getBatchLiveClasses: builder.query<LiveClass[], string>({
      query: (batchId) => `/live-classes?batchId=${batchId}`,
      transformResponse: (r: any) => (Array.isArray(r) ? r : []),
    }),

    // Enroll in free batch
    enrollFreeBatch: builder.mutation<void, string>({
      query: (batchId) => ({ url: `/batches/${batchId}/enroll`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'BatchDetail' as any, id },
        'EnrolledBatch' as any,
      ],
    }),

    // Create Razorpay payment order
    createPaymentOrder: builder.mutation<PaymentOrder, { batch_id: string; coupon_code?: string }>({
      query: (body) => ({ url: '/payments/order', method: 'POST', body }),
    }),

    // Study materials for a batch (student view)
    getBatchStudyMaterials: builder.query<StudyMaterialItem[], string>({
      query: (batchId) => `/study-materials?batchId=${batchId}`,
      transformResponse: (r: any) => (Array.isArray(r) ? r : []),
    }),

    // Get signed URL for a study material
    getStudyMaterialUrl: builder.query<{ url: string; expires_at: string }, string>({
      query: (id) => `/study-materials/${id}/url`,
    }),
  }),
});

export const {
  useGetAllBatchesQuery,
  useGetEnrolledBatchesQuery,
  useGetBatchDetailQuery,
  useGetBatchLiveClassesQuery,
  useEnrollFreeBatchMutation,
  useCreatePaymentOrderMutation,
  useGetBatchStudyMaterialsQuery,
  useGetStudyMaterialUrlQuery,
} = batchApi;
