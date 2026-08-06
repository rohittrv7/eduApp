'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Video,
  ClipboardList,
  MessageCircle,
  Trophy,
  User,
  Users,
  DollarSign,
  Settings,
  BarChart2,
  Shield,
  X,
  Download,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore, UserRole } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** Hide when VIDEO_PROVIDER=youtube */
  requiresNonYoutube?: boolean;
}

const NAV_LINKS: Record<UserRole, NavItem[]> = {
  student: [
    { label: 'Dashboard', href: '/student/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'My Batches', href: '/student/batches', icon: <BookOpen size={18} /> },
    { label: 'Live Classes', href: '/student/live', icon: <Video size={18} /> },
    { label: 'Tests', href: '/student/tests', icon: <ClipboardList size={18} /> },
    { label: 'Doubts', href: '/student/doubts', icon: <MessageCircle size={18} /> },
    { label: 'Leaderboard', href: '/student/leaderboard', icon: <Trophy size={18} /> },
    {
      label: 'Downloads',
      href: '/student/downloads',
      icon: <Download size={18} />,
      requiresNonYoutube: true,
    },
    { label: 'Profile', href: '/student/profile', icon: <User size={18} /> },
  ],
  teacher: [
    { label: 'Dashboard', href: '/teacher/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Batches', href: '/teacher/batches', icon: <BookOpen size={18} /> },
    { label: 'Subjects', href: '/teacher/subjects', icon: <ClipboardList size={18} /> },
    { label: 'Live Classes', href: '/teacher/live-classes', icon: <Video size={18} /> },
    { label: 'Videos', href: '/teacher/videos', icon: <BookOpen size={18} /> },
    { label: 'Quizzes', href: '/teacher/quizzes', icon: <ClipboardList size={18} /> },
    { label: 'Students', href: '/teacher/students', icon: <Users size={18} /> },
    { label: 'Earnings', href: '/teacher/earnings', icon: <DollarSign size={18} /> },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Students', href: '/admin/students', icon: <Users size={18} /> },
    { label: 'Teachers', href: '/admin/teachers', icon: <User size={18} /> },
    { label: 'Live Classes', href: '/admin/live-classes', icon: <Video size={18} /> },
    { label: 'Revenue', href: '/admin/revenue', icon: <BarChart2 size={18} /> },
    { label: 'Moderation', href: '/admin/moderation', icon: <Shield size={18} /> },
    { label: 'Settings', href: '/admin/settings', icon: <Settings size={18} /> },
  ],
};

interface RoleTheme {
  sidebarBg: string;
  sidebarBorder: string;
  logoBg: string;
  logoText: string;
  badgeClass: string;
  badgeLabel: string;
  activeLinkClass: string;
  inactiveLinkClass: string;
}

const ROLE_THEMES: Record<UserRole, RoleTheme> = {
  student: {
    sidebarBg: 'bg-white',
    sidebarBorder: 'border-slate-200',
    logoBg: 'bg-[#1a56db]',
    logoText: 'text-slate-900',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeLabel: 'Student',
    activeLinkClass: 'bg-[#1a56db] text-white shadow-sm shadow-blue-500/30',
    inactiveLinkClass: 'text-slate-600 hover:bg-blue-50 hover:text-blue-700',
  },
  teacher: {
    sidebarBg: 'bg-[#0f1c3f] text-slate-100 border-r border-[#1a3a7a]/50',
    sidebarBorder: 'border-[#1a3a7a]/50',
    logoBg: 'bg-[#1a56db]',
    logoText: 'text-white',
    badgeClass: 'bg-[#1a3a7a]/60 text-blue-200 border-[#1a56db]/60',
    badgeLabel: 'Teacher Dashboard',
    activeLinkClass: 'bg-[#1a56db] text-white font-semibold shadow-md shadow-blue-900/50',
    inactiveLinkClass: 'text-blue-200/70 hover:bg-[#1a3a7a]/50 hover:text-white',
  },
  admin: {
    sidebarBg: 'bg-slate-950 text-slate-100 border-r border-slate-800',
    sidebarBorder: 'border-slate-800',
    logoBg: 'bg-violet-600',
    logoText: 'text-white',
    badgeClass: 'bg-violet-950/80 text-violet-300 border-violet-700/60',
    badgeLabel: 'Admin Console',
    activeLinkClass: 'bg-violet-600 text-white font-semibold shadow-md shadow-violet-900/50',
    inactiveLinkClass: 'text-slate-400 hover:bg-slate-900 hover:text-slate-100',
  },
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { user } = useAuthStore();

  const role: UserRole = user?.role ?? 'student';
  const theme = ROLE_THEMES[role] ?? ROLE_THEMES.student;

  const provider = process.env.NEXT_PUBLIC_VIDEO_PROVIDER ?? 'youtube';
  const allLinks = NAV_LINKS[role] ?? NAV_LINKS.student;
  const links = allLinks.filter((item) => !item.requiresNonYoutube || provider !== 'youtube');

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-30 flex h-full w-64 flex-col shadow-lg transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none',
          theme.sidebarBg,
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-16 items-center justify-between border-b px-4',
            theme.sidebarBorder,
          )}
        >
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm shadow-sm',
                theme.logoBg,
              )}
            >
              BD
            </div>
            <div className="flex flex-col">
              <span className={cn('font-bold text-base leading-none', theme.logoText)}>allEdu</span>
              <span
                className={cn(
                  'mt-0.5 rounded px-1.5 py-0.2 text-[9px] font-extrabold uppercase border tracking-wider',
                  theme.badgeClass,
                )}
              >
                {theme.badgeLabel}
              </span>
            </div>
          </Link>
          <button
            className="lg:hidden text-gray-400 hover:text-gray-200"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {links.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive ? theme.activeLinkClass : theme.inactiveLinkClass,
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
