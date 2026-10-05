"use client";
import { useEffect, useRef, useState } from "react";
import { speak } from "./tts";
import { sfxDing, sfxFanfare, sfxHurt } from "./audio";

type Kind = "police" | "shop" | "candy" | "mask";

const ORDER: { kind: Kind; safe: boolean; line: string }[] = [
  { kind: "police", safe: true, line: "경찰관이에요! 길을 잃으면 도와주세요라고 말해요." },
  { kind: "candy", safe: false, line: "사탕을 준다고 해도 낯선 사람은 따라가면 안돼요!" },
  { kind: "shop", safe: true, line: "가게 아주머니예요! 위험할 땐 가게로 들어가 도움을 요청해요." },
  { kind: "mask", safe: false, line: "이상한 사람이 말을 걸면 싫어요! 하고 큰 소리로 말해요." },
  { kind: "candy", safe: false, line: "또 낯선 사람이에요! 절대 따라가지 않아요." },
  { kind: "shop", safe: true, line: "맞아요! 믿을 수 있는 어른에게 도움을 요청해요." },
];

export function StreetMission({ onFinish }: { onFinish: (stars: number) => void }) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState("이 사람이 말을 걸었어요!");
  const scoreRef = useRef(0);
  const lockRef = useRef(false);
  const cur = ORDER[step];

  useEffect(() => {
    if (step < ORDER.length) {
      speak("이 사람이 말을 걸었어요. 도와달라고 할까요, 싫다고 할까요?");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (!cur) return null;

  const choose = (help: boolean) => {
    if (lockRef.current) return;
    lockRef.current = true;
    const ok = help === cur.safe;
    if (ok) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      sfxDing(scoreRef.current);
      speak(`정답! ${cur.line}`);
      setMsg("정답!");
    } else {
      sfxHurt();
      speak(`땡! ${cur.line}`);
      setMsg("땡! 설명을 들어봐요.");
    }
    setTimeout(() => {
      lockRef.current = false;
      if (step + 1 >= ORDER.length) {
        const n = scoreRef.current;
        const stars = n >= 6 ? 3 : n >= 4 ? 2 : 1;
        sfxFanfare();
        setTimeout(() => onFinish(stars), 1600);
      } else {
        setStep((s) => s + 1);
        setMsg("이 사람이 말을 걸었어요!");
      }
    }, 1900);
  };

  return (
    <div>
      <div className="hud-row">
        <span className="hud-pill">맞춤 {score}/{ORDER.length}</span>
        <span className="hud-pill">🚶 {step + 1}/{ORDER.length}</span>
      </div>
      <p style={{ fontSize: 22 }}>{msg}</p>
      <div className="scene-wrap" style={{ height: "auto", background: "#bae6fd" }}>
        <svg viewBox="0 0 600 380" style={{ width: "100%", display: "block" }}>
          <rect width="600" height="380" fill="#bae6fd" />
          <ellipse cx="300" cy="360" rx="260" ry="40" fill="#86efac" />
          <Person kind={cur.kind} />
          {/* 아이 */}
          <g transform="translate(480,250)">
            <circle cx="0" cy="-70" r="26" fill="#ffd9b3" />
            <circle cx="-9" cy="-73" r="4" fill="#111" />
            <circle cx="9" cy="-73" r="4" fill="#111" />
            <path d="M -10 -60 Q 0 -52 10 -60" stroke="#92400e" strokeWidth="4" fill="none" strokeLinecap="round" />
            <rect x="-22" y="-46" width="44" height="52" rx="16" fill="#f472b6" />
            <rect x="-34" y="-44" width="14" height="34" rx="7" fill="#f472b6" />
            <rect x="20" y="-44" width="14" height="34" rx="7" fill="#f472b6" />
            <rect x="-18" y="6" width="13" height="30" rx="6" fill="#334155" />
            <rect x="5" y="6" width="13" height="30" rx="6" fill="#334155" />
          </g>
        </svg>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <button className="big-btn secondary" onClick={() => choose(true)}>🙏 도와주세요</button>
        <button className="big-btn" onClick={() => choose(false)}>🙅 싫어요!</button>
      </div>
    </div>
  );
}

function Person({ kind }: { kind: Kind }) {
  const isPolice = kind === "police";
  const isShop = kind === "shop";
  const uniform = isPolice ? "#2563eb" : isShop ? "#16a34a" : "#57534e";
  return (
    <g transform="translate(180,220)">
      {/* 몸 */}
      <rect x="-45" y="-60" width="90" height="110" rx="26" fill={uniform} />
      {/* 머리 */}
      <circle cx="0" cy="-105" r="42" fill="#ffd9b3" />
      <circle cx="-14" cy="-108" r="5" fill="#111" />
      <circle cx="14" cy="-108" r="5" fill="#111" />
      {kind === "mask" ? (
        <>
          <rect x="-30" y="-118" width="60" height="24" rx="12" fill="#111827" />
          <path d="M -12 -84 Q 0 -92 12 -84" stroke="#7f1d1d" strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <path d="M -14 -88 Q 0 -78 14 -88" stroke="#92400e" strokeWidth="5" fill="none" strokeLinecap="round" />
      )}
      {isPolice && (
        <>
          <rect x="-40" y="-160" width="80" height="34" rx="8" fill="#1e3a8a" />
          <rect x="-52" y="-132" width="104" height="10" rx="5" fill="#020617" />
          <circle cx="0" cy="-143" r="9" fill="#facc15" />
        </>
      )}
      {isShop && (
        <>
          <path d="M -42 -140 Q 0 -170 42 -140 L 42 -120 Q 0 -145 -42 -120 Z" fill="#f472b6" />
          <rect x="-30" y="-40" width="60" height="50" rx="8" fill="#fff" opacity="0.85" />
        </>
      )}
      {kind === "candy" && (
        <g transform="translate(62,-40)">
          <rect x="-6" y="-40" width="12" height="40" rx="6" fill="#fff" />
          <circle cx="0" cy="-52" r="18" fill="#ef4444" />
          <circle cx="0" cy="-52" r="10" fill="#fff" />
        </g>
      )}
      {/* 말풍선 */}
      <g transform="translate(0,-215)">
        <rect x="-120" y="-44" width="240" height="52" rx="16" fill="#fff" stroke="#0ea5e9" strokeWidth="4" />
        <path d="M -12 8 L 0 26 L 12 8 Z" fill="#fff" stroke="#0ea5e9" strokeWidth="4" />
        <text y="-10" textAnchor="middle" fontSize="26" fill="#0c4a6e">
          {isPolice ? "길을 잃었니?" : isShop ? "어서 오렴!" : kind === "candy" ? "사탕 줄까?" : "이리 오렴…"}
        </text>
      </g>
    </g>
  );
}
