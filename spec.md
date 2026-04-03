# Car Simulator 3D

## Current State
- React Three Fiber 3D car simulator with oval race track
- Lap timer (current/best) tracked in frontend-only `gameStore.ts` state
- Speedometer, gear, compass, mini-map HUD
- No persistent storage -- best lap time is lost on refresh
- No opponent cars
- Backend is empty (`backendInterface {}`)

## Requested Changes (Diff)

### Add
- **AI opponent cars**: 3 AI-controlled cars that drive around the oval track at varying speeds, with different body colors. They follow a simple waypoint path along the track centerline. They do not interact with the player car (no collision). They are purely visual.
- **Persistent leaderboard**: A top-10 leaderboard that stores best lap times on the ICP backend. Players enter a name when they set a new personal best. The leaderboard shows rank, player name, lap time, and date. It is accessible via a HUD button at top-left or auto-shows after a new personal best.
- **Submit best lap time flow**: After crossing the finish line and completing a lap that is a new personal best, prompt the player to enter a name (short text input) and submit to the leaderboard.

### Modify
- `gameStore.ts`: Add `showLeaderboard: boolean` flag and `personalBestSubmitted: boolean` to state.
- `HUD.tsx`: Add leaderboard toggle button and personal best submission modal.
- `CarSimulator.tsx`: Add `<AITraffic />` component to the Canvas.
- Backend `main.mo`: Implement leaderboard storage with submit and query endpoints.

### Remove
- Nothing removed.

## Implementation Plan

### Backend (Motoko)
- `submitLapTime(name: Text, timeMs: Nat): async Bool` -- stores entry, keeps top 10 globally
- `getLeaderboard(): async [LeaderboardEntry]` -- returns top 10 sorted by time ascending
- `LeaderboardEntry` type: `{ rank: Nat; name: Text; timeMs: Nat; timestamp: Int }`

### Frontend
1. **`AITraffic.tsx`** (new) -- Three.js component with 3 AI cars placed as groups on the oval track. Each AI car has its own module-level state (position along track parameterized as 0..1 t-value). Per frame they advance t at their fixed speed and their positions/rotations are computed from the track curve formula matching `TRACK` constants in `World.tsx`. Different colors: red, green, orange.
2. **`gameStore.ts`** -- add `showLeaderboard`, `personalBestSubmitted` flags.
3. **`HUD.tsx`** -- add "LEADERBOARD" button (top-right area or near lap timer). Overlay panel that fetches and displays leaderboard from backend. After a new best lap, show modal: name input + submit button that calls `backend.submitLapTime`.
4. Wire `backend.ts` calls for leaderboard submit and query.
