'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useAuthStore } from '@/stores/auth.store';
import { useGetLeaderboardQuery } from '@/store/dashboardApi';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="w-7 text-center text-[12px] font-bold text-gray-400">{rank}</span>;
}

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useGetLeaderboardQuery();

  const entries = (data?.entries ?? []).slice(0, 10);
  const myRank = data?.myRank;
  const myScore = data?.myScore;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <h1 className="text-[18px] font-bold text-gray-900">Leaderboard</h1>
        </div>

        {/* My rank card */}
        {myRank && (
          <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a56db] text-sm font-bold text-white shadow">
              {(user?.fullName?.trim() || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-gray-500">Your Rank</p>
              <p className="text-[22px] font-extrabold leading-tight text-[#1a56db]">#{myRank}</p>
            </div>
            {myScore != null && (
              <span className="rounded-xl bg-white px-3 py-1.5 text-[13px] font-bold text-gray-700 shadow-sm">
                {myScore} pts
              </span>
            )}
          </div>
        )}

        {isLoading && <SkeletonLoader variant="list-item" count={10} />}

        {!isLoading && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {entries.length === 0 && (
              <p className="py-12 text-center text-sm text-gray-400">No entries yet</p>
            )}
            {entries.map((entry, idx) => {
              const isMe = entry.userId === user?.id;
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-b-0 ${isMe ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <div className="flex w-8 justify-center">
                    <RankBadge rank={entry.rank} />
                  </div>

                  {/* Avatar */}
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a56db] text-[12px] font-bold text-white shadow-sm">
                    {entry.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.photo}
                        alt={entry.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (entry.fullName?.trim() || 'S').charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="flex flex-1 items-center gap-1.5 min-w-0">
                    <span
                      className={`truncate text-[13px] font-semibold ${isMe ? 'text-[#1a56db]' : 'text-gray-900'}`}
                    >
                      {entry.fullName || 'Student'}
                    </span>
                    {isMe && (
                      <span className="flex-shrink-0 rounded-md bg-[#1a56db] px-1.5 py-0.5 text-[9px] font-bold text-white">
                        Me
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[13px] font-bold ${isMe ? 'text-[#1a56db]' : 'text-gray-700'}`}
                  >
                    {entry.score} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
