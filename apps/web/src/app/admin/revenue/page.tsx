'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  useGetAdminTransactionsQuery,
  useRefundTransactionMutation,
  AdminTransaction,
} from '@/store/adminApi';

const STATUS_COLORS: Record<AdminTransaction['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b">
          {Array.from({ length: 7 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 rounded bg-gray-200" style={{ width: j === 0 ? '120px' : '70px' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function AdminRevenuePage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundFeedback, setRefundFeedback] = useState<Record<string, string>>({});

  const { data, isLoading, isFetching } = useGetAdminTransactionsQuery(
    { ...(status && { status }), page, limit }
  );
  const [refundTransaction] = useRefundTransactionMutation();

  const transactions = data?.transactions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  async function handleRefund(tx: AdminTransaction) {
    const confirmed = window.confirm(
      `Refund ₹${tx.finalAmount.toLocaleString('en-IN')} to ${tx.studentName}? This cannot be undone.`
    );
    if (!confirmed) return;
    setRefundingId(tx.id);
    try {
      await refundTransaction(tx.id).unwrap();
      setRefundFeedback((prev) => ({ ...prev, [tx.id]: 'Refunded' }));
    } catch {
      setRefundFeedback((prev) => ({ ...prev, [tx.id]: 'Failed' }));
    } finally {
      setRefundingId(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Revenue &amp; Transactions</h1>

        {/* Filter */}
        <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          {status && (
            <button
              onClick={() => { setStatus(''); setPage(1); }}
              className="rounded border px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Amount (₹)</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading || isFetching ? (
                <TableSkeleton />
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{tx.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">{tx.batchName ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-800">
                      ₹{tx.finalAmount.toLocaleString('en-IN')}
                      {tx.discountAmount > 0 && (
                        <span className="ml-1 text-xs text-gray-400 line-through">
                          ₹{tx.amount.toLocaleString('en-IN')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">
                      {tx.paymentMethod ?? tx.gateway}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[tx.status]}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {tx.status === 'success' && (
                        refundFeedback[tx.id] ? (
                          <span className={`text-xs font-medium ${refundFeedback[tx.id] === 'Refunded' ? 'text-green-600' : 'text-red-600'}`}>
                            {refundFeedback[tx.id]}
                          </span>
                        ) : (
                          <button
                            disabled={refundingId === tx.id}
                            onClick={() => handleRefund(tx)}
                            className="rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {refundingId === tx.id ? 'Processing…' : 'Refund'}
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="flex items-center px-2 font-medium">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
