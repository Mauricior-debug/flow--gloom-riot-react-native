import { AvatarId } from '../data/assets';
import { AdOfferDef, DEFAULT_AD_OFFERS } from '../data/adOffers';

export type Consumables = {
  reroll: number;
  shield: number;
  moves: number;
  revive: number;
  teleport: number;
  lucky: number;
  headStart: number;
};

export type CosmeticsOwned = {
  auras: string[];
  diceSkins: string[];
  trails: string[];
  boards: string[];
};

export type Equipped = {
  aura: string;
  diceSkin: string;
  trail: string;
  board: string;
};

export type LevelProgress = {
  stars: number;
  bestScore: number;
  cleared: boolean;
};

export type SavedBoard = {
  levelId: string;
  snapshot: unknown;
};

export type LocalProfile = {
  email: string;
  password: string;
  displayName: string;
};

export type AdSlot = { count: number; lastAt: number };

export type AdCounters = {
  freeCoins: AdSlot;
  freeReroll: AdSlot;
  revive: AdSlot;
  doubleCoins: AdSlot;
  randomBooster: AdSlot;
  dayKey: string;
  globalCount: number;
};

export type PlayerState = {
  onboarded: boolean;
  displayName: string;
  avatarId: AvatarId;
  coins: number;
  consumables: Consumables;
  cosmetics: CosmeticsOwned;
  equipped: Equipped;
  unlockedLevels: string[];
  forceUnlocked: string[];
  progress: Record<string, LevelProgress>;
  currentLevelId: string;
  savedBoard: SavedBoard | null;
  daily: {
    streakDay: number;
    lastClaimDate: string | null;
  };
  achievementsClaimed: string[];
  stats: {
    levelsCleared: number;
    meadowCleared: number;
    gems: number;
    escapes: number;
    beatKing: boolean;
    beatTitan: boolean;
    threeStarLevels: number;
    untouchable: number;
    speedrun: boolean;
    totalScore: number;
  };
  tipsSeen: string[];
  settings: {
    sound: boolean;
    reduceMotion: boolean;
    largeText: boolean;
    highContrast: boolean;
    musicVolume: number;
    sfxVolume: number;
    haptics: boolean;
    showDangerTiles: boolean;
    showGloomReach: boolean;
    notifications: boolean;
    language: string;
    starlightNotify: boolean;
  };
  eventBanner: string;
  coinRewardMultiplier: number;
  profile: LocalProfile | null;
  loggedIn: boolean;
  cloudStatus: 'phone' | 'synced';
  ads: AdCounters;
  adOffers: AdOfferDef[];
};

export function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function createInitialState(): PlayerState {
  return {
    onboarded: false,
    displayName: '',
    avatarId: 'pip',
    coins: 200,
    consumables: {
      reroll: 1,
      shield: 1,
      moves: 0,
      revive: 0,
      teleport: 0,
      lucky: 0,
      headStart: 0,
    },
    cosmetics: {
      auras: ['classic'],
      diceSkins: ['classic'],
      trails: ['sparkle'],
      boards: ['sandstone'],
    },
    equipped: {
      aura: 'classic',
      diceSkin: 'classic',
      trail: 'sparkle',
      board: 'sandstone',
    },
    unlockedLevels: ['sm-1'],
    forceUnlocked: [],
    progress: {},
    currentLevelId: 'sm-1',
    savedBoard: null,
    daily: { streakDay: 0, lastClaimDate: null },
    achievementsClaimed: [],
    stats: {
      levelsCleared: 0,
      meadowCleared: 0,
      gems: 0,
      escapes: 0,
      beatKing: false,
      beatTitan: false,
      threeStarLevels: 0,
      untouchable: 0,
      speedrun: false,
      totalScore: 0,
    },
    tipsSeen: [],
    settings: {
      sound: true,
      reduceMotion: false,
      largeText: false,
      highContrast: false,
      musicVolume: 50,
      sfxVolume: 80,
      haptics: true,
      showDangerTiles: true,
      showGloomReach: true,
      notifications: true,
      language: 'en',
      starlightNotify: false,
    },
    eventBanner: '',
    coinRewardMultiplier: 1,
    profile: null,
    loggedIn: false,
    cloudStatus: 'phone',
    ads: {
      freeCoins: { count: 0, lastAt: 0 },
      freeReroll: { count: 0, lastAt: 0 },
      revive: { count: 0, lastAt: 0 },
      doubleCoins: { count: 0, lastAt: 0 },
      randomBooster: { count: 0, lastAt: 0 },
      dayKey: dayKey(),
      globalCount: 0,
    },
    adOffers: DEFAULT_AD_OFFERS.map((o) => ({ ...o })),
  };
}
