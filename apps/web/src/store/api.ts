import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { tokenStorage } from '../../lib/api-client';

export const baseApi = createApi({
  reducerPath: 'api',
  tagTypes: ['Announcements', 'Leaderboard', 'Notifications', 'Doubts', 'AdminDashboard', 'AdminStudents', 'AdminTeachers', 'AdminLiveClasses', 'AdminTransactions', 'AdminModeration', 'AdminSettings', 'TeacherLiveClasses', 'TeacherVideos', 'TeacherQuizzes', 'TeacherQuizQuestions', 'TeacherSubjects', 'TeacherBatches', 'TeacherBatchDetail', 'BatchDetail', 'StudyMaterials', 'Batch', 'EnrolledBatch'],
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    prepareHeaders: (headers) => {
      const token = tokenStorage.getAccess();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
    responseHandler: async (response) => {
      if (response.status === 401) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login?message=session_expired';
        }
        return { __unauthorized: true };
      }
      return response.json();
    },
  }),
  endpoints: () => ({}),
});
