import { baseApi } from './api';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  isImportant?: boolean;
}

export const announcementsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnnouncements: builder.query<Announcement[], void>({
      query: () => '/announcements',
      providesTags: ['Announcements'],
    }),
    markAnnouncementRead: builder.mutation<void, string>({
      query: (id) => ({ url: `/announcements/${id}/read`, method: 'POST' }),
      invalidatesTags: ['Announcements'],
    }),
  }),
});

export const { useGetAnnouncementsQuery, useMarkAnnouncementReadMutation } = announcementsApi;
