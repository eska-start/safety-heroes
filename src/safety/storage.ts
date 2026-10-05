// 최고 기록 + 건물별 별 저장 (localStorage)
export type Place = "fire" | "police" | "home" | "street";

export interface Records {
  fireBest: number;
  stars: Record<Place, number>;
}

const KEY = "safety-heroes-records";

const EMPTY: Records = { fireBest: 0, stars: { fire: 0, police: 0, home: 0, street: 0 } };

export function loadRecords(): Records {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(EMPTY);
    const p = JSON.parse(raw) as Partial<Records>;
    return { fireBest: p.fireBest ?? 0, stars: { ...EMPTY.stars, ...p.stars } };
  } catch {
    return structuredClone(EMPTY);
  }
}

function persist(r: Records): Records {
  try {
    localStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    /* ignore */
  }
  return r;
}

export function saveFire(score: number, stars: number): Records {
  const r = loadRecords();
  r.fireBest = Math.max(r.fireBest, score);
  r.stars.fire = Math.max(r.stars.fire, stars);
  return persist(r);
}

export function saveMission(place: Exclude<Place, "fire">, stars: number): Records {
  const r = loadRecords();
  r.stars[place] = Math.max(r.stars[place], stars);
  return persist(r);
}

export const starsText = (s: number) => "★".repeat(s) + "☆".repeat(Math.max(0, 3 - s));
