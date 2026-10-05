"use client";
import { useEffect, useState } from "react";
import { isTtsOn, setTtsOn, speak, stopSpeak, unlockAudio } from "./tts";
import { isMuted, setMuted, sfxClick, unlockAudioSys } from "./audio";
import { loadRecords, saveFire, saveMission, starsText, type Records } from "./storage";
import { VillageMap, type Place } from "./Village";
import { FireMission } from "./FireMission";
import { CrossMission } from "./CrossMission";
import { HomeMission } from "./HomeMission";
import { StreetMission } from "./StreetMission";

type Phase = "map" | "play" | "result";

const PLACE_INFO: Record<Place, { name: string; desc: string; intro: string }> = {
  fire: { name: "소방서", desc: "호스로 불 끄기", intro: "소방서에 불이 났어요! 불을 눌러 물을 뿌려요. 연속으로 끄면 콤보!" },
  police: { name: "횡단보도", desc: "차 피해서 건너기", intro: "횡단보도 미션! 차를 피해서 길을 세 번 건너요. 빨간불엔 차가 멈춰요." },
  home: { name: "우리집", desc: "위험한 물건 찾기", intro: "우리집에 위험한 물건 5개가 숨어있어요. 찾아서 눌러봐요!" },
  street: { name: "학교 앞", desc: "좋은 어른 찾기", intro: "낯선 사람이 말을 걸어요! 도와달라고 할지, 싫다고 할지 골라봐요." },
};

export function Game() {
  const [phase, setPhase] = useState<Phase>("map");
  const [place, setPlace] = useState<Place>("fire");
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [won, setWon] = useState(true);
  const [rec, setRec] = useState<Records>(loadRecords);

  const goMap = () => {
    setRec(loadRecords());
    setPhase("map");
  };

  const start = (p: Place) => {
    unlockAudio();
    unlockAudioSys();
    sfxClick();
    setPlace(p);
    setPhase("play");
    speak(PLACE_INFO[p].intro);
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
      {phase === "play" && (
        <PlayScreen
          place={place}
          onBack={goMap}
          onFire={finishFire}
          onMission={(st, w, s) => finishMission(place, st, w, s)}
        />
      )}
      {phase === "result" && (
        <Result place={place} stars={stars} won={won} score={score} onRetry={() => start(place)} onHome={goMap} />
      )}
    </div>
  );
}

function MapScreen({ rec, onGo }: { rec: Records; onGo: (p: Place) => void }) {
  const [mute, setMute] = useState(isMuted());
  const [tts, setTts] = useState(isTtsOn());

  useEffect(() => {
    speak("안전마을에 오신 걸 환영해요! 건물을 눌러 미션을 시작하세요!");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <h1 className="logo">안전마을</h1>
      <p className="subtitle">경찰·소방관 안전교육 체험!</p>
      <div className="village-wrap">
        <VillageMap stars={rec.stars} onGo={onGo} />
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
      <div className="hud-row" style={{ marginTop: 12 }}>
        <button className="icon-btn" onClick={() => { const m = !mute; setMute(m); setMuted(m); }}>
          {mute ? "🔇 소리 끄기" : "🔊 소리 켜기"}
        </button>
        <button className="icon-btn" onClick={() => { const t = !tts; setTts(t); setTtsOn(t); }}>
          {tts ? "🗣 설명 켜기" : "🚫 설명 끄기"}
        </button>
        <button className="icon-btn" onClick={() => speak("건물을 눌러보세요. 소방서, 횡단보도, 우리집, 학교 앞 미션이 있어요!")}>
          🔊 마을 소개
        </button>
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
      {place === "fire" && <FireMission onFinish={onFire} />}
      {place === "police" && <CrossMission onFinish={(s, st, w) => onMission(st, w, s)} />}
      {place === "home" && <HomeMission onFinish={(st) => onMission(st, true, st * 100)} />}
      {place === "street" && <StreetMission onFinish={(st) => onMission(st, st >= 2, st * 100)} />}
    </>
  );
}

const CONFETTI = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];

function Result({
  place, stars, won, score, onRetry, onHome,
}: {
  place: Place;
  stars: number;
  won: boolean;
  score: number;
  onRetry: () => void;
  onHome: () => void;
}) {
  useEffect(() => {
    speak(won ? `미션 성공! 별 ${stars}개!` : "다시 도전해 봐요!");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div style={{ display: "grid", gap: 12 }}>
        <button className="big-btn" onClick={onRetry}>다시 하기</button>
        <button className="big-btn secondary" onClick={onHome}>마을로 가기</button>
      </div>
    </div>
  );
}
