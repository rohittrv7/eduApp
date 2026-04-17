import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Users, Star } from 'lucide-react';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { EnrollButton } from '@/components/batches/EnrollButton';
import { cookies } from 'next/headers';

interface Subject {
  id: string;
  name: string;
  chapters: { id: string; title: string }[];
}

interface LiveClass {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
}

interface BatchDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  isFree: boolean;
  rating: number;
  ratingCount: number;
  enrolledCount: number;
  teacher: {
    id: string;
    fullName: string;
    photo?: string;
    bio?: string;
  };
  subjects: Subject[];
  upcomingClasses: LiveClass[];
}

async function getBatchDetail(slug: string): Promise<BatchDetail | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const res = await fetch(`${apiUrl}/batches/${slug}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface BatchDetailPageProps {
  params: { slug: string };
}

export default async function BatchDetailPage({ params }: BatchDetailPageProps) {
  const batch = await getBatchDetail(params.slug);

  if (!batch) {
    notFound();
  }

  const cookieStore = cookies();
  const isAuthenticated = cookieStore.has('access_token') || cookieStore.has('refresh_token');

  const upcomingClasses = (batch.upcomingClasses || []).filter(
    (c) => c.status === 'scheduled' || c.status === 'approved'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="text-xl font-bold text-[#1a56db]">
            allEdu
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/batches" className="text-sm text-gray-600 hover:text-[#1a56db]">
              ← All Batches
            </Link>
            {!isAuthenticated && (
              <Link
                href="/login"
                className="rounded-lg bg-[#1a56db] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Batch Header */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 mb-5">
                {batch.thumbnail && (batch.thumbnail.startsWith('http://') || batch.thumbnail.startsWith('https://') || batch.thumbnail.startsWith('/')) ? (
                <Image
                  src={batch.thumbnail}
                  alt={batch.title}
                  fill
                  className="object-cover"
                />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                    <BookOpen size={40} className="text-[#1a56db] opacity-40" />
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{batch.title}</h1>
              <p className="mt-3 text-gray-600">{batch.description}</p>

              {/* Stats */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users size={16} />
                  {batch.enrolledCount?.toLocaleString() || 0} students
                </span>
                {batch.rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    {batch.rating.toFixed(1)} ({batch.ratingCount} reviews)
                  </span>
                )}
              </div>
            </div>

            {/* Teacher Info */}
            {batch.teacher && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Your Teacher</h2>
                <div className="flex items-start gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-200">
                    {batch.teacher.photo && (batch.teacher.photo.startsWith('http://') || batch.teacher.photo.startsWith('https://') || batch.teacher.photo.startsWith('/')) ? (
                      <Image
                        src={batch.teacher.photo}
                        alt={batch.teacher.fullName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#1a56db] text-xl font-bold text-white">
                        {batch.teacher.fullName?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{batch.teacher.fullName}</p>
                    {batch.teacher.bio && (
                      <p className="mt-1 text-sm text-gray-600">{batch.teacher.bio}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Syllabus */}
            {batch.subjects && batch.subjects.length > 0 && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <BookOpen size={20} />
                  Syllabus
                </h2>
                <div className="space-y-4">
                  {batch.subjects.map((subject) => (
                    <div key={subject.id}>
                      <h3 className="font-medium text-gray-800">{subject.name}</h3>
                      {subject.chapters && subject.chapters.length > 0 && (
                        <ul className="mt-2 space-y-1 pl-4">
                          {subject.chapters.map((chapter) => (
                            <li key={chapter.id} className="text-sm text-gray-600 before:mr-2 before:content-['•']">
                              {chapter.title}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Live Classes */}
            {upcomingClasses.length > 0 && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Upcoming Live Classes</h2>
                <div className="space-y-3">
                  {upcomingClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{cls.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(cls.scheduledAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Starts in</p>
                        <CountdownTimer targetDate={new Date(cls.scheduledAt)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Enroll Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl bg-white p-6 shadow-sm">
              <p className="text-3xl font-bold text-gray-900">
                {batch.isFree || batch.price === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  <>
                    ₹{batch.price.toLocaleString('en-IN')}
                  </>
                )}
              </p>

              <EnrollButton
                batchId={batch.id}
                batchSlug={batch.slug}
                price={batch.price}
                isFree={batch.isFree || batch.price === 0}
                isAuthenticated={isAuthenticated}
              />

              <ul className="mt-5 space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Lifetime access
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Live + recorded classes
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Doubt solving sessions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Study materials & quizzes
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
