'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  useGetAdminLiveClassesQuery,
  useApproveLiveClassMutation,
  useRejectLiveClassMutation,
  useDeactivateLiveClassMutation,
  AdminLiveClass,
} from '@/store/adminApi';
import { Play, ChevronDown, ChevronRight, Radio, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  active: 'bg-red-100 text-red-700',
  ended: 'bg-gray-100 text-gray-500',
  rejected: 'bg-red-50 text-red-400',
};
const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  active: '🔴 LIVE',
  ended: 'Ended',
  rejected: 'Rejected',
};

// ── Expandable Live Class Row (YouTube playlist style) ────────────────────────
function LiveClassRow({ cls, onApprove, onReject, onDeactivate, actionMsg }: {
  cls: AdminLiveClass;
  onApprove: () => void;
  onReject: () => void;
  onDeactivate: () => void;
  actionMsg?: { type: 'success' | 'error'; text: string } | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b last:border-0">
      {/* Row header — click to expand */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Thumbnail */}
        <div className="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {cls.youtubeVideoId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://img.youtube.com/vi/${cls.youtubeVideoId}/mqdefault.jpg`}
              alt={cls.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200">
              <Radio size={20} className="text-gray-400" />
            </div>
          )}
          {cls.status === 'active' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded bg-red-600 px-1 py-0.5 text-[10px] font-bold text-white">LIVE</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 line-clamp-1">{cls.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{cls.batchTitle} · {cls.teacherName}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[cls.status] ?? 'bg-gray-100 text-gray-500'}`}>
              {STATUS_LABEL[cls.status] ?? cls.status}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar size={10} />
              {formatDate(cls.scheduledAt)}
            </span>
          </div>
        </div>

        {/* Expand icon */}
        <div className="flex-shrink-0 text-gray-400">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {/* Expanded detail — YouTube video embed + actions */}
      {expanded && (
        <div className="border-t bg-gray-50 px-4 py-4 space-y-4">
          {/* YouTube embed */}
          {cls.youtubeVideoId && (
            <div className="aspect-video w-full max-w-xl overflow-hidden rounded-xl bg-black shadow">
              <iframe
                src={`https://www.youtube.com/embed/${cls.youtubeVideoId}`}
                title={cls.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          )}

          {/* Details */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1"><Clock size={13} /> Scheduled: {formatDate(cls.scheduledAt)}</span>
            <span className="flex items-center gap-1 font-medium text-gray-800">Batch: {cls.batchTitle}</span>
            <span className="flex items-center gap-1 font-medium text-gray-800">Teacher: {cls.teacherName}</span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {cls.status === 'pending_approval' && (
              <>
                <button onClick={onApprove}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                  <CheckCircle size={14} /> Approve
                </button>
                <button onClick={onReject}
                  className="flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                  <XCircle size={14} /> Reject
                </button>
              </>
            )}
            {cls.status === 'scheduled' && (
              <>
                <button onClick={onApprove}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                  <CheckCircle size={14} /> Approve
                </button>
                <button onClick={onReject}
                  className="flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                  <XCircle size={14} /> Reject
                </button>
              </>
            )}
            {cls.status === 'approved' && (
              <button onClick={onReject}
                className="flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                <XCircle size={14} /> Revoke Approval
              </button>
            )}
            {cls.status === 'active' && (
              <button onClick={onDeactivate}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                End Live Class
              </button>
            )}
            {cls.youtubeVideoId && (
              <a
                href={`https://www.youtube.com/watch?v=${cls.youtubeVideoId}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                <Play size={13} /> Watch on YouTube
              </a>
            )}
          </div>

          {actionMsg && (
            <p className={`text-xs font-medium ${actionMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {actionMsg.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminLiveClassesPage() {
  const [filter, setFilter] = useState<string>('all');
  const [actionMsgs, setActionMsgs] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({});

  const { data: allClasses = [], isLoading } = useGetAdminLiveClassesQuery();
  const [approveLiveClass] = useApproveLiveClassMutation();
  const [rejectLiveClass] = useRejectLiveClassMutation();
  const [deactivateLiveClass] = useDeactivateLiveClassMutation();

  function setMsg(id: string, type: 'success' | 'error', text: string) {
    setActionMsgs(prev => ({ ...prev, [id]: { type, text } }));
    setTimeout(() => setActionMsgs(prev => { const n = { ...prev }; delete n[id]; return n; }), 3000);
  }

  async function handleApprove(cls: AdminLiveClass) {
    try { await approveLiveClass(cls.id).unwrap(); setMsg(cls.id, 'success', 'Approved!'); }
    catch { setMsg(cls.id, 'error', 'Failed to approve.'); }
  }
  async function handleReject(cls: AdminLiveClass) {
    try { await rejectLiveClass(cls.id).unwrap(); setMsg(cls.id, 'success', 'Rejected.'); }
    catch { setMsg(cls.id, 'error', 'Failed to reject.'); }
  }
  async function handleDeactivate(cls: AdminLiveClass) {
    try { await deactivateLiveClass(cls.id).unwrap(); setMsg(cls.id, 'success', 'Ended.'); }
    catch { setMsg(cls.id, 'error', 'Failed to end.'); }
  }

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending_approval', label: 'Pending' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'approved', label: 'Approved' },
    { key: 'active', label: '🔴 Live' },
    { key: 'ended', label: 'Ended' },
  ];

  const filtered = filter === 'all' ? allClasses : allClasses.filter(c => c.status === filter);

  const pendingCount = allClasses.filter(c => c.status === 'pending_approval').length;
  const activeCount = allClasses.filter(c => c.status === 'active').length;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Live Classes</h1>
            <p className="text-xs text-gray-400 mt-0.5">Teacher ke scheduled classes approve/reject karo</p>
          </div>
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                {pendingCount} pending
              </span>
            )}
            {activeCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                {activeCount} live
              </span>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-xl border bg-white p-1 shadow-sm">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
                ${filter === tab.key ? 'bg-[#1a56db] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {tab.label}
              {tab.key !== 'all' && (
                <span className="ml-1 opacity-70">
                  ({allClasses.filter(c => c.status === tab.key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="space-y-0">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 border-b px-4 py-3 animate-pulse">
                  <div className="h-14 w-24 rounded-lg bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-gray-200" />
                    <div className="h-3 w-32 rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Radio size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-400">
                {filter === 'all' ? 'Koi live class nahi hai abhi' : `Koi ${filter} class nahi hai`}
              </p>
            </div>
          ) : (
            filtered.map(cls => (
              <LiveClassRow
                key={cls.id}
                cls={cls}
                onApprove={() => handleApprove(cls)}
                onReject={() => handleReject(cls)}
                onDeactivate={() => handleDeactivate(cls)}
                actionMsg={actionMsgs[cls.id]}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
