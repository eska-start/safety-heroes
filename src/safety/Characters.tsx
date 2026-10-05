"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// 통통한 5세 눈높이 캐릭터. 소방관/경찰관 공용 몸통 + 모자만 다르게.
export function HeroBody({ uniform, skin = "#ffd9b3" }: { uniform: string; skin?: string }) {
  const arm = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (arm.current) arm.current.rotation.z = 0.5 + Math.sin(t * 3) * 0.4;
  });
  return (
    <group>
      {/* 다리 */}
      <mesh position={[-0.35, 0.35, 0]}><boxGeometry args={[0.4, 0.7, 0.4]} /><meshStandardMaterial color="#334155" /></mesh>
      <mesh position={[0.35, 0.35, 0]}><boxGeometry args={[0.4, 0.7, 0.4]} /><meshStandardMaterial color="#334155" /></mesh>
      {/* 몸통 */}
      <mesh position={[0, 1.15, 0]}><boxGeometry args={[1.2, 1.1, 0.8]} /><meshStandardMaterial color={uniform} /></mesh>
      {/* 반사띠 (소방관) */}
      <mesh position={[0, 1.15, 0.42]}><boxGeometry args={[1.22, 0.18, 0.02]} /><meshStandardMaterial color="#fde047" /></mesh>
      {/* 팔 */}
      <mesh position={[-0.8, 1.2, 0]}><boxGeometry args={[0.3, 0.9, 0.3]} /><meshStandardMaterial color={uniform} /></mesh>
      <group ref={arm} position={[0.8, 1.6, 0]}>
        <mesh position={[0, -0.4, 0]}><boxGeometry args={[0.3, 0.9, 0.3]} /><meshStandardMaterial color={uniform} /></mesh>
        <mesh position={[0, -0.9, 0]}><sphereGeometry args={[0.22, 16, 16]} /><meshStandardMaterial color={skin} /></mesh>
      </group>
      {/* 얼굴 */}
      <mesh position={[0, 2.15, 0]}><sphereGeometry args={[0.55, 24, 24]} /><meshStandardMaterial color={skin} /></mesh>
      <mesh position={[-0.2, 2.22, 0.5]}><sphereGeometry args={[0.08, 12, 12]} /><meshBasicMaterial color="#111" /></mesh>
      <mesh position={[0.2, 2.22, 0.5]}><sphereGeometry args={[0.08, 12, 12]} /><meshBasicMaterial color="#111" /></mesh>
      <mesh position={[0, 1.95, 0.52]}><boxGeometry args={[0.3, 0.08, 0.02]} /><meshBasicMaterial color="#b45309" /></mesh>
    </group>
  );
}

export function Firefighter() {
  return (
    <group>
      <HeroBody uniform="#dc2626" />
      {/* 소방 헬멧 */}
      <mesh position={[0, 2.55, 0]}><sphereGeometry args={[0.62, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#facc15" /></mesh>
      <mesh position={[0, 2.55, 0]}><cylinderGeometry args={[0.85, 0.85, 0.08, 24]} /><meshStandardMaterial color="#facc15" /></mesh>
      <mesh position={[0, 2.75, 0.45]}><boxGeometry args={[0.3, 0.2, 0.05]} /><meshStandardMaterial color="#dc2626" /></mesh>
    </group>
  );
}

export function Police() {
  return (
    <group>
      <HeroBody uniform="#2563eb" />
      {/* 경찰 모자 */}
      <mesh position={[0, 2.6, 0]}><cylinderGeometry args={[0.5, 0.55, 0.3, 20]} /><meshStandardMaterial color="#1e3a8a" /></mesh>
      <mesh position={[0, 2.48, 0.25]}><boxGeometry args={[0.9, 0.08, 0.5]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <mesh position={[0, 2.62, 0.5]}><boxGeometry args={[0.25, 0.12, 0.03]} /><meshStandardMaterial color="#facc15" /></mesh>
    </group>
  );
}
