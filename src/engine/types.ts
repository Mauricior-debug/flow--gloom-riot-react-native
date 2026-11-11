import { GloomKind } from '../data/levels';

export type Pos = { r: number; c: number };

export type TileKind =
  | 'path'
  | 'rock'
  | 'water'
  | 'lava'
  | 'gem'
  | 'power'
  | 'shield'
  | 'reroll'
  | 'moves'
  | 'teleport'
  | 'shortcut'
  | 'shortcutLand'
  | 'mystery'
  | 'switch'
  | 'bridgeClosed'
  | 'bridgeOpen'
  | 'sticky'
  | 'crumbly'
  | 'vanishing'
  | 'cracked'
  | 'hazard'
  | 'ice'
  | 'arrow'
  | 'start'
  | 'exit'
  | 'grass';

export type BoardTile = {
  kind: TileKind;
  walkable: boolean;
  arrowDir?: Pos;
  teleportId?: number;
  crackedHits?: number;
  gemTaken?: boolean;
  collected?: boolean;
  switchPressed?: boolean;
  gone?: boolean;
};

export type GloomState = {
  id: string;
  kind: GloomKind | 'minion' | 'emberMinion';
  pos: Pos;
  diceMin: number;
  diceMax: number;
  stunned: number;
  summons: number;
  isMinion?: boolean;
};

export type InventoryRuntime = {
  reroll: number;
  shield: number;
  moves: number;
  revive: number;
  teleport: number;
  lucky: number;
  headStart: number;
};

export type GamePhase =
  | 'ready'
  | 'rolling'
  | 'choosing'
  | 'moving'
  | 'gloom'
  | 'won'
  | 'lost';

export type GameState = {
  levelId: string;
  rows: number;
  cols: number;
  grid: (BoardTile | null)[][];
  pip: Pos;
  hearts: number;
  maxHearts: number;
  turn: number;
  diceMin: number;
  diceMax: number;
  lastRoll: number | null;
  movesLeft: number;
  reachable: Pos[];
  gloomReach: Pos[];
  glooms: GloomState[];
  gemsCollected: number;
  gemsTotal: number;
  gemGoal: number;
  coinsFound: number;
  stickyNext: boolean;
  exitLocked: boolean;
  switchesPressed: number;
  switchTotal: number;
  phase: GamePhase;
  message: string;
  inventory: InventoryRuntime;
  shieldActive: boolean;
  luckyActive: boolean;
  gloomBonusNext: number;
  par: number;
  reward: number;
  boss: boolean;
  startedAt: number;
  pathQueue: Pos[];
  tips: string[];
};
