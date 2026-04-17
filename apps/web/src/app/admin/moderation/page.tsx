'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  useGetFlaggedContentQuery,
  useHideContentMutation,
  useDeleteContentMutation,
  ContentType,
  FlaggedContent,
} from '@/store/adminApi';

// ── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<ContentType, string> = {
  chat_message: 'Chat',
  doubt: 'Doubt',
  doubt_reply: 'Reply',
};

const TYPE_COLORS: Record<ContentType, string> = {
  chat_message: 'bg-purple-100 text-purple-700',
  doubt: 'bg-blue-100 text-blue-700',
  doubt_reply: 'bg-teal-100 text-teal-700',
};

function truncate(text: string, max = 120) {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-5 w-14 rounded-full bg-gray-200" />
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="ml-auto h-4 w-24 rounded bg-gray-200" />
          </div>
          <div className="mb-2 h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-3/4 rounded bg-gray-200" />
        </div>
      ))}
    </>
  );
}

// ── Content card ──────────────────────────────────────────────────────────────
function ContentCard({
  item,
  onHide,
  onDelete,
}: {
  item: FlaggedContent;
  onHide: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${item.isHidden ? 'opacity-60' : ''}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[item.type]}`}>
          {TYPE_LABELS[item.type]}
        </span>
        <span className="text-sm font-medium text-gray-800">{item.authorName}</span>
        {item.context && (
          <span className="text-xs text-gray-400">· {item.context}</span>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {new Date(item.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        {item.isHidden && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            Hidden
          </span>
        )}
      </div>

      <p className="mb-3 text-sm text-gray-700">{truncate(item.content)}</p>

      <div className="flex gap-2">
        <button
          onClick={onHide}
          className="rounded border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
        >
          {item.isHidden ? 'Unhide' : 'Hide'}
        </button>
        <button
          onClick={onDelete}
          className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminModerationPage() {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isFetching } = useGetFlaggedContentQuery({
    ...(typeFilter && { type: typeFilter }),
    page,
    limit,
  });

  const [hideContent] = useHideContentMutation();
  const [deleteContent] = useDeleteContentMutation();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const loading = isLoading || isFetching;

  async function handleHide(item: FlaggedContent) {
    await hideContent({ type: item.type, id: item.id });
  }

  async function handleDelete(item: FlaggedContent) {
    if (!window.confirm(`Delete this ${TYPE_LABELS[item.type]}? This cannot be undone.`)) return;
    await deleteContent({ type: item.type, id: item.id });
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Content Moderation</h1>
          <span className="text-sm text-gray-500">{total} flagged item{total !== 1 ? 's' : ''}</span>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {(['', 'chat_message', 'doubt', 'doubt_reply'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1); }}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === t
                  ? 'border-[#1a56db] bg-[#1a56db] text-white'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t === '' ? 'All' : TYPE_LABELS[t as ContentType]}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <CardSkeleton />
          ) : items.length === 0 ? (
            <div className="rounded-xl border bg-white py-16 text-center text-gray-400 shadow-sm">
              No flagged content found.
            </div>
          ) : (
            items.map((item) => (
              <ContentCard
                key={`${item.type}-${item.id}`}
                item={item}
                onHide={() => handleHide(item)}
                onDelete={() => handleDelete(item)}
              />
            ))
          )}
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
              <span className="flex items-center px-2 font-medium">
                {page} / {totalPages}
              </span>
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
