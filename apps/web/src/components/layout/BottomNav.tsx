'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Play, Brain, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Home', href: '/student/dashboard', icon: Home },
  { label: 'Batches', href: '/student/batches', icon: BookOpen },
  { label: 'Live', href: '/student/live', icon: Play },
  { label: 'Quizzes', href: '/student/quizzes', icon: Brain },
  { label: 'Profile', href: '/student/profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-16 items-stretch border-t border-gray-100 bg-white shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
        {TABS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors',
                isActive ? 'text-[#1a56db]' : 'text-gray-400',
              )}
            >
              <div
                className={cn(
                  'flex h-7 w-12 items-center justify-center rounded-full transition-all',
                  isActive ? 'bg-blue-50' : '',
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <span className={cn('text-[10px] font-medium', isActive ? 'font-bold' : '')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
