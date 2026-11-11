import AsyncStorage from '@react-native-async-storage/async-storage';
import { createInitialState, PlayerState } from './types';

const KEY = 'gloom-riot-save-v1';

export async function loadPlayer(): Promise<PlayerState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as PlayerState;
    return { ...createInitialState(), ...parsed, settings: { ...createInitialState().settings, ...parsed.settings }, consumables: { ...createInitialState().consumables, ...parsed.consumables }, stats: { ...createInitialState().stats, ...parsed.stats }, ads: { ...createInitialState().ads, ...parsed.ads }, daily: { ...createInitialState().daily, ...parsed.daily }, cosmetics: { ...createInitialState().cosmetics, ...parsed.cosmetics }, equipped: { ...createInitialState().equipped, ...parsed.equipped } };
  } catch {
    return createInitialState();
  }
}

export async function savePlayer(state: PlayerState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}
