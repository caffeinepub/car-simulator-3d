import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface LightingProps {
  isDay: boolean;
}

export default function Lighting({ isDay }: LightingProps) {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  const dayPos = new THREE.Vector3(80, 60, 40);
  const nightPos = new THREE.Vector3(-20, 30, -20);
  const currentPos = useRef(dayPos.clone());

  useFrame(() => {
    if (!dirLightRef.current || !ambientRef.current) return;

    const targetPos = isDay ? dayPos : nightPos;
    currentPos.current.lerp(targetPos, 0.02);
    dirLightRef.current.position.copy(currentPos.current);

    const targetIntensity = isDay ? 2.5 : 0.3;
    dirLightRef.current.intensity = THREE.MathUtils.lerp(
      dirLightRef.current.intensity,
      targetIntensity,
      0.02,
    );

    const targetAmbient = isDay ? 0.5 : 0.08;
    ambientRef.current.intensity = THREE.MathUtils.lerp(
      ambientRef.current.intensity,
      targetAmbient,
      0.02,
    );

    // Lerp light color
    const targetColor = isDay
      ? new THREE.Color("#fff8e7")
      : new THREE.Color("#3a4fa0");
    dirLightRef.current.color.lerp(targetColor, 0.02);

    const targetAmbColor = isDay
      ? new THREE.Color("#ffe4b0")
      : new THREE.Color("#101030");
    ambientRef.current.color.lerp(targetAmbColor, 0.02);
  });

  return (
    <>
      <ambientLight
        ref={ambientRef}
        intensity={isDay ? 0.5 : 0.08}
        color={isDay ? "#ffe4b0" : "#101030"}
      />
      <directionalLight
        ref={dirLightRef}
        position={[80, 60, 40]}
        intensity={isDay ? 2.5 : 0.3}
        color={isDay ? "#fff8e7" : "#3a4fa0"}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={400}
        shadow-camera-near={0.1}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-bias={-0.0005}
      />
      {!isDay && (
        <pointLight
          position={[0, 80, 0]}
          intensity={0.5}
          color="#b0c4ff"
          distance={500}
        />
      )}
    </>
  );
}
