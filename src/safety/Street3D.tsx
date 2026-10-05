"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { speak } from "./tts";
import { sfxDing, sfxFanfare, sfxHurt } from "./audio";

type Kind = "police" | "shop" | "candy" | "mask";

const ORDER: { kind: Kind; safe: boolean; line: string; bubble: string }[] = [
  { kind: "police", safe: true, line: "경찰관이에요! 길을 잃으면 도와주세요라고 말해요.", bubble: "길을 잃었니?" },
  { kind: "candy", safe: false, line: "사탕을 준다고 해도 낯선 사람은 따라가면 안돼요!", bubble: "사탕 줄까?" },
  { kind: "shop", safe: true, line: "가게 아주머니예요! 위험할 땐 가게로 들어가 도움을 요청해요.", bubble: "어서 오렴!" },
  { kind: "mask", safe: false, line: "이상한 사람이 말을 걸면 싫어요! 하고 큰 소리로 말해요.", bubble: "이리 오렴…" },
  { kind: "candy", safe: false, line: "또 낯선 사람이에요! 절대 따라가지 않아요.", bubble: "따라올래?" },
  { kind: "shop", safe: true, line: "맞아요! 믿을 수 있는 어른에게 도움을 요청해요.", bubble: "도와줄까?" },
];

function Person3D({ kind }: { kind: Kind }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = Math.abs(Math.sin(t * 2.2)) * 0.08;
    ref.current.rotation.y = Math.sin(t * 0.8) * 0.12;
  });
  const isPolice = kind === "police";
  const isShop = kind === "shop";
  const uniform = isPolice ? "#2563eb" : isShop ? "#16a34a" : "#57534e";
  return (
    <group ref={ref} position={[0, 0, 0]}>
      {/* 다리 */}
      <mesh position={[-0.35, 0.5, 0]}><capsuleGeometry args={[0.22, 0.6, 6, 12]} /><meshStandardMaterial color="#1f2937" /></mesh>
      <mesh position={[0.35, 0.5, 0]}><capsuleGeometry args={[0.22, 0.6, 6, 12]} /><meshStandardMaterial color="#1f2937" /></mesh>
      {/* 몸 */}
      <mesh position={[0, 1.8, 0]}><capsuleGeometry args={[0.85, 0.9, 8, 20]} /><meshStandardMaterial color={uniform} roughness={0.6} /></mesh>
      {/* 팔 */}
      <mesh position={[-1.1, 1.9, 0]}><capsuleGeometry args={[0.2, 0.7, 6, 12]} /><meshStandardMaterial color={uniform} /></mesh>
      <mesh position={[1.1, 1.9, 0]}><capsuleGeometry args={[0.2, 0.7, 6, 12]} /><meshStandardMaterial color={uniform} /></mesh>
      {/* 머리 */}
      <mesh position={[0, 3.2, 0]}><sphereGeometry args={[0.72, 24, 24]} /><meshStandardMaterial color="#ffd9b3" roughness={0.5} /></mesh>
      <mesh position={[-0.26, 3.28, 0.66]}><sphereGeometry args={[0.09, 10, 10]} /><meshBasicMaterial color="#111" /></mesh>
      <mesh position={[0.26, 3.28, 0.66]}><sphereGeometry args={[0.09, 10, 10]} /><meshBasicMaterial color="#111" /></mesh>
      {kind === "mask" ? (
        <>
          <mesh position={[0, 3.3, 0.62]}><boxGeometry args={[0.9, 0.32, 0.1]} /><meshStandardMaterial color="#111827" /></mesh>
          <mesh position={[0, 2.9, 0.68]}><torusGeometry args={[0.16, 0.05, 8, 14, Math.PI]} /><meshStandardMaterial color="#7f1d1d" /></mesh>
        </>
      ) : (
        <mesh position={[0, 2.92, 0.68]}><torusGeometry args={[0.16, 0.05, 8, 14, Math.PI]} /><meshStandardMaterial color="#92400e" />
        </mesh>
      )}
      {isPolice && (
        <>
          <mesh position={[0, 3.85, 0]}><cylinderGeometry args={[0.62, 0.7, 0.4, 20]} /><meshStandardMaterial color="#1e3a8a" /></mesh>
          <mesh position={[0, 3.68, 0.15]}><boxGeometry args={[1.25, 0.1, 0.75]} /><meshStandardMaterial color="#020617" /></mesh>
          <mesh position={[0, 3.87, 0.62]}><cylinderGeometry args={[0.15, 0.15, 0.06, 14]} /><meshStandardMaterial color="#facc15" metalness={0.7} roughness={0.25} /></mesh>
        </>
      )}
      {isShop && (
        <>
          <mesh position={[0, 3.75, 0]}><sphereGeometry args={[0.78, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#f472b6" /></mesh>
          <mesh position={[0, 1.7, 0.72]}><boxGeometry args={[0.9, 1, 0.1]} /><meshStandardMaterial color="#fff" transparent opacity={0.9} /></mesh>
        </>
      )}
      {kind === "candy" && (
        <group position={[1.35, 1.4, 0.3]}>
          <mesh position={[0, -0.3, 0]}><cylinderGeometry args={[0.07, 0.07, 0.7, 8]} /><meshStandardMaterial color="#fff" /></mesh>
          <mesh position={[0, -0.85, 0]}><sphereGeometry args={[0.28, 14, 14]} /><meshStandardMaterial color="#ef4444" roughness={0.3} /></mesh>
          <mesh position={[0, -0.85, 0.2]}><sphereGeometry args={[0.12, 10, 10]} /><meshStandardMaterial color="#fff" /></mesh>
        </group>
      )}
      {kind === "mask" && (
        <mesh position={[0, 3.95, 0]}><cylinderGeometry args={[0.5, 0.62, 0.5, 14]} /><meshStandardMaterial color="#374151" />
        </mesh>
      )}
    </group>
  );
}

function Kid3D() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = Math.abs(Math.sin(clock.getElapsedTime() * 3)) * 0.06;
  });
  return (
    <group ref={ref} position={[2.6, 0, 0.6]} rotation={[0, -0.4, 0]}>
      <mesh position={[-0.25, 0.4, 0]}><capsuleGeometry args={[0.16, 0.45, 6, 10]} /><meshStandardMaterial color="#334155" /></mesh>
      <mesh position={[0.25, 0.4, 0]}><capsuleGeometry args={[0.16, 0.45, 6, 10]} /><meshStandardMaterial color="#334155" /></mesh>
      <mesh position={[0, 1.15, 0]}><capsuleGeometry args={[0.42, 0.4, 6, 14]} /><meshStandardMaterial color="#f472b6" /></mesh>
      <mesh position={[0, 1.95, 0]}><sphereGeometry args={[0.38, 18, 18]} /><meshStandardMaterial color="#ffd9b3" /></mesh>
      <mesh position={[-0.13, 2, 0.34]}><sphereGeometry args={[0.05, 8, 8]} /><meshBasicMaterial color="#111" /></mesh>
      <mesh position={[0.13, 2, 0.34]}><sphereGeometry args={[0.05, 8, 8]} /><meshBasicMaterial color="#111" /></mesh>
      <mesh position={[0, 2.35, 0]}><sphereGeometry args={[0.42, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#facc15" /></mesh>
    </group>
  );
}

export function Street3D({ onFinish }: { onFinish: (stars: number) => void }) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState("이 사람이 말을 걸었어요!");
  const scoreRef = useRef(0);
  const lockRef = useRef(false);
  const cur = ORDER[step];

  useEffect(() => {
    if (step < ORDER.length) speak("이 사람이 말을 걸었어요. 도와달라고 할까요, 싫다고 할까요?");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (!cur) return null;

  const choose = (help: boolean) => {
    if (lockRef.current) return;
    lockRef.current = true;
    const ok = help === cur.safe;
    if (ok) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      sfxDing(scoreRef.current);
      speak(`정답! ${cur.line}`);
      setMsg("정답!");
    } else {
      sfxHurt();
      speak(`땡! ${cur.line}`);
      setMsg("땡! 설명을 들어봐요.");
    }
    setTimeout(() => {
      lockRef.current = false;
      if (step + 1 >= ORDER.length) {
        const n = scoreRef.current;
        const stars = n >= 6 ? 3 : n >= 4 ? 2 : 1;
        sfxFanfare();
        setTimeout(() => onFinish(stars), 1600);
      } else {
        setStep((s) => s + 1);
        setMsg("이 사람이 말을 걸었어요!");
      }
    }, 2000);
  };

  return (
    <div>
      <div className="hud-row">
        <span className="hud-pill">맞춤 {score}/{ORDER.length}</span>
        <span className="hud-pill">🚶 {step + 1}/{ORDER.length}</span>
      </div>
      <p style={{ fontSize: 22 }}>{msg}</p>
      <div className="scene-wrap" style={{ height: "52vh" }}>
        <Canvas camera={{ position: [0, 2.6, 8.5], fov: 50 }}>
          <color attach="background" args={["#bae6fd"]} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[4, 8, 6]} intensity={1.2} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <circleGeometry args={[9, 40]} />
            <meshStandardMaterial color="#86efac" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 1.5]}>
            <planeGeometry args={[10, 3]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <group key={step} position={[-1.2, 0, 0]}>
            <Person3D kind={cur.kind} />
          </group>
          <Kid3D />
          <Html position={[-1.2, 5.2, 0]} center zIndexRange={[20, 0]}>
            <div className="speech">{cur.bubble}</div>
          </Html>
        </Canvas>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <button className="big-btn secondary" onClick={() => choose(true)}>🙏 도와주세요</button>
        <button className="big-btn" onClick={() => choose(false)}>🙅 싫어요!</button>
      </div>
    </div>
  );
}
