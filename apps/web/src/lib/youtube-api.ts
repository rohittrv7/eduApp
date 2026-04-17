// YouTube IFrame API loader — kept for backward compat but not used in LiveClassLayout
// LiveClassLayout now uses direct iframe + postMessage approach

let ytReadyPromise: Promise<void> | null = null;

export function loadYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytReadyPromise) return ytReadyPromise;

  ytReadyPromise = new Promise<void>((resolve) => {
    const poll = setInterval(() => {
      if (window.YT?.Player) { clearInterval(poll); resolve(); }
    }, 100);

    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      prev?.();
      clearInterval(poll);
      resolve();
    };

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }
  });

  return ytReadyPromise;
}

export function resetYouTubeAPI() {
  ytReadyPromise = null;
}
