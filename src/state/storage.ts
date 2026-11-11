import AsyncStorage from '@react-native-async-storage/async-storage';
import { createInitialState, PlayerState } from './types';

const KEY = 'gloom-riot-save-v1';

export async function loadPlayer(): Promise<PlayerState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as PlayerState;
    const base = createInitialState();
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...parsed.settings },
      consumables: { ...base.consumables, ...parsed.consumables },
      stats: { ...base.stats, ...parsed.stats },
      ads: { ...base.ads, ...parsed.ads },
      daily: { ...base.daily, ...parsed.daily },
      cosmetics: { ...base.cosmetics, ...parsed.cosmetics },
      equipped: { ...base.equipped, ...parsed.equipped },
      adOffers: parsed.adOffers?.length ? parsed.adOffers : base.adOffers,
    };
  } catch {
    return createInitialState();
  }
}

export async function savePlayer(state: PlayerState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}
