"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Firefighter, Police } from "./Characters";
import type { Lesson } from "./lessons";

function Fire(props: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) ref.current.scale.setScalar(1 + Math.sin(t * 8) * 0.12);
  });
  return (
    <group position={props.position}>
      <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.7, 0.9, 0.4, 12]} /><meshStandardMaterial color="#57534e" /></mesh>
      <mesh ref={ref} position={[0, 1.4, 0]}><coneGeometry args={[0.7, 1.6, 12]} /><meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={0.8} /></mesh>
      <pointLight position={[0, 2, 0]} intensity={8} distance={10} color="#fb923c" />
    </group>
  );
}

function TrafficLight(props: { position: [number, number, number]; green: boolean }) {
  return (
    <group position={props.position}>
      <mesh position={[0, 1, 0]}><boxGeometry args={[0.3, 2, 0.3]} /><meshStandardMaterial color="#334155" /></mesh>
      <mesh position={[0, 2.4, 0]}><boxGeometry args={[0.8, 1.6, 0.6]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <mesh position={[0, 2.8, 0.32]}><sphereGeometry args={[0.22, 16, 16]} /><meshStandardMaterial color={props.green ? "#334155" : "#ef4444"} emissive={props.green ? "#000" : "#ef4444"} emissiveIntensity={1} /></mesh>
      <mesh position={[0, 2.0, 0.32]}><sphereGeometry args={[0.22, 16, 16]} /><meshStandardMaterial color={props.green ? "#22c55e" : "#334155"} emissive={props.green ? "#22c55e" : "#000"} emissiveIntensity={1} /></mesh>
    </group>
  );
}

function Crosswalk() {
  return (
    <group position={[0, 0.01, 2.5]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[(i - 2) * 1.1, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.6, 2.4]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
      ))}
    </group>
  );
}

function Bouncy({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) ref.current.position.y = Math.sin(t * 2) * 0.08;
  });
  return <group ref={ref}>{children}</group>;
}

export function Scene3D({ lesson }: { lesson: Lesson }) {
  const showFire = lesson.id.startsWith("fire");
  const showTraffic = lesson.id.startsWith("police");
  const green = lesson.id === "police-light" ? false : true;
  return (
    <Canvas camera={{ position: [0, 3.4, 7.5], fov: 50 }}>
      <color attach="background" args={["#bfe3ff"]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      {/* 땅 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color={showFire ? "#fde68a" : "#bbf7d0"} />
      </mesh>
      <Bouncy>
        <group position={[-1.2, 0, 0]}>
          {lesson.role === "fire" ? <Firefighter /> : <Police />}
        </group>
      </Bouncy>
      {showFire && <Fire position={[2.2, 0, 0.5]} />}
      {showTraffic && (
        <>
          <TrafficLight position={[2.4, 0, -1]} green={green} />
          <Crosswalk />
        </>
      )}
      {/* 119 전화기 */}
      {lesson.id === "fire-119" && (
        <group position={[2.2, 0.8, 0.5]}>
          <mesh><boxGeometry args={[0.7, 1, 0.3]} /><meshStandardMaterial color="#0ea5e9" /></mesh>
          <mesh position={[0, 0.15, 0.17]}><boxGeometry args={[0.5, 0.4, 0.02]} /><meshBasicMaterial color="#fff" /></mesh>
        </group>
      )}
    </Canvas>
  );
}
