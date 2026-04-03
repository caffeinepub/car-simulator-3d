import { Sky } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

interface WorldProps {
  isDay: boolean;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface TreeData {
  x: number;
  z: number;
  scale: number;
  trunkHeight: number;
}

interface BuildingData {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: string;
}

interface MountainData {
  x: number;
  z: number;
  radius: number;
  height: number;
  color: string;
}

interface RockData {
  x: number;
  z: number;
  scale: number;
}

// Oval track parameters
export const TRACK = {
  // Half-length of the straight sections (along Z)
  straightHalfLen: 120,
  // Radius of the semicircular ends
  curveRadius: 45,
  // Track width
  width: 14,
  // Start/finish line Z position (on the main straight)
  startLineZ: 80,
  // X center of the track (0 = centered)
  cx: 0,
};

// Module-level fog object (created once, color mutated reactively)
const sceneFog = new THREE.FogExp2(0xc8d8e8, 0.003);

// Module-level shared materials (created once)
const dashYellowMat = new THREE.MeshLambertMaterial({ color: "#f0e880" });
const sfWhiteMat = new THREE.MeshLambertMaterial({ color: "#ffffff" });
const sfBlackMat = new THREE.MeshLambertMaterial({ color: "#111111" });

function OvalTrack() {
  const { straightHalfLen, curveRadius, width } = TRACK;

  // Build curved end segments
  const curveSegments = useMemo(() => {
    const segments: Array<{
      x: number;
      z: number;
      rotation: number;
      length: number;
      id: string;
    }> = [];
    const segCount = 20;
    for (let side = 0; side < 2; side++) {
      // side 0 = top (positive Z), side 1 = bottom (negative Z)
      const centerZ = side === 0 ? straightHalfLen : -straightHalfLen;
      for (let i = 0; i < segCount; i++) {
        const startAngle = side === 0 ? 0 : Math.PI;
        const angle = startAngle + (i / segCount) * Math.PI;
        const midAngle = startAngle + ((i + 0.5) / segCount) * Math.PI;
        const x = Math.cos(midAngle) * curveRadius;
        const z = centerZ + Math.sin(midAngle) * curveRadius;
        // Rotation perpendicular to radius = midAngle + PI/2
        const rotation = midAngle + Math.PI / 2;
        // Arc length of this segment
        const length = (Math.PI / segCount) * curveRadius + 0.1;
        segments.push({ x, z, rotation, length, id: `${side}-${i}` });
        void angle; // suppress unused
      }
    }
    return segments;
  }, [straightHalfLen, curveRadius]);

  // Build curb (red/white rumble strips) at track edges
  const curbSegments = useMemo(() => {
    const segs: Array<{
      x: number;
      z: number;
      rotation: number;
      length: number;
      color: number;
      id: string;
    }> = [];
    const segCount = 20;
    for (let side = 0; side < 2; side++) {
      const centerZ = side === 0 ? straightHalfLen : -straightHalfLen;
      for (let i = 0; i < segCount; i++) {
        const startAngle = side === 0 ? 0 : Math.PI;
        const midAngle = startAngle + ((i + 0.5) / segCount) * Math.PI;
        const x = Math.cos(midAngle) * curveRadius;
        const z = centerZ + Math.sin(midAngle) * curveRadius;
        const rotation = midAngle + Math.PI / 2;
        const length = (Math.PI / segCount) * curveRadius + 0.1;
        segs.push({ x, z, rotation, length, color: i % 2, id: `${side}-${i}` });
      }
    }
    return segs;
  }, [straightHalfLen, curveRadius]);

  const asphaltMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: "#2a2c2f" }),
    [],
  );
  const shoulderMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: "#e8e0c8" }),
    [],
  );
  const curbRedMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: "#c0392b" }),
    [],
  );
  const curbWhiteMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: "#ecf0f1" }),
    [],
  );
  const gantryRedMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: "#c0392b" }),
    [],
  );
  const pitLineMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: "#27ae60" }),
    [],
  );

  const dashPositions = useMemo(() => {
    const dashes: number[] = [];
    const count = Math.floor((straightHalfLen * 2) / 18);
    for (let i = 0; i < count; i++) {
      dashes.push(-straightHalfLen + 4 + i * 18);
    }
    return dashes;
  }, [straightHalfLen]);

  // Geometry objects - created once
  const dashGeo = useMemo(() => new THREE.BoxGeometry(0.25, 0.04, 5), []);
  const sfTileGeo = useMemo(() => new THREE.BoxGeometry(2, 0.05, 2), []);

  return (
    <>
      {/* ---- Straight sections ---- */}
      {/* Main straight (positive X side) */}
      <mesh position={[0, 0.01, 0]} receiveShadow material={asphaltMat}>
        <boxGeometry args={[width, 0.06, straightHalfLen * 2]} />
      </mesh>

      {/* Back straight (negative X side, offset by 2*curveRadius) */}
      <mesh
        position={[curveRadius * 2, 0.01, 0]}
        receiveShadow
        material={asphaltMat}
      >
        <boxGeometry args={[width, 0.06, straightHalfLen * 2]} />
      </mesh>

      {/* Road shoulders - main straight */}
      <mesh position={[-width / 2 - 0.3, 0.04, 0]} material={shoulderMat}>
        <boxGeometry args={[0.5, 0.04, straightHalfLen * 2]} />
      </mesh>
      <mesh position={[width / 2 + 0.3, 0.04, 0]} material={shoulderMat}>
        <boxGeometry args={[0.5, 0.04, straightHalfLen * 2]} />
      </mesh>

      {/* Road shoulders - back straight */}
      <mesh
        position={[curveRadius * 2 - width / 2 - 0.3, 0.04, 0]}
        material={shoulderMat}
      >
        <boxGeometry args={[0.5, 0.04, straightHalfLen * 2]} />
      </mesh>
      <mesh
        position={[curveRadius * 2 + width / 2 + 0.3, 0.04, 0]}
        material={shoulderMat}
      >
        <boxGeometry args={[0.5, 0.04, straightHalfLen * 2]} />
      </mesh>

      {/* Center dashes - main straight */}
      {dashPositions.map((z) => (
        <mesh
          key={`dash-m-${z}`}
          position={[0, 0.08, z]}
          geometry={dashGeo}
          material={dashYellowMat}
        />
      ))}

      {/* Center dashes - back straight */}
      {dashPositions.map((z) => (
        <mesh
          key={`dash-b-${z}`}
          position={[curveRadius * 2, 0.08, z]}
          geometry={dashGeo}
          material={dashYellowMat}
        />
      ))}

      {/* ---- Curved end sections ---- */}
      {curveSegments.map((seg) => (
        <mesh
          key={`curve-${seg.id}`}
          position={[seg.x + curveRadius, 0.01, seg.z]}
          rotation={[0, seg.rotation, 0]}
          receiveShadow
          material={asphaltMat}
        >
          <boxGeometry args={[width, 0.06, seg.length + 0.2]} />
        </mesh>
      ))}

      {/* ---- Rumble strips on curved sections ---- */}
      {curbSegments.map((seg) => (
        <group key={`curb-${seg.id}`}>
          {/* Inner curb */}
          <mesh
            position={[
              seg.x +
                curveRadius +
                Math.cos(seg.rotation - Math.PI / 2) * (width / 2 - 0.4),
              0.06,
              seg.z + Math.sin(seg.rotation - Math.PI / 2) * (width / 2 - 0.4),
            ]}
            rotation={[0, seg.rotation, 0]}
            material={seg.color === 0 ? curbRedMat : curbWhiteMat}
          >
            <boxGeometry args={[0.9, 0.06, seg.length]} />
          </mesh>
          {/* Outer curb */}
          <mesh
            position={[
              seg.x +
                curveRadius +
                Math.cos(seg.rotation + Math.PI / 2) * (width / 2 - 0.4),
              0.06,
              seg.z + Math.sin(seg.rotation + Math.PI / 2) * (width / 2 - 0.4),
            ]}
            rotation={[0, seg.rotation, 0]}
            material={seg.color === 0 ? curbRedMat : curbWhiteMat}
          >
            <boxGeometry args={[0.9, 0.06, seg.length]} />
          </mesh>
        </group>
      ))}

      {/* ---- Start / Finish line ---- */}
      {/* Chequered line on main straight */}
      {[0, 1, 2, 3, 4, 5, 6].map((col) => (
        <mesh
          key={`sf-${col}`}
          position={[-width / 2 + col * 2 + 1, 0.09, TRACK.startLineZ]}
          geometry={sfTileGeo}
          material={col % 2 === 0 ? sfWhiteMat : sfBlackMat}
        />
      ))}
      {/* Green pit-lane line in front of start */}
      <mesh position={[0, 0.09, TRACK.startLineZ - 6]} material={pitLineMat}>
        <boxGeometry args={[width, 0.04, 0.6]} />
      </mesh>

      {/* ---- Pit lane / Start gantry arch ---- */}
      <mesh
        position={[-width / 2 - 0.5, 4, TRACK.startLineZ]}
        castShadow
        material={gantryRedMat}
      >
        <boxGeometry args={[0.5, 8, 0.5]} />
      </mesh>
      <mesh
        position={[width / 2 + 0.5, 4, TRACK.startLineZ]}
        castShadow
        material={gantryRedMat}
      >
        <boxGeometry args={[0.5, 8, 0.5]} />
      </mesh>
      <mesh
        position={[0, 8.1, TRACK.startLineZ]}
        castShadow
        material={gantryRedMat}
      >
        <boxGeometry args={[width + 1.5, 0.5, 0.5]} />
      </mesh>
    </>
  );
}

export default function World({ isDay }: WorldProps) {
  const { curveRadius, straightHalfLen } = TRACK;

  const trees = useMemo<TreeData[]>(() => {
    const result: TreeData[] = [];
    // Place trees outside the oval circuit
    for (let i = 0; i < 100; i++) {
      let x: number;
      let z: number;
      do {
        x = (seededRandom(i * 3 + 2) - 0.5) * 500;
        z = (seededRandom(i * 5 + 3) - 0.5) * 500;
      } while (
        // avoid main straight
        (Math.abs(x) < 18 &&
          Math.abs(z) < straightHalfLen + curveRadius + 10) ||
        // avoid back straight
        (Math.abs(x - curveRadius * 2) < 18 &&
          Math.abs(z) < straightHalfLen + curveRadius + 10)
      );
      const scale = 0.7 + seededRandom(i * 11 + 4) * 0.8;
      const trunkHeight = 1.5 + seededRandom(i * 13 + 5) * 1.5;
      result.push({ x, z, scale, trunkHeight });
    }
    return result;
  }, [curveRadius, straightHalfLen]);

  const buildings = useMemo<BuildingData[]>(() => {
    const colors = ["#c8c8b8", "#9a9a8a", "#b8a898", "#7a8898", "#d4c4a0"];
    const result: BuildingData[] = [];
    for (let i = 0; i < 20; i++) {
      const side = seededRandom(i * 9 + 6) > 0.5 ? 1 : -1;
      const x = side * (90 + seededRandom(i * 4 + 7) * 120);
      const z = (seededRandom(i * 6 + 8) - 0.5) * 500;
      const w = 5 + seededRandom(i * 3 + 9) * 12;
      const h = 8 + seededRandom(i * 5 + 10) * 30;
      const d = 5 + seededRandom(i * 7 + 11) * 12;
      const color =
        colors[Math.floor(seededRandom(i * 2 + 12) * colors.length)];
      result.push({ x, z, w, h, d, color });
    }
    return result;
  }, []);

  const mountains = useMemo<MountainData[]>(() => {
    const result: MountainData[] = [];
    const mountainColors = ["#5a6070", "#6b7280", "#4a5568", "#7a8898"];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dist = 300 + seededRandom(i * 8 + 13) * 100;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const radius = 35 + seededRandom(i * 3 + 14) * 30;
      const height = 60 + seededRandom(i * 4 + 15) * 60;
      const color = mountainColors[i % mountainColors.length];
      result.push({ x, z, radius, height, color });
    }
    return result;
  }, []);

  const rocks = useMemo<RockData[]>(() => {
    const result: RockData[] = [];
    for (let i = 0; i < 30; i++) {
      const rx = (seededRandom(i * 17 + 20) - 0.5) * 400;
      const rz = (seededRandom(i * 19 + 21) - 0.5) * 400;
      const rs = 0.3 + seededRandom(i * 23 + 22) * 0.8;
      // avoid the track area
      if (
        Math.abs(rx) > 20 ||
        Math.abs(rz) > straightHalfLen + curveRadius + 15
      ) {
        result.push({ x: rx, z: rz, scale: rs });
      }
    }
    return result;
  }, [curveRadius, straightHalfLen]);

  // Update fog color imperatively (fog object is stable)
  sceneFog.color.set(isDay ? 0xc8d8e8 : 0x040814);

  const sunPosition = isDay
    ? ([100, 50, 100] as [number, number, number])
    : ([-1, -0.3, -1] as [number, number, number]);

  const trunkGeo = useMemo(
    () => new THREE.CylinderGeometry(0.18, 0.28, 2, 7),
    [],
  );
  const canopyGeo = useMemo(() => new THREE.ConeGeometry(1.4, 3.5, 7), []);
  const trunkMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: "#6b4423" }),
    [],
  );
  const canopyMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: "#1e5c38" }),
    [],
  );
  const canopyMat2 = useMemo(
    () => new THREE.MeshLambertMaterial({ color: "#2d7a4f" }),
    [],
  );
  const groundMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: "#3a6b45" }),
    [],
  );
  const infieldMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: "#2d5a38" }),
    [],
  );
  const windowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#1a2030",
        opacity: 0.6,
        transparent: true,
      }),
    [],
  );
  const rockMat = useMemo(
    () => new THREE.MeshLambertMaterial({ color: "#7a7060" }),
    [],
  );

  return (
    <>
      <Sky
        sunPosition={sunPosition}
        turbidity={isDay ? 4 : 20}
        rayleigh={isDay ? 1 : 0.1}
        mieCoefficient={0.003}
        mieDirectionalG={0.85}
      />

      <primitive object={sceneFog} attach="fog" />

      {/* Ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, -0.05, 0]}
        material={groundMat}
      >
        <planeGeometry args={[3000, 3000]} />
      </mesh>

      {/* Infield grass */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[curveRadius, -0.01, 0]}
        material={infieldMat}
      >
        <planeGeometry
          args={[curveRadius * 2 - 20, straightHalfLen * 2 - 10]}
        />
      </mesh>

      {/* Oval race track */}
      <OvalTrack />

      {/* Trees */}
      {trees.map((tree) => (
        <group
          key={`tree-${tree.x.toFixed(2)}-${tree.z.toFixed(2)}`}
          position={[tree.x, 0, tree.z]}
          scale={tree.scale}
        >
          <mesh
            geometry={trunkGeo}
            material={trunkMat}
            position={[0, tree.trunkHeight / 2, 0]}
            castShadow
          />
          <mesh
            geometry={canopyGeo}
            material={tree.x % 3 === 0 ? canopyMat2 : canopyMat}
            position={[0, tree.trunkHeight + 1.6, 0]}
            castShadow
          />
        </group>
      ))}

      {/* Buildings */}
      {buildings.map((b) => (
        <group
          key={`bldg-${b.x.toFixed(2)}-${b.z.toFixed(2)}`}
          position={[b.x, b.h / 2, b.z]}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshLambertMaterial color={b.color} />
          </mesh>
          <mesh position={[0, 0, b.d / 2 + 0.05]} material={windowMat}>
            <planeGeometry args={[b.w * 0.85, b.h * 0.85]} />
          </mesh>
        </group>
      ))}

      {/* Mountains */}
      {mountains.map((m) => (
        <mesh
          key={`mtn-${m.x.toFixed(0)}-${m.z.toFixed(0)}`}
          position={[m.x, m.height / 2 - 10, m.z]}
          castShadow
        >
          <coneGeometry args={[m.radius, m.height, 7]} />
          <meshLambertMaterial color={m.color} />
        </mesh>
      ))}

      {/* Rocks */}
      {rocks.map((rock) => (
        <mesh
          key={`rock-${rock.x.toFixed(2)}-${rock.z.toFixed(2)}`}
          position={[rock.x, 0.15, rock.z]}
          scale={rock.scale}
          castShadow
          material={rockMat}
        >
          <dodecahedronGeometry args={[0.4, 0]} />
        </mesh>
      ))}
    </>
  );
}
