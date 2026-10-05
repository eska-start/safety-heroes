"use client";
import { useEffect, useRef, useState } from "react";
import {
  Board, COLS, COLORS, DARK, LINE_SCORE, Piece, ROWS,
  cellsOf, collides, emptyBoard, ghostY, gravityMs, lockPiece, makeBag, spawnPiece, tryRotate,
} from "./engine";
import {
  isMuted, setMuted, sClear, sCombo, sHard, sHold, sLevel, sLock, sMove, sOver, sRotate, sStart, unlock,
} from "./audio";
import { loadBest, saveBest } from "./storage";

const CELL = 30;
const BW = COLS * CELL;
const BH = ROWS * CELL;

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string }
interface FloatText { id: number; text: string; y: number }

type Phase = "title" | "play" | "over";

export function Tetris() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("title");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [best, setBest] = useState(loadBest);
  const [next, setNext] = useState<number[]>([]);
  const [hold, setHold] = useState<number | null>(null);
  const [combo, setCombo] = useState(-1);
  const [b2b, setB2b] = useState(false);
  const [mute, setMute] = useState(isMuted());
  const [msg, setMsg] = useState("");
  const [floats, setFloats] = useState<FloatText[]>([]);

  const g = useRef({
    board: emptyBoard() as Board,
    cur: null as Piece | null,
    bag: [] as number[],
    hold: null as number | null,
    canHold: true,
    score: 0, level: 1, lines: 0, combo: -1, b2b: false,
    dropAcc: 0, lockAcc: 0, locking: false,
    particles: [] as Particle[],
    flashRows: [] as number[],
    flashT: 0,
    over: false, started: false,
    floatId: 1,
    soft: false,
  });
  const ui = useRef({ setScore, setLevel, setLines, setNext, setHold, setCombo, setB2b, setMsg, setFloats, setPhase, setBest });
  ui.current = { setScore, setLevel, setLines, setNext, setHold, setCombo, setB2b, setMsg, setFloats, setPhase, setBest };

  const float = (text: string) => {
    const id = g.current.floatId++;
    ui.current.setFloats((f) => [...f.slice(-3), { id, text, y: 40 }]);
    setTimeout(() => ui.current.setFloats((f) => f.filter((x) => x.id !== id)), 1300);
  };

  const refill = (S: typeof g.current) => {
    if (S.bag.length < 7) S.bag = [...S.bag, ...makeBag()];
  };

  const nextPiece = (S: typeof g.current) => {
    refill(S);
    const type = S.bag.shift()!;
    refill(S);
    S.cur = spawnPiece(type);
    S.canHold = true;
    S.lockAcc = 0;
    S.locking = false;
    ui.current.setNext(S.bag.slice(0, 4));
    if (collides(S.board, S.cur)) {
      S.over = true;
      sOver();
      const b = saveBest(S.score);
      ui.current.setBest(b);
      ui.current.setMsg(S.score >= b && S.score > 0 ? "신기록!" : "");
      ui.current.setPhase("over");
    }
  };

  const doHold = (S: typeof g.current) => {
    if (!S.canHold || !S.cur || S.over) return;
    sHold();
    const cur = S.cur.type;
    if (S.hold == null) {
      S.hold = cur;
      refill(S);
      S.cur = spawnPiece(S.bag.shift()!);
      refill(S);
      ui.current.setNext(S.bag.slice(0, 4));
    } else {
      const t = S.hold;
      S.hold = cur;
      S.cur = spawnPiece(t);
    }
    S.canHold = false;
    S.lockAcc = 0;
    S.locking = false;
    ui.current.setHold(S.hold);
  };

  const hardDrop = (S: typeof g.current) => {
    if (!S.cur || S.over) return;
    const gy = ghostY(S.board, S.cur);
    const dist = gy - S.cur.y;
    S.cur.y = gy;
    S.score += dist * 2;
    sHard();
    settle(S);
  };

  const settle = (S: typeof g.current) => {
    if (!S.cur) return;
    const n = lockPiece(S.board, S.cur);
    sLock();
    if (n > 0) {
      const isTetris = n === 4;
      const pts = (LINE_SCORE[n] + (isTetris && S.b2b ? 400 : 0)) * S.level;
      S.combo += 1;
      if (S.combo > 0) {
        const cb = 50 * S.combo * S.level;
        S.score += cb;
        sCombo(S.combo);
        float(`${S.combo}콤보 +${cb}`);
      }
      S.score += pts;
      S.lines += n;
      const lv = Math.floor(S.lines / 10) + 1;
      if (lv !== S.level) {
        S.level = lv;
        sLevel();
        float(`${lv}레벨!`);
      }
      if (isTetris) S.b2b = true;
      else S.b2b = false;
      sClear(n);
      // 파티클 + 플래시
      for (let i = 0; i < n * 14; i++) {
        S.particles.push({
          x: Math.random() * BW, y: BH - 40 - Math.random() * 60,
          vx: (Math.random() - 0.5) * 260, vy: -120 - Math.random() * 200,
          life: 0.8, max: 0.8, color: COLORS[1 + Math.floor(Math.random() * 7)],
        });
      }
      float(n === 4 ? `테트리스! +${pts}` : `+${pts}`);
      const U = ui.current;
      U.setScore(S.score);
      U.setLines(S.lines);
      U.setLevel(S.level);
      U.setCombo(S.combo);
      U.setB2b(S.b2b);
    } else {
      S.combo = -1;
      ui.current.setCombo(-1);
      S.b2b = false;
      ui.current.setB2b(false);
    }
    nextPiece(S);
  };

  const move = (dx: number) => {
    const S = g.current;
    if (!S.cur || S.over || pausedRef.current) return;
    const np = { ...S.cur, x: S.cur.x + dx };
    if (!collides(S.board, np)) {
      S.cur = np;
      sMove();
      if (S.locking) {
        S.lockAcc = 0;
      }
    }
  };

  const rotate = (dir: 1 | -1) => {
    const S = g.current;
    if (!S.cur || S.over || pausedRef.current) return;
    const np = tryRotate(S.board, S.cur, dir);
    if (np) {
      S.cur = np;
      sRotate();
      if (S.locking) S.lockAcc = 0;
    }
  };

  const soft = (on: boolean) => {
    g.current.soft = on;
  };

  // g.current.soft: 소프트드롭 플래그
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  pausedRef.current = paused;

  // 메인 루프
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const S = g.current;
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (S.started && !S.over && !pausedRef.current && S.cur) {
        const step = S.soft ? 25 : gravityMs(S.level) / 1000;
        S.dropAcc += dt;
        while (S.dropAcc >= step) {
          S.dropAcc -= step;
          const cur = S.cur;
          if (!cur) break;
          const np: Piece = { ...cur, y: cur.y + 1 };
          if (!collides(S.board, np)) {
            S.cur = np;
            S.locking = false;
            S.lockAcc = 0;
          } else {
            S.locking = true;
            S.lockAcc += step;
            if (S.soft) S.score += 1;
            if (S.lockAcc >= 0.5) {
              S.dropAcc = 0;
              settle(S);
              break;
            }
            break;
          }
        }
        if (S.soft) ui.current.setScore(S.score);
      }
      // 파티클
      for (const p of S.particles) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 500 * dt;
      }
      S.particles = S.particles.filter((p) => p.life > 0);
      draw(ctx, S);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 키보드
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat && ["ArrowLeft", "ArrowRight", "ArrowDown"].indexOf(e.code) === -1) return;
      const S = g.current;
      if (phase === "title" && (e.code === "Enter" || e.code === "Space")) {
        start();
        return;
      }
      if (phase === "over" && e.code === "Enter") {
        start();
        return;
      }
      switch (e.code) {
        case "ArrowLeft": move(-1); break;
        case "ArrowRight": move(1); break;
        case "ArrowDown": soft(true); break;
        case "ArrowUp": rotate(1); break;
        case "KeyZ": rotate(-1); break;
        case "Space":
          e.preventDefault();
          hardDrop(S);
          ui.current.setScore(S.score);
          break;
        case "KeyC": case "ShiftLeft": case "ShiftRight": doHold(S); break;
        case "KeyP": case "Escape": setPaused((p) => !p); break;
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown") soft(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused]);

  const start = () => {
    const S = g.current;
    unlock();
    sStart();
    S.board = emptyBoard();
    S.bag = makeBag();
    S.hold = null;
    S.score = 0;
    S.level = 1;
    S.lines = 0;
    S.combo = -1;
    S.b2b = false;
    S.over = false;
    S.started = true;
    S.particles = [];
    setScore(0);
    setLevel(1);
    setLines(0);
    setCombo(-1);
    setB2b(false);
    setHold(null);
    setMsg("");
    setPaused(false);
    nextPiece(S);
    setPhase("play");
  };

  return (
    <div className="pt-shell">
      {phase === "title" && (
        <div className="pt-title">
          <h1 className="pt-logo">파스텔 테트리스</h1>
          <p className="pt-sub">몽글몽글 블록 쌓기</p>
          <div className="pt-preview">
            <MiniBoard />
          </div>
          <p className="pt-best">최고 {best}점</p>
          <button className="pt-btn" onClick={start}>시작하기</button>
          <p className="pt-help">←→ 이동 · ↑/Z 회전 · ↓ 소프트드롭 · Space 하드드롭 · C 홀드 · P 정지</p>
        </div>
      )}
      {(phase === "play" || phase === "over") && (
        <div className="pt-game">
          <div className="pt-side">
            <div className="pt-panel">
              <div className="pt-label">홀드</div>
              <MiniPiece type={hold} />
            </div>
            <div className="pt-panel">
              <div className="pt-label">점수</div>
              <div className="pt-value">{score}</div>
              <div className="pt-label">최고 {Math.max(best, score)}</div>
            </div>
            <div className="pt-panel">
              <div className="pt-label">레벨 {level}</div>
              <div className="pt-label">줄 {lines}</div>
              {combo > 0 && <div className="pt-combo">{combo}콤보</div>}
              {b2b && <div className="pt-combo">B2B</div>}
            </div>
          </div>
          <div className="pt-board-wrap">
            <canvas ref={canvasRef} width={BW} height={BH} className="pt-board"
              onTouchStart={(e) => touchStart(e)} onTouchMove={(e) => touchMove(e)} onTouchEnd={touchEnd} />
            {floats.map((f) => (
              <div key={f.id} className="pt-float">{f.text}</div>
            ))}
            {paused && phase === "play" && (
              <div className="pt-veil">
                <div>정지됨</div>
                <button className="pt-btn small" onClick={() => setPaused(false)}>계속</button>
              </div>
            )}
            {phase === "over" && (
              <div className="pt-veil">
                <div className="pt-over">게임 오버</div>
                <div>{score}점 {msg && `· ${msg}`}</div>
                <button className="pt-btn small" onClick={start}>다시 하기</button>
              </div>
            )}
          </div>
          <div className="pt-side">
            <div className="pt-panel">
              <div className="pt-label">다음</div>
              {next.map((t, i) => (
                <MiniPiece key={i} type={t} small />
              ))}
            </div>
            <button className="pt-icon" onClick={() => { const m = !mute; setMute(m); setMuted(m); }}>
              {mute ? "🔇" : "🔊"}
            </button>
            <button className="pt-icon" onClick={() => setPaused((p) => !p)}>
              {paused ? "▶" : "⏸"}
            </button>
          </div>
        </div>
      )}
      {phase === "play" && (
        <div className="pt-pad">
          <button onTouchStart={(e) => { e.preventDefault(); move(-1); }}>◀</button>
          <button onTouchStart={(e) => { e.preventDefault(); rotate(1); }}>⟳</button>
          <button onTouchStart={(e) => { e.preventDefault(); move(1); }}>▶</button>
          <button onTouchStart={(e) => { e.preventDefault(); soft(true); }} onTouchEnd={() => soft(false)}>▼</button>
          <button onTouchStart={(e) => { e.preventDefault(); const S = g.current; hardDrop(S); setScore(S.score); }}>⬇</button>
          <button onTouchStart={(e) => { e.preventDefault(); doHold(g.current); }}>H</button>
        </div>
      )}
    </div>
  );

  // 터치 스와이프
  function touchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    (touchStart as unknown as { x: number; y: number }).x = t.clientX;
    (touchStart as unknown as { x: number; y: number }).y = t.clientY;
  }
  function touchMove(e: React.TouchEvent) {
    const s = touchStart as unknown as { x: number; y: number };
    if (s.x == null) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) > 28) {
      move(dx > 0 ? 1 : -1);
      s.x = t.clientX;
      s.y = t.clientY;
    } else if (dy > 44) {
      soft(true);
    }
  }
  function touchEnd() {
    soft(false);
  }
}

function MiniPiece({ type, small }: { type: number | null; small?: boolean }) {
  if (type == null) return <div className={small ? "pt-mini small" : "pt-mini"}>－</div>;
  const cells: Record<number, [number, number][]> = {
    1: [[1, 0], [0, 1], [1, 1], [2, 1]],
    2: [[0, 0], [0, 1], [1, 1], [2, 1]],
    3: [[2, 0], [0, 1], [1, 1], [2, 1]],
    4: [[0, 0], [1, 0], [0, 1], [1, 1]],
    5: [[1, 0], [2, 0], [0, 1], [1, 1]],
    6: [[0, 0], [1, 0], [1, 1], [2, 1]],
    7: [[0, 0], [1, 0], [2, 0], [3, 0]],
  };
  const s = small ? 10 : 16;
  return (
    <svg width={4 * s + 4} height={2 * s + 4} className={small ? "pt-mini small" : "pt-mini"}>
      {cells[type].map(([x, y], i) => (
        <rect key={i} x={x * s + 2} y={y * s + 2} width={s - 1} height={s - 1} rx={3}
          fill={COLORS[type]} stroke={DARK[type]} strokeWidth={1.5} />
      ))}
    </svg>
  );
}

function MiniBoard() {
  const demo: number[][] = [
    [0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0],
    [0, 1, 1, 5, 0],
    [4, 4, 0, 5, 5],
    [4, 4, 7, 7, 7],
  ];
  const s = 26;
  return (
    <svg width={5 * s} height={5 * s} className="pt-demo">
      {demo.flatMap((row, y) => row.map((c, x) => c ? (
        <rect key={`${x}${y}`} x={x * s + 1} y={y * s + 1} width={s - 2} height={s - 2} rx={6}
          fill={COLORS[c]} stroke={DARK[c]} strokeWidth={2} />
      ) : null))}
    </svg>
  );
}

function draw(ctx: CanvasRenderingContext2D, S: {
  board: Board; cur: Piece | null; particles: Particle[]; over: boolean; started: boolean;
}) {
  // 배경
  const bg = ctx.createLinearGradient(0, 0, 0, BH);
  bg.addColorStop(0, "#fdf2f8");
  bg.addColorStop(1, "#fce7f3");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, BW, BH);
  // 격자
  ctx.strokeStyle = "rgba(244,114,182,0.12)";
  ctx.lineWidth = 1;
  for (let x = 1; x < COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, BH);
    ctx.stroke();
  }
  for (let y = 1; y < ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(BW, y * CELL);
    ctx.stroke();
  }
  // 고정 블록
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = S.board[y][x];
      if (c) block(ctx, x, y, c, 1);
    }
  }
  // 고스트 + 현재
  if (S.cur && !S.over) {
    const gy = ghostY(S.board, S.cur);
    for (const [x, y] of cellsOf({ ...S.cur, y: gy })) {
      if (y < 0) continue;
      ctx.globalAlpha = 0.3;
      block(ctx, x, y, S.cur.type, 1);
      ctx.globalAlpha = 1;
    }
    for (const [x, y] of cellsOf(S.cur)) {
      if (y < 0) continue;
      block(ctx, x, y, S.cur.type, 1);
    }
  }
  // 파티클
  for (const p of S.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function block(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, alpha: number) {
  const px = x * CELL;
  const py = y * CELL;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = COLORS[t];
  ctx.strokeStyle = DARK[t];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(px + 1, py + 1, CELL - 2, CELL - 2, 7);
  ctx.fill();
  ctx.stroke();
  // 광택
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.roundRect(px + 5, py + 4, CELL - 10, 8, 4);
  ctx.fill();
  ctx.globalAlpha = 1;
}
