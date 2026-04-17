export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-6xl">📡</div>
      <h1 className="text-2xl font-bold text-gray-900">You&apos;re offline</h1>
      <p className="max-w-sm text-gray-500">
        Check your internet connection and try again. Your downloaded content is still available.
      </p>
      <a
        href="/student/dashboard"
        className="mt-2 rounded-lg bg-[#1a56db] px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Go to Dashboard
      </a>
    </div>
  );
}
