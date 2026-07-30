'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  BookOpen, CheckCircle, Lock, Play, ShoppingCart,
  ChevronDown, ChevronRight, Radio, Calendar,
} from 'lucide-react';
import {
  useGetBatchDetailQuery,
  useGetBatchLiveClassesQuery,
  useEnrollFreeBatchMutation,
  useCreatePaymentOrderMutation,
  useGetBatchStudyMaterialsQuery,
} from '@/store/batchApi';
import { PdfViewer } from '@/components/ui/PdfViewer';

declare global {
  interface Window { Razorpay: any; }
}

type Tab = 'videos' | 'live' | 'notes';

function VideoRow({ video, isEnrolled, isBatchFree, onBuyClick }: {
  video: any; isEnrolled: boolean; isBatchFree: boolean; onBuyClick: () => void;
}) {
  const router = useRouter();
  const isLiveRec = !!video.isLiveRecording;
  return (
    <button
      onClick={() => {
        if (!isEnrolled) { onBuyClick(); return; }
        if (isLiveRec) router.push(`/student/live/${video.id}`);
        else router.push(`/student/videos/${video.id}`);
      }}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors
        ${isEnrolled ? 'hover:bg-blue-50 text-gray-700' : 'text-gray-400 hover:bg-red-50'}`}
    >
      <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full
        ${isEnrolled ? 'bg-[#1a56db] text-white' : 'bg-gray-200 text-gray-400'}`}>
        {isEnrolled ? <Play size={12} /> : <Lock size={11} />}
      </div>
      <span className="flex-1 line-clamp-1">{video.title}</span>
      {!isEnrolled && (
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
          {isBatchFree ? 'Enroll' : 'Buy'}
        </span>
      )}
      {!isLiveRec && video.durationSeconds > 0 && (
        <span className="text-xs text-gray-400 flex-shrink-0">{Math.floor(video.durationSeconds / 60)}m</span>
      )}
    </button>
  );
}

function ChapterSection({ chapter, isEnrolled, isBatchFree, onBuyClick }: {
  chapter: any; isEnrolled: boolean; isBatchFree: boolean; onBuyClick: () => void;
}) {
  const [open, setOpen] = useState(true);
  const videos = chapter.videos ?? [];
  return (
    <div className="border-b last:border-0">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50">
        <span className="text-sm font-medium text-gray-700">{chapter.name === 'Live Classes' ? 'Recorded Classes' : (chapter.name ?? chapter.title)}</span>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{videos.length} videos</span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>
      {open && videos.length > 0 && (
        <div className="px-3 pb-3 space-y-1">
          {videos.map((v: any) => (
            <VideoRow key={v.id} video={v} isEnrolled={isEnrolled} isBatchFree={isBatchFree} onBuyClick={onBuyClick} />
          ))}
        </div>
      )}
    </div>
  );
}

function LiveClassCard({ lc, isEnrolled }: { lc: any; isEnrolled: boolean }) {
  const router = useRouter();

  const isLive = lc.status === 'active';
  const isEnded = lc.status === 'ended';
  const isApproved = lc.status === 'approved';
  const canWatch = isEnrolled && (isLive || isEnded);
  const scheduledDate = new Date(lc.scheduled_at);
  const scheduledValid = !isNaN(scheduledDate.getTime());

  function handleWatch() {
    if (canWatch) router.push(`/student/live/${lc.id}`);
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-white border shadow-sm">
      {/* Thumbnail area — no YouTube, just gradient + icon */}
      <div
        className={`relative w-full overflow-hidden ${canWatch ? 'cursor-pointer group' : ''}`}
        style={{ paddingTop: '52%' }}
        onClick={handleWatch}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <Radio size={36} className={isLive ? 'text-red-400' : 'text-gray-600'} />
        </div>

        {/* Dark overlay */}
        <div className={`absolute inset-0 bg-black/30 ${canWatch ? 'group-hover:bg-black/50' : ''} transition-colors`} />

        {/* LIVE badge */}
        {isLive && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1 shadow-lg">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            <span className="text-xs font-bold text-white tracking-wide">LIVE</span>
          </div>
        )}

        {/* Ended badge */}
        {isEnded && (
          <div className="absolute left-3 top-3 rounded-md bg-gray-700/80 px-2.5 py-1">
            <span className="text-xs font-semibold text-gray-200">Recorded</span>
          </div>
        )}

        {/* Upcoming badge */}
        {isApproved && (
          <div className="absolute left-3 top-3 rounded-md bg-green-600/90 px-2.5 py-1">
            <span className="text-xs font-semibold text-white">Upcoming</span>
          </div>
        )}

        {/* Play button — only if watchable */}
        {canWatch && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-transform duration-200 group-hover:scale-110
              ${isLive ? 'bg-red-600' : 'bg-white/90'}`}>
              <Play size={22} className={`ml-1 ${isLive ? 'text-white' : 'text-gray-900'}`} />
            </div>
          </div>
        )}

        {/* Scheduled time overlay for upcoming */}
        {isApproved && scheduledValid && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-white/90">
              <Calendar size={12} />
              <span>
                {scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                {' · '}
                {scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{lc.title}</h3>
            {lc.description && (
              <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{lc.description}</p>
            )}
            {scheduledValid && (
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                <Calendar size={11} />
                <span>
                  {scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}
                  {scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
          {isLive && <Radio size={16} className="text-red-500 animate-pulse flex-shrink-0 mt-0.5" />}
        </div>

        {/* Join / Watch button */}
        {canWatch && (
          <button
            onClick={handleWatch}
            className={`mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white
              ${isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1a56db] hover:bg-blue-700'} transition-colors`}
          >
            <Play size={14} />
            {isLive ? 'Join Live Now' : 'Watch Recording'}
          </button>
        )}

        {/* Upcoming — reminder info */}
        {isApproved && scheduledValid && (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-xs text-orange-700 font-medium">
            <span>🔔</span>
            <span>
              {scheduledDate > new Date()
                ? `Starts at ${scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                : 'Starting soon...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function PurchasePrompt({ batch, onEnrollFree, onPay, loading, onClose }: {
  batch: any; onEnrollFree: () => void; onPay: () => void; loading: boolean; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
          <Lock size={22} className="text-orange-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Content Locked</h3>
        <p className="mt-1 text-sm text-gray-500">Please enroll in this batch to access this video lesson.</p>
        <div className="mt-4 rounded-lg border p-4">
          <p className="font-semibold text-gray-800">{batch.name}</p>
          <p className="mt-1 text-2xl font-bold text-[#1a56db]">{batch.is_free ? 'Free' : `₹${batch.price}`}</p>
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={batch.is_free ? onEnrollFree : onPay} disabled={loading}
            className="flex-1 rounded-lg bg-[#1a56db] py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Processing...' : batch.is_free ? 'Enroll Free' : `Buy ₹${batch.price}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BatchDetailPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('videos');
  const [enrollMsg, setEnrollMsg] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [showPurchasePrompt, setShowPurchasePrompt] = useState(false);
  const [pdfViewer, setPdfViewer] = useState<{ materialId: string; title: string } | null>(null);
  const [imageError, setImageError] = useState(false);

  const { data, isLoading, refetch } = useGetBatchDetailQuery(batchId);
  const { data: liveClasses = [] } = useGetBatchLiveClassesQuery(data?.id ?? '', { skip: !data?.id });
  // Live tab: sirf active aur upcoming (approved) dikhao — ended nahi
  const visibleLiveClasses = liveClasses.filter((l: any) =>
    ['approved', 'active'].includes(l.status)
  );
  const activeLiveCount = liveClasses.filter((l: any) => l.status === 'active').length;
  const { data: studyMaterials = [] } = useGetBatchStudyMaterialsQuery(data?.id ?? '', { skip: !data?.id });
  const [enrollFree] = useEnrollFreeBatchMutation();
  const [createOrder] = useCreatePaymentOrderMutation();

  async function handleEnrollFree() {
    setEnrolling(true);
    setEnrollMsg('');
    try {
      await enrollFree(data!.id).unwrap();
      setEnrollMsg('Successfully enrolled!');
      setShowPurchasePrompt(false);
      refetch();
    } catch (err: any) {
      setEnrollMsg(err?.data?.message ?? 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  }

  async function handlePay() {
    setEnrolling(true);
    setEnrollMsg('');
    try {
      const order = await createOrder({ batch_id: data!.id }).unwrap();
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Razorpay load failed'));
          document.body.appendChild(s);
        });
      }
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount * 100,
        currency: 'INR',
        order_id: order.orderId,
        name: 'allEdu',
        description: data!.name,
        handler: () => {
          setEnrollMsg('Payment successful! Enrolling...');
          setShowPurchasePrompt(false);
          setTimeout(() => { refetch(); setEnrolling(false); }, 2000);
        },
        modal: { ondismiss: () => setEnrolling(false) },
      });
      rzp.open();
    } catch (err: any) {
      setEnrollMsg(err?.data?.message ?? 'Payment failed');
      setEnrolling(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-100" />
          <div className="h-48 rounded-xl bg-gray-100" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <p className="py-12 text-center text-gray-500">Batch not found.</p>
      </DashboardLayout>
    );
  }

  const isEnrolled = data.isEnrolled;
  const subjects = data.subjects ?? [];
  const totalVideos = subjects.reduce(
    (acc: number, s: any) => acc + (s.chapters ?? []).reduce((a: number, c: any) => a + (c.videos ?? []).length, 0), 0
  );

  return (
    <DashboardLayout>
      {pdfViewer && (
        <PdfViewer materialId={pdfViewer.materialId} title={pdfViewer.title} onClose={() => setPdfViewer(null)} />
      )}
      {showPurchasePrompt && (
        <PurchasePrompt
          batch={data} onEnrollFree={handleEnrollFree} onPay={handlePay}
          loading={enrolling} onClose={() => setShowPurchasePrompt(false)}
        />
      )}

      <div className="mx-auto max-w-2xl space-y-5">
        {/* Batch Info Card */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          {data.thumbnail && !imageError && data.thumbnail.trim() !== '' && !data.thumbnail.includes('undefined') ? (
            <div className="w-full bg-slate-900 flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.thumbnail}
                alt={data.name}
                className="max-h-80 w-full object-contain rounded-lg"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6">
              <div className="flex items-center gap-3">
                <BookOpen size={36} className="opacity-90" />
                <span className="text-2xl font-bold tracking-tight">{data.name}</span>
              </div>
            </div>
          )}
          <div className="p-5">
            <h1 className="text-xl font-bold text-gray-900">{data.name}</h1>
            {data.description && <p className="mt-1 text-sm text-gray-500">{data.description}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {data.target_exam && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{data.target_exam}</span>
              )}
              {data.language && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 capitalize">{data.language}</span>
              )}
              {totalVideos > 0 && (
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">{totalVideos} videos</span>
              )}
              {visibleLiveClasses.length > 0 && (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700">{visibleLiveClasses.length} live classes</span>
              )}
            </div>

            {/* Enrollment section */}
            <div className="mt-5">
              {isEnrolled ? (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3">
                  <CheckCircle size={18} className="text-green-600" />
                  <span className="text-sm font-semibold text-green-700">You are enrolled in this batch</span>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border-2 border-dashed border-[#1a56db]/30 bg-blue-50/40 p-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {data.is_free ? <span className="text-green-600">Free</span> : `₹${data.price}`}
                    </p>
                    {!data.is_free && <p className="text-xs text-gray-400">One-time payment • Lifetime access</p>}
                  </div>
                  <button
                    onClick={data.is_free ? handleEnrollFree : handlePay}
                    disabled={enrolling}
                    className="flex items-center gap-2 rounded-lg bg-[#1a56db] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <ShoppingCart size={15} />
                    {enrolling ? 'Processing...' : data.is_free ? 'Enroll Free' : 'Buy Now'}
                  </button>
                </div>
              )}
              {enrollMsg && (
                <p className={`mt-2 text-sm ${enrollMsg.toLowerCase().includes('success') || enrollMsg.includes('enrolled') ? 'text-green-600' : 'text-red-500'}`}>
                  {enrollMsg}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs — only show if enrolled */}
        {isEnrolled && (
          <div className="flex gap-1 rounded-xl border bg-white p-1 shadow-sm">
            <button onClick={() => setActiveTab('videos')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors
                ${activeTab === 'videos' ? 'bg-[#1a56db] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <BookOpen size={15} /> Videos
            </button>
            <button onClick={() => setActiveTab('live')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors
                ${activeTab === 'live' ? 'bg-[#1a56db] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Radio size={15} /> Live
              {activeLiveCount > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">LIVE</span>
              )}
            </button>
            <button onClick={() => setActiveTab('notes')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors
                ${activeTab === 'notes' ? 'bg-[#1a56db] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              📄 Notes
              {studyMaterials.length > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${activeTab === 'notes' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {studyMaterials.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Videos Tab */}
        {(!isEnrolled || activeTab === 'videos') && (
          subjects.length > 0 ? (
            <div className="space-y-3">
              {isEnrolled && <h2 className="font-semibold text-gray-800">Batch Content</h2>}
              {subjects.map((subject: any) => (
                <div key={subject.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 border-b bg-gray-50 px-4 py-3">
                    <BookOpen size={16} className="text-[#1a56db]" />
                    <span className="font-semibold text-gray-800">{subject.name ?? subject.title}</span>
                  </div>
                  {(subject.chapters ?? []).map((chapter: any) => (
                    <ChapterSection
                      key={chapter.id} chapter={chapter}
                      isEnrolled={isEnrolled} isBatchFree={data.is_free}
                      onBuyClick={() => setShowPurchasePrompt(true)}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
              {isEnrolled ? (
                <>
                  <BookOpen size={36} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">No video lessons available yet. Your instructor will upload content soon.</p>
                </>
              ) : (
                <>
                  <Lock size={36} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    {data.is_free ? 'Enroll for free to access course content' : `Purchase for ₹${data.price} to unlock full course access`}
                  </p>
                  <button
                    onClick={data.is_free ? handleEnrollFree : handlePay}
                    disabled={enrolling}
                    className="mt-4 rounded-lg bg-[#1a56db] px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {data.is_free ? 'Enroll Free' : `Buy ₹${data.price}`}
                  </button>
                </>
              )}
            </div>
          )
        )}

        {/* Live Classes Tab */}
        {isEnrolled && activeTab === 'live' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">Live Classes</h2>
            {visibleLiveClasses.length === 0 ? (
              <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
                <Radio size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">No live classes scheduled at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {visibleLiveClasses.map((lc: any) => (
                  <LiveClassCard key={lc.id} lc={lc} isEnrolled={isEnrolled} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-800">Notes &amp; PDFs</h2>
            {studyMaterials.length === 0 ? (
              <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
                <p className="text-2xl mb-2">📄</p>
                <p className="text-sm text-gray-500">No study materials or notes available yet.</p>
              </div>
            ) : (
              <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                {studyMaterials.map((m: any, idx: number) => (
                  <div key={m.id}
                    className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? 'border-t' : ''}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                      <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{m.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 uppercase">{m.type}</span>
                        {m.is_free_preview && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Free</span>
                        )}
                      </div>
                    </div>
                    {m.file_url ? (
                      <button
                        onClick={() => setPdfViewer({ materialId: m.id, title: m.title })}
                        className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[#1a56db] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        <BookOpen size={12} />
                        View
                      </button>
                    ) : (
                      !isEnrolled && !m.is_free_preview ? (
                        <span className="shrink-0 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-400">
                          🔒 Locked
                        </span>
                      ) : null
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
