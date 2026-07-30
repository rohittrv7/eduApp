'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useGetAdminDashboardQuery, useGetAdminStudentsQuery } from '@/store/adminApi';
import { baseApi } from '@/store/api';
import { useAppDispatch } from '@/store/store';

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
function RevenueBarChart({ data }: { data: Array<{ date: string; amount: number }> }) {
  const chartH = 120;

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
        <svg viewBox="0 0 300 80" className="w-full max-w-sm opacity-10">
          {Array.from({ length: 30 }, (_, i) => (
            <rect key={i} x={i * 10} y={20 + Math.random() * 40} width={8} height={40} fill="#1a56db" rx={2} />
          ))}
        </svg>
        <p className="mt-3 text-sm font-medium">No revenue data available</p>
        <p className="text-xs text-gray-300 mt-1">Revenue chart will populate as students enroll</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.amount), 1);
  const barW = Math.max(4, Math.floor(560 / data.length) - 2);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${data.length * (barW + 2)} ${chartH + 24}`}
        className="w-full"
        style={{ minWidth: `${data.length * (barW + 2)}px` }}
        aria-label="30-day daily revenue chart"
      >
        {data.map((d, i) => {
          const barH = Math.max(2, (d.amount / max) * chartH);
          const x = i * (barW + 2);
          const y = chartH - barH;
          return (
            <g key={d.date}>
              <rect x={x} y={y} width={barW} height={barH} fill="#1a56db" opacity={0.85} rx={2}>
                <title>{d.date}: ₹{d.amount.toLocaleString('en-IN')}</title>
              </rect>
              {i % 7 === 0 && (
                <text x={x + barW / 2} y={chartH + 16} textAnchor="middle" fontSize={8} fill="#6b7280">
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function MetricCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-3 h-4 w-24 rounded bg-gray-200" />
      <div className="h-8 w-32 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-20 rounded bg-gray-100" />
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({
  label, value, sub, prefix = '', color = 'blue',
}: {
  label: string; value: number | string; sub?: string; prefix?: string; color?: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
  };
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 inline-block rounded-lg px-3 py-1 text-2xl font-bold ${colors[color]}`}>
        {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </p>
      {sub && <p className="mt-2 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);

  const { data, isLoading } = useGetAdminDashboardQuery(undefined, {
    pollingInterval: 300000,
  });

  const { data: studentsData } = useGetAdminStudentsQuery({ page: 1, limit: 1 });
  const totalStudents = studentsData?.total ?? 0;

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001';
    try {
      const socket = io(`${apiUrl}/admin`, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 3,
        timeout: 5000,
      });
      socketRef.current = socket;
      socket.on('revenue:update', () => {
        dispatch(baseApi.util.invalidateTags(['AdminDashboard']));
      });
      socket.on('connect_error', () => {
        // Socket unavailable — silently ignore, polling handles refresh
        socket.disconnect();
      });
    } catch {
      // Socket.io not available — ignore
    }
    return () => { socketRef.current?.disconnect(); };
  }, [dispatch]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)}
          </div>
          <div className="animate-pulse rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-4 h-4 w-40 rounded bg-gray-200" />
            <div className="h-36 rounded bg-gray-100" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const revenue = data?.revenue ?? { today: 0, week: 0, month: 0 };
  const enrollments = data?.newEnrollments ?? { today: 0, week: 0, month: 0 };
  const activeSubscriptions = data?.activeSubscriptions ?? 0;
  const dailyRevenue = data?.dailyRevenue ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Live</span>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Today's Revenue"
            value={revenue.today}
            prefix="₹"
            sub={`This week: ₹${revenue.week.toLocaleString('en-IN')} · This month: ₹${revenue.month.toLocaleString('en-IN')}`}
            color="green"
          />
          <MetricCard
            label="Active Subscriptions"
            value={activeSubscriptions}
            color="blue"
          />
          <MetricCard
            label="Today's New Enrollments"
            value={enrollments.today}
            sub={`This week: ${enrollments.week} · This month: ${enrollments.month}`}
            color="purple"
          />
          <MetricCard
            label="Total Students"
            value={totalStudents}
            color="orange"
          />
        </div>

        {/* Revenue Chart */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">30-Din ki Daily Revenue</h2>
            {dailyRevenue.length > 0 && (
              <span className="text-xs text-gray-400">
                Total: ₹{dailyRevenue.reduce((s, d) => s + d.amount, 0).toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <RevenueBarChart data={dailyRevenue} />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Students', href: '/admin/students', emoji: '👨‍🎓' },
            { label: 'Live Classes', href: '/admin/live-classes', emoji: '📺' },
            { label: 'Revenue', href: '/admin/revenue', emoji: '💰' },
            { label: 'Settings', href: '/admin/settings', emoji: '⚙️' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-2 rounded-xl border bg-white p-4 shadow-sm transition-colors hover:bg-blue-50 hover:border-blue-200"
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
