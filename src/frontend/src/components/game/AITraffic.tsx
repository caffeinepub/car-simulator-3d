import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { TRACK } from "./World";

// Track parameterization
// The oval has:
//   Main straight (x=0): z from +120 down to -120
//   Bottom curve: center=(45, 0, -120), radius=45, from x=0 to x=90
//   Back straight (x=90): z from -120 up to +120
//   Top curve: center=(45, 0, +120), radius=45, from x=90 to x=0

const straightLen = 2 * TRACK.straightHalfLen; // 240
const curveLen = Math.PI * TRACK.curveRadius; // ~141.4
const totalLen = 2 * straightLen + 2 * curveLen;

function trackPoint(t: number): { x: number; z: number; angle: number } {
  const pos = ((t % 1) + 1) % 1;
  const d = pos * totalLen;

  const s1 = straightLen; // main straight: 0..240
  const c1 = s1 + curveLen; // bottom curve: 240..381
  const s2 = c1 + straightLen; // back straight: 381..621
  // top curve: 621..762

  if (d < s1) {
    // Main straight: x=0, z goes from +120 down to -120
    const frac = d / s1;
    return {
      x: 0,
      z: TRACK.straightHalfLen - frac * 2 * TRACK.straightHalfLen,
      angle: Math.PI,
    };
  }
  if (d < c1) {
    // Bottom curve: center=(45, 0, -120)
    const frac = (d - s1) / curveLen;
    const a = Math.PI - frac * Math.PI;
    return {
      x: 45 + Math.cos(a) * TRACK.curveRadius,
      z: -TRACK.straightHalfLen + Math.sin(a) * TRACK.curveRadius,
      angle: a - Math.PI / 2,
    };
  }
  if (d < s2) {
    // Back straight: x=90, z goes from -120 up to +120
    const frac = (d - c1) / s1;
    return {
      x: TRACK.curveRadius * 2,
      z: -TRACK.straightHalfLen + frac * 2 * TRACK.straightHalfLen,
      angle: 0,
    };
  }
  // Top curve: center=(45, 0, +120)
  const frac = (d - s2) / curveLen;
  const a = frac * Math.PI;
  return {
    x: 45 + Math.cos(a) * TRACK.curveRadius,
    z: TRACK.straightHalfLen + Math.sin(a) * TRACK.curveRadius,
    angle: a + Math.PI / 2,
  };
}

// AI car configs (stable keys use color)
const AI_CARS = [
  { tSpeed: 0.065, tOffset: 0.1, color: "#8B0000", roofColor: "#5a0000" },
  { tSpeed: 0.085, tOffset: 0.4, color: "#006400", roofColor: "#004000" },
  { tSpeed: 0.075, tOffset: 0.7, color: "#8B4513", roofColor: "#5a2d0c" },
];

// Module-level mutable t positions to avoid re-renders
const aiT = AI_CARS.map((c) => c.tOffset);

function AICar({
  color,
  roofColor,
  groupRef,
}: {
  color: string;
  roofColor: string;
  groupRef: React.RefObject<THREE.Group | null>;
}) {
  return (
    <group ref={groupRef} position={[0, 0.45, 0]}>
      {/* Chassis */}
      <mesh castShadow>
        <boxGeometry args={[2, 0.5, 4.2]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Cabin */}
      <mesh castShadow position={[0, 0.44, -0.1]}>
        <boxGeometry args={[1.72, 0.44, 2.2]} />
        <meshStandardMaterial
          color={roofColor}
          metalness={0.5}
          roughness={0.35}
        />
      </mesh>
      {/* Headlights */}
      <mesh position={[0.65, 0.04, 2.12]}>
        <boxGeometry args={[0.4, 0.14, 0.06]} />
        <meshStandardMaterial
          color="#fffae0"
          emissive="#fffae0"
          emissiveIntensity={1.5}
        />
      </mesh>
      <mesh position={[-0.65, 0.04, 2.12]}>
        <boxGeometry args={[0.4, 0.14, 0.06]} />
        <meshStandardMaterial
          color="#fffae0"
          emissive="#fffae0"
          emissiveIntensity={1.5}
        />
      </mesh>
      {/* Tail lights */}
      <mesh position={[0.65, 0.04, -2.12]}>
        <boxGeometry args={[0.4, 0.14, 0.06]} />
        <meshStandardMaterial
          color="#ff2200"
          emissive="#ff2200"
          emissiveIntensity={1.5}
        />
      </mesh>
      <mesh position={[-0.65, 0.04, -2.12]}>
        <boxGeometry args={[0.4, 0.14, 0.06]} />
        <meshStandardMaterial
          color="#ff2200"
          emissive="#ff2200"
          emissiveIntensity={1.5}
        />
      </mesh>
      {/* Wheels */}
      <mesh
        position={[1.05, -0.18, 1.4]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.36, 0.36, 0.26, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      <mesh
        position={[-1.05, -0.18, 1.4]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.36, 0.36, 0.26, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      <mesh
        position={[1.05, -0.18, -1.4]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.36, 0.36, 0.26, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      <mesh
        position={[-1.05, -0.18, -1.4]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.36, 0.36, 0.26, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
    </group>
  );
}

export default function AITraffic() {
  const groupRefs = [
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
  ];

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < AI_CARS.length; i++) {
      aiT[i] = (aiT[i] + AI_CARS[i].tSpeed * dt) % 1;
      const pt = trackPoint(aiT[i]);
      const ref = groupRefs[i].current;
      if (ref) {
        ref.position.set(pt.x, 0.45, pt.z);
        ref.rotation.y = -pt.angle;
      }
    }
  });

  return (
    <>
      {AI_CARS.map((car, i) => (
        <AICar
          key={car.color}
          color={car.color}
          roofColor={car.roofColor}
          groupRef={groupRefs[i]}
        />
      ))}
    </>
  );
}
