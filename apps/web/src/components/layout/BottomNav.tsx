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
      {/* subtle top glow */}
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

      <div className="flex h-16 items-stretch bg-white/95 backdrop-blur-md shadow-[0_-2px_16px_rgba(0,0,0,0.08)]">
        {TABS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors duration-200"
            >
              {/* Active indicator line at top */}
              <span
                className={cn(
                  'absolute top-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-[#1a56db] transition-all duration-300',
                  isActive ? 'w-6 opacity-100' : 'w-0 opacity-0',
                )}
              />

              {/* Icon container with scale animation */}
              <div
                className={cn(
                  'flex h-8 w-12 items-center justify-center rounded-2xl transition-all duration-200',
                  isActive ? 'scale-110 bg-blue-50' : 'scale-100 bg-transparent',
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className={cn(
                    'transition-colors duration-200',
                    isActive ? 'text-[#1a56db]' : 'text-gray-400',
                  )}
                />
              </div>

              <span
                className={cn(
                  'text-[10px] transition-all duration-200',
                  isActive ? 'font-bold text-[#1a56db]' : 'font-medium text-gray-400',
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
