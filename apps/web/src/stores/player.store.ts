import { create } from 'zustand';

interface PlayerState {
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  watermarkPosition: number; // 0-8
  adOverlayVisible: boolean;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setWatermarkPosition: (position: number) => void;
  setAdOverlayVisible: (visible: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTime: 0,
  isPlaying: false,
  volume: 1,
  watermarkPosition: 0,
  adOverlayVisible: false,
  setCurrentTime: (currentTime) => set({ currentTime }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setWatermarkPosition: (watermarkPosition) => set({ watermarkPosition }),
  setAdOverlayVisible: (adOverlayVisible) => set({ adOverlayVisible }),
}));
