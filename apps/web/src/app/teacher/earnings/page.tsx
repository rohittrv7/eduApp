'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardSectionSkeleton } from '@/components/ui/SkeletonLoader';
import { useGetTeacherEarningsQuery } from '@/store/teacherApi';
import { formatINR } from '@/lib/utils';
import { TrendingUp, Clock, CheckCircle, Users } from 'lucide-react';

/**
 * Teacher earnings page.
 * - Total earnings, pending payout, paid-out amount (Req 32.2)
 * - Per-batch earnings breakdown (Req 32.3)
 * Requirements: 32.2, 32.3
 */
export default function TeacherEarningsPage() {
  const { data: earnings, isLoading } = useGetTeacherEarningsQuery();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <DashboardSectionSkeleton />
          <DashboardSectionSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  const total = earnings?.totalEarnings ?? 0;
  const pending = earnings?.pendingPayout ?? 0;
  const paidOut = earnings?.paidOut ?? 0;
  const breakdown = earnings?.batchBreakdown ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-gray-900">Earnings</h1>

        {/* Summary cards (Req 32.2) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm">
            <div className="rounded-lg bg-blue-50 p-3">
              <TrendingUp size={20} className="text-[#1a56db]" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">{formatINR(total)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm">
            <div className="rounded-lg bg-yellow-50 p-3">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Pending Payout</p>
              <p className="text-2xl font-bold text-yellow-600">{formatINR(pending)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm">
            <div className="rounded-lg bg-green-50 p-3">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Paid Out</p>
              <p className="text-2xl font-bold text-green-600">{formatINR(paidOut)}</p>
            </div>
          </div>
        </div>

        {/* Per-batch breakdown (Req 32.3) */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Per-Batch Breakdown</h2>

          {breakdown.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
              No earnings data yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Batch</th>
                    <th className="px-4 py-3 text-right">
                      <span className="flex items-center justify-end gap-1">
                        <Users size={12} /> Enrollments
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right">Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {breakdown.map((row) => (
                    <tr key={row.batchId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.batchTitle}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {row.enrollments.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#1a56db]">
                        {formatINR(row.earnings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-700">
                      {breakdown.reduce((s, r) => s + r.enrollments, 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#1a56db]">
                      {formatINR(total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        <p className="text-xs text-gray-400">
          Earnings are calculated based on your configured revenue share percentage per batch.
          Contact admin for payout requests.
        </p>
      </div>
    </DashboardLayout>
  );
}
