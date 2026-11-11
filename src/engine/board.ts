import { LevelDef, resolveLevel } from '../data/levels';
import { BoardTile, GameState, GloomState, Pos } from './types';

const DIRS: Pos[] = [
  { r: -1, c: 0 },
  { r: 1, c: 0 },
  { r: 0, c: -1 },
  { r: 0, c: 1 },
];

export function key(p: Pos) {
  return `${p.r},${p.c}`;
}

export function inBounds(state: { rows: number; cols: number }, p: Pos) {
  return p.r >= 0 && p.c >= 0 && p.r < state.rows && p.c < state.cols;
}

export function neighbors(p: Pos): Pos[] {
  return DIRS.map((d) => ({ r: p.r + d.r, c: p.c + d.c }));
}

function parseChar(
  ch: string,
  teleportCounter: { n: number },
  shortcut: { from?: Pos; to?: Pos },
  r: number,
  c: number
): BoardTile | null {
  if (ch === ' ') return null;

  const base = (kind: BoardTile['kind'], extra: Partial<BoardTile> = {}): BoardTile => ({
    kind,
    walkable: !['rock', 'bridgeClosed'].includes(kind),
    ...extra,
  });

  switch (ch) {
    case 'S':
      return base('start');
    case 'E':
      return base('exit');
    case '.':
      return base('path');
    case '#':
      return base('rock');
    case '~':
      return base('water');
    case 'V':
      return base('lava');
    case '*':
      return base('gem');
    case 'P':
      return base('power');
    case 'H':
      return base('shield');
    case 'R':
      return base('reroll');
    case '+':
      return base('moves');
    case 'T': {
      const id = Math.floor(teleportCounter.n / 2);
      teleportCounter.n += 1;
      return base('teleport', { teleportId: id });
    }
    case 'O':
      shortcut.from = { r, c };
      return base('shortcut');
    case 'o':
      shortcut.to = { r, c };
      return base('shortcutLand');
    case '?':
      return base('mystery');
    case 'W':
      return base('switch');
    case 'B':
      return base('bridgeClosed');
    case 'b':
      return base('bridgeOpen');
    case 'K':
      return base('sticky');
    case 'C':
      return base('crumbly');
    case 'D':
      return base('vanishing');
    case 'X':
      return base('cracked', { crackedHits: 0 });
    case 'Z':
      return base('hazard');
    case 'I':
      return base('ice');
    case '>':
      return base('arrow', { arrowDir: { r: 0, c: 1 } });
    case '<':
      return base('arrow', { arrowDir: { r: 0, c: -1 } });
    case '^':
      return base('arrow', { arrowDir: { r: -1, c: 0 } });
    case 'v':
      return base('arrow', { arrowDir: { r: 1, c: 0 } });
    default:
      if (ch >= '1' && ch <= '9') return base('path');
      return base('path');
  }
}

export function buildBoard(level: LevelDef): {
  grid: (BoardTile | null)[][];
  start: Pos;
  exit: Pos;
  gloomSpawns: { index: number; pos: Pos }[];
  gemsTotal: number;
  switchTotal: number;
  cols: number;
  rows: number;
} {
  const rows = level.rows.length;
  const cols = Math.max(...level.rows.map((r) => r.length));
  const grid: (BoardTile | null)[][] = [];
  const teleportCounter = { n: 0 };
  const shortcut: { from?: Pos; to?: Pos } = {};
  let start: Pos = { r: 0, c: 0 };
  let exit: Pos = { r: 0, c: 0 };
  const gloomSpawns: { index: number; pos: Pos }[] = [];
  let gemsTotal = 0;
  let switchTotal = 0;

  for (let r = 0; r < rows; r++) {
    const line = level.rows[r].padEnd(cols, ' ');
    const row: (BoardTile | null)[] = [];
    for (let c = 0; c < cols; c++) {
      const ch = line[c];
      if (ch >= '1' && ch <= '9') {
        gloomSpawns.push({ index: Number(ch) - 1, pos: { r, c } });
      }
      const tile = parseChar(ch, teleportCounter, shortcut, r, c);
      if (tile?.kind === 'start') start = { r, c };
      if (tile?.kind === 'exit') exit = { r, c };
      if (tile?.kind === 'gem') gemsTotal += 1;
      if (tile?.kind === 'switch') switchTotal += 1;
      row.push(tile);
    }
    grid.push(row);
  }

  return { grid, start, exit, gloomSpawns, gemsTotal, switchTotal, cols, rows };
}

export function createGame(
  level: LevelDef,
  inventory: GameState['inventory'],
  useHeadStart: boolean
): GameState {
  const resolved = resolveLevel(level);
  const built = buildBoard(level);
  const glooms: GloomState[] = level.glooms.map((g, i) => {
    const spawn = built.gloomSpawns.find((s) => s.index === i)?.pos
      ?? built.gloomSpawns[i]?.pos
      ?? { r: built.start.r, c: built.start.c };
    const metaDefaults: Record<string, [number, number]> = {
      chaser: [1, 3],
      blocker: [1, 3],
      wanderer: [1, 4],
      pressure: [1, 2],
      redirector: [1, 3],
      brute: [1, 1],
      gloomKing: [1, 2],
      frostTitan: [1, 2],
      ember: [1, 4],
      magma: [1, 1],
      cinder: [1, 3],
      magmaMonarch: [1, 2],
    };
    const def = metaDefaults[g.kind] ?? [1, 3];
    return {
      id: `g${i}`,
      kind: g.kind,
      pos: spawn,
      diceMin: g.diceMin ?? def[0],
      diceMax: g.diceMax ?? def[1],
      stunned: 0,
      summons: 0,
    };
  });

  return {
    levelId: level.id,
    rows: built.rows,
    cols: built.cols,
    grid: built.grid,
    pip: built.start,
    hearts: resolved.hearts,
    maxHearts: resolved.hearts,
    turn: 0,
    diceMin: resolved.diceMin,
    diceMax: resolved.diceMax,
    lastRoll: null,
    movesLeft: 0,
    reachable: [],
    gloomReach: [],
    glooms,
    gemsCollected: 0,
    gemsTotal: built.gemsTotal,
    gemGoal: resolved.gemGoal,
    coinsFound: 0,
    stickyNext: false,
    exitLocked: !!level.exitLocked,
    switchesPressed: 0,
    switchTotal: built.switchTotal,
    phase: 'ready',
    message: 'Tap ROLL THE DICE',
    inventory: { ...inventory },
    shieldActive: useHeadStart || inventory.headStart > 0 ? true : false,
    luckyActive: false,
    gloomBonusNext: 0,
    par: resolved.par,
    reward: resolved.reward,
    boss: !!level.boss,
    startedAt: Date.now(),
    pathQueue: [],
    tips: level.tips ?? [],
  };
}

export function getTile(state: GameState, p: Pos): BoardTile | null {
  if (!inBounds(state, p)) return null;
  return state.grid[p.r][p.c];
}

export function isWalkable(
  state: GameState,
  p: Pos,
  forGloom = false
): boolean {
  const tile = getTile(state, p);
  if (!tile) return false;
  if (tile.kind === 'rock') return false;
  if (tile.kind === 'bridgeClosed') return false;
  if (tile.kind === 'vanishing') {
    const visible = Math.floor(state.turn / 2) % 2 === 0;
    if (!visible) return false;
  }
  if (tile.gone) return false;
  if (tile.kind === 'exit' && state.exitLocked && !forGloom) return false;
  return true;
}

export function moveCost(state: GameState, p: Pos, forGloom = false): number {
  const tile = getTile(state, p);
  if (!tile) return 99;
  if (tile.kind === 'water' || tile.kind === 'lava') return forGloom ? 1 : 2;
  return 1;
}

export function findPathCost(
  state: GameState,
  from: Pos,
  to: Pos,
  budget: number,
  forGloom = false,
  blocked: Set<string> = new Set()
): Pos[] | null {
  if (key(from) === key(to)) return [from];
  type Node = { pos: Pos; cost: number; path: Pos[] };
  const queue: Node[] = [{ pos: from, cost: 0, path: [from] }];
  const best = new Map<string, number>([[key(from), 0]]);

  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const cur = queue.shift()!;
    for (const n of neighbors(cur.pos)) {
      if (!inBounds(state, n)) continue;
      if (!isWalkable(state, n, forGloom)) continue;
      if (blocked.has(key(n)) && key(n) !== key(to)) continue;
      const step = moveCost(state, n, forGloom);
      const nextCost = cur.cost + step;
      if (nextCost > budget) continue;
      const k = key(n);
      if (best.has(k) && best.get(k)! <= nextCost) continue;
      best.set(k, nextCost);
      const path = [...cur.path, n];
      if (k === key(to)) return path;
      queue.push({ pos: n, cost: nextCost, path });
    }
  }
  return null;
}

export function reachableTiles(state: GameState, budget: number): Pos[] {
  const result: Pos[] = [];
  const seen = new Map<string, number>([[key(state.pip), 0]]);
  const queue: { pos: Pos; cost: number }[] = [{ pos: state.pip, cost: 0 }];

  while (queue.length) {
    const cur = queue.shift()!;
    for (const n of neighbors(cur.pos)) {
      if (!isWalkable(state, n)) continue;
      // cannot pass through glooms
      if (state.glooms.some((g) => g.pos.r === n.r && g.pos.c === n.c)) continue;
      const step = moveCost(state, n);
      const next = cur.cost + step;
      if (next > budget) continue;
      const k = key(n);
      if (seen.has(k) && seen.get(k)! <= next) continue;
      seen.set(k, next);
      result.push(n);
      queue.push({ pos: n, cost: next });
    }
  }
  return result;
}

export function gloomReachable(state: GameState): Pos[] {
  const tiles: Pos[] = [];
  const seen = new Set<string>();
  for (const g of state.glooms) {
    if (g.stunned > 0) continue;
    let max = g.diceMax;
    if (g.kind === 'pressure' || g.kind === 'ember' || g.kind === 'emberMinion') {
      max += Math.min(3, Math.floor(state.turn / 3));
    }
    max += state.gloomBonusNext;
    const local = new Map<string, number>([[key(g.pos), 0]]);
    const queue: { pos: Pos; cost: number }[] = [{ pos: g.pos, cost: 0 }];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const n of neighbors(cur.pos)) {
        if (!isWalkable(state, n, true)) continue;
        const step = moveCost(state, n, true);
        const next = cur.cost + step;
        if (next > max) continue;
        const k = key(n);
        if (local.has(k) && local.get(k)! <= next) continue;
        local.set(k, next);
        if (!seen.has(k)) {
          seen.add(k);
          tiles.push(n);
        }
        queue.push({ pos: n, cost: next });
      }
    }
  }
  return tiles;
}

export function cloneState(state: GameState): GameState {
  return {
    ...state,
    pip: { ...state.pip },
    grid: state.grid.map((row) => row.map((t) => (t ? { ...t } : null))),
    reachable: state.reachable.map((p) => ({ ...p })),
    gloomReach: state.gloomReach.map((p) => ({ ...p })),
    glooms: state.glooms.map((g) => ({ ...g, pos: { ...g.pos } })),
    inventory: { ...state.inventory },
    pathQueue: state.pathQueue.map((p) => ({ ...p })),
    tips: [...state.tips],
  };
}
