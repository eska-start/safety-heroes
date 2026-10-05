"use client";
import { useEffect, useState } from "react";
import { lessonsOf, type Role } from "./lessons";
import { speak, stopSpeak, unlockAudio } from "./tts";
import { FireGame } from "./FireGame";
import { CrossGame } from "./CrossGame";

type Phase = "home" | "brief" | "play" | "result";

export function Game() {
  const [phase, setPhase] = useState<Phase>("home");
  const [role, setRole] = useState<Role>("fire");
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [won, setWon] = useState(true);

  const go = (p: Phase) => {
    unlockAudio();
    setPhase(p);
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: 20 }}>
      {phase === "home" && (
        <Home
          onPick={(r) => {
            setRole(r);
            go("brief");
            speak(
              r === "fire"
                ? "소방관 미션! 밤거리에 불이 났어요. 호스로 불을 꺼요. 목표는 열 개!"
                : "경찰관 미션! 차가 달리는 길을 세 번 건너요. 빨간불엔 차가 멈춰요.",
            );
          }}
        />
      )}
      {phase === "brief" && (
        <Brief
          role={role}
          onStart={() => go("play")}
          onHome={() => go("home")}
        />
      )}
      {phase === "play" && role === "fire" && (
        <FireGame
          onFinish={(s) => {
            setScore(s);
            setStars(s >= 20 ? 3 : s >= 14 ? 2 : 1);
            setWon(s >= 10);
            setPhase("result");
          }}
        />
      )}
      {phase === "play" && role === "police" && (
        <CrossGame
          onFinish={(st, w) => {
            setStars(st);
            setWon(w);
            setScore(st);
            setPhase("result");
          }}
        />
      )}
      {phase === "result" && (
        <Result
          stars={stars}
          won={won}
          score={score}
          role={role}
          onRetry={() => go("play")}
          onHome={() => go("home")}
        />
      )}
    </div>
  );
}

function Home({ onPick }: { onPick: (r: Role) => void }) {
  return (
    <>
      <h1 style={{ fontSize: 36, margin: "8px 0" }}>🦸 안전히어로즈 출동!</h1>
      <p style={{ fontSize: 22 }}>미션을 골라봐!</p>
      <div style={{ display: "grid", gap: 16 }}>
        <button className="role-card" onClick={() => onPick("fire")}>
          <div style={{ fontSize: 64 }}>🚒</div>
          <div>소방관: 불 끄기 출동</div>
          <div style={{ fontSize: 18, color: "#666" }}>호스로 불 10개 끄기 · 60초</div>
        </button>
        <button className="role-card" onClick={() => onPick("police")}>
          <div style={{ fontSize: 64 }}>👮</div>
          <div>경찰관: 횡단보도 건너기</div>
          <div style={{ fontSize: 18, color: "#666" }}>차 피해서 3번 건너기 · 목숨 3개</div>
        </button>
      </div>
      <button
        className="big-btn secondary"
        style={{ marginTop: 16 }}
        onClick={() => speak("소방관은 불 끄기, 경찰관은 길 건너기 미션이야. 하나를 눌러봐!")}
      >
        🔊 설명 듣기
      </button>
    </>
  );
}

function Brief({ role, onStart, onHome }: { role: Role; onStart: () => void; onHome: () => void }) {
  const lessons = lessonsOf(role).slice(0, 2);
  useEffect(() => {
    const text = lessons.map((l) => `${l.title}. ${l.script}`).join(" ");
    speak(`출동 전 안전수칙! ${text}`);
    return () => stopSpeak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  return (
    <>
      <h1 style={{ fontSize: 32 }}>{role === "fire" ? "🚒 출동 전 안전수칙" : "👮 출동 전 안전수칙"}</h1>
      {lessons.map((l) => (
        <div key={l.id} style={card}>
          <span style={{ fontSize: 44 }}>{l.icon}</span>
          <div>
            <div style={{ fontSize: 24 }}>{l.title}</div>
            <div style={{ fontSize: 18, color: "#555" }}>{l.script}</div>
          </div>
        </div>
      ))}
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <button
          className="big-btn secondary"
          onClick={() => speak(lessons.map((l) => `${l.title}. ${l.script}`).join(" "))}
        >
          🔊 다시 듣기
        </button>
        <button className="big-btn" onClick={onStart}>
          출동! ➜
        </button>
        <button className="big-btn secondary" onClick={onHome}>
          처음으로
        </button>
      </div>
    </>
  );
}

function Result({
  stars,
  won,
  score,
  role,
  onRetry,
  onHome,
}: {
  stars: number;
  won: boolean;
  score: number;
  role: Role;
  onRetry: () => void;
  onHome: () => void;
}) {
  useEffect(() => {
    speak(won ? `미션 성공! 별 ${stars}개! 정말 훌륭한 히어로예요!` : `아쉬워요. 그래도 별 ${stars}개! 다시 도전해 봐요!`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h1>{won ? "🎉 미션 성공!" : "💪 다시 도전!"}</h1>
      <p style={{ fontSize: 56 }}>{"⭐".repeat(stars)}{"☆".repeat(Math.max(0, 3 - stars))}</p>
      <p style={{ fontSize: 22 }}>
        {role === "fire" ? `끈 불 ${score}개` : `별 ${score}개 획득`}
      </p>
      <div style={{ display: "grid", gap: 12 }}>
        <button className="big-btn" onClick={onRetry}>
          다시 출동
        </button>
        <button className="big-btn secondary" onClick={onHome}>
          처음으로
        </button>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  background: "#fff",
  borderRadius: 20,
  padding: 16,
  marginBottom: 12,
  boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
};
