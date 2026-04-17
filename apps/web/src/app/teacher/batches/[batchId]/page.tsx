'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PdfViewer } from '@/components/ui/PdfViewer';
import {
  useGetTeacherBatchDetailQuery,
  useGetStudyMaterialsQuery,
  useUploadStudyMaterialFileMutation,
  useCreateStudyMaterialMutation,
  useDeleteStudyMaterialMutation,
} from '@/store/teacherApi';

function formatDuration(secs: number): string {
  if (!secs) return '0:00';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type Tab = 'playlist' | 'notes';

export default function TeacherBatchDetailPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('playlist');
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});
  const [pdfViewer, setPdfViewer] = useState<{ materialId: string; title: string } | null>(null);

  const { data: batch, isLoading, isError } = useGetTeacherBatchDetailQuery(batchId);

  function toggleSubject(id: string) {
    setOpenSubjects((p) => ({ ...p, [id]: !p[id] }));
  }
  function toggleChapter(id: string) {
    setOpenChapters((p) => ({ ...p, [id]: !p[id] }));
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-1/3 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-100" />
          {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-gray-100" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !batch) {
    return (
      <DashboardLayout>
        <div className="rounded-xl border bg-white p-12 text-center text-gray-400">
          <p>Batch nahi mila.</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-blue-600 underline">Back</button>
        </div>
      </DashboardLayout>
    );
  }

  const totalVideos = batch.subjects.reduce(
    (acc, s) => acc + s.chapters.reduce((a, c) => a + c.videos.length, 0), 0,
  );

  return (
    <DashboardLayout>
      {pdfViewer && (
        <PdfViewer materialId={pdfViewer.materialId} title={pdfViewer.title} onClose={() => setPdfViewer(null)} />
      )}
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className="rounded-lg border p-2 text-gray-500 hover:bg-gray-50" aria-label="Go back">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{batch.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${batch.is_free ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {batch.is_free ? 'Free' : `₹${batch.price}`}
                </span>
                {batch.target_exam && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{batch.target_exam}</span>
                )}
                {batch.language && (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 capitalize">{batch.language}</span>
                )}
                <span className="text-xs text-gray-400">{totalVideos} videos</span>
              </div>
            </div>
          </div>

          {tab === 'playlist' ? (
            <Link href={`/teacher/videos/new?batchId=${batchId}`}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-[#1a56db] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Video
            </Link>
          ) : null}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
          {(['playlist', 'notes'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'playlist' ? '📹 Playlist' : '📄 Notes / PDFs'}
            </button>
          ))}
        </div>

        {tab === 'playlist' ? (
          <PlaylistTab
            batch={batch}
            openSubjects={openSubjects}
            openChapters={openChapters}
            toggleSubject={toggleSubject}
            toggleChapter={toggleChapter}
            batchId={batchId}
          />
        ) : (
          <NotesTab batchId={batchId} setPdfViewer={setPdfViewer} />
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── Playlist Tab ─────────────────────────────────────────────────────────────

function PlaylistTab({ batch, openSubjects, openChapters, toggleSubject, toggleChapter, batchId }: any) {
  if (batch.subjects.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center text-gray-400">
        <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
        <p className="text-sm font-medium">Koi video nahi hai abhi</p>
        <p className="mt-1 text-xs">"Add Video" button se is batch mein video add karo</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {batch.subjects.map((subject: any) => {
        const isSubjectOpen = openSubjects[subject.id] !== false;
        const subjectVideoCount = subject.chapters.reduce((a: number, c: any) => a + c.videos.length, 0);

        return (
          <div key={subject.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <button onClick={() => toggleSubject(subject.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                  <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{subject.name}</p>
                  <p className="text-xs text-gray-400">{subject.chapters.length} chapters · {subjectVideoCount} videos</p>
                </div>
              </div>
              <svg className={`h-5 w-5 text-gray-400 transition-transform ${isSubjectOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isSubjectOpen && (
              <div className="border-t">
                {subject.chapters.map((chapter: any, chIdx: number) => {
                  const isChapterOpen = openChapters[chapter.id] !== false;
                  return (
                    <div key={chapter.id} className={chIdx > 0 ? 'border-t' : ''}>
                      <button onClick={() => toggleChapter(chapter.id)}
                        className="flex w-full items-center justify-between bg-gray-50 px-5 py-3 text-left hover:bg-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full border bg-white text-xs font-semibold text-gray-600">
                            {chIdx + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-800">{chapter.name}</span>
                          <span className="text-xs text-gray-400">({chapter.videos.length} videos)</span>
                        </div>
                        <svg className={`h-4 w-4 text-gray-400 transition-transform ${isChapterOpen ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {isChapterOpen && (
                        <div>
                          {chapter.videos.length === 0 ? (
                            <p className="px-5 py-3 text-xs text-gray-400">Is chapter mein koi video nahi</p>
                          ) : (
                            chapter.videos.map((video: any, vIdx: number) => (
                              <div key={video.id}
                                className="flex items-center gap-3 border-t px-5 py-3 hover:bg-blue-50/40 transition-colors">
                                <span className="w-5 shrink-0 text-center text-xs text-gray-400">{vIdx + 1}</span>
                                <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-gray-100">
                                  {video.thumbnail ? (
                                    <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      <svg className="h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </div>
                                  )}
                                  {video.isLocked && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                      <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-gray-900">{video.title}</p>
                                  <p className="text-xs text-gray-400">
                                    {formatDuration(video.durationSeconds)}
                                    {video.isLocked && <span className="ml-2 text-orange-500">Locked</span>}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────

function NotesTab({ batchId, setPdfViewer }: { batchId: string; setPdfViewer: (v: { materialId: string; title: string } | null) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: materials = [], isLoading } = useGetStudyMaterialsQuery(batchId);
  const [uploadFile] = useUploadStudyMaterialFileMutation();
  const [createMaterial] = useCreateStudyMaterialMutation();
  const [deleteMaterial] = useDeleteStudyMaterialMutation();

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !title.trim()) return;
    setUploading(true);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      const { url } = await uploadFile(fd).unwrap();
      await createMaterial({
        title: title.trim(),
        type: selectedFile.type === 'application/pdf' ? 'pdf' : 'image',
        file_url: url,
        batch_id: batchId,
        folder_name: subjectName.trim() || undefined,
        is_free_preview: isFreePreview,
      }).unwrap();
      setMsg('PDF upload ho gaya!');
      setTitle('');
      setSubjectName('');
      setSelectedFile(null);
      setIsFreePreview(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setMsg(err?.data?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Is PDF ko delete karna chahte ho?')) return;
    try {
      await deleteMaterial({ id, batchId }).unwrap();
    } catch {
      alert('Delete failed');
    }
  }

  return (
    <div className="space-y-5">
      {/* Upload Form */}
      <form onSubmit={handleUpload} className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-800">PDF / Notes Upload karo</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Title *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 1 Notes"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a56db]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Subject / Folder</label>
            <input
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Mathematics, Physics"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a56db]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">File (PDF / Image) *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              required
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-blue-700"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer w-fit">
          <input type="checkbox" checked={isFreePreview}
            onChange={(e) => setIsFreePreview(e.target.checked)}
            className="rounded" />
          <span className="text-gray-700">Free Preview</span>
          <span className="text-xs text-gray-400">(bina enrollment ke bhi dikhe)</span>
        </label>

        {msg && (
          <p className={`text-sm ${msg.includes('ho gaya') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
        )}

        <button type="submit" disabled={uploading || !selectedFile || !title.trim()}
          className="rounded-lg bg-[#1a56db] px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {uploading ? 'Uploading...' : 'Upload PDF'}
        </button>
      </form>

      {/* Materials List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-14 rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-400">
          <p className="text-sm">Koi PDF nahi hai abhi. Upar se upload karo.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          {materials.map((m, idx) => (
            <div key={m.id}
              className={`flex items-center gap-3 px-5 py-3 ${idx > 0 ? 'border-t' : ''}`}>
              {/* Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
                </svg>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{m.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {m.folder_name && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{m.folder_name}</span>
                  )}
                  <span className="text-xs text-gray-400 uppercase">{m.type}</span>
                  {m.is_free_preview ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Free Preview</span>
                  ) : (
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">Enrolled Only</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {m.file_url && (
                  <button
                    onClick={() => setPdfViewer({ materialId: m.id, title: m.title })}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    View
                  </button>
                )}
                <button onClick={() => handleDelete(m.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
