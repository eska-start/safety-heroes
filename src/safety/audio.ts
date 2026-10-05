// WebAudio 합성 효과음. 외부 파일 없이 동작한다.
let ctx: AudioContext | null = null;
let muted = false;
try {
  muted = localStorage.getItem("sh-muted") === "1";
} catch {
  /* ignore */
}

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem("sh-muted", m ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (m) stopSpray();
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

export function unlockAudioSys() {
  ac();
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.25, when = 0, slideTo?: number) {
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
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export const sfxClick = () => tone(660, 0.12, "triangle", 0.2);
export const sfxDing = (combo: number) => tone(520 + Math.min(combo, 8) * 70, 0.25, "sine", 0.3);
export const sfxBoss = () => {
  tone(220, 0.4, "sawtooth", 0.25);
  tone(330, 0.4, "sawtooth", 0.25, 0.12);
  tone(440, 0.5, "sawtooth", 0.25, 0.24);
};
export const sfxHorn = () => tone(180, 0.5, "sawtooth", 0.3, 0, 140);
export const sfxHurt = () => tone(300, 0.4, "square", 0.2, 0, 120);
export const sfxStep = () => tone(240, 0.08, "triangle", 0.12);
export const sfxFanfare = () => {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, "triangle", 0.28, i * 0.14));
  tone(1319, 0.6, "triangle", 0.25, 0.6);
};
export const sfxFail = () => {
  tone(400, 0.3, "triangle", 0.25);
  tone(300, 0.5, "triangle", 0.25, 0.25);
};

// 호스 물소리 루프
let spray: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
export function startSpray() {
  if (muted || spray) return;
  const c = ac();
  if (!c) return;
  const len = c.sampleRate;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2500;
  const gain = c.createGain();
  gain.gain.value = 0.06;
  src.connect(filter).connect(gain).connect(c.destination);
  src.start();
  spray = { src, gain };
}
export function stopSpray() {
  if (!spray) return;
  try {
    spray.src.stop();
  } catch {
    /* ignore */
  }
  spray = null;
}
