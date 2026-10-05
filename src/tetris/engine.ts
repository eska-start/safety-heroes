// 테트리스 코어: 보드·피        스·7-bag·회전킥·점수
export const COLS = 10;
export const ROWS = 20;

export type Cell = number; // 0 = 빈칸, 1..7 = 블록 종류
export type Board = Cell[][];

export const COLORS = [
  "",
  "#f9a8d4", // T 분홍
  "#93c5fd", // J 하늘
  "#fdba74", // L 살구
  "#fde68a", // O 레몬
  "#86efac", // S 민트
  "#c4b5fd", // Z 라벤더
  "#7dd3fc", // I 베이비블루
];

export const DARK: Record<number, string> = {
  1: "#ec4899",
  2: "#3b82f6",
  3: "#f97316",
  4: "#eab308",
  5: "#22c55e",
  6: "#8b5cf6",
  7: "#0284c7",
};

// 회전 상태별 셀 좌표 (SRS 스폰 방향 기준)
const SHAPES: Record<number, [number, number][][]> = {
  1: [ // T
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  2: [ // J
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  3: [ // L
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
  4: [ // O
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
  ],
  5: [ // S
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  6: [ // Z
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
  7: [ // I
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
};

// 간이 월킥 오프셋
const KICKS: [number, number][] = [
  [0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1], [0, 1], [-2, 0], [2, 0],
];

export interface Piece {
  type: number;
  rot: number;
  x: number;
  y: number;
}

export const emptyBoard = (): Board =>
  Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0));

export const cellsOf = (p: Piece): [number, number][] =>
  SHAPES[p.type][p.rot].map(([cx, cy]) => [p.x + cx, p.y + cy]);

export function collides(b: Board, p: Piece): boolean {
  for (const [x, y] of cellsOf(p)) {
    if (x < 0 || x >= COLS || y >= ROWS) return true;
    if (y >= 0 && b[y][x] !== 0) return true;
  }
  return false;
}

export function spawnPiece(type: number): Piece {
  return { type, rot: 0, x: type === 4 ? 4 : 3, y: type === 7 ? -1 : 0 };
}

export function tryRotate(b: Board, p: Piece, dir: 1 | -1): Piece | null {
  const rot = (p.rot + (dir === 1 ? 1 : 3)) % 4;
  for (const [kx, ky] of KICKS) {
    const np = { ...p, rot, x: p.x + kx, y: p.y + ky };
    if (!collides(b, np)) return np;
  }
  return null;
}

export function makeBag(): number[] {
  const bag = [1, 2, 3, 4, 5, 6, 7];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export function ghostY(b: Board, p: Piece): number {
  const g = { ...p };
  while (!collides(b, { ...g, y: g.y + 1 })) g.y += 1;
  return g.y;
}

/** 잠금 + 줄 삭제. 반환: 삭제된 줄 수 */
export function lockPiece(b: Board, p: Piece): number {
  for (const [x, y] of cellsOf(p)) {
    if (y < 0) continue;
    b[y][x] = p.type;
  }
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (b[y].every((c) => c !== 0)) {
      b.splice(y, 1);
      b.unshift(Array<Cell>(COLS).fill(0));
      cleared += 1;
      y += 1;
    }
  }
  return cleared;
}

export const LINE_SCORE = [0, 100, 300, 500, 800];
export const gravityMs = (level: number) => Math.max(60, Math.pow(0.8 - (level - 1) * 0.02, level - 1) * 800);
