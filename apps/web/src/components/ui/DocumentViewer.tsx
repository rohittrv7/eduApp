'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

interface DocumentViewerProps {
  /** Signed URL to the PDF (fetched from backend, 30-min TTL) */
  signedUrl: string;
  /** Called when the viewer needs a fresh signed URL before expiry */
  onRefreshUrl?: () => Promise<string>;
}

// Signed URLs expire after 30 min; refresh 2 min before expiry
const REFRESH_BEFORE_MS = 2 * 60 * 1000;
const URL_TTL_MS = 30 * 60 * 1000;

export function DocumentViewer({ signedUrl, onRefreshUrl }: DocumentViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [currentUrl, setCurrentUrl] = useState(signedUrl);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Schedule silent URL refresh before expiry (Req 10.4)
  const scheduleRefresh = useCallback(() => {
    if (!onRefreshUrl) return;
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const fresh = await onRefreshUrl();
        setCurrentUrl(fresh);
        scheduleRefresh();
      } catch {
        // silently ignore — user can still read until URL actually expires
      }
    }, URL_TTL_MS - REFRESH_BEFORE_MS);
  }, [onRefreshUrl]);

  // Load PDF using pdfjs-dist (Req 10.1)
  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);
      try {
        // Dynamic import keeps pdfjs out of the initial bundle
        const pdfjsLib = await import('pdfjs-dist');
        // Point worker to the bundled worker file
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();

        const pdf = await pdfjsLib.getDocument({ url: currentUrl, disableRange: false }).promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        setTotalPages(pdf.numPages);
        setPageNum(1);
        scheduleRefresh();
      } catch (err) {
        if (!cancelled) setError('Failed to load document. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [currentUrl, scheduleRefresh]);

  // Render current page onto canvas
  useEffect(() => {
    if (!pdfRef.current || !canvasRef.current) return;
    let cancelled = false;

    async function renderPage() {
      const page = await pdfRef.current.getPage(pageNum);
      if (cancelled || !canvasRef.current) return;

      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: ctx, viewport }).promise;
    }

    renderPage();
    return () => {
      cancelled = true;
    };
  }, [pageNum, totalPages]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  return (
    // Req 10.2: disable context menu + text selection; Req 10.5: no raw file in cache
    <div
      className="flex flex-col items-center gap-3 select-none"
      onContextMenu={(e) => e.preventDefault()}
      style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      {/* Print suppression (Req 10.2) — injected via style tag */}
      <style>{`@media print { .doc-viewer-canvas { display: none !important; } }`}</style>

      {loading && (
        <div className="flex h-64 w-full items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[#1a56db]" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <canvas
            ref={canvasRef}
            className="doc-viewer-canvas max-w-full rounded-lg shadow-md"
            aria-label={`PDF page ${pageNum} of ${totalPages}`}
          />

          {/* Pagination */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPageNum((p) => Math.max(1, p - 1))}
              disabled={pageNum <= 1}
              className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-600">
              {pageNum} / {totalPages}
            </span>
            <button
              onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))}
              disabled={pageNum >= totalPages}
              className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
