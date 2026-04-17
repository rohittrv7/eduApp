import { baseApi } from './api';

export interface SearchBatch {
  id: string;
  title: string;
  thumbnail: string;
  teacherName: string;
  price: number;
  rating: number;
  ratingCount: number;
  isFree: boolean;
}

export interface SearchVideo {
  id: string;
  title: string;
  thumbnail: string;
  batchTitle: string;
  durationSeconds: number;
}

export interface SearchTeacher {
  id: string;
  fullName: string;
  photo?: string;
  subject: string;
  enrolledCount: number;
  slug: string;
}

export interface SearchTest {
  id: string;
  title: string;
  subject: string;
  questionCount: number;
  durationMins: number;
}

export interface SearchResults {
  batches: SearchBatch[];
  videos: SearchVideo[];
  teachers: SearchTeacher[];
  tests: SearchTest[];
}

export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    search: builder.query<SearchResults, string>({
      query: (q) => `/search?q=${encodeURIComponent(q)}`,
    }),
  }),
});

export const { useSearchQuery } = searchApi;
