'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  targetDate: Date;
  onExpire?: () => void;
  className?: string;
}

function getTimeLeft(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, totalSeconds };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function CountdownTimer({ targetDate, onExpire, className }: CountdownTimerProps) {
  const isValid = targetDate instanceof Date && !isNaN(targetDate.getTime());
  const [timeLeft, setTimeLeft] = useState(() => isValid ? getTimeLeft(targetDate) : { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });

  useEffect(() => {
    if (!isValid) return;
    if (timeLeft.totalSeconds === 0) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      const next = getTimeLeft(targetDate);
      setTimeLeft(next);
      if (next.totalSeconds === 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onExpire, timeLeft.totalSeconds, isValid]);

  const isUrgent = timeLeft.totalSeconds > 0 && timeLeft.totalSeconds < 5 * 60;

  if (!isValid) {
    return <span className={cn('text-sm text-gray-400', className)}>—</span>;
  }

  return (
    <span
      className={cn(
        'font-mono text-sm font-semibold tabular-nums',
        isUrgent ? 'text-red-500' : 'text-gray-700',
        className
      )}
    >
      {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
    </span>
  );
}
