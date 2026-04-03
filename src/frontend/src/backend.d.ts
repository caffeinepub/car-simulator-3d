import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;

export interface LeaderboardEntry {
    rank: bigint;
    name: string;
    timeMs: bigint;
    timestamp: bigint;
}

export interface backendInterface {
    submitLapTime: (name: string, timeMs: bigint) => Promise<boolean>;
    getLeaderboard: () => Promise<LeaderboardEntry[]>;
}
