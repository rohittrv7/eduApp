'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Pin } from 'lucide-react';

interface ChatMessage {
  id: string;
  userId: string;
  fullName: string;
  role: 'admin' | 'teacher' | 'student';
  content: string;
  isPinned?: boolean;
  createdAt: string;
}

interface CustomChatProps {
  classId: string;
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'bg-red-100 text-red-700' },
  teacher: { label: 'Teacher', className: 'bg-blue-100 text-blue-700' },
  student: { label: '', className: 'bg-gray-100 text-gray-600' },
};

/**
 * Real-time chat panel for live classes.
 * - Connects to Socket.io /live namespace on mount; joins room live:{classId}
 * - Renders message list with role badges (Admin=red, Teacher=blue, Student=gray)
 * - Pins Teacher/Admin announcements at the top of the chat panel (Req 17.6)
 * - Shows profanity error as inline toast on send failure (Req 4.5)
 * - Message input: max 500 chars, Enter to send (Req 4.3)
 * Requirements: 4.2, 4.3, 4.4, 4.5, 17.6
 */
export function CustomChat({ classId }: CustomChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io(
      process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001',
      { withCredentials: true, transports: ['websocket', 'polling'] }
    );
    socketRef.current = socket;

    socket.emit('live:join', { classId });

    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      // Pin the latest teacher/admin announcement
      if (msg.isPinned && (msg.role === 'teacher' || msg.role === 'admin')) {
        setPinnedMessage(msg);
      }
    });

    socket.on('chat:error', (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    // Handle message hidden by admin moderation
    socket.on('chat:message:hidden', (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    });

    return () => {
      socket.emit('live:leave', { classId });
      socket.disconnect();
    };
  }, [classId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const content = input.trim();
    if (!content || content.length > 500) return;
    socketRef.current?.emit('chat:send', { classId, content });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border bg-white shadow-sm">
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold text-gray-900">Live Chat</h3>
      </div>

      {/* Pinned announcement (Req 17.6) */}
      {pinnedMessage && (
        <div className="flex items-start gap-2 border-b bg-blue-50 px-3 py-2">
          <Pin size={12} className="mt-0.5 shrink-0 text-blue-500" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-blue-700">{pinnedMessage.fullName}</p>
            <p className="truncate text-xs text-blue-800">{pinnedMessage.content}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-400 mt-8">Koi message nahi hai abhi</p>
        )}
        {messages.map((msg) => {
          const badge = ROLE_BADGE[msg.role] ?? ROLE_BADGE.student;
          const time = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
          return (
            <div key={msg.id} className="text-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-900">{msg.fullName || 'Student'}</span>
                  {badge.label && (
                    <span className={`rounded px-1 py-0.5 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                  {msg.isPinned && <Pin size={10} className="text-blue-400" />}
                </div>
                {time && <span className="text-xs text-gray-400">{time}</span>}
              </div>
              <p className="text-gray-700 break-words mt-0.5">{msg.content}</p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Profanity error toast (Req 4.5) */}
      {error && (
        <div className="mx-3 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 500))}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send)"
          maxLength={500}
          className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          aria-label="Send message"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a56db] text-white disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
      {input.length > 450 && (
        <p className="px-3 pb-2 text-right text-xs text-gray-400">{input.length}/500</p>
      )}
    </div>
  );
}
