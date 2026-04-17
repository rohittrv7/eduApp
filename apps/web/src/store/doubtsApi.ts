import { baseApi } from './api';

export interface DoubtAuthor {
  id: string;
  fullName: string;
  profilePhoto?: string;
  role: string;
}

export interface DoubtReply {
  id: string;
  text: string;
  imageUrl?: string;
  author: DoubtAuthor;
  createdAt: string;
}

export interface Doubt {
  id: string;
  text: string;
  imageUrl?: string;
  status: 'open' | 'resolved';
  upvotes: number;
  videoId?: string;
  chapterId?: string;
  student: DoubtAuthor;
  replies?: DoubtReply[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDoubtPayload {
  text: string;
  imageUrl?: string;
  videoId?: string;
  chapterId?: string;
}

export const doubtsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDoubts: builder.query<Doubt[], { videoId?: string; chapterId?: string }>({
      query: ({ videoId, chapterId } = {}) => {
        const params = new URLSearchParams();
        if (videoId) params.set('videoId', videoId);
        if (chapterId) params.set('chapterId', chapterId);
        return `/doubts?${params.toString()}`;
      },
      providesTags: ['Doubts'],
    }),
    getDoubt: builder.query<Doubt, string>({
      query: (id) => `/doubts/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Doubts', id }],
    }),
    createDoubt: builder.mutation<Doubt, CreateDoubtPayload>({
      query: (body) => ({ url: '/doubts', method: 'POST', body }),
      invalidatesTags: ['Doubts'],
    }),
    replyToDoubt: builder.mutation<DoubtReply, { id: string; text: string; imageUrl?: string }>({
      query: ({ id, text, imageUrl }) => ({
        url: `/doubts/${id}/reply`,
        method: 'POST',
        body: { text, image_url: imageUrl },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Doubts', id }, 'Doubts'],
    }),
    upvoteDoubt: builder.mutation<void, string>({
      query: (id) => ({ url: `/doubts/${id}/upvote`, method: 'POST' }),
      invalidatesTags: ['Doubts'],
    }),
    resolveDoubt: builder.mutation<Doubt, string>({
      query: (id) => ({ url: `/doubts/${id}/resolve`, method: 'PATCH' }),
      invalidatesTags: ['Doubts'],
    }),
  }),
});

export const {
  useGetDoubtsQuery,
  useGetDoubtQuery,
  useCreateDoubtMutation,
  useReplyToDoubtMutation,
  useUpvoteDoubtMutation,
  useResolveDoubtMutation,
} = doubtsApi;
