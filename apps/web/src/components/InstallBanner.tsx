'use client';

import { useInstallPrompt } from '../hooks/useInstallPrompt';

export function InstallBanner() {
  const { canInstall, triggerInstall, dismissInstall } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div
      role="banner"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-[#1a56db] px-4 py-3 text-white shadow-lg md:bottom-4 md:left-4 md:right-auto md:max-w-sm md:rounded-xl"
    >
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="h-10 w-10 rounded-lg" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Install allEdu</p>
          <p className="text-xs text-blue-100">Add to home screen for the best experience</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={dismissInstall}
          className="rounded px-2 py-1 text-xs text-blue-200 hover:text-white"
          aria-label="Dismiss install prompt"
        >
          Not now
        </button>
        <button
          onClick={triggerInstall}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#1a56db] hover:bg-blue-50"
        >
          Install
        </button>
      </div>
    </div>
  );
}
