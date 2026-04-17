'use client';

import { useCallback, useRef, useState } from 'react';
import { WhiteLabelPlayer } from './WhiteLabelPlayer';
import { useWatchTracker } from '@/hooks/useWatchTracker';

export interface VideoPlayerProps {
  youtubeVideoId: string;
  watchSessionVideoId: string;
  initialPosition?: number;
  user: { mobile: string; id: string };
  seekRef?: React.MutableRefObject<((seconds: number) => void) | null>;
}

export function VideoPlayer({
  youtubeVideoId,
  watchSessionVideoId,
  initialPosition = 0,
  user,
  seekRef,
}: VideoPlayerProps) {
  const currentTimeRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const getPlayerTime = useCallback(() => currentTimeRef.current, []);

  useWatchTracker({
    videoId: watchSessionVideoId,
    userId: user.id,
    getPlayerTime,
    isPlaying,
  });

  const handleTimeUpdate = useCallback((currentTime: number, _duration: number, playing: boolean) => {
    currentTimeRef.current = currentTime;
    setIsPlaying(playing);
  }, []);

  return (
    <WhiteLabelPlayer
      youtubeVideoId={youtubeVideoId}
      user={user}
      initialPosition={initialPosition}
      onTimeUpdate={handleTimeUpdate}
      onSeekRef={seekRef}
    />
  );
}
