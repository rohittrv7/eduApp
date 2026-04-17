'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import apiClient from '@/../lib/api-client';

interface EnrollButtonProps {
  batchId: string;
  batchSlug: string;
  price: number;
  isFree: boolean;
  isAuthenticated: boolean;
}

export function EnrollButton({ batchId, batchSlug, price, isFree, isAuthenticated }: EnrollButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleEnroll() {
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=/batches/${batchSlug}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isFree || price === 0) {
        await apiClient.post(`/batches/${batchId}/enroll`);
        router.push('/student/dashboard');
      } else {
        // Initiate payment flow
        const { data } = await apiClient.post('/payments/order', { batchId });
        // Redirect to payment page or open Razorpay
        router.push(`/payment?orderId=${data.orderId}&batchId=${batchId}`);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="w-full rounded-xl bg-[#1a56db] py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {loading ? 'Processing...' : isFree || price === 0 ? 'Enroll Now — Free' : 'Buy Now'}
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
