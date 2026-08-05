'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Detects if the app is running as a PWA (installed to home screen)
 * and redirects to /login instead of showing the landing page.
 * Only runs on the root "/" path.
 * Browser users see the landing page normally.
 */
export function PwaRedirect() {
  const router = useRouter();

  useEffect(() => {
    const isPwa =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true; // iOS Safari

    if (isPwa) {
      router.replace('/login');
    }
  }, [router]);

  return null;
}
