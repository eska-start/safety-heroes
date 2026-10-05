// 브라우저 TTS. 자동재생 정책을 피하기 위해 모든 speak()이
// 사용자 제스처 잠금을 먼저 해제한다.
let voice: SpeechSynthesisVoice | null = null;
let unlocked = false;

function pickVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;
  voice =
    voices.find((v) => v.lang === "ko-KR") ??
    voices.find((v) => v.lang.startsWith("ko")) ??
    voices.find((v) => /korean|한국|yuna|heami|sunhi/i.test(v.name)) ??
    voices[0];
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  pickVoice();
  window.speechSynthesis.onvoiceschanged = pickVoice;
}

/** 첫 터치/클릭 때 호출: iOS·크롬의 음성 잠금을 푼다. */
export function unlockAudio() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (unlocked) {
    try {
      window.speechSynthesis.resume();
    } catch {
      /* ignore */
    }
    return;
  }
  unlocked = true;
  try {
    window.speechSynthesis.resume();
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  unlockAudio();
  pickVoice();
  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();
  // 긴 문장은 끊어서 읽어야 중간에 잘리는 브라우저 버그를 피할 수 있다.
  const chunks = text.match(/[^.!?。！？\n]{1,90}[.!?。！？\n]?|[^.!?。！？\n]+/g) ?? [text];
  chunks.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part.trim());
    u.lang = "ko-KR";
    u.rate = 0.95;
    u.pitch = 1.0;
    if (voice) u.voice = voice;
    if (i === 0) {
      // 첫 조각이 끊기면 전체가 멈추는 경우 방지용 예비 재시작
      u.onerror = () => window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeak() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
