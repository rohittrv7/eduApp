'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface PollOption {
  id: string;
  text: string;
  voteCount?: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  durationSeconds: number;
  correctOptionId?: string;
}

interface PollResults extends Poll {
  options: (PollOption & { voteCount: number })[];
}

interface LivePollOverlayProps {
  classId: string;
}

/**
 * Bottom-sheet overlay that appears when a poll is launched during a live class.
 * - Listens for `poll:launched` to show the poll
 * - Listens for `poll:tick` for countdown
 * - Listens for `poll:results` to show bar-chart results with correct answer highlighted
 * - Auto-dismisses 5s after results are shown
 * Requirements: 43.1, 43.2, 43.3
 */
export function LivePollOverlay({ classId }: LivePollOverlayProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<PollResults | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const socket = io(
      process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001',
      { withCredentials: true, transports: ['websocket', 'polling'] }
    );
    socketRef.current = socket;

    socket.on('poll:launched', (data: Poll) => {
      setPoll(data);
      setSelected(null);
      setSubmitted(false);
      setResults(null);
      setTimeLeft(data.durationSeconds);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    });

    socket.on('poll:tick', (data: { timeLeft: number }) => {
      setTimeLeft(data.timeLeft);
    });

    socket.on('poll:results', (data: PollResults) => {
      setResults(data);
      setPoll(null);
      // Auto-dismiss after 8 seconds
      dismissTimerRef.current = setTimeout(() => {
        setResults(null);
      }, 8000);
    });

    return () => {
      socket.disconnect();
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [classId]);

  const handleSubmit = () => {
    if (!selected || !poll) return;
    socketRef.current?.emit('poll:respond', { classId, pollId: poll.id, optionId: selected });
    setSubmitted(true);
  };

  const handleClose = () => {
    setPoll(null);
    setResults(null);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  };

  if (!poll && !results) return null;

  return (
    <div className="absolute bottom-20 left-4 right-4 z-10 rounded-xl border bg-white shadow-xl">
      <div className="p-4">
        {/* Active poll — voting */}
        {poll && !submitted && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Poll</h3>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                {timeLeft}s
              </span>
            </div>
            <p className="mb-3 text-sm text-gray-800">{poll.question}</p>
            <div className="space-y-2">
              {poll.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    selected === opt.id
                      ? 'border-[#1a56db] bg-blue-50 text-[#1a56db]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!selected}
              className="mt-3 w-full rounded-lg bg-[#1a56db] py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Submit
            </button>
          </>
        )}

        {/* Waiting for results after submission */}
        {poll && submitted && (
          <div className="py-4 text-center">
            <p className="font-semibold text-gray-900">Answer submitted!</p>
            <p className="text-sm text-gray-500">Waiting for results...</p>
          </div>
        )}

        {/* Results bar chart */}
        {results && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Poll Results</h3>
              <button
                onClick={handleClose}
                className="text-xs text-gray-400 hover:text-gray-600"
                aria-label="Close poll results"
              >
                Close
              </button>
            </div>
            <p className="mb-3 text-sm text-gray-800">{results.question}</p>
            <div className="space-y-2">
              {results.options.map((opt) => {
                const isCorrect = opt.id === results.correctOptionId;
                const total = results.options.reduce((s, o) => s + (o.voteCount ?? 0), 0);
                const pct = total > 0 ? Math.round(((opt.voteCount ?? 0) / total) * 100) : 0;
                return (
                  <div key={opt.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={
                          isCorrect ? 'font-semibold text-green-600' : 'text-gray-700'
                        }
                      >
                        {opt.text} {isCorrect && '✓'}
                      </span>
                      <span className="text-gray-500">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isCorrect ? 'bg-green-500' : 'bg-[#1a56db]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
