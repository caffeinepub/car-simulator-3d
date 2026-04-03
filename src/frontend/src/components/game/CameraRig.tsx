import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface CameraRigProps {
  carGroupRef: React.RefObject<THREE.Group | null>;
}

const _idealPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _offset = new THREE.Vector3();

export default function CameraRig({ carGroupRef }: CameraRigProps) {
  const { camera } = useThree();

  useFrame(() => {
    if (!carGroupRef.current) return;

    const car = carGroupRef.current;
    const carPos = car.position;
    const carRotY = car.rotation.y;

    // Offset behind and above the car
    _offset.set(-Math.sin(carRotY) * 13, 5.5, -Math.cos(carRotY) * 13);

    _idealPos.copy(carPos).add(_offset);
    camera.position.lerp(_idealPos, 0.07);

    _lookTarget.copy(carPos).add(new THREE.Vector3(0, 1.2, 0));
    camera.lookAt(_lookTarget);
  });

  return null;
}
