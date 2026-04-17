'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  useGetAdminStudentsQuery,
  useBanStudentMutation,
  useUnbanStudentMutation,
  useWarnStudentMutation,
  useInvalidateStudentSessionsMutation,
  useChangeUserRoleMutation,
  useManualEnrollMutation,
  useGetAdminBatchesQuery,
  AdminStudent,
} from '@/store/adminApi';
import { X, Mail, Phone, Clock, BookOpen, BarChart2, Shield } from 'lucide-react';

function formatWatchTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function InfoRow({ icon, label, value, capitalize }: {
  icon: React.ReactNode; label: string; value: string; capitalize?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <span className="w-28 flex-shrink-0 text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-medium text-gray-800 break-all ${capitalize ? 'capitalize' : ''}`}>{value}</span>
    </div>
  );
}

// ── Detail Side Panel ─────────────────────────────────────────────────────────
function StudentDetailPanel({
  student, onClose, onBan, onUnban, onWarn, onMakeTeacher, onEnroll,
}: {
  student: AdminStudent;
  onClose: () => void;
  onBan: () => void;
  onUnban: () => void;
  onWarn: (msg: string) => void;
  onMakeTeacher: () => void;
  onEnroll: () => void;
}) {
  const [warnMsg, setWarnMsg] = useState('');
  const [showWarn, setShowWarn] = useState(false);
  const [invalidateSessions] = useInvalidateStudentSessionsMutation();

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-sm overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold text-gray-900">Student Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1a56db]/10 text-[#1a56db] font-bold text-xl">
              {(student.fullName ?? 'S')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-base">{student.fullName ?? '—'}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${student.isBanned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {student.isBanned ? 'Banned' : 'Active'}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-xl border divide-y">
            <InfoRow icon={<Mail size={14} />} label="Email" value={student.email ?? '—'} />
            <InfoRow icon={<Phone size={14} />} label="Mobile" value={student.mobile ?? '—'} />
            <InfoRow icon={<Shield size={14} />} label="Skill Level" value={student.skillLevel ?? 'basic'} capitalize />
            <InfoRow icon={<Clock size={14} />} label="Last Active" value={new Date(student.lastActive).toLocaleString('en-IN')} />
            <InfoRow icon={<BookOpen size={14} />} label="Enrollments" value={String(student.enrollmentCount)} />
            <InfoRow icon={<BarChart2 size={14} />} label="Quiz Score" value={String(student.quizScore)} />
            <InfoRow icon={<Clock size={14} />} label="Watch Time" value={formatWatchTime(student.totalWatchTimeSecs)} />
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</p>
            {student.isBanned ? (
              <button onClick={onUnban} className="w-full rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700">Unban Student</button>
            ) : (
              <button onClick={onBan} className="w-full rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700">Ban Student</button>
            )}
            <button onClick={onEnroll} className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Manual Enroll in Batch</button>
            <button onClick={onMakeTeacher} className="w-full rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-700">Make Teacher</button>
            <button onClick={() => invalidateSessions(student.id)} className="w-full rounded-lg border py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Invalidate Sessions</button>
            {!showWarn ? (
              <button onClick={() => setShowWarn(true)} className="w-full rounded-lg border border-yellow-400 py-2 text-sm font-semibold text-yellow-600 hover:bg-yellow-50">Send Warning</button>
            ) : (
              <div className="space-y-2">
                <textarea autoFocus rows={2} value={warnMsg} onChange={(e) => setWarnMsg(e.target.value)}
                  placeholder="Warning message..." className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                <div className="flex gap-2">
                  <button disabled={!warnMsg.trim()} onClick={() => { onWarn(warnMsg.trim()); setShowWarn(false); setWarnMsg(''); }}
                    className="flex-1 rounded-lg bg-yellow-500 py-2 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-50">Send</button>
                  <button onClick={() => setShowWarn(false)} className="flex-1 rounded-lg border py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Manual Enroll Modal ───────────────────────────────────────────────────────
function ManualEnrollModal({ student, onClose }: { student: AdminStudent; onClose: () => void }) {
  const [batchId, setBatchId] = useState('');
  const [manualEnroll, { isLoading }] = useManualEnrollMutation();
  const { data: batchesData } = useGetAdminBatchesQuery();
  const batches = batchesData?.data ?? [];

  async function handleSubmit() {
    if (!batchId) return;
    try {
      await manualEnroll({ studentId: student.id, batchId }).unwrap();
      alert(`${student.fullName} ko batch mein enroll kar diya!`);
      onClose();
    } catch (e: any) {
      alert(e?.data?.message ?? 'Enrollment failed');
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Enroll — {student.fullName}</h2>
        <select value={batchId} onChange={(e) => setBatchId(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] mb-4">
          <option value="">-- Batch chuniye --</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="flex gap-3">
          <button onClick={handleSubmit} disabled={!batchId || isLoading}
            className="flex-1 rounded-lg bg-[#1a56db] py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {isLoading ? 'Enrolling...' : 'Enroll Karo'}
          </button>
          <button onClick={onClose} className="flex-1 rounded-lg border py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminStudentsPage() {
  const [skillLevel, setSkillLevel] = useState('');
  const [lastActiveFrom, setLastActiveFrom] = useState('');
  const [lastActiveTo, setLastActiveTo] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [selectedStudent, setSelectedStudent] = useState<AdminStudent | null>(null);
  const [enrollStudent, setEnrollStudent] = useState<AdminStudent | null>(null);

  const params = {
    ...(skillLevel && { skillLevel }),
    ...(lastActiveFrom && { lastActiveFrom }),
    ...(lastActiveTo && { lastActiveTo }),
    ...(enrollmentStatus && { enrollmentStatus }),
    page,
    limit,
  };

  const { data, isLoading, isFetching } = useGetAdminStudentsQuery(params);
  const [banStudent] = useBanStudentMutation();
  const [unbanStudent] = useUnbanStudentMutation();
  const [warnStudent] = useWarnStudentMutation();
  const [changeUserRole] = useChangeUserRoleMutation();

  const students = data?.students ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  function buildExportUrl() {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const qs = new URLSearchParams();
    if (skillLevel) qs.set('skillLevel', skillLevel);
    if (lastActiveFrom) qs.set('lastActiveFrom', lastActiveFrom);
    if (lastActiveTo) qs.set('lastActiveTo', lastActiveTo);
    if (enrollmentStatus) qs.set('enrollmentStatus', enrollmentStatus);
    const query = qs.toString();
    return `${base}/admin/students/export${query ? `?${query}` : ''}`;
  }

  return (
    <DashboardLayout>
      {selectedStudent && (
        <StudentDetailPanel
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onBan={() => { banStudent(selectedStudent.id); setSelectedStudent(null); }}
          onUnban={() => { unbanStudent(selectedStudent.id); setSelectedStudent(null); }}
          onWarn={(msg) => warnStudent({ id: selectedStudent.id, message: msg })}
          onMakeTeacher={() => {
            if (confirm(`"${selectedStudent.fullName}" ko Teacher banana chahte ho?`)) {
              changeUserRole({ id: selectedStudent.id, role: 'teacher' });
              setSelectedStudent(null);
            }
          }}
          onEnroll={() => { setEnrollStudent(selectedStudent); setSelectedStudent(null); }}
        />
      )}
      {enrollStudent && (
        <ManualEnrollModal student={enrollStudent} onClose={() => setEnrollStudent(null)} />
      )}

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Students <span className="ml-2 text-sm font-normal text-gray-400">({total})</span>
          </h1>
          <button onClick={() => window.open(buildExportUrl(), '_blank')}
            className="rounded-lg border border-[#1a56db] px-4 py-2 text-sm font-semibold text-[#1a56db] hover:bg-blue-50">
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Skill Level</label>
            <select value={skillLevel} onChange={(e) => { setSkillLevel(e.target.value); setPage(1); }}
              className="rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]">
              <option value="">All</option>
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Last Active From</label>
            <input type="date" value={lastActiveFrom} onChange={(e) => { setLastActiveFrom(e.target.value); setPage(1); }}
              className="rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Last Active To</label>
            <input type="date" value={lastActiveTo} onChange={(e) => { setLastActiveTo(e.target.value); setPage(1); }}
              className="rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Enrollment</label>
            <select value={enrollmentStatus} onChange={(e) => { setEnrollmentStatus(e.target.value); setPage(1); }}
              className="rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]">
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {(skillLevel || lastActiveFrom || lastActiveTo || enrollmentStatus) && (
            <div className="flex items-end">
              <button onClick={() => { setSkillLevel(''); setLastActiveFrom(''); setLastActiveTo(''); setEnrollmentStatus(''); setPage(1); }}
                className="rounded border px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100">Clear</button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <p className="px-4 pt-3 text-xs text-gray-400">Row pe click karo full details dekhne ke liye</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Skill</th>
                <th className="px-4 py-3">Enrollments</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading || isFetching ? (
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-gray-200" style={{ width: j === 0 ? '120px' : '70px' }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400">No students found.</td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}
                    className={`border-b transition-colors hover:bg-blue-50 ${student.isBanned ? 'bg-red-50/60' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#1a56db]/10 text-[#1a56db] text-xs font-bold">
                          {(student.fullName ?? 'S')[0].toUpperCase()}
                        </div>
                        {student.fullName ?? '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{student.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{student.mobile ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium capitalize text-blue-700">
                        {student.skillLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{student.enrollmentCount}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(student.lastActive).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      {student.isBanned ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Banned</span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedStudent(student); }}
                        className="rounded-lg bg-[#1a56db] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="rounded border px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40">← Prev</button>
              <span className="flex items-center px-2 font-medium">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                className="rounded border px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
