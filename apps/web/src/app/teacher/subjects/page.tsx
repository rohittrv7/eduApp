'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useGetTeacherSubjectsQuery, useCreateSubjectMutation, useDeleteSubjectMutation } from '@/store/teacherApi';

export default function TeacherSubjectsPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [msg, setMsg] = useState('');

  const { data: subjects = [], isLoading } = useGetTeacherSubjectsQuery();
  const [createSubject, { isLoading: creating }] = useCreateSubjectMutation();
  const [deleteSubject] = useDeleteSubjectMutation();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setMsg('');
    try {
      await createSubject({ name: name.trim(), description: description.trim() || undefined }).unwrap();
      setMsg('Subject created!');
      setName('');
      setDescription('');
    } catch (err: any) {
      setMsg(err?.data?.message ?? 'Failed to create subject');
    }
  }

  async function handleDelete(id: string, subjectName: string) {
    if (!confirm(`"${subjectName}" delete karna chahte ho?`)) return;
    try {
      await deleteSubject(id).unwrap();
    } catch (err: any) {
      setMsg(err?.data?.message ?? 'Failed to delete');
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Subjects</h1>

        {/* Create Form */}
        <form onSubmit={handleCreate} className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-gray-800">New Subject</h2>
          <div className="flex gap-3">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Subject name (e.g. Mathematics)"
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a56db]"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a56db]"
            />
            <button type="submit" disabled={creating}
              className="rounded-lg bg-[#1a56db] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {creating ? 'Adding...' : 'Add'}
            </button>
          </div>
          {msg && <p className={`mt-2 text-xs ${msg.includes('created') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
        </form>

        {/* Subjects List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border bg-white p-4">
                <div className="h-4 w-1/3 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-400">
            <p>Koi subject nahi hai. Upar se add karo.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="px-4 py-3">Subject Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500">{(s as any).description ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(s.id, s.name)}
                        className="rounded bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-200">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
