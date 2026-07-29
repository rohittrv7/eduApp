import Link from 'next/link';
import { Rocket, ArrowLeft, Bell, Sparkles } from 'lucide-react';

export default function ComingSoonPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50/80 via-white to-slate-50 p-6 text-center font-sans">
      <div className="relative max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-blue-500/10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 animate-float">
          <Rocket size={32} />
        </div>

        <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-100">
          <Sparkles size={14} className="text-amber-500" /> Feature Under Construction
        </div>

        <h1 className="mt-4 text-3xl font-black text-slate-900 tracking-tight">
          Coming Soon to allEdu!
        </h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          Our engineering team is actively building this feature to give you the ultimate learning experience. Stay tuned for early access launch!
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition-all"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <Link
            href="/batches"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
          >
            Explore Batches
          </Link>
        </div>
      </div>
    </div>
  );
}
