"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Police } from "./Characters";
import { speak } from "./tts";

const LANES = [1, 2, 3, 4, 5]; // z 행, 0 출발 · 6 도착
const GOAL_ROW = 6;
const ROUNDS = 3;

interface CarData {
  lane: number;
  x: number;
  speed: number;
  dir: 1 | -1;
  color: string;
}

const CAR_COLORS = ["#ef4444", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"];

function Traffic({
  cars,
  light,
  onHit,
  hitGuard,
}: {
  cars: React.RefObject<CarData[]>;
  light: React.RefObject<"red" | "green">;
  onHit: () => void;
  hitGuard: React.RefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }, dt) => {
    const d = Math.min(dt, 0.05);
    if (!group.current) return;
    const stop = light.current === "red" ? 0 : 1;
    cars.current.forEach((c, i) => {
      c.x += c.dir * c.speed * stop * d;
      if (c.x > 13) c.x = -13;
      if (c.x < -13) c.x = 13;
      const mesh = group.current!.children[i];
      if (mesh) mesh.position.x = c.x;
    });
    void clock;
  });

  return (
    <group ref={group}>
      {cars.current.map((c, i) => (
        <CarMesh key={i} lane={c.lane} x={c.x} dir={c.dir} color={c.color} />
      ))}
    </group>
  );
}

function CarMesh({ lane, x, dir, color }: { lane: number; x: number; dir: 1 | -1; color: string }) {
  return (
    <group position={[x, 0, laneToZ(lane)]} rotation={[0, dir === 1 ? 0 : Math.PI, 0]}>
      <mesh position={[0, 0.45, 0]}><boxGeometry args={[2.2, 0.6, 1.1]} /><meshStandardMaterial color={color} roughness={0.4} /></mesh>
      <mesh position={[-0.1, 1, 0]}><boxGeometry args={[1.2, 0.55, 1]} /><meshStandardMaterial color="#e2e8f0" roughness={0.3} /></mesh>
      {[[-0.7, 0.55], [0.7, 0.55], [-0.7, -0.55], [0.7, -0.55]].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.3, wz]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 14]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      ))}
      <mesh position={[dir === 1 ? 1.12 : -1.12, 0.5, 0.3]}><boxGeometry args={[0.06, 0.2, 0.25]} /><meshStandardMaterial color="#fef9c3" emissive="#fde047" emissiveIntensity={1} /></mesh>
      <mesh position={[dir === 1 ? 1.12 : -1.12, 0.5, -0.3]}><boxGeometry args={[0.06, 0.2, 0.25]} /><meshStandardMaterial color="#fef9c3" emissive="#fde047" emissiveIntensity={1} /></mesh>
    </group>
  );
}

const laneToZ = (row: number) => 4 - row * 1.6;

function Player({
  pos,
  walking,
  wave,
}: {
  pos: React.RefObject<{ col: number; row: number }>;
  walking: React.RefObject<number>;
  wave: React.RefObject<boolean>;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const tx = pos.current.col * 1.6;
    const tz = laneToZ(pos.current.row);
    ref.current.position.x += (tx - ref.current.position.x) * 0.2;
    ref.current.position.z += (tz - ref.current.position.z) * 0.2;
  });
  return (
    <group ref={ref} position={[0, 0, laneToZ(0)]}>
      <Walker pos={pos} walking={walking} wave={wave} />
    </group>
  );
}

function Walker({
  pos: _pos,
  walking,
  wave,
}: {
  pos: React.RefObject<{ col: number; row: number }>;
  walking: React.RefObject<number>;
  wave: React.RefObject<boolean>;
}) {
  const [w, setW] = useState(0);
  const [wv, setWv] = useState(false);
  useFrame(() => {
    setW(walking.current);
    setWv(wave.current);
  });
  return <Police walk={w} wave={wv} />;
}

export function CrossGame({ onFinish }: { onFinish: (stars: number, won: boolean) => void }) {
  const [lives, setLives] = useState(3);
  const [round, setRound] = useState(1);
  const [light, setLight] = useState<"red" | "green">("green");
  const pos = useRef({ col: 0, row: 0 });
  const walking = useRef(0);
  const wave = useRef(false);
  const cars = useRef<CarData[]>([]);
  const lightRef = useRef<"red" | "green">("green");
  const hitGuard = useRef(0);
  const livesRef = useRef(3);
  const roundRef = useRef(1);
  const doneRef = useRef(false);
  const [, setTick] = useState(0);

  const buildCars = (roundN: number) => {
    const list: CarData[] = [];
    LANES.forEach((lane, li) => {
      const n = 2 + Math.min(2, roundN);
      for (let i = 0; i < n; i++) {
        list.push({
          lane,
          x: -12 + ((24 / n) * i + li * 3) % 24,
          speed: 3 + roundN * 1.2 + li * 0.5,
          dir: li % 2 === 0 ? 1 : -1,
          color: CAR_COLORS[(li + i) % CAR_COLORS.length],
        });
      }
    });
    cars.current = list;
  };

  useEffect(() => {
    buildCars(1);
    setTick((v) => v + 1);
    const sig = setInterval(() => {
      setLight((l) => {
        const n = l === "green" ? "red" : "green";
        lightRef.current = n;
        return n;
      });
    }, 6000);
    const watch = setInterval(() => {
      if (doneRef.current) return;
      const p = pos.current;
      const now = Date.now();
      // 충돌
      const hit = cars.current.some(
        (c) => c.lane === p.row && Math.abs(c.x - p.col * 1.6) < 1.1,
      );
      if (hit && now - hitGuard.current > 1200) {
        hitGuard.current = now;
        walking.current = 0;
        const left = livesRef.current - 1;
        livesRef.current = left;
        setLives(left);
        if (left <= 0) {
          doneRef.current = true;
          clearInterval(watch);
          clearInterval(sig);
          speak("아이고! 차에 닿았어요. 신호를 보고 다시 건너봐요.");
          setTimeout(() => onFinish(1, false), 1800);
        } else {
          speak("조심! 차가 와요. 좌우를 살피고 건너요.");
          pos.current = { col: 0, row: 0 };
        }
      }
      // 도착
      if (p.row >= GOAL_ROW && now - hitGuard.current > 500) {
        hitGuard.current = now;
        const r = roundRef.current;
        if (r >= ROUNDS) {
          doneRef.current = true;
          wave.current = true;
          clearInterval(watch);
          clearInterval(sig);
          const stars = livesRef.current >= 3 ? 3 : livesRef.current === 2 ? 2 : 1;
          speak("세 번 다 건넜어요! 훌륭한 안전히어로!");
          setTimeout(() => onFinish(stars, true), 1800);
        } else {
          roundRef.current = r + 1;
          setRound(r + 1);
          buildCars(r + 1);
          speak(`${r + 1}번째! 차가 더 빨라졌어요!`);
          pos.current = { col: 0, row: 0 };
        }
      }
    }, 150);
    return () => {
      clearInterval(watch);
      clearInterval(sig);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (doneRef.current) return;
      const k = e.key;
      const step = () => {
        walking.current = 1;
        setTimeout(() => (walking.current = 0), 250);
      };
      if (k === "ArrowUp") {
        pos.current.row = Math.min(GOAL_ROW, pos.current.row + 1);
        step();
      } else if (k === "ArrowDown") {
        pos.current.row = Math.max(0, pos.current.row - 1);
        step();
      } else if (k === "ArrowLeft") {
        pos.current.col = Math.max(-3, pos.current.col - 1);
        step();
      } else if (k === "ArrowRight") {
        pos.current.col = Math.min(3, pos.current.col + 1);
        step();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const move = (dc: number, dr: number) => {
    if (doneRef.current) return;
    pos.current.col = Math.max(-3, Math.min(3, pos.current.col + dc));
    pos.current.row = Math.max(0, Math.min(GOAL_ROW, pos.current.row + dr));
    walking.current = 1;
    setTimeout(() => (walking.current = 0), 250);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <span style={pill}>❤️ {lives}</span>
        <span style={pill}>🚸 {round} / {ROUNDS}</span>
        <span style={pill}>{light === "red" ? "🔴 빨간불엔 대기" : "🟢 차 조심!"}</span>
      </div>
      <div className="scene-wrap" style={{ height: "52vh" }}>
        <Canvas camera={{ position: [0, 10, 7], fov: 50 }}>
          <color attach="background" args={["#bae6fd"]} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[5, 10, 5]} intensity={1.2} />
          <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[26, 16]} /><meshStandardMaterial color="#475569" /></mesh>
          {/* 횡단보도 줄무늬 */}
          {[-2.4, -0.8, 0.8, 2.4].map((x) => (
            <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, -1.5]}>
              <planeGeometry args={[0.8, 12]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          ))}
          {/* 출발·도착 존 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, laneToZ(0)]}>
            <planeGeometry args={[12, 1.4]} /><meshStandardMaterial color="#bbf7d0" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, laneToZ(GOAL_ROW)]}>
            <planeGeometry args={[12, 1.4]} /><meshStandardMaterial color="#fde68a" />
          </mesh>
          <Traffic cars={cars} light={lightRef} onHit={() => {}} hitGuard={hitGuard} />
          <Player pos={pos} walking={walking} wave={wave} />
        </Canvas>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
        <span />
        <button className="big-btn" onClick={() => move(0, 1)}>▲</button>
        <span />
        <button className="big-btn" onClick={() => move(-1, 0)}>◀</button>
        <button className="big-btn" onClick={() => move(0, -1)}>▼</button>
        <button className="big-btn" onClick={() => move(1, 0)}>▶</button>
      </div>
      <p style={{ fontSize: 18 }}>빨간불엔 차가 멈춰요. 차를 피해서 노란 구역까지 세 번 건너세요!</p>
    </div>
  );
}

const pill: React.CSSProperties = {
  fontSize: 20,
  background: "#fff",
  borderRadius: 999,
  padding: "8px 16px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
};
