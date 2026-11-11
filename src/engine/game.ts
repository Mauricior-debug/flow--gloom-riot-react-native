import {
  cloneState,
  findPathCost,
  getTile,
  gloomReachable,
  inBounds,
  isWalkable,
  key,
  moveCost,
  neighbors,
  reachableTiles,
} from './board';
import { GameState, Pos } from './types';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function same(a: Pos, b: Pos) {
  return a.r === b.r && a.c === b.c;
}

function dist(a: Pos, b: Pos) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

function findExit(state: GameState): Pos {
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      if (state.grid[r][c]?.kind === 'exit') return { r, c };
    }
  }
  return state.pip;
}

function occupiedByGloom(state: GameState, p: Pos, exceptId?: string) {
  return state.glooms.some(
    (g) => g.id !== exceptId && same(g.pos, p)
  );
}

function hurt(state: GameState, amount: number, reason: string) {
  state.hearts = Math.max(0, state.hearts - amount);
  state.message = reason;
  if (state.hearts <= 0) {
    state.phase = 'lost';
    state.message = 'Out of hearts!';
  }
}

function grantItem(
  state: GameState,
  item: 'shield' | 'reroll' | 'moves'
) {
  state.inventory[item] += 1;
  if (item === 'shield') state.message = 'Got a Shield!';
  if (item === 'reroll') state.message = 'Got a Reroll!';
  if (item === 'moves') state.message = 'Got +2 Moves!';
}

function flipBridges(state: GameState) {
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const t = state.grid[r][c];
      if (!t) continue;
      if (t.kind === 'bridgeClosed') {
        t.kind = 'bridgeOpen';
        t.walkable = true;
      } else if (t.kind === 'bridgeOpen') {
        t.kind = 'bridgeClosed';
        t.walkable = false;
      }
    }
  }
}

function applyEnterEffects(state: GameState, from: Pos | null, to: Pos) {
  const tile = getTile(state, to);
  if (!tile) return;

  if (tile.kind === 'gem' && !tile.gemTaken) {
    tile.gemTaken = true;
    tile.kind = 'path';
    state.gemsCollected += 1;
    state.message = 'Star Gem collected!';
  }

  if (tile.kind === 'hazard') {
    hurt(state, 1, 'Ouch! Hazard!');
  }

  if (tile.kind === 'cracked') {
    tile.crackedHits = (tile.crackedHits ?? 0) + 1;
    if (tile.crackedHits >= 2) {
      hurt(state, 1, 'Cracked ice broke!');
      if (from && isWalkable(state, from)) {
        state.pip = { ...from };
      }
      tile.gone = true;
      tile.kind = 'path';
      tile.walkable = false;
    }
  }

  if (tile.kind === 'switch' && !tile.switchPressed) {
    tile.switchPressed = true;
    state.switchesPressed += 1;
    flipBridges(state);
    if (state.exitLocked && state.switchesPressed >= state.switchTotal) {
      state.exitLocked = false;
      state.message = 'EXIT unlocked!';
    } else {
      state.message = 'Switch flipped!';
    }
  }
}

function applyLanding(state: GameState, prev: Pos, landed: Pos, moveDir?: Pos) {
  let pos = { ...landed };
  const tile = getTile(state, pos);
  if (!tile) {
    state.pip = pos;
    return;
  }

  if (tile.kind === 'shield') {
    grantItem(state, 'shield');
    tile.kind = 'path';
  } else if (tile.kind === 'reroll') {
    grantItem(state, 'reroll');
    tile.kind = 'path';
  } else if (tile.kind === 'moves') {
    grantItem(state, 'moves');
    tile.kind = 'path';
  } else if (tile.kind === 'power') {
    const pick = (['shield', 'reroll', 'moves'] as const)[randInt(0, 2)];
    grantItem(state, pick);
    tile.kind = 'path';
  } else if (tile.kind === 'teleport') {
    const pair = findTeleportPair(state, pos, tile.teleportId!);
    if (pair) {
      pos = pair;
      state.message = 'Whoosh! Teleported!';
    }
  } else if (tile.kind === 'shortcut') {
    const land = findShortcutLand(state);
    if (land) {
      pos = land;
      state.message = 'Hop!';
    }
  } else if (tile.kind === 'sticky') {
    state.stickyNext = true;
    state.message = 'Sticky! Next roll -2.';
  } else if (tile.kind === 'mystery') {
    applyMystery(state);
    tile.kind = 'path';
  }

  // Arrow push
  const afterWarp = getTile(state, pos);
  if (afterWarp?.kind === 'arrow' && afterWarp.arrowDir) {
    const next = {
      r: pos.r + afterWarp.arrowDir.r,
      c: pos.c + afterWarp.arrowDir.c,
    };
    if (isWalkable(state, next) && !occupiedByGloom(state, next)) {
      applyEnterEffects(state, pos, next);
      pos = next;
      state.message = 'Pushed by an arrow!';
    }
  }

  // Ice slide
  const iceTile = getTile(state, pos);
  if (iceTile?.kind === 'ice' && moveDir) {
    const next = { r: pos.r + moveDir.r, c: pos.c + moveDir.c };
    if (isWalkable(state, next) && !occupiedByGloom(state, next)) {
      applyEnterEffects(state, pos, next);
      pos = next;
      state.message = 'Sliding on ice!';
    }
  }

  state.pip = pos;

  const exitTile = getTile(state, pos);
  if (exitTile?.kind === 'exit' && !state.exitLocked) {
    state.phase = 'won';
    state.message = 'Escaped!';
  }
}

function findTeleportPair(state: GameState, from: Pos, id: number): Pos | null {
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const t = state.grid[r][c];
      if (t?.kind === 'teleport' && t.teleportId === id && !(r === from.r && c === from.c)) {
        return { r, c };
      }
    }
  }
  return null;
}

function findShortcutLand(state: GameState): Pos | null {
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      if (state.grid[r][c]?.kind === 'shortcutLand') return { r, c };
    }
  }
  return null;
}

function applyMystery(state: GameState) {
  const roll = randInt(0, 6);
  switch (roll) {
    case 0:
      state.coinsFound += 25;
      state.message = 'Mystery: +25 coins!';
      break;
    case 1:
      grantItem(state, 'shield');
      break;
    case 2:
      grantItem(state, 'reroll');
      break;
    case 3:
      grantItem(state, 'moves');
      break;
    case 4:
      state.glooms.forEach((g) => {
        g.stunned = Math.max(g.stunned, 1);
      });
      state.message = 'Mystery: glooms stunned!';
      break;
    case 5:
      if (state.hearts < state.maxHearts) {
        state.hearts += 1;
        state.message = 'Mystery: healed 1 heart!';
      } else {
        state.coinsFound += 25;
        state.message = 'Mystery: +25 coins!';
      }
      break;
    default:
      state.gloomBonusNext = 1;
      state.message = 'Mystery: glooms +1 next turn!';
  }
}

function destroyCrumbly(state: GameState, p: Pos) {
  const tile = getTile(state, p);
  if (tile?.kind === 'crumbly') {
    tile.gone = true;
    tile.walkable = false;
    tile.kind = 'path';
  }
}

function checkVanishingUnderPip(state: GameState) {
  const tile = getTile(state, state.pip);
  if (tile?.kind === 'vanishing') {
    const visible = Math.floor(state.turn / 2) % 2 === 0;
    if (!visible) {
      hurt(state, 1, 'Tile vanished under Pip!');
      const free = neighbors(state.pip).find(
        (n) => isWalkable(state, n) && !occupiedByGloom(state, n)
      );
      if (free) state.pip = free;
    }
  }
}

export function rollDice(state: GameState): GameState {
  const next = cloneState(state);
  if (next.phase !== 'ready' && next.phase !== 'choosing') return state;

  let min = next.diceMin;
  let max = next.diceMax;
  if (next.luckyActive || next.inventory.lucky > 0) {
    min = Math.max(min, 3);
  }
  let roll = randInt(min, max);
  if (next.stickyNext) {
    roll = Math.max(1, roll - 2);
    next.stickyNext = false;
  }
  if (next.inventory.moves > 0) {
    // optional use is separate; roll itself doesn't auto-spend +2
  }
  next.lastRoll = roll;
  next.movesLeft = roll;
  next.turn += 1;
  next.phase = 'choosing';
  next.reachable = reachableTiles(next, next.movesLeft);
  next.gloomReach = gloomReachable(next);
  next.message = `Rolled ${roll}! Tap a glowing tile.`;
  checkVanishingUnderPip(next);
  return next;
}

export function useReroll(state: GameState): GameState {
  if (state.inventory.reroll <= 0) return state;
  if (state.phase !== 'choosing') return state;
  const next = cloneState(state);
  next.inventory.reroll -= 1;
  next.turn -= 1;
  next.phase = 'ready';
  return rollDice(next);
}

export function useExtraMoves(state: GameState): GameState {
  if (state.inventory.moves <= 0) return state;
  if (state.phase !== 'choosing') return state;
  const next = cloneState(state);
  next.inventory.moves -= 1;
  next.movesLeft += 2;
  next.reachable = reachableTiles(next, next.movesLeft);
  next.message = '+2 moves added!';
  return next;
}

export function useLucky(state: GameState): GameState {
  if (state.inventory.lucky <= 0) return state;
  const next = cloneState(state);
  next.inventory.lucky -= 1;
  next.luckyActive = true;
  next.message = 'Lucky Dice armed!';
  return next;
}

export function useShield(state: GameState): GameState {
  if (state.inventory.shield <= 0) return state;
  const next = cloneState(state);
  next.inventory.shield -= 1;
  next.shieldActive = true;
  next.message = 'Shield up!';
  return next;
}

export function useTeleportBoost(state: GameState, target: Pos): GameState {
  if (state.inventory.teleport <= 0) return state;
  if (state.phase !== 'choosing' && state.phase !== 'ready') return state;
  const path = findPathCost(state, state.pip, target, 4, false);
  if (!path || path.length - 1 > 4) return state;
  // can jump over glooms and water — direct manhattan/chebyshev-ish within 4 walk steps ignoring gloom blocks
  const next = cloneState(state);
  if (dist(next.pip, target) > 4) return state;
  if (!isWalkable(next, target)) return state;
  next.inventory.teleport -= 1;
  const from = { ...next.pip };
  applyEnterEffects(next, from, target);
  applyLanding(next, from, target);
  if (next.phase === 'won' || next.phase === 'lost') return next;
  return afterPipMoved(next).final;
}

export function chooseMove(state: GameState, target: Pos): GameState {
  const sim = simulateWalk(state, target);
  if (!sim) return state;
  return sim.final;
}

/** Intermediate pip steps for animated walking, then final after glooms. */
export function simulateWalk(
  state: GameState,
  target: Pos
): {
  path: Pos[];
  steps: GameState[];
  gloomFrames: GameState[];
  final: GameState;
} | null {
  if (state.phase !== 'choosing') return null;
  if (!state.reachable.some((p) => same(p, target))) return null;
  const path = findPathCost(state, state.pip, target, state.movesLeft, false);
  if (!path || path.length < 2) return null;

  let next = cloneState(state);
  next.phase = 'moving';
  next.pathQueue = path.slice(1);
  const steps: GameState[] = [];

  for (const step of path.slice(1)) {
    const prev = { ...next.pip };
    destroyCrumbly(next, prev);
    const dir = { r: step.r - prev.r, c: step.c - prev.c };
    applyEnterEffects(next, prev, step);
    if ((next.phase as GameState['phase']) === 'lost') {
      steps.push(cloneState(next));
      return { path: path.slice(1), steps, gloomFrames: [], final: next };
    }
    applyLanding(next, prev, step, dir);
    steps.push(cloneState(next));
    if ((next.phase as GameState['phase']) === 'won' || (next.phase as GameState['phase']) === 'lost') {
      return { path: path.slice(1), steps, gloomFrames: [], final: next };
    }
  }

  next.pathQueue = [];
  const { gloomFrames, final } = afterPipMoved(next);
  return { path: path.slice(1), steps, gloomFrames, final };
}

function finishGloomPhase(state: GameState): GameState {
  if (state.phase === 'won' || state.phase === 'lost') return state;
  state.gloomBonusNext = 0;
  state.luckyActive = false;
  state.phase = 'ready';
  state.reachable = [];
  state.gloomReach = gloomReachable(state);
  state.movesLeft = 0;
  if (!state.message || state.message.startsWith('Rolled')) {
    state.message = 'Tap ROLL THE DICE';
  }
  return state;
}

function afterPipMoved(state: GameState): { gloomFrames: GameState[]; final: GameState } {
  if (state.phase === 'won' || state.phase === 'lost') {
    return { gloomFrames: [], final: state };
  }
  state.phase = 'gloom';
  const gloomFrames: GameState[] = [];
  state = runGlooms(state, gloomFrames);
  const final = finishGloomPhase(state);
  return { gloomFrames, final };
}

function auraKinds(kind: string) {
  return ['brute', 'gloomKing', 'frostTitan', 'magma', 'magmaMonarch'].includes(kind);
}

function runGlooms(state: GameState, frames?: GameState[]): GameState {
  const exit = findExit(state);
  const pushFrame = () => {
    if (frames) frames.push(cloneState(state));
  };

  for (const g of state.glooms) {
    if (state.phase === 'lost' || state.phase === 'won') break;
    if (g.stunned > 0) {
      g.stunned -= 1;
      g.lastRoll = null;
      continue;
    }

    // Frost titan stomp every other turn
    if (g.kind === 'frostTitan' && state.turn % 2 === 0) {
      frostStomp(state, g.pos);
      pushFrame();
    }

    // Summons
    if (
      (g.kind === 'gloomKing' || g.kind === 'magmaMonarch') &&
      state.turn > 0 &&
      state.turn % 3 === 0 &&
      g.summons < 3
    ) {
      const spot = neighbors(g.pos).find(
        (n) => isWalkable(state, n, true) && !occupiedByGloom(state, n) && !same(n, state.pip)
      );
      if (spot) {
        g.summons += 1;
        state.glooms.push({
          id: `${g.id}-m${g.summons}`,
          kind: g.kind === 'magmaMonarch' ? 'emberMinion' : 'minion',
          pos: spot,
          diceMin: 1,
          diceMax: 2,
          stunned: 1,
          summons: 0,
          isMinion: true,
          lastRoll: null,
        });
        state.message =
          g.kind === 'magmaMonarch' ? 'Monarch summoned Ember!' : 'King summoned a minion!';
        pushFrame();
      }
    }

    let diceMax = g.diceMax;
    let diceMin = g.diceMin;
    if (g.kind === 'pressure' || g.kind === 'ember' || g.kind === 'emberMinion') {
      diceMax += Math.min(3, Math.floor(state.turn / 3));
    }
    diceMax += state.gloomBonusNext;
    const steps = randInt(diceMin, diceMax);
    g.lastRoll = steps;

    const teammateBlocks = new Set(
      state.glooms.filter((o) => o.id !== g.id).map((o) => key(o.pos))
    );

    let target: Pos | null = null;
    if (g.kind === 'blocker') {
      target = approachExit(state, g.pos, exit, steps, teammateBlocks);
    } else if (g.kind === 'wanderer' || g.kind === 'ember' || g.kind === 'emberMinion') {
      const chasePath = findPathCost(state, g.pos, state.pip, steps, true, teammateBlocks);
      if (chasePath) {
        target = chaseToward(state, g, state.pip, steps, teammateBlocks);
      } else {
        target = wander(state, g.pos, steps, teammateBlocks);
      }
    } else if (g.kind === 'redirector' || g.kind === 'cinder') {
      target = chaseToward(state, g, state.pip, steps, teammateBlocks);
    } else {
      // chaser, pressure, brute, kings, titans, magma, minion
      target = chaseToward(state, g, state.pip, steps, teammateBlocks);
    }

    if (target) {
      // Stop before teammate tile — step one tile at a time for animation frames
      const path = findPathCost(state, g.pos, target, steps, true, new Set());
      if (path) {
        for (const step of path.slice(1)) {
          if (teammateBlocks.has(key(step))) break;
          g.pos = step;
          pushFrame();
        }
      }
    } else {
      pushFrame();
    }

    // Catch Pip?
    if (same(g.pos, state.pip)) {
      if (state.shieldActive || state.inventory.shield > 0) {
        if (!state.shieldActive) state.inventory.shield -= 1;
        state.shieldActive = false;
        g.stunned = Math.max(g.stunned, 1);
        state.message = 'Shield saved Pip!';
        pushFrame();
      } else {
        state.phase = 'lost';
        state.message = 'Caught by a gloom!';
        pushFrame();
        return state;
      }
    }

    // Redirector shove
    if (
      (g.kind === 'redirector' || g.kind === 'cinder') &&
      dist(g.pos, state.pip) <= 2
    ) {
      shovePip(state, exit);
      pushFrame();
    }

    // Aura damage
    if (auraKinds(g.kind) && dist(g.pos, state.pip) === 1) {
      hurt(state, 1, `${g.kind} aura!`);
      pushFrame();
      if ((state.phase as GameState['phase']) === 'lost') return state;
    }
  }

  // If shield blocked catch, ensure gloom not on pip
  for (const g of state.glooms) {
    if (same(g.pos, state.pip) && g.stunned > 0) {
      const back = neighbors(g.pos).find(
        (n) => isWalkable(state, n, true) && !occupiedByGloom(state, n, g.id) && !same(n, state.pip)
      );
      if (back) g.pos = back;
    }
  }

  return state;
}

function frostStomp(state: GameState, from: Pos) {
  const candidates: Pos[] = [];
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const p = { r, c };
      if (dist(from, state.pip) > 0 && dist(p, state.pip) <= 2) {
        const t = getTile(state, p);
        if (t && (t.kind === 'path' || t.kind === 'start' || t.kind === 'ice')) {
          candidates.push(p);
        }
      }
    }
  }
  // crack tiles near Pip within 2 of Pip (titan ability)
  const nearPip: Pos[] = [];
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const p = { r, c };
      if (dist(p, state.pip) <= 2) {
        const t = getTile(state, p);
        if (t && (t.kind === 'path' || t.kind === 'start' || t.kind === 'ice')) {
          nearPip.push(p);
        }
      }
    }
  }
  shuffle(nearPip);
  nearPip.slice(0, 3).forEach((p) => {
    const t = getTile(state, p)!;
    t.kind = 'cracked';
    t.crackedHits = 0;
  });
  state.message = 'Frost Stomp!';
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function chaseToward(
  state: GameState,
  g: { id: string; pos: Pos },
  goal: Pos,
  steps: number,
  teammateBlocks: Set<string>
): Pos {
  // Prefer clear path; if blocked by teammate, chase clear path and stop before teammate
  const clear = findPathCost(state, g.pos, goal, steps, true, teammateBlocks);
  if (clear && clear.length > 1) {
    return pickStepAlong(clear, steps);
  }
  const any = findPathCost(state, g.pos, goal, steps + 6, true, new Set());
  if (any && any.length > 1) {
    // stop before teammate
    let dest = g.pos;
    let used = 0;
    for (const step of any.slice(1)) {
      const cost = moveCost(state, step, true);
      if (used + cost > steps) break;
      if (teammateBlocks.has(key(step))) break;
      dest = step;
      used += cost;
    }
    return dest;
  }
  return g.pos;
}

function pickStepAlong(path: Pos[], steps: number): Pos {
  // path includes start; approximate 1 cost per tile for destination pick
  const idx = Math.min(path.length - 1, steps);
  return path[idx];
}

function approachExit(
  state: GameState,
  from: Pos,
  exit: Pos,
  steps: number,
  blocked: Set<string>
): Pos {
  const path = findPathCost(state, from, exit, steps + 8, true, blocked);
  if (!path || path.length < 2) return from;
  // Prefer to sit on route — move toward exit but not onto exit
  let dest = from;
  let used = 0;
  for (const step of path.slice(1)) {
    if (same(step, exit)) break;
    const cost = moveCost(state, step, true);
    if (used + cost > steps) break;
    dest = step;
    used += cost;
  }
  return dest;
}

function wander(
  state: GameState,
  from: Pos,
  steps: number,
  blocked: Set<string>
): Pos {
  let pos = from;
  for (let i = 0; i < steps; i++) {
    const opts = neighbors(pos).filter(
      (n) => isWalkable(state, n, true) && !blocked.has(key(n)) && !same(n, state.pip)
    );
    if (!opts.length) break;
    pos = opts[randInt(0, opts.length - 1)];
  }
  return pos;
}

function shovePip(state: GameState, exit: Pos) {
  const opts = neighbors(state.pip).filter(
    (n) => isWalkable(state, n) && !occupiedByGloom(state, n)
  );
  if (!opts.length) return;
  opts.sort((a, b) => dist(b, exit) - dist(a, exit));
  const dest = opts[0];
  if (dist(dest, exit) > dist(state.pip, exit)) {
    applyEnterEffects(state, state.pip, dest);
    state.pip = dest;
    state.message = 'Shoved!';
  }
}

export function useRevive(state: GameState): GameState {
  if (state.phase !== 'lost') return state;
  if (state.inventory.revive <= 0) return state;
  const next = cloneState(state);
  next.inventory.revive -= 1;
  next.phase = 'ready';
  next.hearts = Math.max(1, next.hearts);
  next.message = 'Revived! Keep going.';
  // Stun nearby glooms
  next.glooms.forEach((g) => {
    if (dist(g.pos, next.pip) <= 1) g.stunned = Math.max(g.stunned, 1);
  });
  return next;
}

export function scoreResult(state: GameState) {
  const underPar = Math.max(0, state.par - state.turn);
  const stars =
    1 +
    (state.gemsCollected >= state.gemGoal ? 1 : 0) +
    (state.gemsCollected >= state.gemsTotal && state.gemsTotal > 0 && state.turn <= state.par
      ? 1
      : state.gemsCollected >= state.gemsTotal && state.turn <= state.par
        ? 1
        : 0);

  // Third star: every Star Gem taken AND turn count within par
  let starCount = 1;
  if (state.gemsCollected >= state.gemGoal) starCount += 1;
  if (state.gemsCollected >= state.gemsTotal && state.turn <= state.par) starCount += 1;
  // If no gems on board, second star from goal 0 is automatic; third still needs all gems (0) and par
  if (state.gemsTotal === 0) {
    starCount = 1;
    if (state.gemGoal === 0) starCount = 2;
    if (state.turn <= state.par) starCount = 3;
  }

  const score =
    500 +
    150 * state.gemsCollected +
    100 * state.hearts +
    75 * underPar +
    (state.boss ? 500 : 0);

  const coins =
    (state.reward + 10 * state.gemsCollected + state.coinsFound) * 1;

  const title =
    starCount >= 3 ? 'Perfect Escape' : starCount === 2 ? 'Great Escape' : 'Escaped';
  return { stars: starCount, score, coins, underPar, title };
}

export { inBounds, getTile, isWalkable, key, neighbors };
