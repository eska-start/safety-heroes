// 브라우저 음성합성(TTS) 헬퍼. 글을 몰라도 소리로 배우게 한다.
let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  voice =
    voices.find((v) => v.lang.startsWith("ko")) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    voices[0] ??
    null;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  pickVoice();
  window.speechSynthesis.onvoiceschanged = pickVoice;
}

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.92;
  u.pitch = 1.1;
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

export function stopSpeak() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
