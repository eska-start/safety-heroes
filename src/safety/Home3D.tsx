"use client";
import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { speak } from "./tts";
import { sfxDing, sfxFanfare, sfxHurt } from "./audio";

interface H { id: string; label: string; say: string }

const INFO: Record<string, H> = {
  lighter: { id: "lighter", label: "라이터", say: "라이터를 찾았어요! 라이터와 성냥은 절대 만지지 않아요." },
  outlet: { id: "outlet", label: "콘센트", say: "콘센트를 찾았어요! 젓가락이나 손가락을 넣으면 큰일나요." },
  pot: { id: "pot", label: "뜨거운 냄비", say: "뜨거운 냄비를 찾았어요! 주방에는 어른과 함께 가요." },
  medicine: { id: "medicine", label: "약병", say: "약병을 찾았어요! 약은 사탕이 아니에요. 어른이 주실 때만 먹어요." },
  candle: { id: "candle", label: "촛불", say: "촛불을 찾았어요! 불이 있는 곳에서는 뛰지 않아요." },
};

function Flame({ position, s = 1 }: { position: [number, number, number]; s?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.scale.set(s * (1 + Math.sin(t * 11) * 0.12), s * (1 + Math.cos(t * 9) * 0.1), s);
  });
  return (
    <mesh ref={ref} position={position}>
      <coneGeometry args={[0.16 * s, 0.4 * s, 10]} />
      <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={1.4} />
    </mesh>
  );
}

function Found({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 2;
  });
  return (
    <group ref={ref} position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.09, 10, 28]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.6} />
      </mesh>
      <Html position={[0, 0.8, 0]} center zIndexRange={[20, 0]}>
        <span style={{ fontSize: 30 }}>✅</span>
      </Html>
    </group>
  );
}

function Hazard({ onTap, found, children, tip }: {
  onTap: () => void;
  found: boolean;
  children: React.ReactNode;
  tip: [number, number, number];
}) {
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        if (!found) onTap();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = found ? "auto" : "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {children}
      {found && <Found position={tip} />}
    </group>
  );
}

export function Home3D({ onFinish }: { onFinish: (stars: number) => void }) {
  const [found, setFound] = useState<string[]>([]);
  const [miss, setMiss] = useState(0);
  const [msg, setMsg] = useState("위험한 물건 5개를 찾아 눌러봐!");
  const doneRef = useRef(false);

  const tap = (id: string) => {
    if (doneRef.current || found.includes(id)) return;
    const next = [...found, id];
    setFound(next);
    sfxDing(next.length);
    setMsg(`${INFO[id].label} 발견! (${next.length}/5)`);
    speak(INFO[id].say);
    if (next.length >= 5) {
      doneRef.current = true;
      const stars = miss === 0 ? 3 : miss <= 2 ? 2 : 1;
      sfxFanfare();
      setMsg("5개 다 찾았어요! 우리집 안전왕!");
      setTimeout(() => onFinish(stars), 2300);
    }
  };

  const wrong = () => {
    if (doneRef.current || found.length >= 5) return;
    setMiss((m) => m + 1);
    sfxHurt();
    speak("거긴 안전한 곳이에요. 다른 곳을 찾아봐요.");
  };

  return (
    <div>
      <div className="hud-row">
        <span className="hud-pill">찾음 {found.length}/5</span>
        <span className="hud-pill">😅 {miss}</span>
      </div>
      <p style={{ fontSize: 22 }}>{msg}</p>
      <div className="scene-wrap" style={{ height: "58vh" }}>
        <Canvas camera={{ position: [0, 5.2, 11], fov: 55 }}>
          <color attach="background" args={["#fef3c7"]} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[4, 8, 6]} intensity={1.1} />
          <group onClick={wrong}>
            {/* 바닥·벽 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
              <planeGeometry args={[18, 14]} />
              <meshStandardMaterial color="#d6a05c" />
            </mesh>
            <mesh position={[0, 4, -6]}><planeGeometry args={[18, 8]} /><meshStandardMaterial color="#fde68a" /></mesh>
            <mesh position={[-8, 4, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[14, 8]} /><meshStandardMaterial color="#fcd34d" /></mesh>
            {/* 러그·소파 (안전) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, 0.02, 2.5]}>
              <circleGeometry args={[2.2, 28]} />
              <meshStandardMaterial color="#f472b6" transparent opacity={0.55} />
            </mesh>
            <group position={[4.5, 0, -3.5]}>
              <mesh position={[0, 0.6, 0]}><boxGeometry args={[3.4, 1, 1.6]} /><meshStandardMaterial color="#38bdf8" /></mesh>
              <mesh position={[-1.7, 1.2, 0]}><boxGeometry args={[0.5, 1.4, 1.6]} /><meshStandardMaterial color="#0284c7" /></mesh>
              <mesh position={[1.7, 1.2, 0]}><boxGeometry args={[0.5, 1.4, 1.6]} /><meshStandardMaterial color="#0284c7" /></mesh>
            </group>
            {/* 창문+커튼 */}
            <mesh position={[4, 5, -5.95]}><planeGeometry args={[2.6, 2.6]} /><meshStandardMaterial color="#bfdbfe" /></mesh>
            <mesh position={[2.5, 5, -5.9]}><boxGeometry args={[0.6, 3.4, 0.15]} /><meshStandardMaterial color="#f472b6" /></mesh>
            <mesh position={[5.5, 5, -5.9]}><boxGeometry args={[0.6, 3.4, 0.15]} /><meshStandardMaterial color="#f472b6" /></mesh>
          </group>

          {/* 촛불 */}
          <Hazard onTap={() => tap("candle")} found={found.includes("candle")} tip={[4, 4.2, -5.2]}>
            <group position={[4, 3.2, -5.2]}>
              <mesh position={[0, 0, 0]}><boxGeometry args={[0.7, 0.15, 0.7]} /><meshStandardMaterial color="#92400e" /></mesh>
              <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.12, 0.12, 0.7, 10]} /><meshStandardMaterial color="#fff" /></mesh>
              <Flame position={[0, 0.95, 0]} />
            </group>
          </Hazard>

          {/* 싱크대+냄비 */}
          <group position={[-3.5, 0, -4.5]}>
            <mesh position={[0, 1, 0]}><boxGeometry args={[3.4, 2, 1.6]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
            <mesh position={[0, 2.05, 0]}><boxGeometry args={[3.5, 0.12, 1.7]} /><meshStandardMaterial color="#94a3b8" /></mesh>
            <Hazard onTap={() => tap("pot")} found={found.includes("pot")} tip={[0, 3.2, 0.4]}>
              <group position={[0, 2.1, 0.2]}>
                <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.7, 0.6, 0.6, 16]} /><meshStandardMaterial color="#64748b" metalness={0.4} roughness={0.4} /></mesh>
                <mesh position={[0.95, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.07, 0.07, 0.5, 8]} /><meshStandardMaterial color="#0f172a" /></mesh>
                <Flame position={[-0.4, 0.75, 0]} s={0.8} />
              </group>
            </Hazard>
          </group>

          {/* 식탁 */}
          <group position={[1.5, 0, 1.5]}>
            <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[1.7, 1.7, 0.16, 24]} /><meshStandardMaterial color="#92400e" /></mesh>
            <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.18, 0.24, 1.1, 10]} /><meshStandardMaterial color="#78350a" /></mesh>
            <Hazard onTap={() => tap("lighter")} found={found.includes("lighter")} tip={[0.7, 1.9, 0.3]}>
              <group position={[0.7, 1.18, 0.3]}>
                <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.22, 0.4, 0.14]} /><meshStandardMaterial color="#dc2626" /></mesh>
                <mesh position={[0, 0.45, 0]}><boxGeometry args={[0.1, 0.1, 0.1]} /><meshStandardMaterial color="#9ca3af" metalness={0.6} /></mesh>
              </group>
            </Hazard>
          </group>

          {/* 낮은 탁자+약병 */}
          <group position={[-4.5, 0, 2]}>
            <mesh position={[0, 0.5, 0]}><boxGeometry args={[1.8, 1, 1.2]} /><meshStandardMaterial color="#a16207" /></mesh>
            <Hazard onTap={() => tap("medicine")} found={found.includes("medicine")} tip={[0, 1.9, 0]}>
              <group position={[0, 1, 0]}>
                <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.25, 0.25, 0.6, 12]} /><meshStandardMaterial color="#fff" /></mesh>
                <mesh position={[0, 0.68, 0]}><cylinderGeometry args={[0.16, 0.16, 0.16, 12]} /><meshStandardMaterial color="#ef4444" /></mesh>
                <Html position={[0, 0.3, 0.28]} center zIndexRange={[20, 0]}>
                  <span style={{ color: "#ef4444", fontWeight: 900, fontSize: 22 }}>약</span>
                </Html>
              </group>
            </Hazard>
          </group>

          {/* 콘센트+젓가락 */}
          <Hazard onTap={() => tap("outlet")} found={found.includes("outlet")} tip={[-7.6, 1.4, 1.5]}>
            <group position={[-7.9, 1.2, 1.5]} rotation={[0, Math.PI / 2, 0]}>
              <mesh position={[0, 0, 0]}><boxGeometry args={[0.7, 1, 0.12]} /><meshStandardMaterial color="#fff" /></mesh>
              <mesh position={[-0.15, 0.1, 0.08]}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#111" /></mesh>
              <mesh position={[0.15, 0.1, 0.08]}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#111" /></mesh>
              <mesh position={[-0.15, 0.7, 0.15]} rotation={[0, 0, 0.3]}><boxGeometry args={[0.09, 0.8, 0.09]} /><meshStandardMaterial color="#b45309" /></mesh>
            </group>
          </Hazard>
        </Canvas>
      </div>
    </div>
  );
}
