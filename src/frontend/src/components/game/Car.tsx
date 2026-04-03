import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { getGameState, setGameState } from "../../store/gameStore";
import { TRACK } from "./World";

interface CarProps {
  keysRef: React.RefObject<Record<string, boolean>>;
  carGroupRef: React.RefObject<THREE.Group | null>;
}

const CAR_COLOR = "#1a3a6c";
const CAR_ROOF_COLOR = "#142d54";
const WHEEL_COLOR = "#1a1a1a";
const WHEEL_HUB_COLOR = "#8a8a8a";
const GLASS_COLOR = "#3a6080";
const HEADLIGHT_COLOR = "#fffae0";
const TAIL_COLOR = "#ff2200";

export interface CarState {
  position: THREE.Vector3;
  rotation: number;
  speed: number;
  wheelAngle: number;
  wheelSpin: number;
}

// Lap detection state (module-level to avoid re-render churn)
let _prevZ = 0;
let _lapActive = false;
let _lapStartTime: number | null = null;

export default function Car({ keysRef, carGroupRef }: CarProps) {
  const carState = useRef<CarState>({
    position: new THREE.Vector3(0, 0.45, TRACK.startLineZ - 10),
    rotation: 0,
    speed: 0,
    wheelAngle: 0,
    wheelSpin: 0,
  });

  const frontLeftRef = useRef<THREE.Group>(null);
  const frontRightRef = useRef<THREE.Group>(null);
  const rearLeftRef = useRef<THREE.Group>(null);
  const rearRightRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const keys = keysRef.current;
    const cs = carState.current;
    const now = performance.now();

    const accelerating = keys.ArrowUp || keys.KeyW;
    const braking = keys.ArrowDown || keys.KeyS;
    const steerLeft = keys.ArrowLeft || keys.KeyA;
    const steerRight = keys.ArrowRight || keys.KeyD;

    // Acceleration / braking
    if (accelerating) {
      cs.speed += 14 * dt;
      if (cs.speed > 42) cs.speed = 42;
    } else if (braking) {
      if (cs.speed > 0.2) {
        cs.speed -= 22 * dt;
      } else {
        cs.speed = Math.max(-9, cs.speed - 6 * dt);
      }
    } else {
      cs.speed *= 1 - 0.55 * dt;
      if (Math.abs(cs.speed) < 0.05) cs.speed = 0;
    }

    // Steering
    const targetSteer = steerLeft ? -0.55 : steerRight ? 0.55 : 0;
    cs.wheelAngle = THREE.MathUtils.lerp(cs.wheelAngle, targetSteer, 8 * dt);

    // Turning
    const speedFactor = Math.min(Math.abs(cs.speed) / 8, 1);
    const turnSign = cs.speed < 0 ? -1 : 1;
    cs.rotation +=
      turnSign *
      speedFactor *
      cs.wheelAngle *
      dt *
      2.2 *
      Math.sign(cs.speed || 1);

    // Move position
    cs.position.x += Math.sin(cs.rotation) * cs.speed * dt;
    cs.position.z += Math.cos(cs.rotation) * cs.speed * dt;

    // Apply to mesh
    if (carGroupRef.current) {
      carGroupRef.current.position.copy(cs.position);
      carGroupRef.current.rotation.y = cs.rotation;
    }

    // Wheel steering visuals
    const steerAngle = cs.wheelAngle * 0.6;
    if (frontLeftRef.current) frontLeftRef.current.rotation.y = steerAngle;
    if (frontRightRef.current) frontRightRef.current.rotation.y = steerAngle;

    // Wheel spin
    const spinAmount = cs.speed * dt * 2.5;
    if (frontLeftRef.current?.children[0])
      frontLeftRef.current.children[0].rotation.z += spinAmount;
    if (frontRightRef.current?.children[0])
      frontRightRef.current.children[0].rotation.z -= spinAmount;
    if (rearLeftRef.current?.children[0])
      rearLeftRef.current.children[0].rotation.z += spinAmount;
    if (rearRightRef.current?.children[0])
      rearRightRef.current.children[0].rotation.z -= spinAmount;

    // ---- Lap detection ----
    // Detect crossing the start/finish line (z = TRACK.startLineZ)
    // Car must be on the main straight (x roughly in [-8, 8])
    // and must be traveling forward (speed > 2 m/s)
    const carX = cs.position.x;
    const carZ = cs.position.z;
    const sfZ = TRACK.startLineZ;
    const onMainStraight =
      carX > -TRACK.width / 2 - 1 && carX < TRACK.width / 2 + 1;

    const crossedForward =
      _prevZ < sfZ && carZ >= sfZ && cs.speed > 2 && onMainStraight;

    if (crossedForward) {
      if (!_lapActive) {
        // First crossing: start the timer
        _lapActive = true;
        _lapStartTime = now;
        setGameState({ lapStartTime: now, lapCount: 1 });
      } else if (_lapStartTime !== null) {
        // Subsequent crossings: record lap
        const lapTimeSec = (now - _lapStartTime) / 1000;
        const gs = getGameState();
        const newBest =
          gs.bestLapTime === null || lapTimeSec < gs.bestLapTime
            ? lapTimeSec
            : gs.bestLapTime;
        _lapStartTime = now;
        setGameState({
          lapCount: gs.lapCount + 1,
          currentLapTime: 0,
          bestLapTime: newBest,
          lapStartTime: now,
        });
      }
    }

    _prevZ = carZ;

    // Update current lap time
    if (_lapActive && _lapStartTime !== null) {
      const elapsed = (now - _lapStartTime) / 1000;
      setGameState({ currentLapTime: elapsed });
    }

    // Gear calculation
    const speedKmh = Math.abs(cs.speed) * 3.6;
    let gear: number | string;
    if (cs.speed < -0.5) {
      gear = "R";
    } else if (speedKmh < 20) {
      gear = 1;
    } else if (speedKmh < 45) {
      gear = 2;
    } else if (speedKmh < 75) {
      gear = 3;
    } else if (speedKmh < 100) {
      gear = 4;
    } else if (speedKmh < 130) {
      gear = 5;
    } else {
      gear = 6;
    }

    const heading = ((((cs.rotation * 180) / Math.PI) % 360) + 360) % 360;
    const distanceDelta = Math.abs(cs.speed) * dt * (1 / 1000);
    const winMap = window as unknown as Record<string, number>;
    winMap._carDist = (winMap._carDist || 0) + distanceDelta;

    setGameState({
      speed: Math.round(speedKmh),
      gear,
      heading: Math.round(heading),
      distance: Number.parseFloat(winMap._carDist.toFixed(3)),
    });
  });

  return (
    <group
      ref={carGroupRef}
      position={[0, 0.45, TRACK.startLineZ - 10]}
      castShadow
    >
      {/* Main chassis */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[2, 0.5, 4.2]} />
        <meshStandardMaterial
          color={CAR_COLOR}
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>

      {/* Lower body skirt */}
      <mesh castShadow position={[0, -0.18, 0]}>
        <boxGeometry args={[2.1, 0.14, 4.3]} />
        <meshStandardMaterial color="#0f2040" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Cabin / roof */}
      <mesh castShadow position={[0, 0.45, -0.1]}>
        <boxGeometry args={[1.72, 0.45, 2.2]} />
        <meshStandardMaterial
          color={CAR_ROOF_COLOR}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 0.35, 0.92]} rotation={[0.38, 0, 0]}>
        <planeGeometry args={[1.56, 0.7]} />
        <meshStandardMaterial
          color={GLASS_COLOR}
          metalness={0.1}
          roughness={0.05}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Rear window */}
      <mesh position={[0, 0.35, -1.14]} rotation={[-0.38, 0, 0]}>
        <planeGeometry args={[1.56, 0.65]} />
        <meshStandardMaterial
          color={GLASS_COLOR}
          metalness={0.1}
          roughness={0.05}
          transparent
          opacity={0.55}
        />
      </mesh>

      {/* Hood */}
      <mesh castShadow position={[0, 0.14, 1.6]}>
        <boxGeometry args={[1.9, 0.12, 1.4]} />
        <meshStandardMaterial
          color={CAR_COLOR}
          metalness={0.75}
          roughness={0.2}
        />
      </mesh>

      {/* Trunk */}
      <mesh castShadow position={[0, 0.14, -1.7]}>
        <boxGeometry args={[1.85, 0.1, 1.0]} />
        <meshStandardMaterial
          color={CAR_COLOR}
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>

      {/* Front bumper */}
      <mesh castShadow position={[0, -0.1, 2.18]}>
        <boxGeometry args={[1.95, 0.28, 0.25]} />
        <meshStandardMaterial color="#0d1a2e" roughness={0.6} />
      </mesh>

      {/* Rear bumper */}
      <mesh castShadow position={[0, -0.1, -2.18]}>
        <boxGeometry args={[1.95, 0.28, 0.25]} />
        <meshStandardMaterial color="#0d1a2e" roughness={0.6} />
      </mesh>

      {/* Headlights */}
      <mesh position={[0.65, 0.04, 2.22]}>
        <boxGeometry args={[0.4, 0.14, 0.06]} />
        <meshStandardMaterial
          color={HEADLIGHT_COLOR}
          emissive={HEADLIGHT_COLOR}
          emissiveIntensity={2}
        />
      </mesh>
      <mesh position={[-0.65, 0.04, 2.22]}>
        <boxGeometry args={[0.4, 0.14, 0.06]} />
        <meshStandardMaterial
          color={HEADLIGHT_COLOR}
          emissive={HEADLIGHT_COLOR}
          emissiveIntensity={2}
        />
      </mesh>

      {/* Tail lights */}
      <mesh position={[0.65, 0.04, -2.22]}>
        <boxGeometry args={[0.4, 0.14, 0.06]} />
        <meshStandardMaterial
          color={TAIL_COLOR}
          emissive={TAIL_COLOR}
          emissiveIntensity={1.8}
        />
      </mesh>
      <mesh position={[-0.65, 0.04, -2.22]}>
        <boxGeometry args={[0.4, 0.14, 0.06]} />
        <meshStandardMaterial
          color={TAIL_COLOR}
          emissive={TAIL_COLOR}
          emissiveIntensity={1.8}
        />
      </mesh>

      {/* Side mirrors */}
      <mesh castShadow position={[1.1, 0.22, 0.5]}>
        <boxGeometry args={[0.2, 0.1, 0.35]} />
        <meshStandardMaterial
          color={CAR_COLOR}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>
      <mesh castShadow position={[-1.1, 0.22, 0.5]}>
        <boxGeometry args={[0.2, 0.1, 0.35]} />
        <meshStandardMaterial
          color={CAR_COLOR}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>

      {/* Front-Left wheel */}
      <group ref={frontLeftRef} position={[1.05, -0.18, 1.4]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.36, 0.36, 0.26, 20]} />
          <meshStandardMaterial color={WHEEL_COLOR} roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.17, 0.17, 0.28, 8]} />
          <meshStandardMaterial
            color={WHEEL_HUB_COLOR}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Front-Right wheel */}
      <group ref={frontRightRef} position={[-1.05, -0.18, 1.4]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.36, 0.36, 0.26, 20]} />
          <meshStandardMaterial color={WHEEL_COLOR} roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.17, 0.17, 0.28, 8]} />
          <meshStandardMaterial
            color={WHEEL_HUB_COLOR}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Rear-Left wheel */}
      <group ref={rearLeftRef} position={[1.05, -0.18, -1.4]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.36, 0.36, 0.26, 20]} />
          <meshStandardMaterial color={WHEEL_COLOR} roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.17, 0.17, 0.28, 8]} />
          <meshStandardMaterial
            color={WHEEL_HUB_COLOR}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Rear-Right wheel */}
      <group ref={rearRightRef} position={[-1.05, -0.18, -1.4]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.36, 0.36, 0.26, 20]} />
          <meshStandardMaterial color={WHEEL_COLOR} roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.17, 0.17, 0.28, 8]} />
          <meshStandardMaterial
            color={WHEEL_HUB_COLOR}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </group>
    </group>
  );
}
