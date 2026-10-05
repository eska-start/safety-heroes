"use client";
import { useState } from "react";
import { speak } from "./tts";
import { sfxDing, sfxFanfare, sfxHurt } from "./audio";

interface H { id: string; x: number; y: number; label: string; say: string }

const HAZARDS: H[] = [
  { id: "lighter", x: 590, y: 300, label: "라이터", say: "라이터를 찾았어요! 라이터와 성냥은 절대 만지지 않아요." },
  { id: "outlet", x: 120, y: 380, label: "콘센트", say: "콘센트를 찾았어요! 젓가락이나 손가락을 넣으면 큰일나요." },
  { id: "pot", x: 400, y: 230, label: "뜨거운 냄비", say: "뜨거운 냄비를 찾았어요! 주방에는 어른과 함께 가요." },
  { id: "medicine", x: 250, y: 330, label: "약병", say: "약병을 찾았어요! 약은 사탕이 아니에요. 어른이 주실 때만 먹어요." },
  { id: "candle", x: 690, y: 200, label: "촛불", say: "촛불을 찾았어요! 불이 있는 곳에서는 뛰지 않아요." },
];

export function HomeMission({ onFinish }: { onFinish: (stars: number) => void }) {
  const [found, setFound] = useState<string[]>([]);
  const [miss, setMiss] = useState(0);
  const [msg, setMsg] = useState("위험한 물건 5개를 찾아 눌러봐!");

  const tap = (id: string | null) => {
    if (found.length >= 5) return;
    if (!id) {
      setMiss((m) => m + 1);
      sfxHurt();
      speak("거긴 안전한 곳이에요. 다른 곳을 찾아봐요.");
      return;
    }
    if (found.includes(id)) return;
    const h = HAZARDS.find((x) => x.id === id)!;
    const next = [...found, id];
    setFound(next);
    sfxDing(next.length);
    setMsg(`${h.label} 발견! (${next.length}/5)`);
    speak(h.say);
    if (next.length >= 5) {
      const stars = miss === 0 ? 3 : miss <= 2 ? 2 : 1;
      sfxFanfare();
      setMsg("5개 다 찾았어요! 우리집 안전왕!");
      setTimeout(() => onFinish(stars), 2200);
    }
  };

  return (
    <div>
      <div className="hud-row">
        <span className="hud-pill">찾음 {found.length}/5</span>
        <span className="hud-pill">😅 {miss}</span>
      </div>
      <p style={{ fontSize: 22 }}>{msg}</p>
      <div className="scene-wrap" style={{ height: "auto", background: "#fde68a" }}>
        <svg viewBox="0 0 800 500" style={{ width: "100%", display: "block" }} onClick={() => tap(null)}>
          {/* 방 */}
          <rect width="800" height="500" fill="#fef3c7" />
          <rect y="400" width="800" height="100" fill="#d6a05c" />
          <rect x="0" y="0" width="800" height="14" fill="#f59e0b" />
          {/* 창문+커튼 */}
          <rect x="620" y="60" width="130" height="130" rx="10" fill="#bfdbfe" stroke="#fff" strokeWidth="8" />
          <rect x="600" y="50" width="34" height="150" rx="10" fill="#f472b6" />
          <rect x="736" y="50" width="34" height="150" rx="10" fill="#f472b6" />
          {/* 촛불 (위험) */}
          <g className="bldg" onClick={(e) => { e.stopPropagation(); tap("candle"); }}>
            <rect x="682" y="230" width="14" height="40" fill="#fff" />
            <ellipse cx="689" cy="220" rx="8" ry="12" fill="#f97316" />
            <rect x="672" y="270" width="34" height="10" rx="4" fill="#92400e" />
            {found.includes("candle") && <FoundRing x={689} y={240} />}
          </g>
          {/* 싱크대+냄비 (위험) */}
          <rect x="330" y="260" width="160" height="20" rx="6" fill="#94a3b8" />
          <rect x="340" y="280" width="140" height="120" fill="#cbd5e1" />
          <g className="bldg" onClick={(e) => { e.stopPropagation(); tap("pot"); }}>
            <ellipse cx="410" cy="255" rx="42" ry="14" fill="#334155" />
            <rect x="368" y="228" width="84" height="30" rx="8" fill="#64748b" />
            <rect x="448" y="236" width="34" height="10" rx="5" fill="#0f172a" />
            <ellipse cx="390" cy="248" rx="10" ry="14" fill="#f97316" opacity="0.8" />
            {found.includes("pot") && <FoundRing x={410} y={240} />}
          </g>
          {/* 식탁+라이터+약병 */}
          <ellipse cx="560" cy="380" rx="110" ry="26" fill="#92400e" />
          <rect x="500" y="380" width="14" height="90" fill="#78350a" />
          <rect x="606" y="380" width="14" height="90" fill="#78350a" />
          <g className="bldg" onClick={(e) => { e.stopPropagation(); tap("lighter"); }}>
            <rect x="582" y="330" width="18" height="34" rx="4" fill="#dc2626" />
            <rect x="586" y="322" width="10" height="10" fill="#9ca3af" />
            {found.includes("lighter") && <FoundRing x={591} y={340} />}
          </g>
          <g className="bldg" onClick={(e) => { e.stopPropagation(); tap("medicine"); }}>
            <rect x="240" y="330" width="30" height="44" rx="6" fill="#fff" stroke="#ef4444" strokeWidth="4" />
            <rect x="246" y="318" width="18" height="14" rx="3" fill="#ef4444" />
            <text x="255" y="360" textAnchor="middle" fontSize="20" fill="#ef4444">약</text>
            {found.includes("medicine") && <FoundRing x={255} y={348} />}
          </g>
          {/* 콘센트 (위험) */}
          <g className="bldg" onClick={(e) => { e.stopPropagation(); tap("outlet"); }}>
            <rect x="100" y="360" width="44" height="60" rx="8" fill="#fff" stroke="#94a3b8" strokeWidth="4" />
            <circle cx="114" cy="384" r="5" fill="#334155" />
            <circle cx="130" cy="384" r="5" fill="#334155" />
            <rect x="110" y="330" width="8" height="36" rx="4" fill="#b45309" transform="rotate(18 114 348)" />
            {found.includes("outlet") && <FoundRing x={122} y={384} />}
          </g>
          {/* 소파 (안전) */}
          <rect x="520" y="400" width="200" height="60" rx="16" fill="#38bdf8" />
          <rect x="510" y="370" width="24" height="70" rx="10" fill="#0284c7" />
          <rect x="706" y="370" width="24" height="70" rx="10" fill="#0284c7" />
          {/* 러그 */}
          <ellipse cx="400" cy="460" rx="150" ry="26" fill="#f472b6" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}

function FoundRing({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="34" fill="none" stroke="#22c55e" strokeWidth="7" />
      <text x={x} y={y - 40} textAnchor="middle" fontSize="30">✅</text>
    </g>
  );
}
