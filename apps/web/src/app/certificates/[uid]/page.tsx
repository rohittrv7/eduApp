import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface Certificate {
  certificateUid: string;
  studentName: string;
  batchName: string;
  issuedAt: string;
  pdfUrl?: string;
}

async function getCertificate(uid: string): Promise<Certificate | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const res = await fetch(`${apiUrl}/certificates/${uid}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { uid: string } }): Promise<Metadata> {
  const cert = await getCertificate(params.uid);
  if (!cert) return { title: 'Certificate Not Found' };
  return {
    title: `Certificate – ${cert.studentName}`,
    description: `Verify the certificate issued to ${cert.studentName} for completing ${cert.batchName}.`,
  };
}

export default async function CertificateVerificationPage({ params }: { params: { uid: string } }) {
  const cert = await getCertificate(params.uid);

  if (!cert) notFound();

  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#1a56db] text-white font-bold text-lg mb-3">
            BD
          </div>
          <h1 className="text-xl font-bold text-gray-900">allEdu Platform</h1>
          <p className="text-sm text-gray-500 mt-1">Certificate Verification</p>
        </div>

        {/* Certificate card */}
        <div className="rounded-2xl border-2 border-[#1a56db] bg-white p-8 shadow-lg text-center">
          {/* Verified badge */}
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified Certificate
            </span>
          </div>

          <p className="text-sm text-gray-500 mb-1">This certifies that</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{cert.studentName}</h2>
          <p className="text-sm text-gray-500 mb-1">has successfully completed</p>
          <h3 className="text-lg font-semibold text-[#1a56db] mb-4">{cert.batchName}</h3>

          <div className="border-t pt-4 mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Certificate ID</span>
              <span className="font-mono text-xs text-gray-500">{cert.certificateUid}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Issued On</span>
              <span>{issuedDate}</span>
            </div>
          </div>

          {cert.pdfUrl && (
            <a
              href={cert.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-lg bg-[#1a56db] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Download Certificate
            </a>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          This certificate was issued by allEdu Platform and can be verified at this URL.
        </p>
      </div>
    </main>
  );
}
