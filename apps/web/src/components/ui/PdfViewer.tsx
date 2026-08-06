'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { tokenStorage, getApiBaseUrl } from '@/../lib/api-client';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  materialId: string;
  title: string;
  onClose: () => void;
}

export function PdfViewer({ materialId, title, onClose }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Build file source with Authorization header so react-pdf can fetch authenticated PDFs
  const fileSource = {
    url: `${getApiBaseUrl()}/study-materials/${materialId}/file`,
    httpHeaders: {
      Authorization: `Bearer ${tokenStorage.getAccess() ?? ''}`,
    },
    withCredentials: false,
  };

  const onLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    pageRefs.current = new Array(n).fill(null);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9000] flex flex-col bg-gray-950"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-700 bg-gray-900 px-4 py-2.5">
        <h2 className="max-w-xs truncate text-sm font-semibold text-white">{title}</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScale((s) => Math.max(0.5, +(s - 0.2).toFixed(1)))}
            className="text-gray-400 hover:text-white"
            title="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="w-12 text-center text-xs text-gray-400">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(3, +(s + 0.2).toFixed(1)))}
            className="text-gray-400 hover:text-white"
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          <button onClick={onClose} className="ml-1 text-gray-400 hover:text-white" title="Close">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Scrollable PDF area */}
      <div
        ref={containerRef}
        className="flex flex-1 flex-col items-center gap-4 overflow-auto bg-gray-700 px-2 py-4"
      >
        {error ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : (
          <Document
            file={fileSource}
            onLoadSuccess={onLoadSuccess}
            onLoadError={(e) => setError(e?.message || 'Failed to load PDF')}
            loading={
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
            }
          >
            {Array.from({ length: numPages }, (_, i) => (
              <div
                key={i}
                ref={(el) => {
                  pageRefs.current[i] = el;
                }}
                className="shadow-2xl"
              >
                <Page pageNumber={i + 1} scale={scale} renderTextLayer renderAnnotationLayer />
              </div>
            ))}
          </Document>
        )}
      </div>
    </div>
  );
}
