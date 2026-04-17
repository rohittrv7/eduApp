'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import apiClient from '@/../lib/api-client';
import { BarChart2 } from 'lucide-react';

interface DayProgress {
  date: string;       // ISO date
  quizScore: number;  // 0-100
  watchTimeSecs: number;
}

interface WeekProgress {
  weekLabel: string;  // e.g. "Week 1"
  quizScore: number;
  watchTimeSecs: number;
}

interface WeeklyReport {
  days: DayProgress[];
  skillLevel: string;
  cumulativeScore: number;
}

interface MonthlyReport {
  weeks: WeekProgress[];
  skillLevel: string;
  cumulativeScore: number;
}

const SKILL_LEVELS = ['basic', 'intermediate', 'advanced', 'pro'];
const SKILL_COLORS: Record<string, string> = {
  basic: '#9ca3af',
  intermediate: '#3b82f6',
  advanced: '#8b5cf6',
  pro: '#f59e0b',
};

function formatWatchTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Simple bar chart rendered with divs */
function BarChart({
  data,
  labelKey,
  quizKey,
  watchKey,
}: {
  data: Record<string, number | string>[];
  labelKey: string;
  quizKey: string;
  watchKey: string;
}) {
  const maxQuiz = Math.max(...data.map((d) => Number(d[quizKey]) || 0), 1);
  const maxWatch = Math.max(...data.map((d) => Number(d[watchKey]) || 0), 1);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded bg-[#1a56db]" /> Quiz Score (%)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded bg-green-400" /> Watch Time
        </span>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-end gap-0.5" style={{ height: 80 }}>
              {/* Quiz bar */}
              <div
                className="flex-1 rounded-t bg-[#1a56db] transition-all"
                style={{ height: `${(Number(d[quizKey]) / maxQuiz) * 100}%` }}
                title={`Quiz: ${d[quizKey]}%`}
              />
              {/* Watch bar */}
              <div
                className="flex-1 rounded-t bg-green-400 transition-all"
                style={{ height: `${(Number(d[watchKey]) / maxWatch) * 100}%` }}
                title={`Watch: ${formatWatchTime(Number(d[watchKey]))}`}
              />
            </div>
            <span className="text-[10px] text-gray-500 truncate w-full text-center">
              {String(d[labelKey])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProgressReportsPage() {
  const [tab, setTab] = useState<'weekly' | 'monthly'>('weekly');

  const { data: weekly, isLoading: wLoading } = useQuery<WeeklyReport>({
    queryKey: ['progress', 'weekly'],
    queryFn: () => apiClient.get('/users/me/progress/weekly').then((r) => r.data),
  });

  const { data: monthly, isLoading: mLoading } = useQuery<MonthlyReport>({
    queryKey: ['progress', 'monthly'],
    queryFn: () => apiClient.get('/users/me/progress/monthly').then((r) => r.data),
  });

  const isLoading = tab === 'weekly' ? wLoading : mLoading;
  const skillLevel = (tab === 'weekly' ? weekly?.skillLevel : monthly?.skillLevel) ?? 'basic';
  const cumulativeScore = (tab === 'weekly' ? weekly?.cumulativeScore : monthly?.cumulativeScore) ?? 0;

  // Map days to chart-compatible format
  const weeklyChartData = (weekly?.days ?? []).map((d) => ({
    label: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
    quiz: d.quizScore,
    watch: d.watchTimeSecs,
  }));

  const monthlyChartData = (monthly?.weeks ?? []).map((w) => ({
    label: w.weekLabel,
    quiz: w.quizScore,
    watch: w.watchTimeSecs,
  }));

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <BarChart2 size={20} className="text-[#1a56db]" />
          Progress Reports
        </h1>

        {/* Skill Level Card */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">Current Skill Level</p>
          <div className="flex items-center gap-3">
            <span
              className="rounded-full px-4 py-1 text-sm font-bold capitalize text-white"
              style={{ backgroundColor: SKILL_COLORS[skillLevel] ?? '#9ca3af' }}
            >
              {skillLevel}
            </span>
            <span className="text-sm text-gray-500">{cumulativeScore} pts total</span>
          </div>
          {/* Skill progression bar */}
          <div className="mt-4 flex gap-1">
            {SKILL_LEVELS.map((level) => {
              const idx = SKILL_LEVELS.indexOf(level);
              const currentIdx = SKILL_LEVELS.indexOf(skillLevel);
              return (
                <div key={level} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="h-2 w-full rounded-full"
                    style={{
                      backgroundColor:
                        idx <= currentIdx ? SKILL_COLORS[level] : '#e5e7eb',
                    }}
                  />
                  <span className="text-[10px] capitalize text-gray-400">{level}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl border bg-white p-1 shadow-sm">
          {(['weekly', 'monthly'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-[#1a56db] text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'weekly' ? 'Weekly (7 days)' : 'Monthly (4 weeks)'}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          {isLoading ? (
            <SkeletonLoader variant="card" count={1} />
          ) : tab === 'weekly' ? (
            weeklyChartData.length > 0 ? (
              <BarChart
                data={weeklyChartData}
                labelKey="label"
                quizKey="quiz"
                watchKey="watch"
              />
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">No data for this week yet.</p>
            )
          ) : monthlyChartData.length > 0 ? (
            <BarChart
              data={monthlyChartData}
              labelKey="label"
              quizKey="quiz"
              watchKey="watch"
            />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No data for this month yet.</p>
          )}
        </div>

        {/* Daily breakdown table (weekly only) */}
        {tab === 'weekly' && !wLoading && (weekly?.days?.length ?? 0) > 0 && (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">Day</th>
                  <th className="px-4 py-2 text-right">Quiz Score</th>
                  <th className="px-4 py-2 text-right">Watch Time</th>
                </tr>
              </thead>
              <tbody>
                {weekly!.days.map((d, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="px-4 py-2 text-gray-700">
                      {new Date(d.date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-[#1a56db]">
                      {d.quizScore > 0 ? `${d.quizScore}%` : '—'}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">
                      {d.watchTimeSecs > 0 ? formatWatchTime(d.watchTimeSecs) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
