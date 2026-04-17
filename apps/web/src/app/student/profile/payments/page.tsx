'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import apiClient from '@/../lib/api-client';
import { CreditCard, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface Transaction {
  id: string;
  batchTitle?: string;
  testSeriesTitle?: string;
  amount: number;
  finalAmount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  paymentMethod?: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  success: { label: 'Paid', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-red-600 bg-red-50' },
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  refunded: { label: 'Refunded', icon: RefreshCw, color: 'text-gray-600 bg-gray-100' },
};

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PaymentHistoryPage() {
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['payment-history'],
    queryFn: () => apiClient.get('/payments/history').then((r) => r.data),
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <CreditCard size={20} className="text-[#1a56db]" />
          Payment History
        </h1>

        {isLoading && <SkeletonLoader variant="list-item" count={5} />}

        {!isLoading && (!transactions || transactions.length === 0) && (
          <div className="rounded-xl border bg-white p-8 text-center">
            <CreditCard size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">No transactions yet.</p>
          </div>
        )}

        {!isLoading && transactions && transactions.length > 0 && (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            {transactions.map((tx, idx) => {
              const cfg = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              const itemTitle = tx.batchTitle ?? tx.testSeriesTitle ?? 'Purchase';

              return (
                <div
                  key={tx.id}
                  className={`flex items-center gap-4 px-4 py-4 ${
                    idx < transactions.length - 1 ? 'border-b' : ''
                  }`}
                >
                  {/* Status icon */}
                  <div className={`rounded-full p-2 ${cfg.color}`}>
                    <Icon size={16} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{itemTitle}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {tx.paymentMethod && ` · ${tx.paymentMethod}`}
                    </p>
                  </div>

                  {/* Amount + status */}
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatAmount(tx.finalAmount, tx.currency)}
                    </p>
                    <span className={`text-xs font-medium ${cfg.color} rounded-full px-2 py-0.5`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
