import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Users, BookOpen, Star } from 'lucide-react';
import { BatchCard } from '@/components/ui/BatchCard';
import { FollowButton } from '@/components/teachers/FollowButton';
import { cookies } from 'next/headers';

interface TeacherBatch {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;
  price: number;
  rating: number;
  ratingCount: number;
  isFree: boolean;
}

interface TeacherProfile {
  id: string;
  fullName: string;
  photo?: string;
  bio?: string;
  subjects?: string[];
  enrolledStudentsCount: number;
  classesCount: number;
  rating?: number;
  batches: TeacherBatch[];
}

async function getTeacherProfile(slug: string): Promise<TeacherProfile | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    // Try slug-based endpoint first, fall back to id
    const res = await fetch(`${apiUrl}/users/teachers/${slug}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface TeacherPageProps {
  params: { slug: string };
}

export default async function TeacherProfilePage({ params }: TeacherPageProps) {
  const teacher = await getTeacherProfile(params.slug);

  if (!teacher) {
    notFound();
  }

  const cookieStore = cookies();
  const isAuthenticated = cookieStore.has('access_token') || cookieStore.has('refresh_token');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="text-xl font-bold text-[#1a56db]">
            allEdu
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-[#1a56db]">
              Login
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-[#1a56db] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Teacher Profile Card */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-200">
              {teacher.photo && (teacher.photo.startsWith('http://') || teacher.photo.startsWith('https://') || teacher.photo.startsWith('/')) ? (
                <Image
                  src={teacher.photo}
                  alt={teacher.fullName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#1a56db] text-3xl font-bold text-white">
                  {teacher.fullName?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{teacher.fullName}</h1>
                  {teacher.subjects && teacher.subjects.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {teacher.subjects.map((subject) => (
                        <span
                          key={subject}
                          className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-medium text-[#1a56db]"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  )}
                  {teacher.bio && (
                    <p className="mt-3 text-sm text-gray-600 max-w-2xl">{teacher.bio}</p>
                  )}
                </div>

                <FollowButton teacherId={teacher.id} isAuthenticated={isAuthenticated} />
              </div>

              {/* Stats */}
              <div className="mt-4 flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Users size={16} className="text-[#1a56db]" />
                  <span className="font-semibold text-gray-900">
                    {teacher.enrolledStudentsCount?.toLocaleString() || 0}
                  </span>{' '}
                  students
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <BookOpen size={16} className="text-[#1a56db]" />
                  <span className="font-semibold text-gray-900">
                    {teacher.classesCount?.toLocaleString() || 0}
                  </span>{' '}
                  classes
                </div>
                {teacher.rating && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900">{teacher.rating.toFixed(1)}</span>{' '}
                    rating
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Active Batches */}
        <div>
          <h2 className="mb-5 text-xl font-bold text-gray-900">Active Batches</h2>
          {teacher.batches && teacher.batches.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {teacher.batches.map((batch) => (
                <Link key={batch.id} href={`/batches/${batch.slug}`}>
                  <BatchCard
                    id={batch.id}
                    thumbnail={batch.thumbnail || '/placeholder-batch.jpg'}
                    title={batch.title}
                    teacherName={teacher.fullName}
                    price={batch.price}
                    rating={batch.rating || 4}
                    ratingCount={batch.ratingCount}
                    isFree={batch.isFree || batch.price === 0}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border bg-white py-12 text-center">
              <p className="text-gray-500">No active batches at the moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
