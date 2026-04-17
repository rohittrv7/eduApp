'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ChevronDown, ChevronUp, Wifi, WifiOff, Activity, ChevronRight } from 'lucide-react';

export interface ApiLog {
  id: string;
  time: string;
  type: 'api' | 'error' | 'warn' | 'info' | 'ws';
  method?: string;
  url?: string;
  status?: number;
  duration?: number;
  message: string;
  detail?: string;
  requestBody?: any;
  responseBody?: any;
  expanded?: boolean;
}

const logs: ApiLog[] = [];
const listeners: Set<() => void> = new Set();

function addLog(entry: Omit<ApiLog, 'id' | 'time' | 'expanded'>) {
  if (process.env.NODE_ENV !== 'development') return;
  const log: ApiLog = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    expanded: false,
    ...entry,
  };
  logs.unshift(log);
  if (logs.length > 200) logs.pop();
  listeners.forEach((l) => l());
}

export const devLog = {
  api: (method: string, url: string, status: number, duration: number, req?: any, res?: any) =>
    addLog({ type: 'api', method, url, status, duration, message: `${method} ${url}`, requestBody: req, responseBody: res }),
  error: (message: string, detail?: string) => addLog({ type: 'error', message, detail }),
  warn: (message: string, detail?: string) => addLog({ type: 'warn', message, detail }),
  info: (message: string, detail?: string) => addLog({ type: 'info', message, detail }),
  ws: (message: string) => addLog({ type: 'ws', message }),
};

const STATUS_COLOR = (s?: number) => {
  if (!s) return 'text-gray-400';
  if (s < 300) return 'text-green-400';
  if (s < 400) return 'text-yellow-400';
  return 'text-red-400';
};

const TYPE_COLORS: Record<string, string> = {
  api: 'text-blue-400', error: 'text-red-400', warn: 'text-yellow-400', info: 'text-gray-400', ws: 'text-purple-400',
};

function JsonView({ data }: { data: any }) {
  if (data === undefined || data === null) return <span className="text-gray-500">null</span>;
  try {
    const str = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    return (
      <pre className="text-[10px] text-green-300 whitespace-pre-wrap break-all max-h-40 overflow-y-auto bg-gray-950 rounded p-2 mt-1">
        {str}
      </pre>
    );
  } catch {
    return <span className="text-gray-500">{String(data)}</span>;
  }
}

export function DevMonitor() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ApiLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'api' | 'error' | 'warn'>('all');
  const [online, setOnline] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    const listener = () => setEntries([...logs]);
    listeners.add(listener);
    setOnline(navigator.onLine);
    window.addEventListener('online', () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));

    const origError = console.error;
    const origWarn = console.warn;
    console.error = (...args) => { origError(...args); addLog({ type: 'error', message: args.map(String).join(' ').slice(0, 300) }); };
    console.warn = (...args) => { origWarn(...args); addLog({ type: 'warn', message: args.map(String).join(' ').slice(0, 300) }); };

    const onError = (e: ErrorEvent) => addLog({ type: 'error', message: e.message, detail: e.filename });
    const onUnhandled = (e: PromiseRejectionEvent) => addLog({ type: 'error', message: String(e.reason).slice(0, 300) });
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandled);

    return () => {
      listeners.delete(listener);
      console.error = origError;
      console.warn = origWarn;
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandled);
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  const filtered = entries.filter((e) => {
    const matchFilter = filter === 'all' || e.type === filter;
    const matchSearch = !search || e.url?.includes(search) || e.message.includes(search);
    return matchFilter && matchSearch;
  });

  const errorCount = entries.filter((e) => e.type === 'error').length;
  const warnCount = entries.filter((e) => e.type === 'warn').length;

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9998] font-mono text-xs select-none">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-white shadow-xl hover:bg-gray-800"
      >
        <Activity size={14} className="text-green-400" />
        <span className="text-gray-300 font-semibold">DEV</span>
        {errorCount > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold">{errorCount}</span>}
        {warnCount > 0 && <span className="rounded-full bg-yellow-500 px-1.5 py-0.5 text-[10px] font-bold text-black">{warnCount}</span>}
        {online ? <Wifi size={12} className="text-green-400" /> : <WifiOff size={12} className="text-red-400" />}
        {open ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>

      {open && (
        <div className="absolute bottom-10 left-0 w-[560px] max-h-[75vh] flex flex-col rounded-xl bg-gray-950 border border-gray-700 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-700 px-3 py-2 bg-gray-900">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">API Monitor</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${online ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                {online ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { logs.length = 0; setEntries([]); }} className="text-gray-500 hover:text-gray-300 text-[10px] px-2 py-0.5 rounded border border-gray-700 hover:border-gray-500">
                Clear
              </button>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white"><X size={13} /></button>
            </div>
          </div>

          {/* Search */}
          <div className="border-b border-gray-700 px-3 py-1.5 bg-gray-900">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search URL or message..."
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[11px] text-gray-300 outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 border-b border-gray-700 px-3 py-1.5 bg-gray-900">
            {(['all', 'api', 'error', 'warn'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded px-2 py-0.5 text-[10px] uppercase font-bold transition-colors ${filter === f ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {f}
                {f === 'error' && errorCount > 0 && <span className="ml-1 text-red-400">({errorCount})</span>}
                {f === 'warn' && warnCount > 0 && <span className="ml-1 text-yellow-400">({warnCount})</span>}
              </button>
            ))}
            <span className="ml-auto text-gray-600 text-[10px] self-center">{filtered.length} logs</span>
          </div>

          {/* Log entries */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-4 text-center text-gray-600 text-[11px]">No logs</p>
            ) : (
              filtered.map((entry) => {
                const isExpanded = expandedIds.has(entry.id);
                const hasDetail = entry.requestBody !== undefined || entry.responseBody !== undefined || entry.detail;
                return (
                  <div key={entry.id} className="border-b border-gray-800">
                    {/* Main row */}
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 hover:bg-gray-900 ${hasDetail ? 'cursor-pointer' : ''}`}
                      onClick={() => hasDetail && toggleExpand(entry.id)}
                    >
                      <span className="text-gray-600 shrink-0 w-14">{entry.time}</span>
                      <span className={`uppercase font-bold shrink-0 w-8 ${TYPE_COLORS[entry.type]}`}>{entry.type}</span>
                      {entry.method && <span className="text-purple-400 shrink-0 w-10 font-semibold">{entry.method}</span>}
                      {entry.status && (
                        <span className={`shrink-0 font-bold w-8 ${STATUS_COLOR(entry.status)}`}>{entry.status}</span>
                      )}
                      {entry.duration && <span className="text-gray-500 shrink-0 w-12">{entry.duration}ms</span>}
                      <span className="text-gray-300 truncate flex-1">{entry.url || entry.message}</span>
                      {hasDetail && (
                        <ChevronRight size={12} className={`text-gray-500 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      )}
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-3 pb-3 bg-gray-900/50 space-y-2">
                        {entry.detail && (
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Detail</p>
                            <p className="text-[11px] text-gray-400 break-all">{entry.detail}</p>
                          </div>
                        )}
                        {entry.requestBody !== undefined && (
                          <div>
                            <p className="text-[10px] text-yellow-500 uppercase font-bold mb-0.5">↑ Request Payload</p>
                            <JsonView data={entry.requestBody} />
                          </div>
                        )}
                        {entry.responseBody !== undefined && (
                          <div>
                            <p className={`text-[10px] uppercase font-bold mb-0.5 ${entry.status && entry.status >= 400 ? 'text-red-400' : 'text-green-400'}`}>
                              ↓ Response {entry.status}
                            </p>
                            <JsonView data={entry.responseBody} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Stats footer */}
          <div className="border-t border-gray-700 px-3 py-1.5 bg-gray-900 flex gap-4 text-[10px] text-gray-500">
            <span>Total: {entries.length}</span>
            <span className="text-red-400">Errors: {errorCount}</span>
            <span className="text-yellow-400">Warns: {warnCount}</span>
            <span className="text-blue-400">API: {entries.filter(e => e.type === 'api').length}</span>
            <span className="text-green-400">2xx: {entries.filter(e => e.status && e.status < 300).length}</span>
            <span className="text-red-400">4xx/5xx: {entries.filter(e => e.status && e.status >= 400).length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
