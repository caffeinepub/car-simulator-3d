import { useEffect, useState } from "react";

export interface GameState {
  speed: number;
  gear: number | string;
  heading: number;
  isDay: boolean;
  gameStarted: boolean;
  distance: number;
  lapCount: number;
  currentLapTime: number; // seconds
  bestLapTime: number | null; // seconds, null = no lap completed yet
  lapStartTime: number | null; // performance.now() timestamp
  showLeaderboard: boolean;
  newBestPending: boolean; // true when player just set a new best and hasn't submitted yet
}

let state: GameState = {
  speed: 0,
  gear: 1,
  heading: 0,
  isDay: true,
  gameStarted: false,
  distance: 0,
  lapCount: 0,
  currentLapTime: 0,
  bestLapTime: null,
  lapStartTime: null,
  showLeaderboard: false,
  newBestPending: false,
};

const listeners = new Set<() => void>();

export function getGameState(): GameState {
  return state;
}

export function setGameState(patch: Partial<GameState>) {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

export function useGameStore(): GameState {
  const [s, setS] = useState<GameState>(state);
  useEffect(() => {
    const l = () => setS({ ...state });
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return s;
}
