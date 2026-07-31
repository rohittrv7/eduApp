import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

export const tokenStorage = {
  getAccess: () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null),
  getRefresh: () => (typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null),
  setAccess: (t: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, t);
    // Cookie for Next.js middleware — 7 days so page reloads don't lose auth
    // Middleware reads this for route protection; API calls use Authorization header
    document.cookie = `access_token=${t}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  },
  setRefresh: (t: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REFRESH_KEY, t);
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    // Clear cookies with explicit past expiration
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
  },
};

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return 'https://eduapp-1-tqo2.onrender.com/api/v1';
  }
  return 'http://localhost:3001/api/v1';
}

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: false, // tokens via Authorization header, not cookies
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token and dynamic baseURL to every request
apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Dev monitoring interceptor
if (process.env.NODE_ENV === 'development') {
  apiClient.interceptors.request.use((config) => {
    (config as any)._startTime = Date.now();
    return config;
  });
  apiClient.interceptors.response.use(
    (response) => {
      const duration = Date.now() - ((response.config as any)._startTime ?? Date.now());
      import('@/components/dev/DevMonitor').then(({ devLog }) => {
        devLog.api(
          response.config.method?.toUpperCase() ?? 'GET',
          response.config.url ?? '',
          response.status,
          duration,
          response.config.data ? (() => { try { return JSON.parse(response.config.data); } catch { return response.config.data; } })() : undefined,
          response.data,
        );
      });
      return response;
    },
    (error: AxiosError) => {
      const duration = Date.now() - ((error.config as any)?._startTime ?? Date.now());
      import('@/components/dev/DevMonitor').then(({ devLog }) => {
        devLog.api(
          error.config?.method?.toUpperCase() ?? 'GET',
          error.config?.url ?? '',
          error.response?.status ?? 0,
          duration,
          error.config?.data ? (() => { try { return JSON.parse(error.config!.data); } catch { return error.config?.data; } })() : undefined,
          error.response?.data,
        );
      });
      return Promise.reject(error);
    },
  );
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: AxiosError | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(undefined);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenStorage.getRefresh();
        if (!refreshToken) throw new Error('No refresh token');

        // Send refresh token in body since we're not using cookies
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } },
        );

        const newAccessToken = res.data?.accessToken as string;
        if (newAccessToken) {
          tokenStorage.setAccess(newAccessToken); // updates both localStorage + cookie
        }

        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        tokenStorage.clear();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login?message=session_expired';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
