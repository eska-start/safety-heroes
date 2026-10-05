"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Firefighter } from "./Characters";
import { speak } from "./tts";
import { isMuted, setMuted, sfxBoss, sfxClick, sfxDing, sfxFanfare, startSpray, stopSpray, unlockAudioSys } from "./audio";

const WAVES = [8, 12, 15];

interface FireData {
  id: number;
  x: number;
  z: number;
  hp: number;
  max: number;
  boss: boolean;
  dead: boolean;
  out: boolean;
}

interface Pop {
  id: number;
  text: string;
  x: number;
  y: number;
}

function FireMesh({ data, onOut }: { data: FireData; onOut: (id: number) => void }) {
  const flame = useRef<THREE.Mesh>(null);
  const smoke = useRef<THREE.Mesh>(null);
  const outRef = useRef(false);
  const s = data.boss ? 1.7 : 1;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + data.id;
    const k = Math.max(0, data.hp / data.max);
    if (flame.current) {
      flame.current.scale.set(
        s * (0.6 + k * 0.9 + Math.sin(t * 11) * 0.1 * k),
        s * (0.5 + k * 1.1),
        s * (0.6 + k * 0.9),
      );
      const m = flame.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.4 + k * 1.2;
    }
    if (smoke.current) {
      smoke.current.position.y = 2.2 * s + Math.sin(t * 2) * 0.2;
      (smoke.current.material as THREE.MeshStandardMaterial).opacity = 0.25 + k * 0.3;
    }
    if (data.hp <= 0 && !outRef.current) {
      outRef.current = true;
      onOut(data.id);
    }
  });

  return (
    <group position={[data.x, 0, data.z]}>
      <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.8 * s, 1 * s, 0.5, 14]} /><meshStandardMaterial color="#44403c" /></mesh>
      <mesh ref={flame} position={[0, 1.1 * s, 0]}>
        <coneGeometry args={[0.75, 1.8, 12]} />
        <meshStandardMaterial color={data.boss ? "#c026d3" : "#fb923c"} emissive={data.boss ? "#a21caf" : "#ea580c"} emissiveIntensity={1.4} transparent opacity={0.95} />
      </mesh>
      <mesh ref={smoke} position={[0, 2.2 * s, 0]}>
        <sphereGeometry args={[0.5 * s, 12, 12]} />
        <meshStandardMaterial color="#57534e" transparent opacity={0.4} />
      </mesh>
      <pointLight position={[0, 1.6, 0]} intensity={6} distance={9} color={data.boss ? "#e879f9" : "#fb923c"} />
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
    const len = Math.max(0.1, dir.length());
    mesh.current.position.copy(from).addScaledVector(dir, 0.5);
    mesh.current.lookAt(target.current);
    mesh.current.scale.set(1, 1, len);
    const pos = drops.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < 60; i++) {
      const f = Math.random();
      pos.setXYZ(
        i,
        from.x + dir.x * f + (Math.random() - 0.5) * 0.6,
        from.y + dir.y * f + (Math.random() - 0.5) * 0.6,
        from.z + dir.z * f + (Math.random() - 0.5) * 0.6,
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

function Shaker({ shake }: { shake: React.RefObject<number> }) {
  useFrame(({ camera }) => {
    if (shake.current > 0.01) {
      camera.position.x += (Math.random() - 0.5) * shake.current * 0.5;
      camera.position.y += (Math.random() - 0.5) * shake.current * 0.5;
      shake.current *= 0.9;
    }
  });
  return null;
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
      {/* 소방차 */}
      <group position={[-4.5, 0, 5.5]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 0.8, 0]}><boxGeometry args={[4.4, 1.4, 2]} /><meshStandardMaterial color="#dc2626" roughness={0.4} /></mesh>
        <mesh position={[-0.4, 1.9, 0]}><boxGeometry args={[1.6, 1, 1.9]} /><meshStandardMaterial color="#fca5a5" roughness={0.3} /></mesh>
        <mesh position={[0, 0.9, 1.02]}><boxGeometry args={[4.0, 0.3, 0.04]} /><meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={0.4} /></mesh>
        {[[-1.5], [1.5]].map(([wx], i) => (
          <mesh key={i} position={[wx, 0.4, 1.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.25, 16]} /><meshStandardMaterial color="#0f172a" />
          </mesh>
        ))}
        <pointLight position={[0, 3, 0]} intensity={10} distance={12} color="#ef4444" />
      </group>
    </group>
  );
}

export function FireGame({ onFinish }: { onFinish: (score: number) => void }) {
  const [fires, setFires] = useState<FireData[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wave, setWave] = useState(1);
  const [banner, setBanner] = useState("1 웨이브!");
  const [pops, setPops] = useState<Pop[]>([]);
  const [paused, setPaused] = useState(false);
  const [mute, setMute] = useState(isMuted());

  const firesRef = useRef<FireData[]>([]);
  const aim = useRef(new THREE.Vector3(0, 0.5, -2));
  const spraying = useRef(false);
  const shake = useRef(0);
  const nozzle = useMemo(() => new THREE.Vector3(0.5, 1.6, 3.4), []);
  const idRef = useRef(1);
  const popId = useRef(1);
  const doneRef = useRef(false);
  const pausedRef = useRef(false);
  const waveRef = useRef(1);
  const toSpawnRef = useRef(WAVES[0]);
  const comboTime = useRef(0);
  const scoreRef = useRef(0);

  pausedRef.current = paused;

  const addPop = (text: string) => {
    const id = popId.current++;
    setPops((p) => [...p.slice(-5), { id, text, x: 20 + Math.random() * 60, y: 20 + Math.random() * 30 }]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1200);
  };

  const finish = (finalScore: number) => {
    if (doneRef.current) return;
    doneRef.current = true;
    stopSpray();
    spraying.current = false;
    if (finalScore >= 1500) {
      sfxFanfare();
      speak(`미션 완료! ${finalScore}점! 최고의 소방관이에요!`);
    } else {
      speak(`미션 완료! ${finalScore}점!`);
    }
    setTimeout(() => onFinish(finalScore), 2000);
  };

  const nextWave = (cleared: number) => {
    if (cleared > WAVES.length) {
      finish(scoreRef.current + 500);
      return;
    }
    waveRef.current = cleared;
    toSpawnRef.current = WAVES[cleared - 1];
    setWave(cleared);
    setBanner(`${cleared} 웨이브!`);
    speak(cleared === WAVES.length ? "마지막 웨이브! 큰 불이 나왔어요!" : `${cleared} 웨이브 시작!`);
    shake.current = 0.5;
    setTimeout(() => setBanner(""), 2200);
    if (cleared === WAVES.length) {
      const boss: FireData = { id: idRef.current++, x: 0, z: -6, hp: 300, max: 300, boss: true, dead: false, out: false };
      firesRef.current = [...firesRef.current, boss];
      setFires([...firesRef.current]);
    }
  };

  useEffect(() => {
    unlockAudioSys();
    const t = setTimeout(() => setBanner(""), 2200);
    speak("1 웨이브! 불을 눌러 물을 뿌려요!");
    const spawner = setInterval(() => {
      if (pausedRef.current || doneRef.current) return;
      if (toSpawnRef.current <= 0) {
        // 웨이브 클리어 판정
        if (firesRef.current.length === 0) {
          toSpawnRef.current = -1; // 중복 방지
          const bonus = waveRef.current * 200;
          scoreRef.current += bonus;
          setScore(scoreRef.current);
          addPop(`웨이브 보너스 +${bonus}`);
          setTimeout(() => nextWave(waveRef.current + 1), 1500);
        }
        return;
      }
      if (firesRef.current.length >= 6) return;
      toSpawnRef.current -= 1;
      const f: FireData = {
        id: idRef.current++,
        x: (Math.random() - 0.5) * 14,
        z: -8 + Math.random() * 9,
        hp: 100,
        max: 100,
        boss: false,
        dead: false,
        out: false,
      };
      firesRef.current = [...firesRef.current, f];
      setFires([...firesRef.current]);
    }, 1300);
    return () => {
      clearInterval(spawner);
      clearTimeout(t);
      stopSpray();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 물 데미지
  useEffect(() => {
    const dmg = setInterval(() => {
      if (pausedRef.current || !spraying.current || doneRef.current) return;
      let changed = false;
      for (const f of firesRef.current) {
        if (f.dead) continue;
        const d = Math.hypot(f.x - aim.current.x, f.z - aim.current.z);
        if (d < (f.boss ? 2 : 1.4)) {
          f.hp -= f.boss ? 8 : 14;
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
    const now = Date.now();
    const c = now - comboTime.current < 5000 ? Math.min(8, combo + 1) : 1;
    comboTime.current = now;
    setCombo(c);
    const pts = f.boss ? 500 : 100 * c;
    scoreRef.current += pts;
    setScore(scoreRef.current);
    addPop(f.boss ? `보스 진압! +${pts}` : `+${pts}${c > 1 ? ` ${c}콤보!` : ""}`);
    if (f.boss) {
      sfxBoss();
      shake.current = 1;
    } else {
      sfxDing(c);
    }
    setTimeout(() => {
      firesRef.current = firesRef.current.filter((x) => x.id !== id);
      setFires([...firesRef.current]);
    }, 400);
  };

  const setSpray = (on: boolean) => {
    if (paused) return;
    spraying.current = on;
    if (on) startSpray();
    else stopSpray();
  };

  return (
    <div>
      <div className="hud-row">
        <span style={pill}>점수 {score}</span>
        <span style={pill}>웨이브 {wave}/3</span>
        {combo > 1 && <span style={{ ...pill, background: "#fef08a" }}>{combo}콤보</span>}
        <button
          className="icon-btn"
          onClick={() => {
            const m = !mute;
            setMute(m);
            setMuted(m);
          }}
        >
          {mute ? "음소거" : "소리"}
        </button>
        <button className="icon-btn" onClick={() => { setPaused((p) => !p); setSpray(false); sfxClick(); }}>
          {paused ? "계속" : "정지"}
        </button>
      </div>
      {banner && <div className="banner">{banner}</div>}
      <div
        className="scene-wrap"
        style={{ height: "58vh", touchAction: "none", cursor: "crosshair", position: "relative" }}
        onPointerDown={() => setSpray(true)}
        onPointerUp={() => setSpray(false)}
        onPointerLeave={() => setSpray(false)}
      >
        <Canvas camera={{ position: [0, 5.5, 8.5], fov: 55 }}>
          <color attach="background" args={["#0f172a"]} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 8, 5]} intensity={1} />
          <Shaker shake={shake} />
          <Street />
          <group position={[0, 0, 4.2]}>
            <Firefighter wave={spraying.current} />
          </group>
          {/* 그림자 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 4.2]}>
            <circleGeometry args={[1.1, 20]} />
            <meshBasicMaterial color="#000" transparent opacity={0.3} />
          </mesh>
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
              setSpray(true);
            }}
            onPointerUp={() => setSpray(false)}
          >
            <planeGeometry args={[26, 26]} />
            <meshBasicMaterial visible={false} />
          </mesh>
          <AimMarker aim={aim} spraying={spraying} />
        </Canvas>
        {pops.map((p) => (
          <div key={p.id} className="score-pop" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            {p.text}
          </div>
        ))}
        {paused && (
          <div className="pause-veil">
            <div style={{ fontSize: 40 }}>정지됨</div>
            <button className="big-btn" style={{ maxWidth: 240 }} onClick={() => setPaused(false)}>
              계속하기
            </button>
          </div>
        )}
      </div>
      <p style={{ fontSize: 18 }}>불을 누르고 있으면 물이 나가요. 연속 진압하면 콤보!</p>
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
