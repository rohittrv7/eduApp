'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 font-sans antialiased text-slate-900">
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <h2 className="text-2xl font-black text-slate-900">Application Error</h2>
          <p className="mt-2 text-sm text-slate-600 max-w-md">{error.message || 'An unexpected application error occurred.'}</p>
          <button
            onClick={() => reset()}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition-all"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
