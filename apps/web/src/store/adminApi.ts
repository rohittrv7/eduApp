import { baseApi } from './api';

export interface AdminTeacher {
  id: string;
  fullName: string;
  mobile: string | null;
  email: string | null;
  isBanned: boolean;
  batchCount: number;
  joinedAt: string;
}

export interface AdminTeachersResponse {
  teachers: AdminTeacher[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminDashboardData {
  revenue: {
    today: number;
    week: number;
    month: number;
  };
  activeSubscriptions: number;
  newEnrollments: {
    today: number;
    week: number;
    month: number;
  };
  dailyRevenue: Array<{ date: string; amount: number }>;
}

export interface AdminStudent {
  id: string;
  fullName: string;
  mobile: string;
  email?: string;
  skillLevel: string;
  lastActive: string;
  totalWatchTimeSecs: number;
  quizScore: number;
  enrollmentCount: number;
  isBanned: boolean;
}

export interface AdminStudentsResponse {
  students: AdminStudent[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminStudentsParams {
  skillLevel?: string;
  lastActiveFrom?: string;
  lastActiveTo?: string;
  enrollmentStatus?: string;
  page?: number;
  limit?: number;
}

export interface AdminLiveClass {
  id: string;
  title: string;
  batchTitle: string;
  teacherName: string;
  scheduledAt: string;
  status: 'scheduled' | 'pending_approval' | 'approved' | 'active' | 'ended' | 'rejected';
  youtubeUrl?: string;
  youtubeVideoId?: string;
}

export interface ActivateLiveClassBody {
  youtubeUrl: string;
  youtubeVideoId: string;
  title: string;
}

export interface AdminTransaction {
  id: string;
  studentName: string;
  batchName?: string;
  amount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod?: string;
  gateway: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  createdAt: string;
}

export interface AdminTransactionsResponse {
  transactions: AdminTransaction[];
  total: number;
  page: number;
  limit: number;
}

export type ContentType = 'chat_message' | 'doubt' | 'doubt_reply';

export interface FlaggedContent {
  id: string;
  type: ContentType;
  content: string;
  authorName: string;
  createdAt: string;
  isHidden: boolean;
  context?: string;
}

export interface FlaggedContentResponse {
  items: FlaggedContent[];
  total: number;
  page: number;
  limit: number;
}

export interface PlatformSettings {
  platformName: string;
  logoUrl: string;
  brandingColor: string;
  contactEmail: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };
  smsGateway: string;
  smsApiKey: string;
  paymentGateway: string;
  razorpayKeyId: string;
  razorpayWebhookSecret: string;
  fcmServerKey: string;
  skillThresholds: {
    basic: number;
    intermediate: number;
    advanced: number;
    pro: number;
  };
  referralRewardType: 'coupon' | 'cashback';
  referralRewardValue: number;
  attendanceWarningThreshold: number;
  maintenanceMode: boolean;
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query<AdminDashboardData, void>({
      query: () => '/admin/dashboard',
      providesTags: ['AdminDashboard'],
    }),

    getAdminStudents: builder.query<AdminStudentsResponse, AdminStudentsParams>({
      query: (params) => ({
        url: '/admin/students',
        params,
      }),
      providesTags: ['AdminStudents'],
    }),

    banStudent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/students/${id}/ban`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminStudents'],
    }),

    unbanStudent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/students/${id}/unban`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminStudents'],
    }),

    warnStudent: builder.mutation<void, { id: string; message: string }>({
      query: ({ id, message }) => ({
        url: `/admin/students/${id}/warn`,
        method: 'POST',
        body: { message },
      }),
    }),

    invalidateStudentSessions: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/admin/sessions/${userId}/invalidate`,
        method: 'POST',
      }),
    }),

    changeUserRole: builder.mutation<void, { id: string; role: string }>({
      query: ({ id, role }) => ({
        url: `/admin/users/${id}/role`,
        method: 'POST',
        body: { role },
      }),
      invalidatesTags: ['AdminStudents', 'AdminTeachers'],
    }),

    getAdminTeachers: builder.query<AdminTeachersResponse, { page?: number; limit?: number } | void>({
      query: (params) => ({ url: '/admin/teachers', ...(params ? { params } : {}) }),
      providesTags: ['AdminTeachers'],
    }),

    getTeacherEarnings: builder.query<{ teacherId: string; totalEarnings: number; transactions: any[] }, string>({
      query: (id) => `/admin/teachers/${id}/earnings`,
    }),

    createTeacherPayout: builder.mutation<void, { id: string; amount: number }>({
      query: ({ id, amount }) => ({
        url: `/admin/teachers/${id}/payout`,
        method: 'POST',
        body: { amount },
      }),
    }),

    demoteTeacher: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/users/${id}/role`,
        method: 'POST',
        body: { role: 'student' },
      }),
      invalidatesTags: ['AdminTeachers'],
    }),

    getAdminLiveClasses: builder.query<AdminLiveClass[], { status?: string } | void>({
      query: (params) => {
        const p = params || undefined;
        return { url: '/admin/live-classes', ...(p ? { params: p } : {}) };
      },
      providesTags: ['AdminLiveClasses'],
    }),

    approveLiveClass: builder.mutation<void, string>({
      query: (id) => ({
        url: `/live-classes/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminLiveClasses'],
    }),

    rejectLiveClass: builder.mutation<void, string>({
      query: (id) => ({
        url: `/live-classes/${id}/reject`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminLiveClasses'],
    }),

    activateLiveClass: builder.mutation<void, ActivateLiveClassBody>({
      query: (body) => ({
        url: '/live-classes',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminLiveClasses'],
    }),

    deactivateLiveClass: builder.mutation<void, string>({
      query: (id) => ({
        url: `/live-classes/${id}/end`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminLiveClasses'],
    }),

    getAdminTransactions: builder.query<AdminTransactionsResponse, { status?: string; page?: number; limit?: number } | void>({
      query: (params) => {
        const p = params || undefined;
        return { url: '/payments/transactions', ...(p ? { params: p } : {}) };
      },
      providesTags: ['AdminTransactions'],
    }),

    refundTransaction: builder.mutation<void, string>({
      query: (transactionId) => ({
        url: `/payments/refund/${transactionId}`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminTransactions'],
    }),

    getFlaggedContent: builder.query<FlaggedContentResponse, { type?: string; page?: number; limit?: number } | void>({
      query: (params) => {
        const p = params || undefined;
        return { url: '/admin/content/flagged', ...(p ? { params: p } : {}) };
      },
      providesTags: ['AdminModeration'],
    }),

    hideContent: builder.mutation<void, { type: ContentType; id: string }>({
      query: ({ type, id }) => ({
        url: `/admin/content/${type}/${id}/hide`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminModeration'],
    }),

    deleteContent: builder.mutation<void, { type: ContentType; id: string }>({
      query: ({ type, id }) => ({
        url: `/admin/content/${type}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminModeration'],
    }),

    getPlatformSettings: builder.query<PlatformSettings, void>({
      query: () => '/admin/settings',
      providesTags: ['AdminSettings'],
    }),

    updatePlatformSettings: builder.mutation<PlatformSettings, Partial<PlatformSettings>>({
      query: (body) => ({
        url: '/admin/settings',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminSettings'],
    }),

    toggleMaintenanceMode: builder.mutation<void, { enabled: boolean }>({
      query: (body) => ({
        url: '/admin/maintenance',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminSettings'],
    }),

    manualEnroll: builder.mutation<{ message: string }, { studentId: string; batchId: string }>({
      query: (body) => ({
        url: '/admin/enrollments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminStudents'],
    }),

    getAdminBatches: builder.query<{ data: { id: string; name: string }[]; total: number }, void>({
      query: () => '/batches',
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetAdminStudentsQuery,
  useBanStudentMutation,
  useUnbanStudentMutation,
  useWarnStudentMutation,
  useInvalidateStudentSessionsMutation,
  useChangeUserRoleMutation,
  useGetAdminTeachersQuery,
  useGetTeacherEarningsQuery,
  useCreateTeacherPayoutMutation,
  useDemoteTeacherMutation,
  useGetAdminLiveClassesQuery,
  useApproveLiveClassMutation,
  useRejectLiveClassMutation,
  useActivateLiveClassMutation,
  useDeactivateLiveClassMutation,
  useGetAdminTransactionsQuery,
  useRefundTransactionMutation,
  useGetFlaggedContentQuery,
  useHideContentMutation,
  useDeleteContentMutation,
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
  useToggleMaintenanceModeMutation,
  useManualEnrollMutation,
  useGetAdminBatchesQuery,
} = adminApi;
