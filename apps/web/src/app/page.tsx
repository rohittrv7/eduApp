import Link from 'next/link';
import Image from 'next/image';
import {
  Star,
  Users,
  BookOpen,
  Sparkles,
  CheckCircle2,
  PlayCircle,
  GraduationCap,
  Award,
  Zap,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  MessageSquare,
  BarChart3,
  Video,
  FileText,
  ChevronRight,
  Download,
} from 'lucide-react';
import { BatchCard } from '@/components/ui/BatchCard';

export const dynamic = 'force-dynamic';

interface Batch {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;
  teacherName: string;
  price: number;
  rating: number;
  ratingCount: number;
  isFree: boolean;
}

async function getFeaturedBatches(): Promise<Batch[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const res = await fetch(`${apiUrl}/batches?featured=true`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || data).slice(0, 6);
  } catch {
    return [];
  }
}

const STATS = [
  { icon: Users, value: '50,000+', label: 'Active Students', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Award, value: '98.4%', label: 'Selection Success Rate', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Video, value: '5,000+', label: 'Hours of Video Content', color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: MessageSquare, value: '24/7', label: 'Instant Doubt Solving', color: 'text-amber-600', bg: 'bg-amber-50' },
];

const EXAM_CATEGORIES = [
  { id: 'all', name: '⚡ All Courses', desc: 'Explore complete library' },
  { id: 'jee', name: '🎯 JEE (Mains + Adv)', desc: 'IIT Engineering Prep' },
  { id: 'neet', name: '🩺 NEET (Medical)', desc: 'Doctor Aspiration' },
  { id: 'boards', name: '📚 Class 9th-12th', desc: 'CBSE & State Boards' },
  { id: 'foundation', name: '🌱 Olympiad & NTSE', desc: 'Foundation & KVPY' },
];

const FEATURES = [
  {
    icon: Video,
    title: '4K Interactive Live Classes',
    desc: 'Engage with top faculties in real-time with dual-teacher support, live polls, and hand-raise doubt clarification.',
    badge: 'Real-time',
    gradient: 'from-blue-500/10 via-indigo-500/10 to-transparent',
  },
  {
    icon: MessageSquare,
    title: 'Instant 24/7 Doubt Resolution',
    desc: 'Snap a picture of any question and get detailed step-by-step video solutions from subject experts within minutes.',
    badge: 'AI + Teacher Support',
    gradient: 'from-purple-500/10 via-pink-500/10 to-transparent',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Rank & Analytics Tests',
    desc: 'Test series designed strictly on NTA/CBSE patterns with detailed speed, accuracy, and All-India Rank analytics.',
    badge: 'NTA Pattern',
    gradient: 'from-emerald-500/10 via-teal-500/10 to-transparent',
  },
  {
    icon: FileText,
    title: 'Smart Notes & Class DPPs',
    desc: 'Download handwritten teacher notes, chapter DPPs, formula sheets, and mind maps after every single class.',
    badge: 'PDF Downloads',
    gradient: 'from-amber-500/10 via-orange-500/10 to-transparent',
  },
];

const TEACHERS = [
  {
    name: 'Dr. Rajesh Sharma',
    subject: 'Physics Lead',
    role: 'Ex-Allen & FIITJEE HOD',
    rating: 4.9,
    students: '25,000+',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  },
  {
    name: 'Sunita Verma',
    subject: 'Organic & Inorganic Chemistry',
    role: 'Gold Medalist (IIT Delhi)',
    rating: 4.9,
    students: '18,000+',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  },
  {
    name: 'Vikramaditya Roy',
    subject: 'Mathematics Head',
    role: 'JEE Advanced AIR 84',
    rating: 4.8,
    students: '22,000+',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  },
];

const TESTIMONIALS = [
  {
    name: 'Aarav Patel',
    rank: 'AIR 142 (JEE Advanced)',
    text: 'allEdu live classes and test series were the game-changer for me. The doubt solving team resolved my Physics doubts within 5 minutes even at night!',
    rating: 5,
    city: 'Kota, Rajasthan',
  },
  {
    name: 'Priya Mukherjee',
    rank: 'Score: 685/720 (NEET UG)',
    text: 'The DPP practice papers and recorded videos allowed me to revise organic chemistry effortlessly. High quality content at extremely affordable price!',
    rating: 5,
    city: 'Kolkata, WB',
  },
  {
    name: 'Rohan Sharma',
    rank: '96.8% (Class 12 Boards)',
    text: 'Teachers explain complex Math concepts with real-world examples. I stopped going to offline coaching because allEdu is far better!',
    rating: 5,
    city: 'Patna, Bihar',
  },
];

const FAQS = [
  {
    q: 'How do I join live classes after enrolling?',
    a: 'Once you enroll in a batch, all live classes will appear on your Student Dashboard under "My Batches". You will also receive SMS & Push notification alerts 15 minutes before any session.',
  },
  {
    q: 'Can I watch recorded lectures if I miss a live class?',
    a: 'Yes! Every live class is automatically recorded in 4K resolution and saved in your batch library along with the PDF teacher slides within 1 hour.',
  },
  {
    q: 'How does the 24/7 Doubt Clearing feature work?',
    a: 'You can take a photo of any numerical or concept question and upload it in the Doubts section. Our expert faculties provide instant step-by-step video & text solutions.',
  },
  {
    q: 'Is there a free trial or free content available?',
    a: 'Yes, we offer free trial classes for every batch, free mock tests, and daily free practice quizzes so you can evaluate our teaching quality before enrolling.',
  },
];

export default async function HomePage() {
  const featuredBatches = await getFeaturedBatches();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 py-2.5 px-4 text-center text-xs font-semibold text-white sm:text-sm tracking-wide">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-md">
          <Sparkles size={12} className="text-yellow-300 animate-pulse" /> New Admission Season
        </span>{' '}
        JEE & NEET 2026 Rankers Batches Now Open with Special Early-Bird Offer!
        <Link href="/batches" className="ml-2 font-bold underline underline-offset-2 hover:text-yellow-300">
          Explore Now &rarr;
        </Link>
      </div>

      {/* Modern Navigation Header */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <GraduationCap size={22} />
            </div>
            <span>
              all<span className="text-blue-600">Edu</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden items-center gap-8 md:flex font-semibold text-sm">
            <Link href="/batches" className="text-slate-600 hover:text-blue-600 transition-colors">
              Batches & Courses
            </Link>
            <Link href="/test-series" className="text-slate-600 hover:text-blue-600 transition-colors">
              Test Series
            </Link>
            <Link href="/teachers" className="text-slate-600 hover:text-blue-600 transition-colors">
              Top Faculties
            </Link>
            <Link href="/about" className="text-slate-600 hover:text-blue-600 transition-colors">
              Why Us
            </Link>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transition-all"
            >
              <Zap size={16} className="fill-yellow-400 text-yellow-400" /> Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Scroll Reveal Text Animations */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-slate-50 pt-16 pb-20 md:pt-24 md:pb-32">
        {/* Background Decorative Blur Orbs */}
        <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl animate-float animation-delay-200" />

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          {/* Trust Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-1.5 shadow-sm backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700">Trusted by over 50,000+ Students Across India</span>
            <ShieldCheck size={14} className="text-blue-600" />
          </div>

          {/* Main Animated Headline */}
          <h1 className="animate-fade-up animation-delay-100 mt-8 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl leading-[1.15]">
            Learn from{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-shimmer-text">
              India&apos;s Best Faculties
            </span>{' '}
            <br className="hidden sm:inline" />
            & Crack Your Dream Exam
          </h1>

          {/* Subtext */}
          <p className="animate-fade-up animation-delay-200 mx-auto mt-6 max-w-3xl text-base text-slate-600 sm:text-lg md:text-xl leading-relaxed">
            High-definition 4K Live Classes, 24/7 AI & Teacher Instant Doubt Clearing, All-India Rank Test Series, and Free PDF Notes tailored for JEE, NEET, and Board Exams.
          </p>

          {/* Action CTAs */}
          <div className="animate-fade-up animation-delay-300 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Start Free Learning <ArrowRight size={18} />
            </Link>
            <Link
              href="/batches"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-800 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition-all"
            >
              <PlayCircle size={20} className="text-blue-600" /> Explore All Batches
            </Link>
          </div>

          {/* Key Trust Highlights under Hero */}
          <div className="animate-fade-up animation-delay-400 mt-14 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-semibold text-slate-600">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" /> No Credit Card Required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" /> Free Demo Classes
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" /> Hindi & Hinglish Batches
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" /> 100% Mobile Optimized
            </span>
          </div>
        </div>
      </section>

      {/* Platform Stats Section */}
      <section className="relative z-10 -mt-10 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 md:grid-cols-4 md:p-8">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="flex flex-col items-center text-center p-3 transition-transform hover:-translate-y-1">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color} mb-3 shadow-sm`}>
                  <Icon size={24} />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Goal / Category Selector Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Select Your Target Goal
            </span>
            <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl tracking-tight">What Are You Preparing For?</h2>
            <p className="mt-2 text-slate-500 text-base max-w-xl mx-auto">
              Choose your exam stream to unlock customized live schedules, test series, and study modules.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {EXAM_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href="/batches"
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/10 transition-all hover:-translate-y-1"
              >
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{cat.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{cat.desc}</p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600">
                  Explore <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured & Trending Batches Section with DIFFERENT Exam Images */}
      <section className="bg-slate-100/70 py-16 md:py-24 border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Top Rated Courses
              </span>
              <h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl tracking-tight">Featured & Trending Batches</h2>
              <p className="mt-1 text-slate-500 text-sm">Handpicked complete courses taught by senior faculties</p>
            </div>
            <Link
              href="/batches"
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              View All Batches <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-10">
            {featuredBatches.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredBatches.map((batch) => {
                  const thumb =
                    batch.thumbnail &&
                    (batch.thumbnail.startsWith('http://') ||
                      batch.thumbnail.startsWith('https://') ||
                      batch.thumbnail.startsWith('/'))
                      ? batch.thumbnail
                      : null;
                  return (
                    <BatchCard
                      key={batch.id}
                      id={batch.id}
                      slug={batch.slug}
                      thumbnail={thumb}
                      title={batch.title}
                      teacherName={batch.teacherName}
                      price={batch.price}
                      rating={batch.rating || 5}
                      ratingCount={batch.ratingCount || 420}
                      isFree={batch.isFree || batch.price === 0}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* 3 Distinct Exam Relevant High-Resolution Images */}
                {[
                  {
                    id: '1',
                    slug: 'jee-lakshya-2026',
                    title: 'JEE Mains & Advanced 2026: Lakshya Batch',
                    teacherName: 'Dr. Rajesh Sharma & Team',
                    price: 3499,
                    rating: 5,
                    ratingCount: 1480,
                    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=600', // Physics & Math Formula Board
                  },
                  {
                    id: '2',
                    slug: 'neet-rankers-2026',
                    title: 'NEET Ultimate 2026 Rankers Batch',
                    teacherName: 'Sunita Ma\'am & Team',
                    price: 2999,
                    rating: 5,
                    ratingCount: 1120,
                    thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600', // Stethoscope & Doctor Medical Exam
                  },
                  {
                    id: '3',
                    slug: 'board-booster-12th',
                    title: 'Class 12th Board Booster + Foundation',
                    teacherName: 'Vikram Sir',
                    price: 0,
                    rating: 5,
                    ratingCount: 890,
                    thumbnail: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600', // Study Books & Library
                  },
                ].map((batch) => (
                  <BatchCard
                    key={batch.id}
                    id={batch.id}
                    slug={batch.slug}
                    thumbnail={batch.thumbnail}
                    title={batch.title}
                    teacherName={batch.teacherName}
                    price={batch.price}
                    rating={batch.rating}
                    ratingCount={batch.ratingCount}
                    isFree={batch.price === 0}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Ecosystem & Platform Features */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              Complete Learning Ecosystem
            </span>
            <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl tracking-tight">Everything You Need to Succeed</h2>
            <p className="mt-2 text-slate-500 text-base max-w-2xl mx-auto">
              Our platform brings together live interactive tools, AI analytics, and instant doubt resolution in one place.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all hover:-translate-y-1"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feat.gradient} opacity-50`} />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                        <Icon size={26} />
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {feat.badge}
                      </span>
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-slate-900">{feat.title}</h3>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Top Educators Showcase */}
      <section className="bg-slate-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
              Expert Mentors
            </span>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl text-white tracking-tight">Learn from Renowned Educators</h2>
            <p className="mt-2 text-slate-400 text-base max-w-xl mx-auto">
              Our faculties have mentored top rankers in JEE & NEET for over a decade.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {TEACHERS.map((teacher, i) => (
              <div
                key={i}
                className="flex flex-col items-center rounded-3xl border border-slate-800 bg-slate-800/60 p-6 text-center backdrop-blur-md hover:border-slate-700 transition-all hover:-translate-y-1"
              >
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-blue-500 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={teacher.avatar} alt={teacher.name} className="h-full w-full object-cover" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{teacher.name}</h3>
                <p className="text-xs font-semibold text-blue-400">{teacher.subject}</p>
                <p className="mt-1 text-xs text-slate-400">{teacher.role}</p>

                <div className="mt-6 flex items-center justify-between w-full border-t border-slate-700/60 pt-4 text-xs font-medium text-slate-300">
                  <span>⭐ {teacher.rating} Rating</span>
                  <span>👨‍🎓 {teacher.students} Guided</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Callout */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-8 md:p-14 text-white shadow-2xl">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider backdrop-blur-md">
                <Smartphone size={14} /> Learn Anywhere, Anytime
              </span>
              <h2 className="mt-4 text-3xl font-black sm:text-4xl lg:text-5xl leading-tight tracking-tight">
                Download the Official allEdu Android App
              </h2>
              <p className="mt-4 text-base text-blue-100 leading-relaxed">
                Enjoy low-bandwidth video mode, offline video downloads, instant push alerts for live classes, and quick doubt uploading directly from your Android device.
              </p>

              {/* Direct APK Download Button & Web App link */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="/alledu-mobile.apk"
                  download="alledu-mobile.apk"
                  className="inline-flex items-center gap-3 rounded-2xl bg-white px-7 py-4 text-base font-extrabold text-slate-900 shadow-xl hover:bg-slate-100 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Download size={22} className="text-blue-600 animate-bounce" /> Download Android APK (73 MB)
                </a>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-4 text-sm font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all"
                >
                  <Smartphone size={18} /> Open Web App
                </Link>
              </div>

              {/* APK Specs & Trust Indicators */}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-blue-200 font-semibold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" /> 100% Virus & Malware Free
                </span>
                <span>•</span>
                <span>v1.0.0 (Official Release)</span>
                <span>•</span>
                <span>Requires Android 7.0+</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-slate-100/80 py-16 md:py-24 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Student Wall of Fame
            </span>
            <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl tracking-tight">Stories of Success</h2>
            <p className="mt-2 text-slate-500 text-base">Hear directly from students who transformed their exam results</p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm hover:shadow-md transition-all">
                <div>
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: t.rating }).map((_, r) => (
                      <Star key={r} size={16} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-slate-700 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                </div>
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs font-semibold text-blue-600">{t.rank}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Frequently Asked Questions
            </span>
            <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl tracking-tight">Have Questions? We Have Answers</h2>
          </div>

          <div className="mt-10 space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                    Q
                  </span>
                  {faq.q}
                </h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed pl-8">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white pt-14 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 text-2xl font-black text-slate-900">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <GraduationCap size={20} />
                </div>
                <span>
                  all<span className="text-blue-600">Edu</span>
                </span>
              </Link>
              <p className="mt-4 max-w-sm text-xs text-slate-500 leading-relaxed">
                allEdu is India&apos;s premier online learning platform providing top-quality live classes, test series, and 24/7 doubt resolution for competitive and board exams.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Popular Batches</h4>
              <ul className="mt-4 space-y-2 text-xs text-slate-500 font-medium">
                <li><Link href="/batches" className="hover:text-blue-600">JEE Mains & Advanced</Link></li>
                <li><Link href="/batches" className="hover:text-blue-600">NEET UG Medical</Link></li>
                <li><Link href="/batches" className="hover:text-blue-600">Class 12th Board Prep</Link></li>
                <li><Link href="/batches" className="hover:text-blue-600">Foundation Class 9 & 10</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Quick Links</h4>
              <ul className="mt-4 space-y-2 text-xs text-slate-500 font-medium">
                <li><Link href="/about" className="hover:text-blue-600">About Us</Link></li>
                <li><Link href="/teachers" className="hover:text-blue-600">Our Teachers</Link></li>
                <li><Link href="/test-series" className="hover:text-blue-600">Test Series</Link></li>
                <li><Link href="/contact" className="hover:text-blue-600">Contact Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Legal</h4>
              <ul className="mt-4 space-y-2 text-xs text-slate-500 font-medium">
                <li><Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-blue-600">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} allEdu. All rights reserved. Made with ❤️ for Indian Students.
          </div>
        </div>
      </footer>
    </div>
  );
}
