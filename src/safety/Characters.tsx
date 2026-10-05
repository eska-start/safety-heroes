"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface HeroProps {
  walk?: number; // 0 = idle, 1 = 걷기
  wave?: boolean; // 손 흔들기
}

function Eyes({ y = 2.32, z = 0.52 }: { y?: number; z?: number }) {
  return (
    <group>
      <mesh position={[-0.2, y, z - 0.02]}><sphereGeometry args={[0.13, 16, 16]} /><meshStandardMaterial color="#fff" /></mesh>
      <mesh position={[0.2, y, z - 0.02]}><sphereGeometry args={[0.13, 16, 16]} /><meshStandardMaterial color="#fff" /></mesh>
      <mesh position={[-0.2, y, z + 0.06]}><sphereGeometry args={[0.06, 12, 12]} /><meshBasicMaterial color="#111827" /></mesh>
      <mesh position={[0.2, y, z + 0.06]}><sphereGeometry args={[0.06, 12, 12]} /><meshBasicMaterial color="#111827" /></mesh>
      <mesh position={[-0.32, y - 0.22, z]}><sphereGeometry args={[0.07, 10, 10]} /><meshStandardMaterial color="#f9a8a8" /></mesh>
      <mesh position={[0.32, y - 0.22, z]}><sphereGeometry args={[0.07, 10, 10]} /><meshStandardMaterial color="#f9a8a8" /></mesh>
      <mesh position={[0, y - 0.38, z + 0.02]}>
        <torusGeometry args={[0.12, 0.035, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>
    </group>
  );
}

function Body({
  uniform,
  stripe,
  walk = 0,
  wave = false,
  skin = "#ffd9b3",
}: HeroProps & { uniform: string; stripe: string; skin?: string }) {
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const sw = Math.sin(t * 9) * walk;
    if (legL.current) legL.current.rotation.x = sw * 0.7;
    if (legR.current) legR.current.rotation.x = -sw * 0.7;
    if (armL.current) armL.current.rotation.x = -sw * 0.55;
    if (torso.current) torso.current.position.y = Math.abs(Math.sin(t * 9)) * 0.06 * walk + Math.sin(t * 2) * 0.02;
    if (armR.current) {
      armR.current.rotation.z = wave ? 2.4 + Math.sin(t * 10) * 0.45 : 0.12;
      armR.current.rotation.x = wave ? 0 : sw * 0.55;
    }
  });

  return (
    <group ref={torso}>
      {/* 부츠 + 다리 */}
      <group ref={legL} position={[-0.32, 0.75, 0]}>
        <mesh position={[0, -0.35, 0]}><capsuleGeometry args={[0.19, 0.4, 6, 12]} /><meshStandardMaterial color="#1f2937" /></mesh>
        <mesh position={[0, -0.72, 0.08]}><boxGeometry args={[0.36, 0.18, 0.55]} /><meshStandardMaterial color="#111827" /></mesh>
      </group>
      <group ref={legR} position={[0.32, 0.75, 0]}>
        <mesh position={[0, -0.35, 0]}><capsuleGeometry args={[0.19, 0.4, 6, 12]} /><meshStandardMaterial color="#1f2937" /></mesh>
        <mesh position={[0, -0.72, 0.08]}><boxGeometry args={[0.36, 0.18, 0.55]} /><meshStandardMaterial color="#111827" /></mesh>
      </group>
      {/* 몸통 */}
      <mesh position={[0, 1.35, 0]}><capsuleGeometry args={[0.62, 0.55, 8, 20]} /><meshStandardMaterial color={uniform} roughness={0.6} /></mesh>
      {/* 반사띠 */}
      <mesh position={[0, 1.3, 0]}><torusGeometry args={[0.63, 0.07, 10, 28]} /><meshStandardMaterial color={stripe} emissive={stripe} emissiveIntensity={0.35} /></mesh>
      <mesh position={[0, 1.62, 0]}><torusGeometry args={[0.6, 0.05, 10, 28]} /><meshStandardMaterial color={stripe} emissive={stripe} emissiveIntensity={0.25} /></mesh>
      {/* 벨트 */}
      <mesh position={[0, 0.95, 0]}><torusGeometry args={[0.55, 0.06, 8, 24]} /><meshStandardMaterial color="#111827" /></mesh>
      <mesh position={[0, 0.95, 0.55]}><boxGeometry args={[0.22, 0.14, 0.06]} /><meshStandardMaterial color="#facc15" metalness={0.6} roughness={0.3} /></mesh>
      {/* 왼팔 */}
      <group ref={armL} position={[-0.78, 1.7, 0]}>
        <mesh position={[0, -0.4, 0]}><capsuleGeometry args={[0.16, 0.5, 6, 12]} /><meshStandardMaterial color={uniform} roughness={0.6} /></mesh>
        <mesh position={[0, -0.78, 0]}><sphereGeometry args={[0.18, 14, 14]} /><meshStandardMaterial color={skin} /></mesh>
      </group>
      {/* 오른팔 (손 흔들기) */}
      <group ref={armR} position={[0.78, 1.7, 0]}>
        <mesh position={[0, -0.4, 0]}><capsuleGeometry args={[0.16, 0.5, 6, 12]} /><meshStandardMaterial color={uniform} roughness={0.6} /></mesh>
        <mesh position={[0, -0.82, 0]}><sphereGeometry args={[0.18, 14, 14]} /><meshStandardMaterial color={skin} /></mesh>
      </group>
      {/* 머리 */}
      <mesh position={[0, 2.35, 0]}><sphereGeometry args={[0.55, 28, 28]} /><meshStandardMaterial color={skin} roughness={0.5} /></mesh>
      <Eyes />
    </group>
  );
}

export function Firefighter(props: HeroProps) {
  return (
    <group>
      <Body {...props} uniform="#dc2626" stripe="#fde047" />
      {/* 소방 헬멧 */}
      <mesh position={[0, 2.78, 0]}><sphereGeometry args={[0.64, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#facc15" roughness={0.35} /></mesh>
      <mesh position={[0, 2.76, 0]}><cylinderGeometry args={[0.92, 0.95, 0.09, 28]} /><meshStandardMaterial color="#eab308" roughness={0.4} /></mesh>
      <mesh position={[0, 2.85, 0.55]}><boxGeometry args={[0.34, 0.24, 0.06]} /><meshStandardMaterial color="#dc2626" /></mesh>
      <mesh position={[0, 2.85, 0.59]}><boxGeometry args={[0.2, 0.1, 0.02]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.6} /></mesh>
      {/* 헤드랜턴 */}
      <mesh position={[0.3, 3.0, 0.35]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#fef9c3" emissive="#fef08a" emissiveIntensity={1} /></mesh>
    </group>
  );
}

export function Police(props: HeroProps) {
  return (
    <group>
      <Body {...props} uniform="#2563eb" stripe="#93c5fd" />
      {/* 경찰 모자 */}
      <mesh position={[0, 2.82, 0]}><cylinderGeometry args={[0.5, 0.56, 0.32, 24]} /><meshStandardMaterial color="#1e3a8a" roughness={0.5} /></mesh>
      <mesh position={[0, 2.68, 0.12]}><boxGeometry args={[1.0, 0.09, 0.62]} /><meshStandardMaterial color="#020617" roughness={0.3} /></mesh>
      <mesh position={[0, 2.84, 0.5]}><cylinderGeometry args={[0.12, 0.12, 0.05, 16]} /><meshStandardMaterial color="#facc15" metalness={0.7} roughness={0.25} /></mesh>
      {/* 어깨 견장 */}
      <mesh position={[-0.62, 1.86, 0]}><boxGeometry args={[0.28, 0.08, 0.3]} /><meshStandardMaterial color="#facc15" /></mesh>
      <mesh position={[0.62, 1.86, 0]}><boxGeometry args={[0.28, 0.08, 0.3]} /><meshStandardMaterial color="#facc15" /></mesh>
      {/* 넥타이 */}
      <mesh position={[0, 1.62, 0.6]}><boxGeometry args={[0.16, 0.4, 0.04]} /><meshStandardMaterial color="#020617" /></mesh>
    </group>
  );
}
