"use client";
import { useEffect, useState } from "react";
import { isTtsOn, setTtsOn, speak, stopSpeak, unlockAudio } from "./tts";
import { isMuted, setMuted, sfxClick, unlockAudioSys } from "./audio";
import { loadRecords, saveFire, saveMission, starsText, type Place, type Records } from "./storage";
import { lessonsOf } from "./lessons";
import { Village3D } from "./Village3D";
import { FireGame } from "./FireGame";
import { CrossGame } from "./CrossGame";
import { Home3D } from "./Home3D";
import { Street3D } from "./Street3D";

type Phase = "map" | "brief" | "play" | "result";

const PLACE_INFO: Record<Place, { name: string; desc: string; intro: string; how: string }> = {
  fire: {
    name: "소방서", desc: "호스로 불 끄기",
    intro: "소방서에 불이 났어요! 불을 눌러 물을 뿌려요.",
    how: "불을 손가락으로 누르면 물이 나가요. 5초 안에 연속으로 끄면 콤보! 3웨이브를 모두 끄면 성공.",
  },
  police: {
    name: "횡단보도", desc: "차 피해서 건너기",
    intro: "횡단보도 미션! 차를 피해서 길을 세 번 건너요.",
    how: "화살표로 한 칸씩 움직여요. 빨간불엔 차가 멈춰요. 아슬아슬하게 피하면 +50점. 목숨 3개, 40초 안에 건너요.",
  },
  home: {
    name: "우리집", desc: "위험한 물건 찾기",
    intro: "우리집에 위험한 물건 5개가 숨어있어요.",
    how: "방을 둘러보고 위험한 물건을 눌러요. 틀리면 오답이 올라가요. 5개를 다 찾으면 성공.",
  },
  street: {
    name: "학교 앞", desc: "좋은 어른 찾기",
    intro: "낯선 사람이 말을 걸어요!",
    how: "도와줘도 되는 어른이면 도와주세요, 낯선 사람이면 싫어요! 6명 중 4명 이상 맞히면 별 2개.",
  },
};

export function Game() {
  const [phase, setPhase] = useState<Phase>("map");
  const [place, setPlace] = useState<Place>("fire");
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [won, setWon] = useState(true);
  const [rec, setRec] = useState<Records>(loadRecords);

  const goMap = () => {
    unlockAudio();
    setRec(loadRecords());
    setPhase("map");
  };

  const start = (p: Place) => {
    unlockAudio();
    unlockAudioSys();
    sfxClick();
    setPlace(p);
    setPhase("brief");
    speak(`${PLACE_INFO[p].name} 미션! ${PLACE_INFO[p].intro} ${PLACE_INFO[p].how}`);
  };

  const finishFire = (s: number) => {
    const st = s >= 3000 ? 3 : s >= 1800 ? 2 : 1;
    setScore(s);
    setStars(st);
    setWon(true);
    setRec(saveFire(s, st));
    setPhase("result");
  };
  const finishMission = (p: Place, st: number, w = true, s = 0) => {
    setStars(st);
    setWon(w);
    setScore(s);
    setRec(saveMission(p as Exclude<Place, "fire">, st));
    setPhase("result");
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "8px 16px 32px" }}>
      {phase === "map" && <MapScreen rec={rec} onGo={start} />}
      {phase === "brief" && (
        <Brief place={place} onStart={() => { unlockAudio(); sfxClick(); setPhase("play"); }} onHome={goMap} />
      )}
      {phase === "play" && (
        <PlayScreen
          place={place}
          onBack={goMap}
          onFire={finishFire}
          onMission={(st, w, s) => finishMission(place, st, w, s)}
        />
      )}
      {phase === "result" && (
        <Result
          place={place} stars={stars} won={won} score={score} rec={rec}
          onRetry={() => start(place)} onHome={goMap}
        />
      )}
    </div>
  );
}

function MapScreen({ rec, onGo }: { rec: Records; onGo: (p: Place) => void }) {
  const [mute, setMute] = useState(isMuted());
  const [tts, setTts] = useState(isTtsOn());
  const total = rec.stars.fire + rec.stars.police + rec.stars.home + rec.stars.street;

  useEffect(() => {
    speak("안전마을에 오신 걸 환영합니다! 건물을 눌러 미션을 시작하세요!");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <h1 className="logo">안전마을</h1>
      <p className="subtitle">경찰·소방관 안전교육 체험! ⭐ {total}/12</p>
      <div className="scene-wrap" style={{ height: "52vh", background: "#7dd3fc" }}>
        <Village3D stars={rec.stars} onGo={onGo} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        {(Object.keys(PLACE_INFO) as Place[]).map((p) => (
          <button key={p} className="mission-card small" onClick={() => onGo(p)}>
            <span>
              <div className="name">{PLACE_INFO[p].name}</div>
              <div className="desc">{PLACE_INFO[p].desc}</div>
              <div className="stars">{starsText(rec.stars[p])}</div>
            </span>
          </button>
        ))}
      </div>
      {total >= 12 && (
        <div className="cert">🏅 안전히어로 인증서 획득!</div>
      )}
      <div className="hud-row" style={{ marginTop: 12 }}>
        <button className="icon-btn" onClick={() => { const m = !mute; setMute(m); setMuted(m); }}>
          {mute ? "🔇 소리 끄기" : "🔊 소리 켜기"}
        </button>
        <button className="icon-btn" onClick={() => { const t = !tts; setTts(t); setTtsOn(t); }}>
          {tts ? "🗣 설명 켜기" : "🚫 설명 끄기"}
        </button>
      </div>
    </>
  );
}

function Brief({ place, onStart, onHome }: { place: Place; onStart: () => void; onHome: () => void }) {
  const rules = lessonsOf(place === "police" ? "police" : place === "fire" ? "fire" : place === "home" ? "fire" : "police").slice(0, 2);
  useEffect(() => {
    speak(`출동 전 안전수칙! ${rules.map((l) => `${l.title}. ${l.script}`).join(" ")}`);
    return () => stopSpeak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place]);

  return (
    <>
      <h1 className="logo" style={{ fontSize: 40 }}>{PLACE_INFO[place].name} 미션</h1>
      <div className="rule-card">
        <span style={{ fontSize: 44 }}>🎮</span>
        <div>
          <div style={{ fontSize: 24 }}>노는 방법</div>
          <div style={{ fontSize: 18, color: "#555" }}>{PLACE_INFO[place].how}</div>
        </div>
      </div>
      {rules.map((l) => (
        <div key={l.id} className="rule-card">
          <span style={{ fontSize: 44 }}>{l.icon}</span>
          <div>
            <div style={{ fontSize: 24 }}>{l.title}</div>
            <div style={{ fontSize: 18, color: "#555" }}>{l.script}</div>
          </div>
        </div>
      ))}
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <button className="big-btn secondary" onClick={() => speak(`${PLACE_INFO[place].how} ${rules.map((l) => `${l.title}. ${l.script}`).join(" ")}`)}>
          🔊 다시 듣기
        </button>
        <button className="big-btn" onClick={onStart}>출동! ➜</button>
        <button className="big-btn secondary" onClick={onHome}>마을로</button>
      </div>
    </>
  );
}

function PlayScreen({
  place, onBack, onFire, onMission,
}: {
  place: Place;
  onBack: () => void;
  onFire: (score: number) => void;
  onMission: (stars: number, won: boolean, score: number) => void;
}) {
  useEffect(() => () => stopSpeak(), []);
  return (
    <>
      <div className="hud-row">
        <button className="icon-btn" onClick={onBack}>◀ 마을로</button>
        <span className="hud-pill">{PLACE_INFO[place].name} 미션</span>
      </div>
      {place === "fire" && <FireGame onFinish={onFire} />}
      {place === "police" && <CrossGame onFinish={(s, st, w) => onMission(st, w, s)} />}
      {place === "home" && <Home3D onFinish={(st) => onMission(st, true, st * 100)} />}
      {place === "street" && <Street3D onFinish={(st) => onMission(st, st >= 2, st * 100)} />}
    </>
  );
}

const CONFETTI = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];

function Result({ place, stars, won, score, rec, onRetry, onHome }: {
  place: Place; stars: number; won: boolean; score: number; rec: Records;
  onRetry: () => void; onHome: () => void;
}) {
  useEffect(() => {
    speak(won ? `미션 성공! 별 ${stars}개!` : "다시 도전해 보세요!");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const total = rec.stars.fire + rec.stars.police + rec.stars.home + rec.stars.street;

  return (
    <div className="result-box">
      {won && Array.from({ length: 24 }).map((_, i) => (
        <span key={i} className="confetti" style={{ left: `${(i * 41) % 100}%`, background: CONFETTI[i % CONFETTI.length], animationDelay: `${(i % 8) * 0.25}s` }} />
      ))}
      <h1 style={{ margin: "4px 0" }}>{won ? "미션 성공!" : "다시 도전!"}</h1>
      <div className="result-stars">
        {[0, 1, 2].map((i) => (
          <span key={i}>{i < stars ? "⭐" : "☆"}</span>
        ))}
      </div>
      <p style={{ fontSize: 24, margin: "8px 0" }}>{PLACE_INFO[place].name} · {score}점</p>
      <p style={{ fontSize: 20 }}>모은 별 ⭐ {total}/12 {total >= 12 && "🏅 인증서 획득!"}</p>
      <div style={{ display: "grid", gap: 12 }}>
        <button className="big-btn" onClick={onRetry}>다시 하기</button>
        <button className="big-btn secondary" onClick={onHome}>마을로 가기</button>
      </div>
    </div>
  );
}
