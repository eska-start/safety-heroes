"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Firefighter, Police } from "./Characters";
import type { Place } from "./storage";

function Label({ x, y, z, title, sub, stars, onGo }: {
  x: number; y: number; z: number; title: string; sub: string; stars: number; onGo: () => void;
}) {
  return (
    <Html position={[x, y, z]} center zIndexRange={[20, 0]}>
      <button className="map-label" onClick={onGo}>
        <span className="map-title">{title}</span>
        <span className="map-sub">{sub}</span>
        {stars > 0 && <span className="map-stars">{"★".repeat(stars)}</span>}
      </button>
    </Html>
  );
}

function Clickable({ children, onGo, position }: { children: React.ReactNode; onGo: () => void; position: [number, number, number] }) {
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onGo();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {children}
    </group>
  );
}

function FireStation({ onGo, stars }: { onGo: () => void; stars: number }) {
  return (
    <Clickable position={[-8, 0, -6]} onGo={onGo}>
      <mesh position={[0, 2, 0]}><boxGeometry args={[7, 4, 6]} /><meshStandardMaterial color="#ef4444" roughness={0.6} /></mesh>
      <mesh position={[0, 4.6, 0]}><boxGeometry args={[7.6, 0.7, 6.6]} /><meshStandardMaterial color="#991b1b" /></mesh>
      <mesh position={[-1.6, 1.2, 3.02]}><boxGeometry args={[2.4, 2.4, 0.1]} /><meshStandardMaterial color="#7f1d1d" /></mesh>
      <mesh position={[1.6, 1.2, 3.02]}><boxGeometry args={[2.4, 2.4, 0.1]} /><meshStandardMaterial color="#7f1d1d" /></mesh>
      <mesh position={[-2.2, 6, -1]}><boxGeometry args={[1.4, 4, 1.4]} /><meshStandardMaterial color="#fca5a5" /></mesh>
      <mesh position={[-2.2, 8.2, -1]}><boxGeometry args={[1.8, 0.5, 1.8]} /><meshStandardMaterial color="#991b1b" /></mesh>
      <Label x={0} y={9.6} z={0} title="소방서" sub="불 끄기" stars={stars} onGo={onGo} />
    </Clickable>
  );
}

function PoliceStation({ onGo, stars }: { onGo: () => void; stars: number }) {
  return (
    <Clickable position={[8, 0, -6]} onGo={onGo}>
      <mesh position={[0, 2, 0]}><boxGeometry args={[7, 4, 6]} /><meshStandardMaterial color="#3b82f6" roughness={0.6} /></mesh>
      <mesh position={[0, 4.6, 0]}><boxGeometry args={[7.6, 0.7, 6.6]} /><meshStandardMaterial color="#1e3a8a" /></mesh>
      <mesh position={[0, 1.4, 3.02]}><boxGeometry args={[2.2, 2.8, 0.1]} /><meshStandardMaterial color="#1e3a8a" /></mesh>
      <mesh position={[-2.2, 2.4, 3.02]}><boxGeometry args={[1.6, 1.4, 0.1]} /><meshStandardMaterial color="#bfdbfe" emissive="#bfdbfe" emissiveIntensity={0.3} /></mesh>
      <mesh position={[2.2, 2.4, 3.02]}><boxGeometry args={[1.6, 1.4, 0.1]} /><meshStandardMaterial color="#bfdbfe" emissive="#bfdbfe" emissiveIntensity={0.3} /></mesh>
      <mesh position={[0, 5.6, 0]}><cylinderGeometry args={[0.5, 0.5, 0.2, 16]} /><meshStandardMaterial color="#facc15" metalness={0.6} roughness={0.3} /></mesh>
      <Label x={0} y={7.4} z={0} title="경찰서" sub="횡단보도" stars={stars} onGo={onGo} />
    </Clickable>
  );
}

function School({ onGo, stars }: { onGo: () => void; stars: number }) {
  return (
    <Clickable position={[8, 0, 7]} onGo={onGo}>
      <mesh position={[0, 2, 0]}><boxGeometry args={[7, 4, 6]} /><meshStandardMaterial color="#fbbf24" roughness={0.6} /></mesh>
      <mesh position={[0, 4.4, 0]}><cylinderGeometry args={[0.2, 4.6, 1.6, 4]} /><meshStandardMaterial color="#b45309" /></mesh>
      <mesh position={[0, 5.6, 0]}><cylinderGeometry args={[0.9, 0.9, 0.3, 20]} /><meshStandardMaterial color="#fff" /></mesh>
      <mesh position={[-2, 2.2, 3.02]}><boxGeometry args={[1.4, 1.4, 0.1]} /><meshStandardMaterial color="#fef3c7" emissive="#fde047" emissiveIntensity={0.3} /></mesh>
      <mesh position={[0.4, 2.2, 3.02]}><boxGeometry args={[1.4, 1.4, 0.1]} /><meshStandardMaterial color="#fef3c7" emissive="#fde047" emissiveIntensity={0.3} /></mesh>
      <mesh position={[2.6, 2.2, 3.02]}><boxGeometry args={[1.4, 1.4, 0.1]} /><meshStandardMaterial color="#fef3c7" emissive="#fde047" emissiveIntensity={0.3} /></mesh>
      <Label x={0} y={7.6} z={0} title="학교 앞" sub="좋은 어른 찾기" stars={stars} onGo={onGo} />
    </Clickable>
  );
}

function House({ onGo, stars }: { onGo: () => void; stars: number }) {
  const smoke = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!smoke.current) return;
    const t = clock.getElapsedTime();
    smoke.current.children.forEach((c, i) => {
      c.position.y = 1 + ((t * 0.7 + i * 0.8) % 2.4);
      (c as THREE.Mesh).scale.setScalar(0.7 + ((t * 0.7 + i * 0.8) % 2.4) * 0.4);
    });
  });
  return (
    <Clickable position={[-8, 0, 7]} onGo={onGo}>
      <mesh position={[0, 1.5, 0]}><boxGeometry args={[5.5, 3, 5]} /><meshStandardMaterial color="#fde68a" roughness={0.7} /></mesh>
      <mesh position={[0, 3.9, 0]}><coneGeometry args={[4.4, 2.4, 4]} /><meshStandardMaterial color="#b45309" roughness={0.7} /></mesh>
      <mesh position={[0, 1.1, 2.52]}><boxGeometry args={[1.2, 2, 0.1]} /><meshStandardMaterial color="#92400e" /></mesh>
      <mesh position={[-1.7, 1.6, 2.52]}><boxGeometry args={[1, 1, 0.1]} /><meshStandardMaterial color="#bfdbfe" emissive="#bfdbfe" emissiveIntensity={0.3} /></mesh>
      <mesh position={[1.5, 4.6, -1]}><boxGeometry args={[0.5, 1.6, 0.5]} /><meshStandardMaterial color="#78716c" /></mesh>
      <group ref={smoke} position={[1.5, 5.2, -1]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 1 + i * 0.8, 0]}>
            <sphereGeometry args={[0.35, 10, 10]} />
            <meshStandardMaterial color="#e7e5e4" transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
      <Label x={0} y={7.6} z={0} title="우리집" sub="위험 찾기" stars={stars} onGo={onGo} />
    </Clickable>
  );
}

function Car({ color, z, speed, offset }: { color: string; z: number; speed: number; offset: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed + offset;
    ref.current.position.x = ((t % 44) + 44) % 44 - 22;
  });
  return (
    <group ref={ref} position={[0, 0, z]}>
      <mesh position={[0, 0.55, 0]}><boxGeometry args={[2.4, 0.7, 1.2]} /><meshStandardMaterial color={color} roughness={0.4} /></mesh>
      <mesh position={[-0.1, 1.1, 0]}><boxGeometry args={[1.3, 0.6, 1.1]} /><meshStandardMaterial color="#e2e8f0" roughness={0.3} /></mesh>
      {[[-0.75], [0.75]].map(([wx], i) => (
        <mesh key={i} position={[wx, 0.32, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.2, 14]} /><meshStandardMaterial color="#0f172a" />
        </mesh>
      ))}
      {[[-0.75], [0.75]].map(([wx], i) => (
        <mesh key={`b${i}`} position={[wx, 0.32, -0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.2, 14]} /><meshStandardMaterial color="#0f172a" />
        </mesh>
      ))}
    </group>
  );
}

function Tree({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.8, 0]}><cylinderGeometry args={[0.25, 0.35, 1.6, 10]} /><meshStandardMaterial color="#92400e" /></mesh>
      <mesh position={[0, 2.4, 0]}><coneGeometry args={[1.4, 2.6, 10]} /><meshStandardMaterial color="#22c55e" roughness={0.7} /></mesh>
      <mesh position={[0, 3.6, 0]}><coneGeometry args={[1, 1.8, 10]} /><meshStandardMaterial color="#4ade80" roughness={0.7} /></mesh>
    </group>
  );
}

function Lamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.4, 0]}><cylinderGeometry args={[0.12, 0.16, 4.8, 8]} /><meshStandardMaterial color="#334155" /></mesh>
      <mesh position={[0, 4.9, 0]}><sphereGeometry args={[0.35, 12, 12]} /><meshStandardMaterial color="#fef9c3" emissive="#fde047" emissiveIntensity={1} /></mesh>
      <pointLight position={[0, 4.9, 0]} intensity={4} distance={10} color="#fde68a" />
    </group>
  );
}

function Clouds() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 0.15;
    ref.current.children.forEach((c, i) => {
      c.position.x = -18 + ((i * 13 + t * (2 + i)) % 38);
    });
  });
  return (
    <group ref={ref} position={[0, 13, -8]}>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, (i % 2) * 2, -i * 2]}>
          <mesh><sphereGeometry args={[1.6, 14, 14]} /><meshStandardMaterial color="#fff" transparent opacity={0.92} /></mesh>
          <mesh position={[1.5, -0.3, 0]}><sphereGeometry args={[1.1, 12, 12]} /><meshStandardMaterial color="#fff" transparent opacity={0.92} /></mesh>
          <mesh position={[-1.5, -0.3, 0]}><sphereGeometry args={[1.1, 12, 12]} /><meshStandardMaterial color="#fff" transparent opacity={0.92} /></mesh>
        </group>
      ))}
    </group>
  );
}

function Sway() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime() * 0.12;
    camera.position.x = Math.sin(t) * 2.5;
    camera.lookAt(0, 2, 0);
  });
  return null;
}

export function Village3D({ stars, onGo }: { stars: Record<Place, number>; onGo: (p: Place) => void }) {
  return (
    <Canvas camera={{ position: [0, 15, 21], fov: 50 }}>
      <color attach="background" args={["#7dd3fc"]} />
      <fog attach="fog" args={["#7dd3fc", 34, 60]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[8, 14, 8]} intensity={1.4} />
      <Sway />
      <Clouds />
      {/* 대지 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[20, 48]} />
        <meshStandardMaterial color="#4ade80" roughness={0.9} />
      </mesh>
      {/* 도로 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[4.5, 38]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[38, 4.5]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      {/* 중앙 광장 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[3.4, 32]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[2.6, 3, 32]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
      {/* 분수 */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[1.2, 1.4, 0.8, 20]} /><meshStandardMaterial color="#94a3b8" /></mesh>
        <mesh position={[0, 1.6, 0]}><cylinderGeometry args={[0.25, 0.35, 1.6, 12]} /><meshStandardMaterial color="#64748b" /></mesh>
        <mesh position={[0, 2.5, 0]}><sphereGeometry args={[0.5, 14, 14]} /><meshStandardMaterial color="#7dd3fc" transparent opacity={0.85} /></mesh>
      </group>

      <FireStation onGo={() => onGo("fire")} stars={stars.fire} />
      <PoliceStation onGo={() => onGo("police")} stars={stars.police} />
      <School onGo={() => onGo("street")} stars={stars.street} />
      <House onGo={() => onGo("home")} stars={stars.home} />

      {/* 영웅들 */}
      <group position={[-2, 0, 1.5]} rotation={[0, 0.6, 0]}>
        <Firefighter wave />
      </group>
      <group position={[2, 0, 1.5]} rotation={[0, -0.6, 0]}>
        <Police wave />
      </group>

      <Car color="#ef4444" z={1.1} speed={3} offset={0} />
      <Car color="#3b82f6" z={-1.1} speed={2.2} offset={20} />
      <Car color="#f59e0b" z={12} speed={0} offset={0} />

      <Tree x={-13} z={-11} />
      <Tree x={13} z={-11} s={1.2} />
      <Tree x={-13} z={11} s={0.9} />
      <Tree x={13} z={11} />
      <Tree x={0} z={-13} s={1.1} />
      <Lamp x={-3.4} z={-6} />
      <Lamp x={3.4} z={6} />
    </Canvas>
  );
}
