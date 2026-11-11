import { AdOfferKind } from '../components/VideoAdCard';

export type AdOfferDef = {
  id: AdOfferKind;
  name: string;
  description: string;
  rewardLabel: string;
  dailyLimit: number;
  cooldownMinutes: number;
  placement: string;
  active: boolean;
};

export const DEFAULT_AD_OFFERS: AdOfferDef[] = [
  {
    id: 'freeCoins',
    name: 'Free 100 Coins',
    description: 'Watch an optional sandbox video for 100 coins.',
    rewardLabel: '+100 coins',
    dailyLimit: 5,
    cooldownMinutes: 5,
    placement: 'home',
    active: true,
  },
  {
    id: 'freeReroll',
    name: 'Free Reroll',
    description: 'Get one reroll when you have none left in a level.',
    rewardLabel: '+1 reroll',
    dailyLimit: 5,
    cooldownMinutes: 2,
    placement: 'level',
    active: true,
  },
  {
    id: 'revive',
    name: 'Revive',
    description: 'Watch a video to revive after being caught.',
    rewardLabel: 'Revive',
    dailyLimit: 3,
    cooldownMinutes: 0,
    placement: 'loss',
    active: true,
  },
  {
    id: 'doubleCoins',
    name: 'Double Coins',
    description: 'Watch a video to double the coins from this escape.',
    rewardLabel: 'Double coins',
    dailyLimit: 5,
    cooldownMinutes: 0,
    placement: 'win',
    active: true,
  },
  {
    id: 'randomBooster',
    name: 'Random Booster',
    description: 'Watch for a random reroll, shield, or +2 moves.',
    rewardLabel: 'Random booster',
    dailyLimit: 3,
    cooldownMinutes: 10,
    placement: 'store',
    active: true,
  },
];

export const GLOBAL_AD_DAILY_CAP = 15;
