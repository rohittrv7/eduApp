import { baseApi } from './api';

export interface WatchSession {
  videoId: string;
  title: string;
  thumbnail: string;
  lastPosition: number;
  durationSeconds: number;
  progressPercent: number;
}

export interface LiveClass {
  id: string;
  title: string;
  scheduledAt: string;
  batchTitle: string;
  status: string;
}

export interface EnrolledBatch {
  id: string;
  title: string;
  thumbnail: string;
  teacherName: string;
  progressPercent: number;
  price: number;
  rating: number;
}

export interface QuizAttempt {
  id: string;
  quizTitle: string;
  score: number;
  totalMarks: number;
  attemptedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  photo?: string;
  score: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  myRank: number | null;
  myScore: number | null;
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRecentWatchSessions: builder.query<WatchSession[], void>({
      query: () => '/videos/watch-sessions/recent',
    }),
    getUpcomingLiveClasses: builder.query<LiveClass[], void>({
      query: () => '/live-classes?status=approved&upcoming=true',
    }),
    getEnrolledBatches: builder.query<EnrolledBatch[], void>({
      query: () => '/batches/enrolled',
    }),
    getRecentQuizAttempts: builder.query<QuizAttempt[], void>({
      query: () => '/quizzes/attempts/recent',
    }),
    getUnreadNotifications: builder.query<Notification[], void>({
      query: () => '/notifications?unread=true',
    }),
    getLeaderboard: builder.query<LeaderboardResponse, void>({
      query: () => '/leaderboard',
      transformResponse: (raw: any): LeaderboardResponse => ({
        entries: (raw.entries ?? []).map((e: any) => ({
          rank: e.rank,
          userId: e.id ?? e.userId,
          fullName: e.full_name ?? e.fullName ?? 'Student',
          photo: e.profile_photo ?? e.photo,
          score: e.cumulative_score ?? e.score ?? 0,
        })),
        myRank: raw.myRank ?? null,
        myScore: raw.myScore ?? null,
      }),
    }),
  }),
});

export const {
  useGetRecentWatchSessionsQuery,
  useGetUpcomingLiveClassesQuery,
  useGetEnrolledBatchesQuery,
  useGetRecentQuizAttemptsQuery,
  useGetUnreadNotificationsQuery,
  useGetLeaderboardQuery,
} = dashboardApi;
