'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/../lib/api-client';

interface FollowButtonProps {
  teacherId: string;
  isAuthenticated: boolean;
  initialFollowing?: boolean;
}

export function FollowButton({ teacherId, isAuthenticated, initialFollowing = false }: FollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function handleFollow() {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/users/${teacherId}/follow`);
      setFollowing((prev) => !prev);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
        following
          ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          : 'bg-[#1a56db] text-white hover:bg-blue-700'
      }`}
    >
      {loading ? '...' : following ? 'Following' : 'Follow'}
    </button>
  );
}
