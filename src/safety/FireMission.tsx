"use client";
import { useEffect, useRef, useState } from "react";
import { speak } from "./tts";
import { isMuted, setMuted, sfxBoss, sfxDing, sfxFanfare, startSpray, stopSpray } from "./audio";

interface F { id: number; x: number; y: number; hp: number; max: number; boss: boolean; seed: number }
interface Pt { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; kind: "water" | "ember" | "smoke" }
interface Pop { id: number; text: string }

const W = 600;
const H = 640;
const WAVES = [8, 12, 15];

export function FireMission({ onFinish }: { onFinish: (score: number, stars: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wave, setWave] = useState(1);
  const [banner, setBanner] = useState("1웨이브!");
  const [pops, setPops] = useState<Pop[]>([]);
  const [paused, setPaused] = useState(false);
  const [mute, setMute] = useState(isMuted());

  const st = useRef({
    fires: [] as F[],
    pts: [] as Pt[],
    aim: { x: W / 2, y: 240 },
    spray: false,
    score: 0,
    combo: 0,
    comboT: 0,
    wave: 1,
    toSpawn: WAVES[0],
    spawnT: 0,
    id: 1,
    popId: 1,
    done: false,
    paused: false,
    time: 0,
    shake: 0,
  });

  const ui = useRef({ setScore, setCombo, setWave, setBanner, setPops });
  ui.current = { setScore, setCombo, setWave, setBanner, setPops };

  const addPop = (text: string) => {
    const id = st.current.popId++;
    ui.current.setPops((p) => [...p.slice(-4), { id, text }]);
    setTimeout(() => ui.current.setPops((p) => p.filter((x) => x.id !== id)), 1200);
  };

  const finish = (s: number) => {
    const S = st.current;
    if (S.done) return;
    S.done = true;
    S.spray = false;
    stopSpray();
    const stars = s >= 3000 ? 3 : s >= 1800 ? 2 : 1;
    sfxFanfare();
    speak(`미션 완료! ${s}점!`);
    setTimeout(() => onFinish(s, stars), 2000);
  };

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const S = st.current;
    speak("불을 누르고 물을 뿌려요!");
    const bannerTimer = setTimeout(() => ui.current.setBanner(""), 2000);

    const spawnFire = (boss = false) => {
      const f: F = {
        id: S.id++,
        x: 70 + Math.random() * (W - 140),
        y: 170 + Math.random() * 330,
        hp: boss ? 320 : 100,
        max: boss ? 320 : 100,
        boss,
        seed: Math.random() * 10,
      };
      S.fires.push(f);
    };

    const toXY = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    };
    const down = (e: PointerEvent) => {
      if (S.paused || S.done) return;
      const p = toXY(e);
      S.aim = p;
      S.spray = true;
      startSpray();
      cv.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!S.spray) return;
      S.aim = toXY(e);
    };
    const up = () => {
      S.spray = false;
      stopSpray();
    };
    cv.addEventListener("pointerdown", down);
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);

    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (S.paused || S.done) {
        draw(ctx, S, true);
        return;
      }
      S.time += dt;

      // 스폰
      S.spawnT -= dt;
      const active = S.fires.length;
      if (S.toSpawn > 0 && S.spawnT <= 0 && active < 6) {
        S.toSpawn -= 1;
        spawnFire(false);
        S.spawnT = Math.max(0.6, 1.4 - S.wave * 0.2);
      }
      if (S.wave === WAVES.length && S.toSpawn === WAVES[WAVES.length - 1] && !S.fires.some((f) => f.boss) && active < 6) {
        spawnFire(true); // 보스
        S.toSpawn -= 1;
      }
      // 웨이브 클리어
      if (S.toSpawn <= 0 && active === 0) {
        const bonus = S.wave * 200;
        S.score += bonus;
        ui.current.setScore(S.score);
        addPop(`보너스 +${bonus}`);
        if (S.wave >= WAVES.length) {
          finish(S.score + 500);
          return;
        }
        S.wave += 1;
        S.toSpawn = WAVES[S.wave - 1];
        ui.current.setWave(S.wave);
        ui.current.setBanner(S.wave === WAVES.length ? "마지막 웨이브!" : `${S.wave}웨이브!`);
        speak(S.wave === WAVES.length ? "마지막 웨이브! 큰 불이에요!" : `${S.wave}웨이브!`);
        S.shake = 0.6;
        setTimeout(() => ui.current.setBanner(""), 2000);
      }

      // 물 데미지 + 물 파티클
      const nx = W / 2;
      const ny = H - 30;
      if (S.spray) {
        for (let i = 0; i < 4; i++) {
          const dx = S.aim.x - nx;
          const dy = S.aim.y - ny;
          const d = Math.hypot(dx, dy) || 1;
          S.pts.push({
            x: nx, y: ny,
            vx: (dx / d) * 900 + (Math.random() - 0.5) * 120,
            vy: (dy / d) * 900 + (Math.random() - 0.5) * 120,
            life: 0.5, max: 0.5, size: 5 + Math.random() * 4, kind: "water",
          });
        }
        for (const f of S.fires) {
          const r = f.boss ? 75 : 55;
          if (Math.hypot(f.x - S.aim.x, f.y - S.aim.y) < r) f.hp -= (f.boss ? 90 : 170) * dt;
        }
      }
      // 진압 판정
      for (const f of S.fires) {
        if (f.hp <= 0 && !(f as F & { counted?: boolean; diedAt?: number }).counted) {
          (f as F & { counted?: boolean; diedAt?: number }).counted = true;
          (f as F & { counted?: boolean; diedAt?: number }).diedAt = S.time;
          const nowMs = Date.now();
          const c = nowMs - S.comboT < 5000 ? Math.min(8, S.combo + 1) : 1;
          S.combo = c;
          S.comboT = nowMs;
          ui.current.setCombo(c);
          const pts = f.boss ? 500 : 100 * c;
          S.score += pts;
          ui.current.setScore(S.score);
          addPop(f.boss ? `보스 진압! +${pts}` : `+${pts}${c > 1 ? ` ${c}콤보!` : ""}`);
          if (f.boss) {
            sfxBoss();
            S.shake = 1;
          } else sfxDing(c);
          for (let i = 0; i < 16; i++) {
            S.pts.push({ x: f.x, y: f.y, vx: (Math.random() - 0.5) * 300, vy: -Math.random() * 300, life: 0.6, max: 0.6, size: 4 + Math.random() * 5, kind: "ember" });
          }
        }
        // 불씨·연기
        if (Math.random() < dt * 20) {
          S.pts.push({ x: f.x + (Math.random() - 0.5) * 30, y: f.y - 20, vx: (Math.random() - 0.5) * 30, vy: -60 - Math.random() * 40, life: 0.8, max: 0.8, size: 3 + Math.random() * 4, kind: "ember" });
        }
        if (Math.random() < dt * 6) {
          S.pts.push({ x: f.x, y: f.y - 40, vx: (Math.random() - 0.5) * 20, vy: -50, life: 1.6, max: 1.6, size: 10 + Math.random() * 10, kind: "smoke" });
        }
      }
      S.fires = S.fires.filter((f) => {
        const c = (f as F & { counted?: boolean; diedAt?: number });
        if (!c.counted) return true;
        return S.time - (c.diedAt ?? 0) < 0.45;
      });
      // 파티클 업데이트
      for (const p of S.pts) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind === "water") p.vy += 900 * dt;
      }
      S.pts = S.pts.filter((p) => p.life > 0);
      if (S.pts.length > 400) S.pts.splice(0, S.pts.length - 400);
      if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 2);

      draw(ctx, S, false);
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(bannerTimer);
      stopSpray();
      cv.removeEventListener("pointerdown", down);
      cv.removeEventListener("pointermove", move);
      cv.removeEventListener("pointerup", up);
      cv.removeEventListener("pointercancel", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    st.current.paused = paused;
    if (paused) stopSpray();
    st.current.spray = false;
  }, [paused]);

  return (
    <div>
      <div className="hud-row">
        <span className="hud-pill">점수 {score}</span>
        <span className="hud-pill">웨이브 {wave}/3</span>
        {combo > 1 && <span className="hud-pill combo">{combo}콤보</span>}
        <button className="icon-btn" onClick={() => { const m = !mute; setMute(m); setMuted(m); }}>
          {mute ? "음소거" : "소리"}
        </button>
        <button className="icon-btn" onClick={() => setPaused((p) => !p)}>{paused ? "계속" : "정지"}</button>
      </div>
      {banner && <div className="banner">{banner}</div>}
      <div className="scene-wrap" style={{ height: "auto", position: "relative" }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ width: "100%", display: "block", touchAction: "none", cursor: "crosshair" }} />
        {pops.map((p) => (
          <div key={p.id} className="score-pop" style={{ left: "30%", top: "30%" }}>{p.text}</div>
        ))}
        {paused && (
          <div className="pause-veil">
            <div style={{ fontSize: 40 }}>정지됨</div>
            <button className="big-btn" style={{ maxWidth: 240 }} onClick={() => setPaused(false)}>계속하기</button>
          </div>
        )}
      </div>
      <p style={{ fontSize: 18 }}>불을 손가락으로 누르고 있으면 물이 나가요. 연속 진압하면 콤보!</p>
    </div>
  );
}

function draw(ctx: CanvasRenderingContext2D, S: {
  fires: F[]; pts: Pt[]; aim: { x: number; y: number }; spray: boolean; time: number; shake: number;
}, frozen: boolean) {
  void frozen;
  ctx.save();
  if (S.shake > 0.02) ctx.translate((Math.random() - 0.5) * S.shake * 14, (Math.random() - 0.5) * S.shake * 14);

  // 밤하늘 + 건물
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#0c1445");
  sky.addColorStop(0.7, "#1e3a8a");
  sky.addColorStop(1, "#334155");
  ctx.fillStyle = sky;
  ctx.fillRect(-20, -20, W + 40, H + 40);
  // 별
  ctx.fillStyle = "#fff";
  for (let i = 0; i < 40; i++) {
    const x = (i * 137) % W;
    const y = (i * 89) % 150;
    ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(S.time * 2 + i));
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
  // 건물 실루엣
  const blocks = [[0, 120, 130], [150, 150, 110], [280, 110, 140], [440, 150, 160]];
  for (const [bx, by, bw] of blocks) {
    ctx.fillStyle = "#111c33";
    ctx.fillRect(bx, by, bw, 420 - by);
    for (let wy = by + 20; wy < 400; wy += 34) {
      for (let wx = bx + 12; wx < bx + bw - 12; wx += 30) {
        ctx.fillStyle = (wx + wy) % 3 === 0 ? "#fde047" : "#1e293b";
        ctx.globalAlpha = (wx + wy) % 3 === 0 ? 0.85 : 1;
        ctx.fillRect(wx, wy, 16, 20);
      }
    }
    ctx.globalAlpha = 1;
  }
  // 달
  ctx.fillStyle = "#fef9c3";
  ctx.beginPath();
  ctx.arc(520, 70, 30, 0, Math.PI * 2);
  ctx.fill();

  // 불
  for (const f of S.fires) {
    const k = Math.max(0, f.hp / f.max);
    const fl = 1 + Math.sin(S.time * 12 + f.seed) * 0.12;
    const s = (f.boss ? 1.7 : 1) * fl;
    // 빛
    const glow = ctx.createRadialGradient(f.x, f.y, 5, f.x, f.y, 90 * s);
    const col = f.boss ? "168,85,247" : "249,115,22";
    glow.addColorStop(0, `rgba(${col},0.55)`);
    glow.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(f.x - 95 * s, f.y - 95 * s, 190 * s, 190 * s);
    // 장작
    ctx.fillStyle = "#44403c";
    ctx.fillRect(f.x - 28 * s, f.y - 8, 56 * s, 14);
    // 불꽃 3겹
    const layers: [string, number][] = f.boss
      ? [["#7e22ce", 1], ["#c026d3", 0.72], ["#f0abfc", 0.45]]
      : [["#dc2626", 1], ["#f97316", 0.72], ["#fde047", 0.42]];
    for (const [c, q] of layers) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(f.x, f.y - 34 * s * q * k - 8, 26 * s * q * (0.4 + 0.6 * k), 40 * s * q * (0.35 + 0.65 * k), 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 소방차 + 호스
  ctx.fillStyle = "#dc2626";
  roundRect(ctx, W / 2 - 90, H - 96, 180, 56, 10);
  ctx.fill();
  ctx.fillStyle = "#fca5a5";
  roundRect(ctx, W / 2 - 70, H - 130, 60, 36, 6);
  ctx.fill();
  ctx.fillStyle = "#fde047";
  ctx.fillRect(W / 2 - 90, H - 70, 180, 8);
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(W / 2 - 55, H - 40, 20, 0, Math.PI * 2);
  ctx.arc(W / 2 + 55, H - 40, 20, 0, Math.PI * 2);
  ctx.fill();

  // 물줄기
  if (S.spray) {
    const nx = W / 2;
    const ny = H - 110;
    const g = ctx.createLinearGradient(nx, ny, S.aim.x, S.aim.y);
    g.addColorStop(0, "rgba(125,211,252,0.95)");
    g.addColorStop(1, "rgba(125,211,252,0.35)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(nx, ny);
    const mx = (nx + S.aim.x) / 2;
    const my = (ny + S.aim.y) / 2 - 40;
    ctx.quadraticCurveTo(mx, my, S.aim.x, S.aim.y);
    ctx.stroke();
  }

  // 파티클
  for (const p of S.pts) {
    const a = Math.max(0, p.life / p.max);
    if (p.kind === "water") {
      ctx.fillStyle = `rgba(186,230,253,${0.9 * a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * a + 1, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "ember") {
      ctx.fillStyle = `rgba(253,224,71,${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(87,83,78,${0.4 * a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1.6 - a), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 조준점
  ctx.strokeStyle = S.spray ? "#22d3ee" : "#fff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(S.aim.x, S.aim.y, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(S.aim.x, S.aim.y, 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
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
