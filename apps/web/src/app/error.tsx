'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center font-sans">
      <h2 className="text-2xl font-extrabold text-slate-900">Something went wrong!</h2>
      <p className="mt-2 text-sm text-slate-600 max-w-md">{error.message || 'An unexpected error occurred.'}</p>
      <button
        onClick={() => reset()}
        className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition-all"
      >
        Try again
      </button>
    </div>
  );
}
