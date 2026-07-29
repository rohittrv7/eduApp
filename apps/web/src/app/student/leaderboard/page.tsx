'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useAuthStore } from '@/stores/auth.store';
import { useGetLeaderboardQuery } from '@/store/dashboardApi';
import { Trophy, Medal } from 'lucide-react';

const RANK_COLORS: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-amber-600',
};

export default function LeaderboardPage() {
  const { user } = useAuthStore();

  // RTK Query — cached 5 min via keepUnusedDataFor (Req 7.2)
  const { data, isLoading } = useGetLeaderboardQuery();

  // Top 10 entries (Req 7.1)
  const entries = (data?.entries ?? []).slice(0, 10);
  const myRank = data?.myRank;
  const myScore = data?.myScore;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Trophy size={20} className="text-yellow-500" />
          Leaderboard
        </h1>

        {/* My rank card — always shown even if outside top 10 (Req 7.3) */}
        {myRank && (
          <div className="rounded-xl border border-[#1a56db] bg-blue-50 p-4">
            <p className="text-sm text-gray-600">Your Rank</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-[#1a56db]">#{myRank}</span>
              {myScore !== null && myScore !== undefined && (
                <span className="text-sm font-medium text-gray-700">{myScore} pts</span>
              )}
            </div>
          </div>
        )}

        {isLoading && <SkeletonLoader variant="list-item" count={10} />}

        {!isLoading && (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            {entries.map((entry) => {
              // Highlight current user's row (Req 7.3)
              const isCurrentUser = entry.userId === user?.id || (user?.email && entry.fullName?.toLowerCase().includes(user.email.split('@')[0]?.toLowerCase()));
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 border-b px-4 py-3 last:border-b-0 ${
                    isCurrentUser ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Rank with medal for top 3 */}
                  <div className="w-8 text-center">
                    {entry.rank <= 3 ? (
                      <Medal
                        size={20}
                        className={RANK_COLORS[entry.rank] ?? 'text-gray-400'}
                      />
                    ) : (
                      <span className="text-sm font-bold text-gray-500">{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar — no mobile/email shown (Req 7.4) */}
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a56db] text-sm font-bold text-white">
                    {entry.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.photo}
                        alt={entry.fullName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      (entry.fullName?.trim() || 'S').charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Display name only (Req 7.4) */}
                  <span
                    className={`flex-1 text-sm font-medium ${
                      isCurrentUser ? 'font-bold text-[#1a56db]' : 'text-gray-900'
                    }`}
                  >
                    {entry.fullName || 'Student'}
                    {isCurrentUser && (
                      <span className="ml-2 rounded-md bg-blue-100 px-1.5 py-0.5 text-xs font-bold text-[#1a56db]">
                        (Me)
                      </span>
                    )}
                  </span>

                  {/* Score */}
                  <span className="text-sm font-bold text-gray-700">{entry.score} pts</span>
                </div>
              );
            })}

            {entries.length === 0 && (
              <p className="py-8 text-center text-gray-400">No entries yet</p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
