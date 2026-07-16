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

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { user } = useAuthStore();

  const role: UserRole = user?.role ?? 'student';
  const provider = process.env.NEXT_PUBLIC_VIDEO_PROVIDER ?? 'youtube';
  const allLinks = NAV_LINKS[role] ?? NAV_LINKS.student;
  const links = allLinks.filter(
    (item) => !item.requiresNonYoutube || provider !== 'youtube',
  );

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
          'fixed left-0 top-0 z-30 flex h-full w-64 flex-col bg-white shadow-lg transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a56db] text-white font-bold text-sm">
              BD
            </div>
            <span className="font-semibold text-gray-900">allEdu</span>
          </Link>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
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
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#1a56db] text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
