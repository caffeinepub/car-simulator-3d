import { useEffect, useRef, useState } from "react";
import type { LeaderboardEntry } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { setGameState, useGameStore } from "../../store/gameStore";

function formatLapTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins}:${String(secs).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

function formatLapTimeMs(timeMs: bigint): string {
  const ms = Number(timeMs);
  const totalSecs = ms / 1000;
  const mins = Math.floor(totalSecs / 60);
  const secsInt = Math.floor(totalSecs % 60);
  const msRemainder = ms % 1000;
  return `${mins}:${String(secsInt).padStart(2, "0")}.${String(msRemainder).padStart(3, "0")}`;
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

const RANK_COLORS = ["#F5B400", "#C0C0C0", "#CD7F32"];

function LeaderboardPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const { actor, isFetching } = useActor();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    setLoading(true);
    setError(null);
    (actor as unknown as { getLeaderboard: () => Promise<LeaderboardEntry[]> })
      .getLeaderboard()
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load leaderboard.");
        setLoading(false);
      });
  }, [actor, isFetching]);

  return (
    <div
      data-ocid="leaderboard.modal"
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(8px)",
        zIndex: 15,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        style={{
          background: "rgba(10,12,14,0.97)",
          border: "1px solid rgba(53,194,255,0.25)",
          borderRadius: 20,
          padding: "28px 32px",
          width: "min(480px, 92vw)",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
          fontFamily: "'BricolageGrotesque', system-ui, sans-serif",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🏆</span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "white",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              LEADERBOARD
            </span>
          </div>
          <button
            data-ocid="leaderboard.close_button"
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(53,194,255,0.3), transparent)",
            marginBottom: 18,
          }}
        />

        {/* Content */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {(loading || isFetching) && (
            <div
              data-ocid="leaderboard.loading_state"
              style={{
                textAlign: "center",
                color: "rgba(255,255,255,0.4)",
                padding: "32px 0",
                fontSize: 14,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: "3px solid rgba(53,194,255,0.2)",
                  borderTopColor: "#35C2FF",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 12px",
                }}
              />
              Loading times...
            </div>
          )}

          {error && (
            <div
              data-ocid="leaderboard.error_state"
              style={{
                textAlign: "center",
                color: "#FF4D3A",
                padding: "32px 0",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          {!loading && !isFetching && !error && entries.length === 0 && (
            <div
              data-ocid="leaderboard.empty_state"
              style={{
                textAlign: "center",
                color: "rgba(255,255,255,0.35)",
                padding: "32px 0",
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>🏎️</div>
              No times recorded yet.
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.25)",
                  marginTop: 6,
                }}
              >
                Complete a lap to set the first record!
              </div>
            </div>
          )}

          {!loading && !isFetching && !error && entries.length > 0 && (
            <div
              data-ocid="leaderboard.table"
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              {/* Column headers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1fr 120px 90px",
                  gap: 8,
                  padding: "0 8px",
                  marginBottom: 4,
                }}
              >
                {["#", "NAME", "TIME", "DATE"].map((h) => (
                  <span
                    key={h}
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      color: "rgba(255,255,255,0.35)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {entries.map((entry, idx) => {
                const rankColor =
                  idx < 3 ? RANK_COLORS[idx] : "rgba(255,255,255,0.5)";
                const isTop3 = idx < 3;
                return (
                  <div
                    key={String(entry.rank)}
                    data-ocid={`leaderboard.item.${idx + 1}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "40px 1fr 120px 90px",
                      gap: 8,
                      padding: "10px 8px",
                      borderRadius: 10,
                      background: isTop3
                        ? `rgba(${idx === 0 ? "245,180,0" : idx === 1 ? "192,192,192" : "205,127,50"},0.06)`
                        : "rgba(255,255,255,0.03)",
                      border: isTop3
                        ? `1px solid rgba(${idx === 0 ? "245,180,0" : idx === 1 ? "192,192,192" : "205,127,50"},0.15)`
                        : "1px solid rgba(255,255,255,0.06)",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: isTop3 ? 16 : 13,
                        fontWeight: 800,
                        color: rankColor,
                        lineHeight: 1,
                      }}
                    >
                      {isTop3
                        ? ["\ud83e\udd47", "\ud83e\udd48", "\ud83e\udd49"][idx]
                        : `#${Number(entry.rank)}`}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.9)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.name}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: isTop3 ? rankColor : "rgba(255,255,255,0.75)",
                        fontFamily: "'GeistMono', monospace",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {formatLapTimeMs(entry.timeMs)}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.35)",
                      }}
                    >
                      {new Date(
                        Number(entry.timestamp) / 1e6,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewBestModal({
  bestLapTime,
  onSubmit,
  onSkip,
}: {
  bestLapTime: number;
  onSubmit: (name: string) => Promise<void>;
  onSkip: () => void;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(name.trim());
    } catch {
      setSubmitError("Failed to submit. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div
      data-ocid="newbest.modal"
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(10px)",
        zIndex: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          background: "rgba(10,12,14,0.98)",
          border: "1px solid rgba(245,180,0,0.35)",
          borderRadius: 20,
          padding: "32px 36px",
          width: "min(400px, 90vw)",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.9), 0 0 60px rgba(245,180,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
          fontFamily: "'BricolageGrotesque', system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Trophy & Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 44 }}>🏆</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#F5B400",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textShadow: "0 0 30px rgba(245,180,0,0.4)",
            }}
          >
            NEW BEST LAP!
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#35C2FF",
              fontFamily: "'GeistMono', monospace",
              letterSpacing: "0.02em",
            }}
          >
            {formatLapTime(bestLapTime)}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: "100%",
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(245,180,0,0.3), transparent)",
          }}
        />

        {/* Name input */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <label
            htmlFor="player-name-input"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.45)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            YOUR NAME
          </label>
          <input
            ref={inputRef}
            id="player-name-input"
            data-ocid="newbest.input"
            type="text"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              e.stopPropagation();
            }}
            placeholder="Enter your name..."
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(53,194,255,0.3)",
              borderRadius: 10,
              padding: "12px 16px",
              color: "white",
              fontSize: 16,
              fontFamily: "'BricolageGrotesque', system-ui, sans-serif",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {submitError && (
            <div
              data-ocid="newbest.error_state"
              style={{ fontSize: 12, color: "#FF4D3A" }}
            >
              {submitError}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: 12,
            width: "100%",
          }}
        >
          <button
            data-ocid="newbest.cancel_button"
            type="button"
            onClick={onSkip}
            disabled={submitting}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.6)",
              cursor: submitting ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.06em",
              fontFamily: "'BricolageGrotesque', system-ui, sans-serif",
            }}
          >
            SKIP
          </button>
          <button
            data-ocid="newbest.submit_button"
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
            style={{
              flex: 2,
              padding: "12px 0",
              borderRadius: 10,
              border: "1px solid rgba(245,180,0,0.5)",
              background:
                submitting || !name.trim()
                  ? "rgba(245,180,0,0.1)"
                  : "rgba(245,180,0,0.2)",
              color:
                submitting || !name.trim() ? "rgba(245,180,0,0.4)" : "#F5B400",
              cursor: submitting || !name.trim() ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.1em",
              fontFamily: "'BricolageGrotesque', system-ui, sans-serif",
              transition: "all 0.2s ease",
            }}
          >
            {submitting ? "SUBMITTING..." : "SUBMIT"}
          </button>
        </div>
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
    showLeaderboard,
    newBestPending,
  } = useGameStore();
  const { actor } = useActor();

  if (!gameStarted) return null;

  const lapActive = lapStartTime !== null;

  const handleLeaderboardToggle = () => {
    setGameState({ showLeaderboard: !showLeaderboard });
  };

  const handleBestSubmit = async (name: string) => {
    if (bestLapTime === null || !actor) return;
    const typedActor = actor as unknown as {
      submitLapTime: (name: string, timeMs: bigint) => Promise<boolean>;
    };
    await typedActor.submitLapTime(
      name,
      BigInt(Math.round(bestLapTime * 1000)),
    );
    setGameState({ newBestPending: false, showLeaderboard: true });
  };

  const handleBestSkip = () => {
    setGameState({ newBestPending: false });
  };

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
      {/* Spinning animation keyframes injected once */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

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

      {/* Top Left: Lap Timer + Leaderboard Button */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        <LapTimer
          lapCount={lapCount}
          currentLapTime={currentLapTime}
          bestLapTime={bestLapTime}
          lapActive={lapActive}
        />
        <button
          data-ocid="leaderboard.open_modal_button"
          type="button"
          onClick={handleLeaderboardToggle}
          style={{
            pointerEvents: "auto",
            background: showLeaderboard
              ? "rgba(245,180,0,0.2)"
              : "rgba(10,12,14,0.75)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${showLeaderboard ? "rgba(245,180,0,0.5)" : "rgba(53,194,255,0.2)"}`,
            borderRadius: 12,
            padding: "10px 16px",
            color: showLeaderboard ? "#F5B400" : "rgba(255,255,255,0.75)",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.1em",
            fontFamily: "'BricolageGrotesque', system-ui, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 7,
            transition: "all 0.25s ease",
            boxShadow:
              "0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          🏆 LEADERBOARD
        </button>
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

      {/* Leaderboard overlay */}
      {showLeaderboard && (
        <LeaderboardPanel
          onClose={() => setGameState({ showLeaderboard: false })}
        />
      )}

      {/* New best time submission modal */}
      {newBestPending && bestLapTime !== null && (
        <NewBestModal
          bestLapTime={bestLapTime}
          onSubmit={handleBestSubmit}
          onSkip={handleBestSkip}
        />
      )}
    </div>
  );
}
