'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArrowLeft, Radio, Calendar, Clock, Users, Pencil, Check, X, Send, Pin } from 'lucide-react';
import { baseApi } from '@/store/api';
import { useDispatch } from 'react-redux';
import { io, Socket } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

interface LiveClassDetail {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  scheduled_at: string;
  started_at?: string | null;
  ended_at?: string | null;
  youtube_url?: string | null;
  batch_id: string;
  batch?: { name: string };
  viewer_count?: number;
}

interface ChatMessage {
  id: string;
  userId: string;
  fullName: string;
  role: 'admin' | 'teacher' | 'student';
  content: string;
  isPinned?: boolean;
  createdAt: string;
}

function formatDate(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin:   { label: 'Admin',   cls: 'bg-red-100 text-red-700' },
  teacher: { label: 'Teacher', cls: 'bg-blue-100 text-blue-700' },
  student: { label: '',        cls: '' },
};

export default function TeacherManageLiveClassPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useDispatch();

  const [cls, setCls] = useState<LiveClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [newScheduledAt, setNewScheduledAt] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinnedMsg, setPinnedMsg] = useState<ChatMessage | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function fetchClass() {
    try {
      const res = await fetch(`${API}/live-classes/${id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCls(data);
        setNewScheduledAt(toDatetimeLocal(data.scheduled_at));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchClass(); }, [id]);

  // Socket.io — connect when class is active
  useEffect(() => {
    if (!cls || cls.status !== 'active') return;

    const socket = io(SOCKET_URL, { withCredentials: true, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('live:join', { classId: id });
    });
    socket.on('chat:message', (m: ChatMessage) => {
      setMessages((prev) => [...prev, m]);
      if (m.isPinned) setPinnedMsg(m);
    });
    socket.on('viewer:count', (d: { count: number }) => {
      setViewerCount(d.count);
    });
    socket.on('chat:message:hidden', (d: { messageId: string }) =>
      setMessages((prev) => prev.filter((m) => m.id !== d.messageId))
    );

    return () => {
      socket.emit('live:leave', { classId: id });
      socket.disconnect();
    };
  }, [cls?.status, id]);

  // Poll viewer count from API every 5s as fallback (in case Redis is down)
  useEffect(() => {
    if (!cls || cls.status !== 'active') return;
    const poll = async () => {
      try {
        const res = await fetch(`${API}/live-classes/${id}/viewer-count`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          // Use socket count if > 0, else use API count
          setViewerCount((prev) => {
            const apiCount = data.count ?? data.viewer_count ?? 0;
            return prev > 0 ? prev : apiCount;
          });
        }
      } catch { /* ignore */ }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [cls?.status, id]);

  // Auto-scroll chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendChat() {
    const content = chatInput.trim();
    if (!content) return;
    socketRef.current?.emit('chat:send', { classId: id, content });
    setChatInput('');
  }

  async function doAction(endpoint: string, successMsg: string) {
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${API}/live-classes/${id}/${endpoint}`, {
        method: 'POST', credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Action failed');
      }
      setMsg({ type: 'success', text: successMsg });
      dispatch(baseApi.util.invalidateTags(['TeacherLiveClasses']));
      await fetchClass();
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.message || 'Action failed. Try again.' });
    } finally {
      setActionLoading(false);
    }
  }

  async function saveSchedule() {
    if (!newScheduledAt) return;
    setSavingSchedule(true);
    setMsg(null);
    try {
      const res = await fetch(`${API}/live-classes/${id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: new Date(newScheduledAt).toISOString() }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed');
      setMsg({ type: 'success', text: 'Schedule updated!' });
      setEditingSchedule(false);
      dispatch(baseApi.util.invalidateTags(['TeacherLiveClasses']));
      await fetchClass();
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.message || 'Failed to update schedule.' });
    } finally {
      setSavingSchedule(false);
    }
  }

  if (loading) return (
    <DashboardLayout>
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-48 rounded bg-gray-200" />
        <div className="h-40 rounded-xl bg-gray-100" />
      </div>
    </DashboardLayout>
  );

  if (!cls) return (
    <DashboardLayout><p className="py-12 text-center text-gray-500">Live class not found.</p></DashboardLayout>
  );

  const isLive = cls.status === 'active';
  const isEnded = cls.status === 'ended';
  const canEdit = !isLive && !isEnded;

  const STATUS_COLORS: Record<string, string> = {
    scheduled: 'bg-gray-100 text-gray-600', pending_approval: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700', active: 'bg-red-100 text-red-700',
    ended: 'bg-gray-100 text-gray-500', rejected: 'bg-red-50 text-red-400',
  };
  const STATUS_LABELS: Record<string, string> = {
    scheduled: 'Scheduled', pending_approval: 'Pending Approval',
    approved: 'Approved', active: '🔴 LIVE', ended: 'Ended', rejected: 'Rejected',
  };

  return (
    <DashboardLayout>
      <div className={`mx-auto space-y-5 ${isLive ? 'max-w-5xl' : 'max-w-2xl'}`}>
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={15} /> Back to Live Classes
        </button>

        <div className={`flex gap-5 ${isLive ? 'flex-col lg:flex-row' : ''}`}>
          {/* Left — class info + controls */}
          <div className="flex-1 space-y-4">
            <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[cls.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[cls.status] ?? cls.status}
                  </span>
                  <h1 className="mt-2 text-xl font-bold text-gray-900">{cls.title}</h1>
                  {cls.description && <p className="mt-1 text-sm text-gray-500">{cls.description}</p>}
                </div>
                {isLive && <Radio size={22} className="text-red-500 animate-pulse flex-shrink-0" />}
              </div>

              {/* Schedule */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <Calendar size={14} />
                {editingSchedule ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input type="datetime-local" value={newScheduledAt}
                      onChange={(e) => setNewScheduledAt(e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 focus:border-[#1a56db] focus:outline-none" />
                    <button onClick={saveSchedule} disabled={savingSchedule}
                      className="flex items-center gap-1 rounded-lg bg-[#1a56db] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                      <Check size={12} /> {savingSchedule ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => { setEditingSchedule(false); setNewScheduledAt(toDatetimeLocal(cls.scheduled_at)); }}
                      className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                      <X size={12} /> Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Scheduled: {cls.scheduled_at ? formatDate(cls.scheduled_at) : 'Not set'}</span>
                    {canEdit && (
                      <button onClick={() => setEditingSchedule(true)}
                        className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-800">
                        <Pencil size={11} /> Edit
                      </button>
                    )}
                  </div>
                )}
              </div>

              {cls.started_at && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock size={14} /> Started: {formatDate(cls.started_at)}
                </div>
              )}
              {isLive && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Users size={14} /> {viewerCount} viewers watching
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-1">
                {cls.status === 'approved' && !isLive && (
                  <button onClick={() => doAction('go-live', 'Class is now LIVE!')} disabled={actionLoading}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                    <Radio size={15} /> {actionLoading ? 'Starting...' : '🔴 Go Live'}
                  </button>
                )}
                {isLive && (
                  <button onClick={() => doAction('end', 'Class ended.')} disabled={actionLoading}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                    {actionLoading ? 'Ending...' : 'End Live Class'}
                  </button>
                )}
                {cls.status === 'scheduled' && (
                  <div className="rounded-lg bg-yellow-50 px-4 py-2.5 text-sm text-yellow-700">
                    ⏳ Admin approval ka wait karo.
                  </div>
                )}
                {cls.status === 'rejected' && (
                  <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
                    ❌ Ye class reject ho gayi hai.
                  </div>
                )}
              </div>

              {msg && (
                <p className={`text-sm font-medium ${msg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {msg.text}
                </p>
              )}
            </div>
          </div>

          {/* Right — Live Chat (only when LIVE) */}
          {isLive && (
            <div className="w-full lg:w-[720px] flex flex-col rounded-xl border bg-white shadow-sm" style={{ minHeight: '70vh' }}>
              <div className="flex items-center justify-between border-b px-5 py-4 bg-gray-50 rounded-t-xl">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                  <Radio size={18} className="text-red-500 animate-pulse" />
                  Student Messages
                </h3>
                <span className="text-sm text-gray-500 font-semibold bg-gray-200 px-2 py-0.5 rounded-full">{messages.length}</span>
              </div>

              {/* Pinned */}
              {pinnedMsg && (
                <div className="flex items-start gap-2 border-b bg-blue-50 px-4 py-3">
                  <Pin size={13} className="mt-0.5 shrink-0 text-blue-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-blue-700">{pinnedMsg.fullName}</p>
                    <p className="truncate text-sm text-blue-800">{pinnedMsg.content}</p>
                  </div>
                </div>
              )}

              {/* Messages list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-base text-gray-400 mt-16">Abhi koi message nahi hai</p>
                )}
                {messages.map((m) => {
                  const badge = ROLE_BADGE[m.role] ?? ROLE_BADGE.student;
                  return (
                    <div key={m.id} className={`rounded-xl px-4 py-3 ${m.role === 'teacher' || m.role === 'admin' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-gray-900 truncate text-base">{m.fullName}</span>
                          {badge.label && (
                            <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${badge.cls}`}>
                              {badge.label}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-sm text-gray-400 font-medium">{formatTime(m.createdAt)}</span>
                      </div>
                      <p className="text-gray-800 break-words text-base leading-relaxed">{m.content}</p>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Teacher reply input */}
              <div className="border-t p-4 flex gap-2 bg-gray-50 rounded-b-xl">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value.slice(0, 500))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                  placeholder="Reply to students..."
                  className="flex-1 rounded-lg border px-4 py-2.5 text-base outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
                />
                <button onClick={sendChat} disabled={!chatInput.trim()}
                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1a56db] text-white disabled:opacity-50 hover:bg-blue-700">
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
