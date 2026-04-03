import { setGameState, useGameStore } from "../../store/gameStore";

function formatLapTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins}:${String(secs).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

function Speedometer({ speed }: { speed: number }) {
  const maxSpeed = 200;
  const sweepDeg = 240;
  const startDeg = -120;

  const cx = 80;
  const cy = 80;
  const r = 64;

  function polarToXY(angleDeg: number, radius: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  function describeArc(
    startAngle: number,
    endAngle: number,
    radius: number,
  ): string {
    const start = polarToXY(startAngle, radius);
    const end = polarToXY(endAngle, radius);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  const speedRatio = Math.min(speed / maxSpeed, 1);
  const endDeg = startDeg + sweepDeg * speedRatio;
  const needleAngle = startDeg + sweepDeg * speedRatio;
  const needleTip = polarToXY(needleAngle, 52);
  const needleBase1 = polarToXY(needleAngle + 90, 8);
  const needleBase2 = polarToXY(needleAngle - 90, 8);

  const ticks: Array<{
    outer: { x: number; y: number };
    inner: { x: number; y: number };
    isMajor: boolean;
    angle: number;
  }> = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const tickAngle = startDeg + sweepDeg * t;
    const isMajor = i % 4 === 0;
    const outerR = r + 2;
    const innerR = isMajor ? r - 10 : r - 5;
    ticks.push({
      outer: polarToXY(tickAngle, outerR),
      inner: polarToXY(tickAngle, innerR),
      isMajor,
      angle: tickAngle,
    });
  }

  const isRedzone = speed > 160;
  const arcColor = isRedzone ? "#FF4D3A" : "#35C2FF";

  return (
    <svg
      width="160"
      height="160"
      viewBox="0 0 160 160"
      aria-label="Speedometer"
    >
      <title>Speedometer</title>
      <circle cx={cx} cy={cy} r={r + 8} fill="rgba(0,0,0,0.5)" />
      <path
        d={describeArc(startDeg, startDeg + sweepDeg, r)}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {speed > 0 && (
        <path
          d={describeArc(startDeg, endDeg, r)}
          fill="none"
          stroke={arcColor}
          strokeWidth="6"
          strokeLinecap="round"
        />
      )}
      {ticks.map((tick) => (
        <line
          key={`tick-${tick.angle.toFixed(2)}`}
          x1={tick.inner.x}
          y1={tick.inner.y}
          x2={tick.outer.x}
          y2={tick.outer.y}
          stroke={
            tick.isMajor ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)"
          }
          strokeWidth={tick.isMajor ? 2 : 1}
        />
      ))}
      <polygon
        points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
        fill={isRedzone ? "#FF4D3A" : "#35C2FF"}
        opacity={0.95}
      />
      <circle cx={cx} cy={cy} r={5} fill="#fff" opacity={0.9} />
      <text
        x={cx}
        y={cy + 20}
        textAnchor="middle"
        fill="white"
        fontSize="28"
        fontWeight="800"
        fontFamily="'BricolageGrotesque', system-ui, sans-serif"
        letterSpacing="-1"
      >
        {speed}
      </text>
      <text
        x={cx}
        y={cy + 32}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize="9"
        fontFamily="system-ui, sans-serif"
      >
        km/h
      </text>
    </svg>
  );
}

const COMPASS_DIRS = [
  { label: "N", angle: 0 },
  { label: "E", angle: 90 },
  { label: "S", angle: 180 },
  { label: "W", angle: 270 },
];

function Compass({ heading }: { heading: number }) {
  return (
    <div
      style={{
        width: 70,
        height: 70,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="70" height="70" viewBox="0 0 70 70" aria-label="Compass">
        <title>Compass</title>
        <circle
          cx="35"
          cy="35"
          r="32"
          fill="rgba(0,0,0,0.45)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />
        {COMPASS_DIRS.map((d) => {
          const rad = ((d.angle - heading - 90) * Math.PI) / 180;
          const tx = 35 + 22 * Math.cos(rad);
          const ty = 35 + 22 * Math.sin(rad);
          return (
            <text
              key={d.label}
              x={tx}
              y={ty + 3.5}
              textAnchor="middle"
              fill={d.label === "N" ? "#FF4D3A" : "rgba(255,255,255,0.7)"}
              fontSize="9"
              fontWeight={d.label === "N" ? "bold" : "normal"}
              fontFamily="system-ui"
            >
              {d.label}
            </text>
          );
        })}
        <polygon
          points="35,8 38,35 35,31 32,35"
          fill="#35C2FF"
          transform={`rotate(${-heading}, 35, 35)`}
        />
        <circle cx="35" cy="35" r="3" fill="white" opacity={0.9} />
      </svg>
    </div>
  );
}

function LapTimer({
  lapCount,
  currentLapTime,
  bestLapTime,
  lapActive,
}: {
  lapCount: number;
  currentLapTime: number;
  bestLapTime: number | null;
  lapActive: boolean;
}) {
  return (
    <div
      style={{
        background: "rgba(10,12,14,0.75)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(53,194,255,0.2)",
        borderRadius: 14,
        padding: "10px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 180,
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Lap counter */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          LAP
        </span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#F5B400",
            lineHeight: 1,
            letterSpacing: "-1px",
          }}
        >
          {lapCount === 0 ? "--" : lapCount}
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />

      {/* Current lap time */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          CURRENT
        </span>
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: lapActive ? "#35C2FF" : "rgba(255,255,255,0.3)",
            fontFamily: "'GeistMono', monospace",
            letterSpacing: "0.02em",
          }}
        >
          {lapActive ? formatLapTime(currentLapTime) : "--:--.---"}
        </span>
      </div>

      {/* Best lap time */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          BEST
        </span>
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: bestLapTime !== null ? "#27ae60" : "rgba(255,255,255,0.25)",
            fontFamily: "'GeistMono', monospace",
            letterSpacing: "0.02em",
          }}
        >
          {bestLapTime !== null ? formatLapTime(bestLapTime) : "--:--.---"}
        </span>
      </div>
    </div>
  );
}

export default function HUD() {
  const {
    speed,
    gear,
    heading,
    isDay,
    gameStarted,
    lapCount,
    currentLapTime,
    bestLapTime,
    lapStartTime,
  } = useGameStore();

  if (!gameStarted) return null;

  const lapActive = lapStartTime !== null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 10,
        fontFamily: "'BricolageGrotesque', system-ui, sans-serif",
      }}
    >
      {/* Top Right: Day/Night Toggle */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          display: "flex",
          gap: 10,
          pointerEvents: "auto",
        }}
      >
        <button
          data-ocid="daynight.toggle"
          type="button"
          onClick={() => setGameState({ isDay: true })}
          title="Day Mode"
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: `2px solid ${isDay ? "#F5B400" : "rgba(255,255,255,0.2)"}`,
            background: isDay ? "rgba(245,180,0,0.25)" : "rgba(0,0,0,0.5)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            transition: "all 0.3s ease",
            backdropFilter: "blur(8px)",
          }}
        >
          ☀️
        </button>
        <button
          data-ocid="daynight.toggle"
          type="button"
          onClick={() => setGameState({ isDay: false })}
          title="Night Mode"
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: `2px solid ${!isDay ? "#35C2FF" : "rgba(255,255,255,0.2)"}`,
            background: !isDay ? "rgba(53,194,255,0.2)" : "rgba(0,0,0,0.5)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            transition: "all 0.3s ease",
            backdropFilter: "blur(8px)",
          }}
        >
          🌙
        </button>
      </div>

      {/* Top Left: Lap Timer */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          pointerEvents: "none",
        }}
      >
        <LapTimer
          lapCount={lapCount}
          currentLapTime={currentLapTime}
          bestLapTime={bestLapTime}
          lapActive={lapActive}
        />
      </div>

      {/* Bottom Center: Main Dashboard */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 20,
          background: "rgba(10,12,14,0.75)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(53,194,255,0.2)",
          borderRadius: 20,
          padding: "12px 24px",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <Speedometer speed={speed} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            minWidth: 60,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.45)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              GEAR
            </span>
            <span
              style={{
                fontSize: 38,
                fontWeight: 800,
                color: gear === "R" ? "#FF4D3A" : "#F5B400",
                lineHeight: 1,
                letterSpacing: "-1px",
              }}
            >
              {gear === "R" ? "R" : `G:${gear}`}
            </span>
          </div>

          <div
            style={{
              width: 50,
              height: 6,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.min((speed / 200) * 100, 100)}%`,
                height: "100%",
                background:
                  speed > 160
                    ? "linear-gradient(90deg,#F5B400,#FF4D3A)"
                    : "linear-gradient(90deg,#35C2FF,#F5B400)",
                transition: "width 0.1s ease",
                borderRadius: 3,
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            HDG
          </span>
          <Compass heading={heading} />
        </div>
      </div>

      {/* Bottom Right: Controls hint */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          right: 20,
          background: "rgba(10,12,14,0.65)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: "8px 14px",
          color: "rgba(255,255,255,0.5)",
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: "rgba(255,255,255,0.7)",
            marginBottom: 3,
          }}
        >
          CONTROLS
        </div>
        <div>W / ↑ — Accelerate</div>
        <div>S / ↓ — Brake / Reverse</div>
        <div>A / ← D / → — Steer</div>
      </div>

      {/* Bottom Left: Mini-map (oval track) */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 20,
          width: 130,
          height: 130,
          background: "rgba(10,12,14,0.75)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(53,194,255,0.2)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <svg
          width="130"
          height="130"
          viewBox="-70 -140 140 280"
          aria-label="Mini Map"
        >
          <title>Mini Map</title>
          {/* Oval track outline */}
          <rect
            x="-42"
            y="-120"
            width="84"
            height="240"
            rx="42"
            fill="none"
            stroke="rgba(53,194,255,0.5)"
            strokeWidth="10"
          />
          {/* Start/finish line */}
          <line
            x1="-42"
            y1="70"
            x2="42"
            y2="70"
            stroke="#ffffff"
            strokeWidth="3"
          />
          {/* Car position dot */}
          <circle cx="0" cy="0" r="6" fill="#35C2FF" />
          <circle cx="0" cy="0" r="3" fill="white" />
          <polygon
            points="0,-12 4,-5 -4,-5"
            fill="#F5B400"
            transform={`rotate(${heading}, 0, 0)`}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 0,
            width: "100%",
            textAlign: "center",
            fontSize: 9,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.1em",
          }}
        >
          MINI MAP
        </div>
      </div>
    </div>
  );
}
