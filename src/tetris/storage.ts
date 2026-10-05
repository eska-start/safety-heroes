const KEY = "pastel-tetris-best";

export function loadBest(): number {
  try {
    return Number(localStorage.getItem(KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(score: number): number {
  try {
    const best = Math.max(loadBest(), score);
    localStorage.setItem(KEY, String(best));
    return best;
  } catch {
    return score;
  }
}
