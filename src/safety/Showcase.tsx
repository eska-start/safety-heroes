"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Firefighter, Police } from "./Characters";

function Rig() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime() * 0.25;
    camera.position.set(Math.sin(t) * 7.5, 4.2, Math.cos(t) * 7.5);
    camera.lookAt(0, 1.6, 0);
  });
  return null;
}

function MiniFire({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime();
      ref.current.scale.setScalar(1 + Math.sin(t * 9) * 0.12);
    }
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.6, 0.75, 0.4, 12]} /><meshStandardMaterial color="#57534e" /></mesh>
      <mesh ref={ref} position={[0, 1, 0]}>
        <coneGeometry args={[0.55, 1.3, 10]} />
        <meshStandardMaterial color="#fb923c" emissive="#ea580c" emissiveIntensity={1.2} />
      </mesh>
      <pointLight position={[0, 1.4, 0]} intensity={5} distance={8} color="#fb923c" />
    </group>
  );
}

export function Showcase() {
  return (
    <Canvas camera={{ position: [0, 4.2, 7.5], fov: 50 }}>
      <color attach="background" args={["#0ea5e9"]} />
      <fog attach="fog" args={["#0ea5e9", 14, 26]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[6, 9, 6]} intensity={1.4} />
      <Rig />
      {/* 광장 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[7.5, 40]} />
        <meshStandardMaterial color="#4ade80" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[3.2, 3.7, 40]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      {/* 히어로 2명 */}
      <group position={[-1.8, 0, 0.5]} rotation={[0, 0.5, 0]}>
        <Firefighter wave />
      </group>
      <group position={[1.8, 0, 0.5]} rotation={[0, -0.5, 0]}>
        <Police wave />
      </group>
      <MiniFire position={[0, 0, -2.8]} />
      {/* 풍선 기둥 */}
      {[[-4.5, "#ef4444"], [4.5, "#3b82f6"]].map(([x, c], i) => (
        <group key={i} position={[x as number, 0, -1]}>
          <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.08, 0.08, 2.4, 8]} /><meshStandardMaterial color="#e2e8f0" /></mesh>
          <mesh position={[0, 2.8, 0]}><sphereGeometry args={[0.55, 16, 16]} /><meshStandardMaterial color={c as string} roughness={0.3} /></mesh>
        </group>
      ))}
    </Canvas>
  );
}
