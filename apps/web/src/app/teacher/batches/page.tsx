'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useGetTeacherBatchesQuery, useCreateTeacherBatchMutation } from '@/store/teacherApi';

export default function TeacherBatchesPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', target_exam: '', price: '0', is_free: true,
    language: 'hindi', thumbnail: '', start_date: '', end_date: '',
  });
  const [msg, setMsg] = useState('');

  const { data: batches = [], isLoading } = useGetTeacherBatchesQuery();
  const [createBatch, { isLoading: creating }] = useCreateTeacherBatchMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      await createBatch({
        name: form.name,
        description: form.description || undefined,
        target_exam: form.target_exam || undefined,
        price: form.is_free ? 0 : Number(form.price),
        is_free: form.is_free,
        language: form.language as any,
        thumbnail: form.thumbnail || undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
      }).unwrap();
      setMsg('Batch created!');
      setShowForm(false);
      setForm({ name: '', description: '', target_exam: '', price: '0', is_free: true, language: 'hindi', thumbnail: '', start_date: '', end_date: '' });
    } catch (err: any) {
      setMsg(err?.data?.message ?? 'Failed to create batch');
    }
  }

  const inputCls = 'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a56db]';

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">My Batches</h1>
          <button onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-[#1a56db] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            {showForm ? 'Cancel' : '+ New Batch'}
          </button>
        </div>

        {msg && <p className={`text-sm ${msg.includes('created') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}

        {/* Create Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800">Create New Batch</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Batch Name *</label>
                <input required className={inputCls} value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. SSC CGL 2025 Batch" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Target Exam</label>
                <input className={inputCls} value={form.target_exam}
                  onChange={(e) => setForm((p) => ({ ...p, target_exam: e.target.value }))}
                  placeholder="e.g. SSC CGL, UPSC" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
              <textarea rows={2} className={inputCls} value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Batch ke baare mein batao..." />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Language</label>
                <select className={inputCls} value={form.language}
                  onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}>
                  <option value="hindi">Hindi</option>
                  <option value="english">English</option>
                  <option value="hinglish">Hinglish</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Start Date</label>
                <input type="date" className={inputCls} value={form.start_date}
                  onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">End Date</label>
                <input type="date" className={inputCls} value={form.end_date}
                  onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Pricing</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.is_free}
                      onChange={(e) => setForm((p) => ({ ...p, is_free: e.target.checked }))} />
                    Free Batch
                  </label>
                  {!form.is_free && (
                    <input type="number" min={1} className={`${inputCls} flex-1`}
                      value={form.price} placeholder="Price (₹)"
                      onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Thumbnail URL</label>
                <input className={inputCls} value={form.thumbnail}
                  onChange={(e) => setForm((p) => ({ ...p, thumbnail: e.target.value }))}
                  placeholder="https://... (optional)" />
              </div>
            </div>

            <button type="submit" disabled={creating}
              className="rounded-lg bg-[#1a56db] px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Batch'}
            </button>
          </form>
        )}

        {/* Batches List */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border bg-white p-4 shadow-sm">
                <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : batches.length === 0 ? (
          <div className="rounded-xl border bg-white p-12 text-center text-gray-400">
            <p className="text-base">Koi batch nahi hai abhi</p>
            <p className="mt-1 text-xs">Upar "+ New Batch" button se banao</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map((batch) => (
              <div
                key={batch.id}
                onClick={() => router.push(`/teacher/batches/${batch.id}`)}
                className="cursor-pointer rounded-xl border bg-white p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-gray-900">{batch.name}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${(batch as any).is_free ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {(batch as any).is_free ? 'Free' : `₹${(batch as any).price}`}
                  </span>
                  {(batch as any).target_exam && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {(batch as any).target_exam}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-400">ID: {batch.id.slice(0, 8)}...</p>
                  <span className="text-xs font-medium text-blue-600">View Playlist →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
