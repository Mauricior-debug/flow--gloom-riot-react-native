export type StoreItem = {
  id: string;
  name: string;
  kind: 'coins' | 'consumable' | 'pack' | 'cosmetic' | 'bundle';
  description?: string;
  coinPrice?: number;
  poundPrice?: number;
  badge?: string;
  grants: Record<string, number | string>;
};

export const STORE_ITEMS: StoreItem[] = [
  {
    id: 'pouch',
    name: 'Pouch of Coins',
    kind: 'coins',
    poundPrice: 0.99,
    grants: { coins: 500 },
  },
  {
    id: 'chest',
    name: 'Chest of Coins',
    kind: 'coins',
    poundPrice: 1.99,
    badge: 'Popular',
    grants: { coins: 1200 },
  },
  {
    id: 'vault',
    name: 'Vault of Coins',
    kind: 'coins',
    poundPrice: 4.99,
    badge: 'Best value',
    grants: { coins: 3000 },
  },
  {
    id: 'reroll3',
    name: 'Reroll x3',
    kind: 'consumable',
    coinPrice: 150,
    grants: { reroll: 3 },
  },
  {
    id: 'shield1',
    name: 'Shield',
    kind: 'consumable',
    coinPrice: 120,
    grants: { shield: 1 },
  },
  {
    id: 'moves2',
    name: '+2 Moves x2',
    kind: 'consumable',
    coinPrice: 150,
    grants: { moves: 2 },
  },
  {
    id: 'revive1',
    name: 'Revive',
    kind: 'consumable',
    coinPrice: 250,
    grants: { revive: 1 },
  },
  {
    id: 'teleport1',
    name: 'Teleport Boost',
    kind: 'consumable',
    coinPrice: 200,
    grants: { teleport: 1 },
  },
  {
    id: 'lucky1',
    name: 'Lucky Dice',
    kind: 'consumable',
    coinPrice: 180,
    grants: { lucky: 1 },
  },
  {
    id: 'headstart1',
    name: 'Head Start',
    kind: 'consumable',
    coinPrice: 150,
    grants: { headStart: 1 },
  },
  {
    id: 'booster',
    name: 'Booster Pack',
    kind: 'pack',
    coinPrice: 400,
    badge: 'Save 25%',
    grants: { reroll: 3, shield: 2, moves: 2 },
  },
  {
    id: 'explorer',
    name: 'Explorer Aura',
    kind: 'cosmetic',
    coinPrice: 600,
    grants: { aura: 'explorer' },
  },
  {
    id: 'frostAura',
    name: 'Frost Aura',
    kind: 'cosmetic',
    coinPrice: 800,
    grants: { aura: 'frost' },
  },
  {
    id: 'royalAura',
    name: 'Royal Aura',
    kind: 'cosmetic',
    poundPrice: 1.99,
    grants: { aura: 'royal' },
  },
  {
    id: 'candyDice',
    name: 'Candy Dice',
    kind: 'cosmetic',
    coinPrice: 400,
    grants: { diceSkin: 'candy' },
  },
  {
    id: 'goldenDice',
    name: 'Golden Dice',
    kind: 'cosmetic',
    poundPrice: 0.99,
    grants: { diceSkin: 'golden' },
  },
  {
    id: 'galaxyDice',
    name: 'Galaxy Dice',
    kind: 'cosmetic',
    coinPrice: 900,
    grants: { diceSkin: 'galaxy' },
  },
  {
    id: 'heartTrail',
    name: 'Heart Trail',
    kind: 'cosmetic',
    coinPrice: 300,
    grants: { trail: 'hearts' },
  },
  {
    id: 'snowTrail',
    name: 'Snow Trail',
    kind: 'cosmetic',
    coinPrice: 300,
    grants: { trail: 'snow' },
  },
  {
    id: 'candyTiles',
    name: 'Candy Tiles',
    kind: 'cosmetic',
    coinPrice: 500,
    grants: { board: 'candy' },
  },
  {
    id: 'frostTiles',
    name: 'Frost Tiles',
    kind: 'cosmetic',
    coinPrice: 500,
    grants: { board: 'frost' },
  },
  {
    id: 'adventurer',
    name: 'Adventurer Bundle',
    kind: 'bundle',
    poundPrice: 3.99,
    grants: {
      coins: 1500,
      aura: 'royal',
      diceSkin: 'golden',
      reroll: 5,
      shield: 3,
    },
  },
];

export const DAILY_REWARDS = [
  { day: 1, coins: 50 },
  { day: 2, reroll: 1 },
  { day: 3, coins: 100 },
  { day: 4, shield: 1 },
  { day: 5, coins: 150 },
  { day: 6, moves: 2 },
  { day: 7, coins: 300, revive: 1 },
] as const;

export type AchievementDef = {
  id: string;
  name: string;
  description: string;
  target: number;
  reward: number;
  track:
    | 'levelsCleared'
    | 'meadowCleared'
    | 'levelsCleared18'
    | 'gems'
    | 'escapes'
    | 'beatKing'
    | 'beatTitan'
    | 'threeStarLevels'
    | 'untouchable'
    | 'speedrun';
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-escape',
    name: 'First Escape',
    description: 'Clear 1 level',
    target: 1,
    reward: 50,
    track: 'levelsCleared',
  },
  {
    id: 'meadow-master',
    name: 'Meadow Master',
    description: 'Clear 6 levels',
    target: 6,
    reward: 150,
    track: 'meadowCleared',
  },
  {
    id: 'riot-legend',
    name: 'Riot Legend',
    description: 'Clear all 18 levels',
    target: 18,
    reward: 0,
    track: 'levelsCleared18',
  },
  {
    id: 'gem-grabber',
    name: 'Gem Grabber',
    description: 'Collect 10 Star Gems',
    target: 10,
    reward: 100,
    track: 'gems',
  },
  {
    id: 'gem-hoarder',
    name: 'Gem Hoarder',
    description: 'Collect 30 Star Gems',
    target: 30,
    reward: 300,
    track: 'gems',
  },
  {
    id: 'slippery-pip',
    name: 'Slippery Pip',
    description: 'Escape 10 glooms',
    target: 10,
    reward: 120,
    track: 'escapes',
  },
  {
    id: 'dethroned',
    name: 'Dethroned',
    description: 'Beat the Gloom King',
    target: 1,
    reward: 250,
    track: 'beatKing',
  },
  {
    id: 'titan-toppler',
    name: 'Titan Toppler',
    description: 'Beat the Frost Titan',
    target: 1,
    reward: 300,
    track: 'beatTitan',
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Earn 3 stars on 3 levels',
    target: 3,
    reward: 150,
    track: 'threeStarLevels',
  },
  {
    id: 'untouchable',
    name: 'Untouchable',
    description: 'Win 3 heart levels with no damage',
    target: 3,
    reward: 150,
    track: 'untouchable',
  },
  {
    id: 'speedrunner',
    name: 'Speedrunner',
    description: 'Win a level under 45 seconds',
    target: 1,
    reward: 100,
    track: 'speedrun',
  },
];

export const NEWS_ITEMS = [
  {
    id: 'n1',
    title: 'Lava Lagoon is live!',
    body: 'Wade through magma pools, dodge Ember Sprites, and face the Magma Monarch.',
    date: '2026-03-01',
  },
  {
    id: 'n2',
    title: 'Starlight Skies teaser',
    body: 'A new sky-high escape is on the way — hop the floating isles and discover Star Gates!',
    date: '2026-02-14',
  },
  {
    id: 'n3',
    title: 'Daily gifts refreshed',
    body: 'Log in seven days in a row for coins, rerolls, shields, and a revive.',
    date: '2026-01-20',
  },
];

export const LEADERBOARD_SEED = [
  { name: 'PipPrime', score: 18420, avatar: 'pip' },
  { name: 'GloomyGus', score: 16750, avatar: 'gloomBuddy' },
  { name: 'StarSeeker', score: 15200, avatar: 'starGem' },
  { name: 'DiceQueen', score: 14110, avatar: 'luckyDice' },
  { name: 'CJRuns', score: 12880, avatar: 'cj' },
  { name: 'BlossomBee', score: 11940, avatar: 'blossom' },
  { name: 'SpecsPlay', score: 10820, avatar: 'specs' },
  { name: 'RustyRoll', score: 9940, avatar: 'rusty' },
];
