'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  useGetTeacherSubjectsQuery,
  useCreateSubjectMutation,
  useDeleteSubjectMutation,
  useGetChaptersBySubjectQuery,
  useGetTeacherBatchesQuery,
  useCreateChapterMutation,
  useDeleteChapterMutation,
} from '@/store/teacherApi';
import {
  Plus, ChevronDown, ChevronRight, Trash2, BookOpen,
  FolderPlus, X,
} from 'lucide-react';

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ChapterRow({ chapter, onDelete }: { chapter: any; onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b last:border-0 hover:bg-gray-50">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <FolderPlus size={14} className="text-gray-400" />
        {chapter.name}
      </div>
      {confirm ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Delete?</span>
          <button onClick={onDelete} className="text-xs text-red-600 font-medium hover:underline">Yes</button>
          <button onClick={() => setConfirm(false)} className="text-xs text-gray-500 hover:underline">No</button>
        </div>
      ) : (
        <button onClick={() => setConfirm(true)} className="text-gray-400 hover:text-red-500">
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

function SubjectCard({ subject, onDeleteSubject }: { subject: any; onDeleteSubject: () => void }) {
  const [open, setOpen] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [chapterName, setChapterName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: chapters = [], refetch } = useGetChaptersBySubjectQuery(subject.id);
  const [createChapter, { isLoading: creating }] = useCreateChapterMutation();
  const [deleteChapter] = useDeleteChapterMutation();

  async function handleAddChapter() {
    if (!chapterName.trim()) return;
    await createChapter({ subjectId: subject.id, name: chapterName.trim() }).unwrap();
    setChapterName('');
    setShowAddChapter(false);
    refetch();
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 flex-1 text-left">
          <BookOpen size={16} className="text-[#1a56db]" />
          <span className="font-semibold text-gray-800">{subject.name}</span>
          <span className="text-xs text-gray-400 ml-1">({chapters.length} chapters)</span>
          {open ? <ChevronDown size={14} className="ml-auto text-gray-400" /> : <ChevronRight size={14} className="ml-auto text-gray-400" />}
        </button>
        <div className="flex items-center gap-2 ml-3">
          <button
            onClick={() => setShowAddChapter(true)}
            className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-[#1a56db] hover:bg-blue-100"
          >
            <Plus size={12} /> Chapter
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={onDeleteSubject} className="text-xs text-red-600 font-medium hover:underline">Delete</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:underline">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="text-gray-400 hover:text-red-500">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {open && (
        <div>
          {chapters.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">No chapters yet. Add one above.</p>
          ) : (
            chapters.map((c: any) => (
              <ChapterRow
                key={c.id}
                chapter={c}
                onDelete={() => deleteChapter(c.id).then(() => refetch())}
              />
            ))
          )}
        </div>
      )}

      {showAddChapter && (
        <Modal title="New Chapter" onClose={() => setShowAddChapter(false)}>
          <input
            autoFocus
            value={chapterName}
            onChange={e => setChapterName(e.target.value)}
            placeholder="e.g. Algebra, Trigonometry..."
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] mb-4"
            onKeyDown={e => e.key === 'Enter' && handleAddChapter()}
          />
          <div className="flex gap-2">
            <button onClick={() => setShowAddChapter(false)} className="flex-1 rounded-lg border py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={handleAddChapter} disabled={creating || !chapterName.trim()}
              className="flex-1 rounded-lg bg-[#1a56db] py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {creating ? 'Adding...' : 'Add Chapter'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function TeacherContentPage() {
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectName, setSubjectName] = useState('');

  const { data: subjects = [], refetch } = useGetTeacherSubjectsQuery();
  const { data: batches = [] } = useGetTeacherBatchesQuery();
  const [createSubject, { isLoading: creatingSubject }] = useCreateSubjectMutation();
  const [deleteSubject] = useDeleteSubjectMutation();

  async function handleAddSubject() {
    if (!subjectName.trim()) return;
    await createSubject({ name: subjectName.trim() }).unwrap();
    setSubjectName('');
    setShowAddSubject(false);
    refetch();
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Content</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage subjects and chapters</p>
          </div>
          <button
            onClick={() => setShowAddSubject(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#1a56db] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={16} /> New Subject
          </button>
        </div>

        {batches.length === 0 && (
          <div className="rounded-xl border bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Pehle ek batch create karo, phir subjects aur chapters add karo.
          </div>
        )}

        {subjects.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
            <BookOpen size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">Koi subject nahi hai. "New Subject" se add karo.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subjects.map((s: any) => (
              <SubjectCard
                key={s.id}
                subject={s}
                onDeleteSubject={() => deleteSubject(s.id).then(() => refetch())}
              />
            ))}
          </div>
        )}
      </div>

      {showAddSubject && (
        <Modal title="New Subject" onClose={() => setShowAddSubject(false)}>
          <input
            autoFocus
            value={subjectName}
            onChange={e => setSubjectName(e.target.value)}
            placeholder="e.g. Mathematics, Physics..."
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] mb-4"
            onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
          />
          <div className="flex gap-2">
            <button onClick={() => setShowAddSubject(false)} className="flex-1 rounded-lg border py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={handleAddSubject} disabled={creatingSubject || !subjectName.trim()}
              className="flex-1 rounded-lg bg-[#1a56db] py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {creatingSubject ? 'Adding...' : 'Add Subject'}
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
