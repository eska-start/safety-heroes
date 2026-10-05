"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Firefighter } from "./Characters";
import { speak } from "./tts";

const DURATION = 60;
const PASS_SCORE = 10;

interface FireData {
  id: number;
  x: number;
  z: number;
  hp: number;
  max: number;
  dead: boolean;
  out: boolean;
}

function FireMesh({ data, onOut }: { data: FireData; onOut: (id: number) => void }) {
  const flame = useRef<THREE.Mesh>(null);
  const smoke = useRef<THREE.Mesh>(null);
  const outRef = useRef(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + data.id;
    const k = Math.max(0, data.hp / data.max);
    if (flame.current) {
      flame.current.scale.set(0.6 + k * 0.9 + Math.sin(t * 11) * 0.1 * k, 0.5 + k * 1.1, 0.6 + k * 0.9);
      const m = flame.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.4 + k * 1.2;
    }
    if (smoke.current) {
      smoke.current.position.y = 2.2 + Math.sin(t * 2) * 0.2;
      (smoke.current.material as THREE.MeshStandardMaterial).opacity = 0.25 + k * 0.3;
    }
    if (data.hp <= 0 && !outRef.current) {
      outRef.current = true;
      onOut(data.id);
    }
  });

  return (
    <group position={[data.x, 0, data.z]}>
      <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.8, 1, 0.5, 14]} /><meshStandardMaterial color="#44403c" /></mesh>
      <mesh ref={flame} position={[0, 1.1, 0]}>
        <coneGeometry args={[0.75, 1.8, 12]} />
        <meshStandardMaterial color="#fb923c" emissive="#ea580c" emissiveIntensity={1.4} transparent opacity={0.95} />
      </mesh>
      <mesh ref={smoke} position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshStandardMaterial color="#57534e" transparent opacity={0.4} />
      </mesh>
      <pointLight position={[0, 1.6, 0]} intensity={6} distance={9} color="#fb923c" />
    </group>
  );
}

function WaterJet({ from, target, active }: { from: THREE.Vector3; target: React.RefObject<THREE.Vector3>; active: React.RefObject<boolean> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const drops = useRef<THREE.Points>(null);

  const positions = useMemo(() => new Float32Array(60 * 3), []);

  useFrame(() => {
    if (!mesh.current || !drops.current) return;
    const show = active.current;
    mesh.current.visible = show;
    drops.current.visible = show;
    if (!show) return;
    const dir = target.current.clone().sub(from);
    const len = dir.length();
    mesh.current.position.copy(from).addScaledVector(dir, 0.5);
    mesh.current.lookAt(target.current);
    mesh.current.scale.set(1, 1, len);
    const pos = drops.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < 60; i++) {
      const f = Math.random();
      pos.setXYZ(
        i,
        from.x + dir.x * f + (Math.random() - 0.5) * 0.5,
        from.y + dir.y * f + (Math.random() - 0.5) * 0.5,
        from.z + dir.z * f + (Math.random() - 0.5) * 0.5,
      );
    }
    pos.needsUpdate = true;
  });

  return (
    <group>
      <mesh ref={mesh}>
        <cylinderGeometry args={[0.12, 0.2, 1, 8]} />
        <meshStandardMaterial color="#7dd3fc" transparent opacity={0.8} />
      </mesh>
      <points ref={drops}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#bae6fd" size={0.18} transparent opacity={0.9} />
      </points>
    </group>
  );
}

function Street() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {[-6, -2, 2, 6].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, 0]}>
          <planeGeometry args={[0.25, 24]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
      ))}
      {/* 건물 */}
      {[[-9, -7], [9, -7], [-9, 6], [9, 6]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 2.5, 0]}><boxGeometry args={[5, 5, 5]} /><meshStandardMaterial color={i % 2 ? "#64748b" : "#94a3b8"} /></mesh>
          {[0, 1, 2].map((r) =>
            [-1.2, 0, 1.2].map((c) => (
              <mesh key={`${r}${c}`} position={[c, 1.5 + r * 1.2, 2.55]}>
                <planeGeometry args={[0.8, 0.8]} />
                <meshStandardMaterial color="#fef9c3" emissive="#fde047" emissiveIntensity={0.5} />
              </mesh>
            )),
          )}
        </group>
      ))}
    </group>
  );
}

export function FireGame({ onFinish }: { onFinish: (score: number) => void }) {
  const [fires, setFires] = useState<FireData[]>([]);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const firesRef = useRef<FireData[]>([]);
  const aim = useRef(new THREE.Vector3(0, 0.5, -2));
  const spraying = useRef(false);
  const nozzle = useMemo(() => new THREE.Vector3(0.5, 1.6, 3.4), []);
  const idRef = useRef(1);
  const doneRef = useRef(false);

  const spawn = (list: FireData[]) => {
    if (list.filter((f) => !f.dead).length >= 6) return list;
    const f: FireData = {
      id: idRef.current++,
      x: (Math.random() - 0.5) * 14,
      z: -8 + Math.random() * 9,
      hp: 100,
      max: 100,
      dead: false,
      out: false,
    };
    return [...list, f];
  };

  useEffect(() => {
    let list: FireData[] = [spawn([])[0]].filter(Boolean) as FireData[];
    firesRef.current = list;
    setFires([...list]);
    const spawner = setInterval(() => {
      list = spawn(list);
      firesRef.current = list;
      setFires([...list]);
    }, 1400);
    const timer = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(timer);
          clearInterval(spawner);
          if (!doneRef.current) {
            doneRef.current = true;
            const s = firesRef.current.filter((f) => f.out).length;
            speak(s >= PASS_SCORE ? `불을 ${s}개 껐어요! 훌륭한 소방관이에요!` : `불을 ${s}개 껐어요. 한 번 더 도전해 봐요!`);
            setTimeout(() => onFinish(s), 1800);
          }
          return 0;
        }
        if (v === 11) speak("10초 남았어요! 힘내요!");
        return v - 1;
      });
    }, 1000);
    return () => {
      clearInterval(timer);
      clearInterval(spawner);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 물 데미지 루프
  useEffect(() => {
    const dmg = setInterval(() => {
      if (!spraying.current) return;
      let changed = false;
      for (const f of firesRef.current) {
        if (f.dead) continue;
        const d = Math.hypot(f.x - aim.current.x, f.z - aim.current.z);
        if (d < 1.4) {
          f.hp -= 14;
          changed = true;
        }
      }
      if (changed) setFires([...firesRef.current]);
    }, 100);
    return () => clearInterval(dmg);
  }, []);

  const handleOut = (id: number) => {
    const f = firesRef.current.find((x) => x.id === id);
    if (!f || f.dead) return;
    f.dead = true;
    f.out = true;
    setScore((s) => {
      const n = s + 1;
      if (n === PASS_SCORE) speak("목표 달성! 정말 잘하고 있어요!");
      return n;
    });
    setTimeout(() => {
      firesRef.current = firesRef.current.filter((x) => x.id !== id);
      setFires([...firesRef.current]);
    }, 400);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <span style={pill}>🔥 끈 불 {score}개</span>
        <span style={pill}>⏱ {left}초</span>
        <span style={pill}>🎯 목표 {PASS_SCORE}개</span>
      </div>
      <div
        className="scene-wrap"
        style={{ height: "60vh", touchAction: "none", cursor: "crosshair" }}
        onPointerDown={() => (spraying.current = true)}
        onPointerUp={() => (spraying.current = false)}
        onPointerLeave={() => (spraying.current = false)}
      >
        <Canvas camera={{ position: [0, 5.5, 8.5], fov: 55 }}>
          <color attach="background" args={["#0f172a"]} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 8, 5]} intensity={1} />
          <Street />
          <group position={[0, 0, 4.2]}>
            <Firefighter wave={spraying.current} />
          </group>
          {fires.map((f) => (
            <FireMesh key={f.id} data={f} onOut={handleOut} />
          ))}
          <WaterJet from={nozzle} target={aim} active={spraying} />
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.02, 0]}
            onPointerMove={(e) => aim.current.copy(e.point)}
            onPointerDown={(e) => {
              aim.current.copy(e.point);
              spraying.current = true;
            }}
            onPointerUp={() => (spraying.current = false)}
          >
            <planeGeometry args={[26, 26]} />
            <meshBasicMaterial visible={false} />
          </mesh>
          {/* 조준점 */}
          <AimMarker aim={aim} spraying={spraying} />
        </Canvas>
      </div>
      <p style={{ fontSize: 18 }}>불을 누르고 있으면 물이 나가요. 불을 향해 조준하세요!</p>
    </div>
  );
}

function AimMarker({ aim, spraying }: { aim: React.RefObject<THREE.Vector3>; spraying: React.RefObject<boolean> }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.copy(aim.current).add(new THREE.Vector3(0, 0.1, 0));
    (ref.current.material as THREE.MeshBasicMaterial).color.set(spraying.current ? "#22d3ee" : "#fff");
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.3, 0.45, 24]} />
      <meshBasicMaterial color="#fff" transparent opacity={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}

const pill: React.CSSProperties = {
  fontSize: 20,
  background: "#fff",
  borderRadius: 999,
  padding: "8px 16px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
};
