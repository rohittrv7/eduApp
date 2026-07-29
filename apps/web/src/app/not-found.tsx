import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center font-sans">
      <h2 className="text-4xl font-black text-slate-900">404</h2>
      <p className="mt-2 text-lg font-bold text-slate-800">Page Not Found</p>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">The page you are looking for doesn&apos;t exist or has been moved.</p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition-all"
      >
        Back to Home
      </Link>
    </div>
  );
}
