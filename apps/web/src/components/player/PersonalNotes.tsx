'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/../lib/api-client';
import { usePlayerStore } from '@/stores/player.store';
import { StickyNote, Plus, Pencil, Trash2, Download, Check, X } from 'lucide-react';

interface Note {
  id: string;
  content: string;
  timestampSecs: number;
  createdAt: string;
  updatedAt: string;
}

function formatTimestamp(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface PersonalNotesProps {
  videoId: string;
  onSeek?: (seconds: number) => void;
}

export function PersonalNotes({ videoId, onSeek }: PersonalNotesProps) {
  const queryClient = useQueryClient();
  const currentTime = usePlayerStore((s) => s.currentTime);

  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ['notes', videoId],
    queryFn: () => apiClient.get(`/users/me/notes/${videoId}`).then((r) => {
      return (r.data as any[]).map((n: any) => ({
        id: n.id,
        content: n.content,
        timestampSecs: n.timestamp_secs ?? n.timestampSecs ?? 0,
        createdAt: n.created_at ?? n.createdAt,
        updatedAt: n.updated_at ?? n.updatedAt,
      }));
    }),
    enabled: !!videoId,
  });

  // Sort ascending by timestamp (Req 45.3)
  const sortedNotes = [...notes].sort((a, b) => a.timestampSecs - b.timestampSecs);

  const createMutation = useMutation({
    mutationFn: (content: string) =>
      apiClient.post('/users/me/notes', {
        videoId,
        content,
        timestampSecs: Math.floor(currentTime),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', videoId] });
      setNewContent('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      apiClient.patch(`/users/me/notes/${id}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', videoId] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/me/notes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes', videoId] }),
  });

  // PDF export (Req 45.6)
  async function handleExport() {
    const res = await apiClient.get(`/users/me/notes/${videoId}/export`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-${videoId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function startEdit(note: Note) {
    setEditingId(note.id);
    setEditContent(note.content);
  }

  function handleCreate() {
    const trimmed = newContent.trim();
    if (!trimmed) return;
    createMutation.mutate(trimmed);
  }

  return (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <StickyNote size={16} className="text-blue-400" />
          My Notes
        </h3>
        {sortedNotes.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-gray-700"
            title="Export as PDF"
          >
            <Download size={12} />
            Export
          </button>
        )}
      </div>

      {/* New note input */}
      <div className="border-b border-gray-700 p-3">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder={`Add a note at ${formatTimestamp(Math.floor(currentTime))}…`}
          rows={2}
          className="w-full resize-none rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={handleCreate}
          disabled={!newContent.trim() || createMutation.isPending}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus size={12} />
          Save Note
        </button>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="space-y-2 p-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-700" />
            ))}
          </div>
        )}

        {!isLoading && sortedNotes.length === 0 && (
          <p className="p-6 text-center text-xs text-gray-500">
            No notes yet. Pause the video and jot something down.
          </p>
        )}

        {sortedNotes.map((note) => (
          <div key={note.id} className="border-b border-gray-700 px-4 py-3 last:border-b-0">
            {/* Timestamp — clickable to seek */}
            <button
              onClick={() => onSeek?.(note.timestampSecs)}
              className={`mb-1 inline-block rounded bg-blue-900/50 px-1.5 py-0.5 text-xs font-mono font-semibold text-blue-400 ${onSeek ? 'hover:bg-blue-800/70 cursor-pointer' : 'cursor-default'}`}
              title={onSeek ? `Jump to ${formatTimestamp(note.timestampSecs)}` : undefined}
            >
              ▶ {formatTimestamp(note.timestampSecs)}
            </button>

            {editingId === note.id ? (
              <div className="mt-1 space-y-1">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => updateMutation.mutate({ id: note.id, content: editContent })}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                  >
                    <Check size={10} /> Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-gray-700"
                  >
                    <X size={10} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <p className="flex-1 text-sm text-gray-300">{note.content}</p>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(note)} className="rounded p-1 text-gray-500 hover:bg-gray-700 hover:text-gray-300">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => deleteMutation.mutate(note.id)} disabled={deleteMutation.isPending}
                    className="rounded p-1 text-gray-500 hover:bg-red-900/40 hover:text-red-400 disabled:opacity-50">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
