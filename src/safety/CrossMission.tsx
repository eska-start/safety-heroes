"use client";
import { useEffect, useRef, useState } from "react";
import { speak } from "./tts";
import { isMuted, setMuted, sfxClick, sfxFanfare, sfxHorn, sfxHurt, sfxStep } from "./audio";

interface Car { lane: number; x: number; speed: number; dir: 1 | -1; color: string; grazed: boolean }
interface Pop { id: number; text: string }

const W = 600;
const H = 640;
const LANES = [1, 2, 3, 4, 5];
const GOAL = 6;
const ROUNDS = 3;
const RTIME = 40;
const laneY = (row: number) => 560 - row * 80;

const COLORS = ["#ef4444", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"];

export function CrossMission({ onFinish }: { onFinish: (score: number, stars: number, won: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [round, setRound] = useState(1);
  const [time, setTime] = useState(RTIME);
  const [light, setLight] = useState<"red" | "green">("green");
  const [pops, setPops] = useState<Pop[]>([]);
  const [paused, setPaused] = useState(false);
  const [mute, setMute] = useState(isMuted());

  const st = useRef({
    cars: [] as Car[],
    px: 0, py: 0, // 목표 위치(칸)
    lives: 3, round: 1, score: 0, time: RTIME,
    light: "green" as "red" | "green",
    sigT: 0, guard: 0, done: false, paused: false,
    hopT: 0, winT: 0, popId: 1,
  });
  const ui = useRef({ setScore, setLives, setRound, setTime, setLight, setPops });
  ui.current = { setScore, setLives, setRound, setTime, setLight, setPops };

  const addPop = (text: string) => {
    const S = st.current;
    const id = S.popId++;
    ui.current.setPops((p) => [...p.slice(-3), { id, text }]);
    setTimeout(() => ui.current.setPops((p) => p.filter((x) => x.id !== id)), 1100);
  };

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const S = st.current;

    const build = (r: number) => {
      const list: Car[] = [];
      LANES.forEach((lane, li) => {
        const n = 2 + Math.min(2, r);
        for (let i = 0; i < n; i++) {
          list.push({
            lane,
            x: ((24 / n) * i + li * 5) % 26 - 13,
            speed: 130 + r * 45 + li * 18,
            dir: li % 2 === 0 ? 1 : -1,
            color: COLORS[(li + i) % COLORS.length],
            grazed: false,
          });
        }
      });
      S.cars = list;
    };
    build(1);
    speak("초록불에도 차를 보고 건너요!");

    const lose = (why: string) => {
      S.lives -= 1;
      ui.current.setLives(S.lives);
      sfxHurt();
      S.guard = performance.now();
      if (S.lives <= 0) {
        S.done = true;
        speak("다시 신호를 보고 건너봐요.");
        setTimeout(() => onFinish(S.score, 1, false), 1800);
      } else {
        speak(why);
        S.px = 0;
        S.py = 0;
        S.time = RTIME;
        ui.current.setTime(RTIME);
      }
    };

    const keys = (e: KeyboardEvent) => {
      if (S.done || S.paused) return;
      if (e.key === "ArrowUp") mv(0, 1);
      else if (e.key === "ArrowDown") mv(0, -1);
      else if (e.key === "ArrowLeft") mv(-1, 0);
      else if (e.key === "ArrowRight") mv(1, 0);
    };
    const mv = (dc: number, dr: number) => {
      S.px = Math.max(-3, Math.min(3, S.px + dc));
      S.py = Math.max(0, Math.min(GOAL, S.py + dr));
      S.hopT = 0.18;
      sfxStep();
    };
    (cv as HTMLCanvasElement & { __mv?: unknown }).__mv = mv;
    window.addEventListener("keydown", keys);

    let raf = 0;
    let last = performance.now();
    let secAcc = 0;

    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(ctx, S);
      if (S.paused || S.done) return;

      // 신호등
      S.sigT += dt;
      if (S.sigT > 6) {
        S.sigT = 0;
        S.light = S.light === "green" ? "red" : "green";
        ui.current.setLight(S.light);
      }
      // 자동차
      const stop = S.light === "red" ? 0 : 1;
      for (const c of S.cars) {
        c.x += ((c.dir * c.speed * stop * dt) / 26) * 2;
        if (c.x > 14) c.x = -14;
        if (c.x < -14) c.x = 14;
      }
      // 타이머
      secAcc += dt;
      if (secAcc >= 1) {
        secAcc = 0;
        S.time -= 1;
        ui.current.setTime(S.time);
        if (S.time <= 0) lose("시간 초과! 빨리 건너요.");
      }
      if (S.hopT > 0) S.hopT -= dt;
      if (S.winT > 0) S.winT -= dt;

      const px = S.px * 80;
      const py = laneY(S.py);
      // 충돌·아슬아슬
      for (const c of S.cars) {
        if (c.lane !== S.py) continue;
        const cx = (c.x / 14) * (W / 2);
        const dx = Math.abs(cx - px);
        if (dx < 42 && now - S.guard > 1200) {
          S.guard = now;
          lose("조심! 차에 닿았어요.");
          return;
        }
        if (!c.grazed && dx < 80 && dx >= 42) {
          c.grazed = true;
          S.score += 50;
          ui.current.setScore(S.score);
          addPop("+50 아슬아슬!");
          sfxHorn();
        }
      }
      // 도착
      if (S.py >= GOAL && now - S.guard > 500) {
        S.guard = now;
        S.winT = 0.6;
        const bonus = S.time * 10 + S.lives * 100;
        S.score += 500 + bonus;
        ui.current.setScore(S.score);
        addPop(`+${500 + bonus}`);
        sfxFanfare();
        if (S.round >= ROUNDS) {
          S.done = true;
          const stars = S.lives >= 3 ? 3 : S.lives === 2 ? 2 : 1;
          speak("세 번 다 건넜어요!");
          setTimeout(() => onFinish(S.score, stars, true), 1800);
        } else {
          S.round += 1;
          ui.current.setRound(S.round);
          build(S.round);
          speak(`${S.round}번째! 차가 더 빨라요!`);
          S.px = 0;
          S.py = 0;
          S.time = RTIME;
          ui.current.setTime(RTIME);
        }
      }
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", keys);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    st.current.paused = paused;
  }, [paused]);

  const mv = (dc: number, dr: number) => {
    const S = st.current;
    if (S.done || S.paused) return;
    S.px = Math.max(-3, Math.min(3, S.px + dc));
    S.py = Math.max(0, Math.min(GOAL, S.py + dr));
    S.hopT = 0.18;
    sfxStep();
  };

  return (
    <div>
      <div className="hud-row">
        <span className="hud-pill">점수 {score}</span>
        <span className="hud-pill">❤️ {lives}</span>
        <span className="hud-pill">🚸 {round}/{ROUNDS}</span>
        <span className="hud-pill">⏱ {time}</span>
        <span className="hud-pill">{light === "red" ? "🔴 대기" : "🟢 차 조심"}</span>
        <button className="icon-btn" onClick={() => { const m = !mute; setMute(m); setMuted(m); }}>
          {mute ? "음소거" : "소리"}
        </button>
        <button className="icon-btn" onClick={() => { setPaused((p) => !p); sfxClick(); }}>{paused ? "계속" : "정지"}</button>
      </div>
      <div className="scene-wrap" style={{ height: "auto", position: "relative" }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ width: "100%", display: "block" }} />
        {pops.map((p) => (
          <div key={p.id} className="score-pop" style={{ left: "35%", top: "25%" }}>{p.text}</div>
        ))}
        {paused && (
          <div className="pause-veil">
            <div style={{ fontSize: 40 }}>정지됨</div>
            <button className="big-btn" style={{ maxWidth: 240 }} onClick={() => setPaused(false)}>계속하기</button>
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
        <span />
        <button className="big-btn" onClick={() => mv(0, 1)}>▲</button>
        <span />
        <button className="big-btn" onClick={() => mv(-1, 0)}>◀</button>
        <button className="big-btn" onClick={() => mv(0, -1)}>▼</button>
        <button className="big-btn" onClick={() => mv(1, 0)}>▶</button>
      </div>
      <p style={{ fontSize: 18 }}>빨간불엔 차가 멈춰요. 노란 구역까지 세 번 건너세요!</p>
    </div>
  );
}

function draw(ctx: CanvasRenderingContext2D, S: {
  cars: Car[]; px: number; py: number; light: "red" | "green"; hopT: number; winT: number;
}) {
  // 하늘·땅
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#7dd3fc");
  sky.addColorStop(0.35, "#bae6fd");
  sky.addColorStop(0.351, "#4ade80");
  sky.addColorStop(1, "#22c55e");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // 도로
  ctx.fillStyle = "#475569";
  ctx.fillRect(30, laneY(5.6), W - 60, laneY(0.4) - laneY(5.6));
  // 횡단보도 줄무늬
  ctx.fillStyle = "rgba(248,250,252,0.85)";
  for (const x of [W / 2 - 130, W / 2 - 45, W / 2 + 40, W / 2 + 125]) {
    ctx.fillRect(x - 22, laneY(5.7), 44, laneY(0.3) - laneY(5.7));
  }
  // 출발·도착
  ctx.fillStyle = "#bbf7d0";
  ctx.fillRect(30, laneY(0) - 26, W - 60, 52);
  ctx.fillStyle = "#fde68a";
  ctx.fillRect(30, laneY(GOAL) - 26, W - 60, 52);
  ctx.fillStyle = "#92400e";
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("도착!", W / 2, laneY(GOAL) + 9);

  // 차선
  ctx.fillStyle = "#fde047";
  for (const lane of LANES) {
    const y = laneY(lane) + 38;
    for (let x = 50; x < W - 40; x += 60) ctx.fillRect(x, y, 30, 5);
  }

  // 신호등
  ctx.fillStyle = "#0f172a";
  roundRect(ctx, 30, 60, 46, 100, 10);
  ctx.fill();
  ctx.fillStyle = S.light === "red" ? "#ef4444" : "#334155";
  ctx.beginPath();
  ctx.arc(53, 90, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = S.light === "green" ? "#22c55e" : "#334155";
  ctx.beginPath();
  ctx.arc(53, 130, 14, 0, Math.PI * 2);
  ctx.fill();

  // 자동차
  for (const c of S.cars) {
    const cx = W / 2 + (c.x / 14) * (W / 2);
    const cy = laneY(c.lane);
    ctx.save();
    ctx.translate(cx, cy);
    if (c.dir === -1) ctx.scale(-1, 1);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 16, 52, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.color;
    roundRect(ctx, -55, -18, 110, 34, 10);
    ctx.fill();
    ctx.fillStyle = "#e2e8f0";
    roundRect(ctx, -30, -34, 55, 22, 8);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(-32, 16, 12, 0, Math.PI * 2);
    ctx.arc(32, 16, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fef9c3";
    ctx.fillRect(53, -8, 6, 12);
    ctx.restore();
  }

  // 아이
  const hop = S.hopT > 0 ? Math.sin((S.hopT / 0.18) * Math.PI) * -22 : 0;
  const px = W / 2 + S.px * 80;
  const py = laneY(S.py) + hop;
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(px, laneY(S.py) + 18, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // 몸
  ctx.fillStyle = "#f472b6";
  roundRect(ctx, px - 16, py - 26, 32, 34, 12);
  ctx.fill();
  // 머리
  ctx.fillStyle = "#ffd9b3";
  ctx.beginPath();
  ctx.arc(px, py - 42, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(px - 6, py - 44, 2.5, 0, Math.PI * 2);
  ctx.arc(px + 6, py - 44, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // 안전모
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(px, py - 46, 19, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(px - 24, py - 48, 48, 5);
  if (S.winT > 0) {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText("통과!", W / 2, 200);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
