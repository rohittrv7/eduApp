'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Video, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Home', href: '/student/dashboard', icon: Home },
  { label: 'Batches', href: '/student/batches', icon: BookOpen },
  { label: 'Live', href: '/student/live', icon: Video },
  { label: 'Tests', href: '/student/tests', icon: ClipboardList },
  { label: 'Profile', href: '/student/profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-16 items-center border-t bg-white lg:hidden">
      {TABS.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors',
              isActive ? 'text-[#1a56db]' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
