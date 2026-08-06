'use client';

import { useState } from 'react';
import { Doubt, useUpvoteDoubtMutation, useResolveDoubtMutation } from '@/store/doubtsApi';
import { DoubtReplyForm } from './DoubtReplyForm';
import { useAuthStore } from '@/stores/auth.store';
import { ChevronDown, ChevronUp, ThumbsUp, CheckCircle, MessageCircle } from 'lucide-react';

interface DoubtCardProps {
  doubt: Doubt;
}

export function DoubtCard({ doubt }: DoubtCardProps) {
  const { user } = useAuthStore();
  const [expanded, setExpanded] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [upvote] = useUpvoteDoubtMutation();
  const [resolve] = useResolveDoubtMutation();

  const canResolve =
    user?.role === 'admin' ||
    user?.role === 'teacher' ||
    user?.id === doubt.student.id;

  const canReply = user?.role === 'admin' || user?.role === 'teacher';

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm transition-colors ${
        doubt.status === 'resolved' ? 'border-green-200' : 'border-gray-200'
      }`}
    >
      <div className="p-4">
        {/* Status + author row */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                doubt.status === 'resolved'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {doubt.status === 'resolved' ? '✓ Resolved' : 'Open'}
            </span>
            <span className="text-xs text-gray-400">
              by {doubt.student.fullName}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {new Date(doubt.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>

        {/* Doubt text */}
        <p className="text-sm text-gray-800">{doubt.text}</p>

        {/* Image */}
        {doubt.imageUrl && (
          <img
            src={doubt.imageUrl}
            alt="doubt attachment"
            className="mt-2 max-h-48 rounded-lg object-contain"
          />
        )}

        {/* Actions row */}
        <div className="mt-3 flex items-center gap-3">
          {/* Upvote */}
          <button
            onClick={() => upvote(doubt.id)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ThumbsUp size={14} />
            <span>{doubt.upvotes}</span>
          </button>

          {/* Toggle replies */}
          {(doubt.replies?.length ?? 0) > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <MessageCircle size={14} />
              <span>{doubt.replies!.length} {doubt.replies!.length === 1 ? 'reply' : 'replies'}</span>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {/* Reply (teacher/admin) */}
          {canReply && (
            <button
              onClick={() => setShowReply((v) => !v)}
              className="ml-auto rounded-lg px-2 py-1 text-sm text-[#1a56db] hover:bg-blue-50 transition-colors"
            >
              Reply
            </button>
          )}

          {/* Resolve */}
          {canResolve && doubt.status === 'open' && (
            <button
              onClick={() => resolve(doubt.id)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-green-600 hover:bg-green-50 transition-colors"
            >
              <CheckCircle size={14} />
              Resolve
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {expanded && doubt.replies && doubt.replies.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-3">
          {doubt.replies.map((reply) => (
            <div key={reply.id} className="flex gap-2">
              <div className="flex-shrink-0 h-7 w-7 rounded-full bg-[#1a56db] flex items-center justify-center text-white text-xs font-bold">
                {(reply.author?.fullName ?? reply.author?.email ?? 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-800">{reply.author?.fullName ?? reply.author?.email ?? 'User'}</span>
                  {(reply.author.role === 'teacher' || reply.author.role === 'admin') && (
                    <span className="rounded-full bg-[#1a56db] px-1.5 py-0.5 text-[10px] font-medium text-white capitalize">
                      {reply.author.role}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-gray-700">{reply.text}</p>
                {reply.imageUrl && (
                  <img
                    src={reply.imageUrl}
                    alt="reply attachment"
                    className="mt-1.5 max-h-36 rounded-lg object-contain"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      {showReply && (
        <div className="border-t border-gray-100 px-4 py-3">
          <DoubtReplyForm doubtId={doubt.id} onSuccess={() => setShowReply(false)} />
        </div>
      )}
    </div>
  );
}
