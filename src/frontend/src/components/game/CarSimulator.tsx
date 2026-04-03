import { Canvas } from "@react-three/fiber";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { setGameState, useGameStore } from "../../store/gameStore";
import AITraffic from "./AITraffic";
import CameraRig from "./CameraRig";
import Car from "./Car";
import HUD from "./HUD";
import Lighting from "./Lighting";
import World from "./World";

const DECORATIVE_LINES = [0, 1, 2, 3, 4, 5];
const FEATURES = [
  "🎮 WASD / Arrow Keys",
  "🌅 Day / Night Cycle",
  "🏎️ Realistic Physics",
  "🗺️ Open World",
];

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5 }}
      data-ocid="start.modal"
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at center, rgba(10,20,40,0.92) 0%, rgba(0,0,0,0.97) 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
        cursor: "pointer",
        userSelect: "none",
        backdropFilter: "blur(6px)",
      }}
      onClick={onStart}
    >
      {/* Decorative lines */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {DECORATIVE_LINES.map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${10 + i * 16}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: `linear-gradient(180deg, transparent 0%, rgba(53,194,255,${0.05 + i * 0.02}) 50%, transparent 100%)`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.35em",
            color: "#35C2FF",
            fontWeight: 700,
            textTransform: "uppercase",
            border: "1px solid rgba(53,194,255,0.4)",
            padding: "4px 14px",
            borderRadius: 4,
            marginBottom: 12,
          }}
        >
          Open World · React Three Fiber
        </div>

        <h1
          style={{
            fontSize: "clamp(3rem, 10vw, 7rem)",
            fontWeight: 900,
            color: "white",
            letterSpacing: "-0.03em",
            lineHeight: 0.9,
            textAlign: "center",
            textShadow: "0 0 80px rgba(53,194,255,0.3)",
            fontFamily: "'BricolageGrotesque', system-ui, sans-serif",
          }}
        >
          CAR
          <span
            style={{
              display: "block",
              background: "linear-gradient(135deg, #35C2FF 0%, #F5B400 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SIMULATOR
          </span>
        </h1>

        <p
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.5)",
            marginTop: 16,
            letterSpacing: "0.05em",
          }}
        >
          An open-world 3D driving experience
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.4, 1] }}
        transition={{
          delay: 0.8,
          duration: 1.5,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
        data-ocid="start.primary_button"
        style={{
          marginTop: 52,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "0.25em",
          color: "#F5B400",
          textTransform: "uppercase",
          border: "2px solid rgba(245,180,0,0.6)",
          padding: "14px 36px",
          borderRadius: 8,
          background: "rgba(245,180,0,0.08)",
        }}
      >
        PRESS SPACE OR CLICK TO START
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        style={{
          marginTop: 40,
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {FEATURES.map((feat) => (
          <span
            key={feat}
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.08em",
            }}
          >
            {feat}
          </span>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default function CarSimulator() {
  const { isDay, gameStarted } = useGameStore();
  const keysRef = useRef<Record<string, boolean>>({});
  const carGroupRef = useRef<THREE.Group>(null);
  // Shared AI positions array updated each frame by AITraffic
  const aiPositionsRef = useRef<THREE.Vector3[]>([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startCountdown = useCallback(() => {
    setGameState({ countdownActive: true, countdownValue: 3 });
    let step = 3;
    const tick = () => {
      step--;
      if (step > 0) {
        setGameState({ countdownValue: step });
        countdownTimerRef.current = setTimeout(tick, 1000);
      } else {
        setGameState({ countdownValue: "GO" });
        countdownTimerRef.current = setTimeout(() => {
          setGameState({ countdownActive: false, countdownValue: null });
        }, 900);
      }
    };
    countdownTimerRef.current = setTimeout(tick, 1000);
  }, []);

  const startGame = useCallback(() => {
    setGameState({ gameStarted: true });
    startCountdown();
  }, [startCountdown]);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === "Space") {
        e.preventDefault();
        if (!gameStarted) startGame();
      }
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)
      ) {
        e.preventDefault();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [gameStarted, startGame]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas
        shadows
        camera={{ fov: 60, near: 0.1, far: 2000, position: [0, 8, 20] }}
        style={{ background: "#000" }}
        gl={{ antialias: true, toneMappingExposure: isDay ? 1.0 : 0.4 }}
      >
        <Suspense fallback={null}>
          <Lighting isDay={isDay} />
          <World isDay={isDay} />
          <Car
            keysRef={keysRef}
            carGroupRef={carGroupRef}
            aiPositionsRef={aiPositionsRef}
          />
          <AITraffic aiPositionsRef={aiPositionsRef} />
          <CameraRig carGroupRef={carGroupRef} />
        </Suspense>
      </Canvas>

      <HUD />

      <AnimatePresence>
        {!gameStarted && <StartScreen key="start" onStart={startGame} />}
      </AnimatePresence>
    </div>
  );
}
