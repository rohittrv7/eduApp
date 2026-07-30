'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  useGetAdminTeachersQuery,
  useGetTeacherEarningsQuery,
  useCreateTeacherPayoutMutation,
  useDemoteTeacherMutation,
  useBanStudentMutation,
  useUnbanStudentMutation,
  useInvalidateStudentSessionsMutation,
  AdminTeacher,
} from '@/store/adminApi';
import { X, Mail, Phone, BookOpen, Calendar, TrendingUp } from 'lucide-react';

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <span className="w-28 flex-shrink-0 text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 break-all">{value}</span>
    </div>
  );
}

// ── Teacher Detail Panel ──────────────────────────────────────────────────────
function TeacherDetailPanel({
  teacher, onClose, onDemote, onBan, onUnban, onInvalidateSessions,
}: {
  teacher: AdminTeacher;
  onClose: () => void;
  onDemote: () => void;
  onBan: () => void;
  onUnban: () => void;
  onInvalidateSessions: () => void;
}) {
  const { data: earnings, isLoading: earningsLoading } = useGetTeacherEarningsQuery(teacher.id);
  const [createPayout] = useCreateTeacherPayoutMutation();
  const [amount, setAmount] = useState('');
  const [payoutMsg, setPayoutMsg] = useState('');

  async function handlePayout() {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    try {
      await createPayout({ id: teacher.id, amount: amt }).unwrap();
      setPayoutMsg('Payout created!');
      setAmount('');
    } catch {
      setPayoutMsg('Payout failed.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-sm overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold text-gray-900">Teacher Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold text-xl">
              {(teacher.fullName ?? 'T')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-base">{teacher.fullName ?? '—'}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${teacher.isBanned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {teacher.isBanned ? 'Banned' : 'Active'}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-xl border divide-y">
            <InfoRow icon={<Mail size={14} />} label="Email" value={teacher.email ?? '—'} />
            <InfoRow icon={<Phone size={14} />} label="Mobile" value={teacher.mobile ?? '—'} />
            <InfoRow icon={<BookOpen size={14} />} label="Batches" value={`${teacher.batchCount} batches`} />
            <InfoRow icon={<Calendar size={14} />} label="Joined" value={new Date(teacher.joinedAt).toLocaleDateString('en-IN')} />
          </div>

          {/* Earnings */}
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-green-600" />
              <p className="font-semibold text-gray-800">Earnings</p>
            </div>
            {earningsLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
            ) : (
              <p className="text-2xl font-bold text-green-700">
                ₹{(earnings?.totalEarnings ?? 0).toLocaleString('en-IN')}
              </p>
            )}

            <div className="mt-3 flex gap-2">
              <input type="number" min={1} placeholder="Payout amount (₹)" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
              <button onClick={handlePayout} disabled={!amount || Number(amount) <= 0}
                className="rounded-lg bg-[#1a56db] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                Pay
              </button>
            </div>
            {payoutMsg && (
              <p className={`mt-1 text-xs ${payoutMsg.includes('created') ? 'text-green-600' : 'text-red-500'}`}>{payoutMsg}</p>
            )}

            {(earnings?.transactions?.length ?? 0) > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-medium text-gray-400 uppercase">Recent Transactions</p>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {earnings!.transactions.slice(0, 8).map((t: any, i: number) => (
                    <div key={i} className="flex justify-between rounded bg-gray-50 px-3 py-1.5 text-xs">
                      <span className="text-gray-500">{new Date(t.t_created_at).toLocaleDateString('en-IN')}</span>
                      <span className="font-medium">₹{Number(t.t_final_amount).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</p>
            {teacher.isBanned ? (
              <button onClick={onUnban} className="w-full rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700">Unban Teacher</button>
            ) : (
              <button onClick={onBan} className="w-full rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700">Ban Teacher</button>
            )}
            <button onClick={onDemote}
              className="w-full rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600">
              Make Student
            </button>
            <button onClick={onInvalidateSessions} className="w-full rounded-lg border py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Invalidate Sessions</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminTeachersPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const [selectedTeacher, setSelectedTeacher] = useState<AdminTeacher | null>(null);

  const { data, isLoading, isFetching } = useGetAdminTeachersQuery({ page, limit });
  const [demoteTeacher] = useDemoteTeacherMutation();
  const [banTeacher] = useBanStudentMutation();
  const [unbanTeacher] = useUnbanStudentMutation();
  const [invalidateSessions] = useInvalidateStudentSessionsMutation();

  const teachers = data?.teachers ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      {selectedTeacher && (
        <TeacherDetailPanel
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
          onBan={() => { banTeacher(selectedTeacher.id); setSelectedTeacher(null); }}
          onUnban={() => { unbanTeacher(selectedTeacher.id); setSelectedTeacher(null); }}
          onInvalidateSessions={() => { invalidateSessions(selectedTeacher.id); setSelectedTeacher(null); }}
          onDemote={() => {
            if (confirm(`"${selectedTeacher.fullName}" ko wapas Student banana chahte ho?`)) {
              demoteTeacher(selectedTeacher.id);
              setSelectedTeacher(null);
            }
          }}
        />
      )}

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Teachers <span className="ml-2 text-sm font-normal text-gray-400">({total})</span>
          </h1>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <p className="px-4 pt-3 text-xs text-gray-400">Click any row to view full details</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Batches</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading || isFetching ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-gray-200" style={{ width: j === 0 ? '140px' : '80px' }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <p className="text-base">Koi teacher nahi hai abhi</p>
                    <p className="mt-1 text-xs">Students page se kisi ko Teacher role do</p>
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id}
                    className="border-b transition-colors hover:bg-purple-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xs font-bold">
                          {(teacher.fullName ?? 'T')[0].toUpperCase()}
                        </div>
                        {teacher.fullName ?? '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{teacher.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{teacher.mobile ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {teacher.batchCount} batches
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(teacher.joinedAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      {teacher.isBanned ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Banned</span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTeacher(teacher); }}
                        className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
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
