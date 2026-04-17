'use client';

import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import apiClient from '@/../lib/api-client';
import { Award, Download, Share2, ExternalLink } from 'lucide-react';

interface Certificate {
  id: string;
  certificateUid: string;
  batchTitle: string;
  issuedAt: string;
  pdfUrl?: string;
}

function CertificateCard({ cert }: { cert: Certificate }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function handleDownloadPdf() {
    if (!cert.pdfUrl) return;
    const a = document.createElement('a');
    a.href = cert.pdfUrl;
    a.download = `certificate-${cert.certificateUid}.pdf`;
    a.target = '_blank';
    a.click();
  }

  /** Generate a shareable certificate image via Canvas API */
  function handleShareImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 500;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 800, 500);
    grad.addColorStop(0, '#1a56db');
    grad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 500);

    // Border
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 760, 460);

    // Title
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 36px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Certificate of Completion', 400, 120);

    // Batch name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(cert.batchTitle, 400, 220);

    // Platform
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#c7d9ff';
    ctx.fillText('allEdu', 400, 290);

    // UID
    ctx.font = '14px monospace';
    ctx.fillStyle = '#93c5fd';
    ctx.fillText(`Certificate ID: ${cert.certificateUid}`, 400, 360);

    // Date
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#c7d9ff';
    ctx.fillText(
      `Issued: ${new Date(cert.issuedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`,
      400,
      400
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${cert.certificateUid}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100">
          <Award size={24} className="text-yellow-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{cert.batchTitle}</h3>
          <p className="mt-0.5 text-xs text-gray-400">
            Issued{' '}
            {new Date(cert.issuedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p className="mt-1 font-mono text-xs text-gray-500">
            ID: {cert.certificateUid}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {cert.pdfUrl && (
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download size={12} />
            Download PDF
          </button>
        )}
        <button
          onClick={handleShareImage}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <Share2 size={12} />
          Share as Image
        </button>
        <a
          href={`/certificates/${cert.certificateUid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-[#1a56db] hover:bg-blue-50"
        >
          <ExternalLink size={12} />
          Verify
        </a>
      </div>
    </div>
  );
}

export default function CertificatesPage() {
  const { data: certificates, isLoading } = useQuery<Certificate[]>({
    queryKey: ['certificates'],
    queryFn: () => apiClient.get('/users/me/certificates').then((r) => r.data),
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Award size={20} className="text-yellow-500" />
          My Certificates
        </h1>

        {isLoading && <SkeletonLoader variant="card" count={3} />}

        {!isLoading && (!certificates || certificates.length === 0) && (
          <div className="rounded-xl border bg-white p-8 text-center">
            <Award size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">No certificates yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Complete a batch (80% watch-time + all quizzes) to earn your certificate.
            </p>
          </div>
        )}

        {!isLoading &&
          certificates?.map((cert) => <CertificateCard key={cert.id} cert={cert} />)}
      </div>
    </DashboardLayout>
  );
}
