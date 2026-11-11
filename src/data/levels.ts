import { TipId } from './tips';
import { Images } from './assets';

export type WorldTheme = 'meadow' | 'candy' | 'frost' | 'lava' | 'starlight';

export type GloomKind =
  | 'chaser'
  | 'blocker'
  | 'wanderer'
  | 'pressure'
  | 'redirector'
  | 'brute'
  | 'gloomKing'
  | 'frostTitan'
  | 'ember'
  | 'magma'
  | 'cinder'
  | 'magmaMonarch';

export type LevelGloom = {
  kind: GloomKind;
  diceMin?: number;
  diceMax?: number;
  name?: string;
};

export type LevelDef = {
  id: string;
  worldId: string;
  order: number;
  name: string;
  objective: string;
  rows: string[];
  glooms: LevelGloom[];
  gemGoal?: number;
  par?: number;
  reward?: number;
  hearts?: number;
  diceMin?: number;
  diceMax?: number;
  boss?: boolean;
  exitLocked?: boolean;
  tips?: TipId[];
};

export type WorldDef = {
  id: string;
  name: string;
  theme: WorldTheme;
  tagline: string;
  image: number;
  playable: boolean;
  comingSoon?: string;
  badge?: string;
  unlockAfter?: string;
  bossName?: string;
  levels: LevelDef[];
};

const defaultReward = (order: number) => 40 + 10 * order;

export const WORLDS: WorldDef[] = [
  {
    id: 'sunny-meadows',
    name: 'Sunny Meadows',
    theme: 'meadow',
    tagline: 'Where every adventure begins',
    image: Images.meadow,
    playable: true,
    levels: [
      {
        id: 'sm-1',
        worldId: 'sunny-meadows',
        order: 1,
        name: 'First Steps',
        objective: 'Reach the EXIT before the Gloom catches you.',
        rows: ['S.....', '.#..#.', '..1...', '.#..#.', '.....E'],
        glooms: [{ kind: 'chaser', diceMin: 1, diceMax: 1 }],
        par: 4,
        tips: ['basics', 'route', 'gloom', 'exit'],
      },
      {
        id: 'sm-2',
        worldId: 'sunny-meadows',
        order: 2,
        name: 'Forked Paths',
        objective: 'Pick a branch and grab 2 Star Gems on the way.',
        rows: ['S...*..', '.##.##.', '.#1...*', '...##..', '*.#...E'],
        glooms: [{ kind: 'chaser', diceMin: 1, diceMax: 2 }],
        gemGoal: 2,
        par: 5,
        tips: ['gems'],
      },
      {
        id: 'sm-3',
        worldId: 'sunny-meadows',
        order: 3,
        name: 'Pond Hop',
        objective: 'Water slows you down. Collect 2 Star Gems.',
        rows: ['S..~~..*', '..#..#..', '*.P.1.#.', '.#.~~..?', '..*..#.E'],
        glooms: [{ kind: 'chaser', diceMin: 1, diceMax: 2 }],
        gemGoal: 2,
        tips: ['water', 'powerups', 'mystery'],
      },
      {
        id: 'sm-4',
        worldId: 'sunny-meadows',
        order: 4,
        name: 'Double Trouble',
        objective: 'Two Glooms are on patrol. Escape!',
        rows: ['S...#..*.', '.#H.1.#..', '..#...R.E', '*..2#.#..', '...*....#'],
        glooms: [
          { kind: 'chaser' },
          { kind: 'wanderer' },
        ],
        gemGoal: 2,
        tips: ['shields', 'rerolls', 'personality'],
      },
      {
        id: 'sm-5',
        worldId: 'sunny-meadows',
        order: 5,
        name: 'Bridge Switch',
        objective: 'Flip the switch to change which bridge is open.',
        rows: ['S..W. ..*', '.#...B...', '..1.. .#E', '*...+b...', '..... .2.'],
        glooms: [
          { kind: 'chaser', diceMin: 1, diceMax: 2 },
          { kind: 'blocker' },
        ],
        gemGoal: 1,
        par: 6,
        tips: ['switches', 'moves'],
      },
      {
        id: 'sm-6',
        worldId: 'sunny-meadows',
        order: 6,
        name: 'Meadow Mayhem',
        objective: 'Three Glooms and thorny paths. Keep your hearts!',
        rows: [
          'S..*..#..T',
          '.#.Z.#..#.',
          '..1...?...',
          'T.#.#2.#.*',
          '...Z...3.E',
          '.*..#.....',
        ],
        glooms: [
          { kind: 'chaser' },
          { kind: 'wanderer' },
          { kind: 'pressure' },
        ],
        gemGoal: 2,
        par: 7,
        reward: 120,
        tips: ['hazards', 'teleports'],
      },
    ],
  },
  {
    id: 'candy-caverns',
    name: 'Candy Caverns',
    theme: 'candy',
    tagline: 'Sweet, sticky and sneaky',
    image: Images.candy,
    playable: true,
    unlockAfter: 'sm-6',
    bossName: 'Gloom King',
    levels: [
      {
        id: 'cc-1',
        worldId: 'candy-caverns',
        order: 1,
        name: 'Gumdrop Grotto',
        objective: 'Sticky goo stops you cold. Plan around it.',
        rows: ['S..K...*', '.#.#.#K.', '..K.1...', '*.#.#.#.', '...K...E'],
        glooms: [{ kind: 'chaser', diceMin: 1, diceMax: 2 }],
        gemGoal: 2,
        tips: ['sticky'],
      },
      {
        id: 'cc-2',
        worldId: 'candy-caverns',
        order: 2,
        name: 'Crumble Cookie',
        objective: 'Cookie tiles crumble behind you.',
        rows: ['S.CCC..*.', '.#.#.#.#.', '..C.1.C..', '*.#.#.#C.', '...CC...E'],
        glooms: [{ kind: 'chaser', diceMin: 1, diceMax: 3 }],
        gemGoal: 2,
        tips: ['crumbly'],
      },
      {
        id: 'cc-3',
        worldId: 'candy-caverns',
        order: 3,
        name: 'Taffy Twister',
        objective: 'Push arrows shove you around. Beware the Blocker.',
        rows: ['S..>...v.', '.#.#.#.#.', '...2..<..', '^.#.#.#.*', '*..>..1.E'],
        glooms: [
          { kind: 'chaser', diceMin: 1, diceMax: 2 },
          { kind: 'blocker' },
        ],
        gemGoal: 2,
        tips: ['arrows'],
      },
      {
        id: 'cc-4',
        worldId: 'candy-caverns',
        order: 4,
        name: 'Licorice Leap',
        objective: 'Hop pads leap you ahead. Spikes sting!',
        rows: ['S.Z..O.#.', '.#.#...#.', '..1.Z.*2.', '*.#...#Z.', '...Z.o..E'],
        glooms: [
          { kind: 'chaser', diceMin: 1, diceMax: 2 },
          { kind: 'redirector' },
        ],
        gemGoal: 2,
        tips: ['hop', 'hazards'],
      },
      {
        id: 'cc-5',
        worldId: 'candy-caverns',
        order: 5,
        name: 'Sugar Glass',
        objective: 'Glass paths vanish and return. Time your crossing.',
        rows: ['S..DDD..*', '.#.#.#.#.', '..1.D.2..', '*.#DDD#..', '........E'],
        glooms: [
          { kind: 'brute' },
          { kind: 'pressure' },
        ],
        gemGoal: 2,
        par: 7,
        tips: ['glass'],
      },
      {
        id: 'cc-6',
        worldId: 'candy-caverns',
        order: 6,
        name: "Gloom King's Court",
        objective: 'Press both switches to unlock the EXIT, then escape the King!',
        rows: ['S...#...W', '.#.K..#..', '..*..1...', 'W.#.#.#.*', '...?.Z..E'],
        glooms: [{ kind: 'gloomKing' }],
        gemGoal: 1,
        par: 9,
        reward: 250,
        boss: true,
        exitLocked: true,
        tips: ['kingSwitches', 'personality'],
      },
    ],
  },
  {
    id: 'frozen-peaks',
    name: 'Frozen Peaks',
    theme: 'frost',
    tagline: 'Slide fast, think faster',
    image: Images.frost,
    playable: true,
    unlockAfter: 'cc-6',
    bossName: 'Frost Titan',
    levels: [
      {
        id: 'fp-1',
        worldId: 'frozen-peaks',
        order: 1,
        name: 'Slippery Slopes',
        objective: 'Ice keeps you sliding. Use it to go far!',
        rows: ['S.IIII..*', '.#.#.#.#.', '..1.IIII.', '*.#.#.#..', 'IIII....E'],
        glooms: [{ kind: 'chaser', diceMin: 1, diceMax: 2 }],
        gemGoal: 2,
        tips: ['ice'],
      },
      {
        id: 'fp-2',
        worldId: 'frozen-peaks',
        order: 2,
        name: 'Cracked Glacier',
        objective: 'Cracked ice breaks on the second step.',
        rows: ['S.X.X..*', '.#.#.X#.', 'X.1.X...', '.#X#.#X.', '*..X.X.E'],
        glooms: [{ kind: 'chaser', diceMin: 1, diceMax: 2 }],
        gemGoal: 2,
        tips: ['cracked'],
      },
      {
        id: 'fp-3',
        worldId: 'frozen-peaks',
        order: 3,
        name: 'Aurora Portals',
        objective: 'Warp through portals while a Brute guards the pass.',
        rows: ['S..#..T.*', '.#...#...', '..1.#..2.', 'T.#...#..', '*...I...E'],
        glooms: [
          { kind: 'wanderer' },
          { kind: 'brute' },
        ],
        gemGoal: 2,
        tips: ['teleports'],
      },
      {
        id: 'fp-4',
        worldId: 'frozen-peaks',
        order: 4,
        name: 'Blizzard Bridges',
        objective: 'Two switches, two bridges, icy lanes.',
        rows: ['S..W ....', '.II.B.I*.', '..1. ...E', '*.I.b.2..', '.W.. ....'],
        glooms: [
          { kind: 'chaser', diceMin: 1, diceMax: 2 },
          { kind: 'pressure' },
        ],
        gemGoal: 2,
        par: 7,
        tips: ['switches', 'ice'],
      },
      {
        id: 'fp-5',
        worldId: 'frozen-peaks',
        order: 5,
        name: 'Avalanche Run',
        objective: 'Vanishing snow, icicles and three Glooms.',
        rows: ['S.DD..X..*', '.#..#.#.#.', '..1.Z.D.2.', '*.#.X.#...', '..DD..3..E'],
        glooms: [
          { kind: 'chaser' },
          { kind: 'redirector' },
          { kind: 'pressure' },
        ],
        gemGoal: 2,
        par: 8,
        tips: ['glass', 'hazards', 'cracked'],
      },
      {
        id: 'fp-6',
        worldId: 'frozen-peaks',
        order: 6,
        name: "Frost Titan's Peak",
        objective: 'Press both switches, dodge Frost Stomps and escape!',
        rows: ['S..I..#.W', '.#.I.X...', '..X..1.#.', 'W.#.II.X*', '...X...IE'],
        glooms: [{ kind: 'frostTitan' }],
        gemGoal: 1,
        par: 9,
        reward: 300,
        boss: true,
        exitLocked: true,
        tips: ['frostStomp'],
      },
    ],
  },
  {
    id: 'lava-lagoon',
    name: 'Lava Lagoon',
    theme: 'lava',
    tagline: 'Hot paths, hotter escapes',
    image: Images.lavaWorld,
    playable: true,
    unlockAfter: 'fp-6',
    bossName: 'Magma Monarch',
    levels: [
      {
        id: 'll-1',
        worldId: 'lava-lagoon',
        order: 1,
        name: 'Warm Welcome',
        objective: 'Lava pools cost 2 moves. Wade carefully!',
        rows: ['S..VV..*', '.#..#...', '..1..V..', '.#..#..?', '*..VV..E'],
        glooms: [{ kind: 'chaser', diceMin: 1, diceMax: 2 }],
        gemGoal: 2,
        tips: ['lava'],
      },
      {
        id: 'll-2',
        worldId: 'lava-lagoon',
        order: 2,
        name: 'Ember Skitter',
        objective: 'The Ember Sprite speeds up. Grab 2 Star Gems!',
        rows: ['S...*..#.', '.#.#.#...', '..1....V.', '*.V...#..', '...*.#.E'],
        glooms: [{ kind: 'ember' }],
        gemGoal: 2,
      },
      {
        id: 'll-3',
        worldId: 'lava-lagoon',
        order: 3,
        name: 'Basalt Bridges',
        objective: 'Flip switches to open basalt bridges over the lava.',
        rows: ['S..W ....', '.VV.B.V*.', '..1. ...E', '*.V.b.2..', '.W.. ....'],
        glooms: [
          { kind: 'chaser', diceMin: 1, diceMax: 2 },
          { kind: 'blocker' },
        ],
        gemGoal: 2,
        par: 7,
        tips: ['switches', 'lava'],
      },
      {
        id: 'll-4',
        worldId: 'lava-lagoon',
        order: 4,
        name: 'Cinder Cliffs',
        objective: 'The Cinder Shade shoves Pip off course. Mind the spikes!',
        rows: ['S.Z..O.#.', '.#.#...#.', '..1.Z.*2.', '*.#...#Z.', '...Z.o..E'],
        glooms: [
          { kind: 'cinder' },
          { kind: 'chaser' },
        ],
        gemGoal: 2,
        tips: ['hop', 'hazards'],
      },
      {
        id: 'll-5',
        worldId: 'lava-lagoon',
        order: 5,
        name: 'Smoking Run',
        objective: 'Push arrows, vanishing basalt and two hot Glooms.',
        rows: ['S..>...v.', '.#.#.#.#.', '...2..<..', '^.#.#.#.*', '*..>..1.E'],
        glooms: [
          { kind: 'ember' },
          { kind: 'magma' },
        ],
        gemGoal: 2,
        par: 7,
        tips: ['arrows'],
      },
      {
        id: 'll-6',
        worldId: 'lava-lagoon',
        order: 6,
        name: 'Geyser Grotto',
        objective: 'Warp through geysers while three Glooms close in.',
        rows: [
          'S..*..#..T',
          '.#.Z.#..V.',
          '..1...?...',
          'T.#.#2.#.*',
          '...Z...3.E',
        ],
        glooms: [
          { kind: 'chaser' },
          { kind: 'ember' },
          { kind: 'cinder' },
        ],
        gemGoal: 2,
        par: 8,
        reward: 160,
        tips: ['teleports'],
      },
      {
        id: 'll-7',
        worldId: 'lava-lagoon',
        order: 7,
        name: 'Tar Trap',
        objective: 'Sticky tar, crumbling basalt and a scorching Magma Brute.',
        rows: [
          'S..K..X..*',
          '.#.V.#..#.',
          '..1...?...',
          '*.K.#.2..V',
          '..X...3..E',
        ],
        glooms: [
          { kind: 'ember' },
          { kind: 'magma' },
          { kind: 'chaser' },
        ],
        gemGoal: 2,
        par: 8,
        tips: ['sticky', 'cracked'],
      },
      {
        id: 'll-8',
        worldId: 'lava-lagoon',
        order: 8,
        name: "Magma Monarch's Throne",
        objective: 'Press both switches to unlock the EXIT, then escape the Monarch!',
        rows: ['S...#...W', '.#.K..V..', '..*..1...', 'W.#.#.#.*', '...?.Z..E'],
        glooms: [{ kind: 'magmaMonarch' }],
        gemGoal: 1,
        par: 9,
        reward: 350,
        boss: true,
        exitLocked: true,
        tips: ['monarchSwitches'],
      },
    ],
  },
  {
    id: 'starlight-skies',
    name: 'Starlight Skies',
    theme: 'starlight',
    tagline: 'A new sky-high escape is on the way — hop the floating isles and discover Star Gates!',
    image: Images.starlightTeaser,
    playable: false,
    comingSoon: 'A new sky-high escape is on the way — hop the floating isles and discover Star Gates!',
    badge: 'Discover Star Gates',
    levels: [],
  },
];

export function getAllLevels(): LevelDef[] {
  return WORLDS.flatMap((w) => w.levels);
}

export function getLevel(id: string): LevelDef | undefined {
  return getAllLevels().find((l) => l.id === id);
}

export function getWorld(id: string): WorldDef | undefined {
  return WORLDS.find((w) => w.id === id);
}

export function resolveLevel(level: LevelDef) {
  return {
    ...level,
    gemGoal: level.gemGoal ?? 0,
    par: level.par ?? 6,
    reward: level.reward ?? defaultReward(level.order),
    hearts: level.hearts ?? 3,
    diceMin: level.diceMin ?? 1,
    diceMax: level.diceMax ?? 6,
  };
}

export const GLOOM_META: Record<
  GloomKind,
  { name: string; blurb: string; diceDefault: [number, number]; image: number; ring: string }
> = {
  chaser: {
    name: 'Gloom',
    blurb: 'Walks toward Pip.',
    diceDefault: [1, 3],
    image: Images.gloom,
    ring: '#3B3B55',
  },
  blocker: {
    name: 'Blocker Gloom',
    blurb: 'Stands on the route to the EXIT.',
    diceDefault: [1, 3],
    image: Images.gloom,
    ring: '#7B3FE4',
  },
  wanderer: {
    name: 'Wobble Gloom',
    blurb: 'Wanders, but chases if it can reach Pip.',
    diceDefault: [1, 4],
    image: Images.gloom,
    ring: '#1FA6C9',
  },
  pressure: {
    name: 'Rush Gloom',
    blurb: 'Chases and gains speed every 3 turns.',
    diceDefault: [1, 2],
    image: Images.gloom,
    ring: '#F2672E',
  },
  redirector: {
    name: 'Shove Gloom',
    blurb: 'Shoves Pip away from the EXIT when close.',
    diceDefault: [1, 3],
    image: Images.gloom,
    ring: '#E0409A',
  },
  brute: {
    name: 'Gloom Brute',
    blurb: 'Chases. Aura hurts when adjacent.',
    diceDefault: [1, 1],
    image: Images.brute,
    ring: '#5B2A86',
  },
  gloomKing: {
    name: 'Gloom King',
    blurb: 'Aura + summons chaser minions.',
    diceDefault: [1, 2],
    image: Images.gloomKing,
    ring: '#E8A800',
  },
  frostTitan: {
    name: 'Frost Titan',
    blurb: 'Frost Stomp cracks tiles near Pip.',
    diceDefault: [1, 2],
    image: Images.frostTitan,
    ring: '#39A7E6',
  },
  ember: {
    name: 'Ember Sprite',
    blurb: 'Wanders and speeds up like Rush.',
    diceDefault: [1, 4],
    image: Images.ember,
    ring: '#F2672E',
  },
  magma: {
    name: 'Magma Brute',
    blurb: 'Slow aura chaser.',
    diceDefault: [1, 1],
    image: Images.magmaBrute,
    ring: '#D1481F',
  },
  cinder: {
    name: 'Cinder Shade',
    blurb: 'Shoves Pip like a redirector.',
    diceDefault: [1, 3],
    image: Images.ember,
    ring: '#8A5A00',
  },
  magmaMonarch: {
    name: 'Magma Monarch',
    blurb: 'Aura + summons Ember minions.',
    diceDefault: [1, 2],
    image: Images.magmaMonarch,
    ring: '#E85D04',
  },
};
