# Car Simulator 3D

## Current State
A 3D open-world car simulator with:
- Straight 2km road with trees, buildings, mountains
- WASD/Arrow key driving controls
- HUD: speedometer, gear, compass, mini-map, day/night toggle
- GameStore with speed, gear, heading, isDay, gameStarted, distance

## Requested Changes (Diff)

### Add
- Oval race circuit track replacing the straight road
- Lap timer (mm:ss.ms format) displayed on HUD
- Best lap time tracking and display
- Lap counter (current lap / total)
- Start/finish line on the track with a visible marker
- Checkpoint system to detect valid laps (must cross start/finish going forward)
- Track-side barriers/curbs

### Modify
- World.tsx: replace straight road with oval circuit using track segments
- GameStore: add lapTime, bestLapTime, currentLap, lapStartTime fields
- Car.tsx: add checkpoint/lap crossing detection logic
- HUD.tsx: add lap timer panel to the display
- Car starting position placed on track start/finish straight
- Mini-map updated to show oval track shape

### Remove
- Straight 2km road geometry
- Road center dashes for straight road

## Implementation Plan
1. Update GameState interface with lap fields: lapCount, currentLapTime, bestLapTime, lapStartTime
2. Build oval track in World.tsx: two long straights + two semicircular ends using boxGeometry segments
3. Add start/finish line visual marker
4. In Car.tsx: detect when car crosses start/finish line (z crossing threshold near x=0) and record lap times
5. Update HUD.tsx: lap timer panel showing current lap time, best lap, lap counter
6. Update mini-map SVG to show oval track outline
7. Adjust car spawn position to track start/finish line
