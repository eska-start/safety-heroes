// 파스텔 효과음 (WebAudio 합성)
let ctx: AudioContext | null = null;
let muted = false;
try {
  muted = localStorage.getItem("pt-muted") === "1";
} catch {
  /* ignore */
}

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem("pt-muted", m ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function unlock() {
  ac();
}

function tone(freq: number, dur = 0.12, type: OscillatorType = "sine", vol = 0.18, when = 0, slideTo?: number) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export const sMove = () => tone(440, 0.06, "triangle", 0.1);
export const sRotate = () => tone(660, 0.08, "triangle", 0.12, 0, 880);
export const sHold = () => tone(520, 0.1, "triangle", 0.14, 0, 390);
export const sLock = () => tone(220, 0.1, "triangle", 0.16, 0, 160);
export const sHard = () => tone(330, 0.12, "square", 0.08, 0, 110);
export const sClear = (n: number) => {
  const base = [523, 659, 784, 1047];
  for (let i = 0; i < Math.min(4, n + 1); i++) tone(base[i], 0.16, "sine", 0.2, i * 0.07);
  if (n >= 4) {
    [1047, 1319, 1568].forEach((f, i) => tone(f, 0.25, "sine", 0.2, 0.3 + i * 0.1));
  }
};
export const sCombo = (c: number) => tone(700 + Math.min(c, 10) * 60, 0.14, "sine", 0.16);
export const sLevel = () => {
  [523, 659, 784].forEach((f, i) => tone(f, 0.18, "triangle", 0.2, i * 0.1));
};
export const sOver = () => {
  [440, 349, 262].forEach((f, i) => tone(f, 0.3, "triangle", 0.2, i * 0.22));
};
export const sStart = () => {
  [392, 523, 659].forEach((f, i) => tone(f, 0.14, "triangle", 0.18, i * 0.09));
};
