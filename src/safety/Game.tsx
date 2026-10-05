"use client";
import { useEffect, useState } from "react";
import { lessonsOf } from "./lessons";
import { useSafety } from "./store";
import { speak, stopSpeak } from "./tts";
import { Scene3D } from "./Scene3D";

function TopBar({ title }: { title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <h1 style={{ fontSize: 32, margin: 0 }}>{title}</h1>
    </div>
  );
}

function Home() {
  const setRole = useSafety((s) => s.setRole);
  const setPhase = useSafety((s) => s.setPhase);
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 20 }}>
      <TopBar title="🦸 도와줘요 안전히어로즈" />
      <p style={{ fontSize: 22 }}>누구와 배울까? 눌러봐!</p>
      <div style={{ display: "grid", gap: 16 }}>
        <button
          className="role-card"
          onClick={() => {
            setRole("fire");
            setPhase("learn");
            speak("소방관과 불조심을 배워요. 불이 나면 일일구에 전화해요.");
          }}
        >
          🚒 소방관
          <div style={{ fontSize: 18 }}>불조심 배우기</div>
        </button>
        <button
          className="role-card"
          onClick={() => {
            setRole("police");
            setPhase("learn");
            speak("경찰관과 길조심을 배워요. 횡단보도에서 손을 들고 건너요.");
          }}
        >
          👮 경찰관
          <div style={{ fontSize: 18 }}>길조심 배우기</div>
        </button>
      </div>
      <button
        className="big-btn secondary"
        style={{ marginTop: 16 }}
        onClick={() => speak("소방관이나 경찰관을 눌러봐. 소리가 나올거야.")}
      >
        🔊 소리 내기
      </button>
    </div>
  );
}

function Learn() {
  const role = useSafety((s) => s.role);
  const step = useSafety((s) => s.step);
  const next = useSafety((s) => s.next);
  const setPhase = useSafety((s) => s.setPhase);
  const reset = useSafety((s) => s.reset);
  const lessons = lessonsOf(role);
  const lesson = lessons[step];

  useEffect(() => {
    if (lesson) speak(`${lesson.title}. ${lesson.script}`);
    return () => stopSpeak();
  }, [lesson]);

  if (!lesson) {
    setPhase("quiz");
    return null;
  }
  const last = step === lessons.length - 1;
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 20 }}>
      <TopBar title={`${lesson.icon} ${lesson.title}`} />
      <div className="scene-wrap">
        <Scene3D lesson={lesson} />
      </div>
      <p style={{ fontSize: 24 }}>{lesson.script}</p>
      <div style={{ display: "grid", gap: 12 }}>
        <button className="big-btn secondary" onClick={() => speak(`${lesson.title}. ${lesson.script}`)}>
          🔊 다시 듣기
        </button>
        <button
          className="big-btn"
          onClick={() => {
            if (last) {
              setPhase("quiz");
              speak("이제 문제를 풀어보자!");
            } else {
              next();
            }
          }}
        >
          {last ? "문제 풀기 ➜" : "다음 ➜"}
        </button>
        <button className="big-btn secondary" onClick={reset}>
          처음으로
        </button>
      </div>
      <p style={{ fontSize: 18 }}>
        {step + 1} / {lessons.length}
      </p>
    </div>
  );
}

function Quiz() {
  const role = useSafety((s) => s.role);
  const quizStep = useSafety((s) => s.quizStep);
  const nextQuiz = useSafety((s) => s.nextQuiz);
  const addStar = useSafety((s) => s.addStar);
  const stars = useSafety((s) => s.stars);
  const setPhase = useSafety((s) => s.setPhase);
  const lessons = lessonsOf(role);
  const lesson = lessons[quizStep];
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    setPicked(null);
    if (lesson) speak(lesson.quiz.question);
  }, [lesson]);

  if (!lesson) {
    setPhase("done");
    return null;
  }
  const q = lesson.quiz;
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 20 }}>
      <TopBar title={`⭐ ${stars}개`} />
      <div className="scene-wrap">
        <Scene3D lesson={lesson} />
      </div>
      <p style={{ fontSize: 26 }}>{q.question}</p>
      <div style={{ display: "flex", gap: 12 }}>
        {q.options.map((opt, i) => (
          <button
            key={i}
            className={`choice-btn${picked === null ? "" : i === q.correct ? " correct" : picked === i ? " wrong" : ""}`}
            onClick={() => {
              if (picked !== null) return;
              setPicked(i);
              if (i === q.correct) {
                addStar();
                speak("정답! 정말 잘했어요!");
              } else {
                speak("괜찮아, 다시 생각해보자. 소리를 들어봐.");
              }
            }}
          >
            {opt}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <button className="big-btn secondary" onClick={() => speak(q.question)}>
          🔊 문제 듣기
        </button>
        {picked !== null && (
          <button
            className="big-btn"
            onClick={() => {
              if (quizStep + 1 >= lessons.length) {
                setPhase("done");
                speak("다 풀었어! 참 잘했어요!");
              } else {
                nextQuiz();
              }
            }}
          >
            다음 ➜
          </button>
        )}
      </div>
    </div>
  );
}

function Done() {
  const stars = useSafety((s) => s.stars);
  const reset = useSafety((s) => s.reset);

  useEffect(() => {
    speak(`별을 ${stars}개 모았어요! 안전히어로!`);
  }, [stars]);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 20, textAlign: "center" }}>
      <h1>🎉 안전히어로! 🎉</h1>
      <p style={{ fontSize: 40 }}>{"⭐".repeat(Math.max(1, Math.min(4, stars)))} </p>
      <p style={{ fontSize: 22 }}>별 {stars}개!</p>
      <button className="big-btn" onClick={reset}>
        다시 하기
      </button>
    </div>
  );
}

export function Game() {
  const phase = useSafety((s) => s.phase);
  if (phase === "home") return <Home />;
  if (phase === "learn") return <Learn />;
  if (phase === "quiz") return <Quiz />;
  return <Done />;
}
