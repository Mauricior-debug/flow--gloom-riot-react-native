import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ACHIEVEMENTS, DAILY_REWARDS, STORE_ITEMS, StoreItem } from '../data/catalog';
import { AvatarId } from '../data/assets';
import { getAllLevels, getLevel, WORLDS } from '../data/levels';
import { loadPlayer, savePlayer } from './storage';
import { createInitialState, dayKey, PlayerState } from './types';

type Ctx = {
  ready: boolean;
  player: PlayerState;
  refresh: () => Promise<void>;
  update: (fn: (p: PlayerState) => PlayerState) => void;
  completeOnboarding: (name: string, avatarId: AvatarId) => void;
  isLevelUnlocked: (levelId: string) => boolean;
  isWorldUnlocked: (worldId: string) => boolean;
  claimDaily: () => { ok: boolean; message: string };
  buyStoreItem: (itemId: string) => { ok: boolean; message: string };
  equipCosmetic: (slot: 'aura' | 'diceSkin' | 'trail' | 'board', id: string) => void;
  applyLevelWin: (opts: {
    levelId: string;
    stars: number;
    score: number;
    coins: number;
    gems: number;
    noDamage: boolean;
    elapsedMs: number;
  }) => void;
  setCurrentLevel: (id: string) => void;
  saveBoard: (levelId: string, snapshot: unknown) => void;
  clearSavedBoard: () => void;
  markTipSeen: (id: string) => void;
  watchAd: (
    kind: 'freeCoins' | 'freeReroll' | 'revive' | 'doubleCoins' | 'randomBooster'
  ) => { ok: boolean; message: string; reward?: Partial<PlayerState['consumables']> & { coins?: number } };
  getAdStatus: (
    kind: 'freeCoins' | 'freeReroll' | 'revive' | 'doubleCoins' | 'randomBooster'
  ) => { ok: boolean; message: string };
  updateAdOffer: (
    id: 'freeCoins' | 'freeReroll' | 'revive' | 'doubleCoins' | 'randomBooster',
    patch: Partial<import('../data/adOffers').AdOfferDef>
  ) => void;
  register: (email: string, password: string, displayName: string) => { ok: boolean; message: string };
  login: (email: string, password: string) => { ok: boolean; message: string };
  logout: () => void;
  resetPassword: (email: string, password: string) => { ok: boolean; message: string };
  claimAchievement: (id: string) => void;
  achievementProgress: (id: string) => number;
  addCoins: (amount: number) => void;
  syncConsumables: (c: PlayerState['consumables']) => void;
  resetPhoneSave: () => void;
  dailyClaimable: boolean;
  achievementClaimable: boolean;
};

const PlayerContext = createContext<Ctx | null>(null);

function resetAdsIfNeeded(p: PlayerState): PlayerState {
  const today = dayKey();
  if (p.ads.dayKey === today) return p;
  return {
    ...p,
    ads: {
      freeCoins: { count: 0, lastAt: 0 },
      freeReroll: { count: 0, lastAt: 0 },
      revive: { count: 0, lastAt: 0 },
      doubleCoins: { count: 0, lastAt: 0 },
      randomBooster: { count: 0, lastAt: 0 },
      dayKey: today,
      globalCount: 0,
    },
  };
}

function nextLevelId(levelId: string): string | null {
  const all = getAllLevels();
  const idx = all.findIndex((l) => l.id === levelId);
  if (idx < 0 || idx >= all.length - 1) return null;
  return all[idx + 1].id;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<PlayerState>(createInitialState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const loaded = resetAdsIfNeeded(await loadPlayer());
      setPlayer(loaded);
      setReady(true);
    })();
  }, []);

  const update = useCallback((fn: (p: PlayerState) => PlayerState) => {
    setPlayer((prev) => {
      const next = fn(resetAdsIfNeeded(prev));
      void savePlayer(next);
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    const loaded = resetAdsIfNeeded(await loadPlayer());
    setPlayer(loaded);
  }, []);

  const completeOnboarding = useCallback(
    (name: string, avatarId: AvatarId) => {
      update((p) => ({
        ...p,
        onboarded: true,
        displayName: name.trim() || 'Pip',
        avatarId,
      }));
    },
    [update]
  );

  const isLevelUnlocked = useCallback(
    (levelId: string) => {
      if (player.forceUnlocked.includes(levelId)) return true;
      if (player.unlockedLevels.includes(levelId)) return true;
      return false;
    },
    [player.forceUnlocked, player.unlockedLevels]
  );

  const isWorldUnlocked = useCallback(
    (worldId: string) => {
      const world = WORLDS.find((w) => w.id === worldId);
      if (!world) return false;
      if (!world.playable) return false;
      if (!world.unlockAfter) return true;
      if (player.progress[world.unlockAfter]?.cleared) return true;
      return world.levels.some(
        (l) =>
          player.forceUnlocked.includes(l.id) || player.unlockedLevels.includes(l.id)
      );
    },
    [player.progress, player.forceUnlocked, player.unlockedLevels]
  );

  const claimDaily = useCallback(() => {
    let message = '';
    let ok = false;
    update((p) => {
      const today = dayKey();
      if (p.daily.lastClaimDate === today) {
        message = 'Already claimed today.';
        return p;
      }
      const yesterday = dayKey(new Date(Date.now() - 86400000));
      const streak =
        p.daily.lastClaimDate === yesterday
          ? (p.daily.streakDay % 7) + 1
          : 1;
      const reward = DAILY_REWARDS[streak - 1];
      const consumables = { ...p.consumables };
      let coins = p.coins;
      if ('coins' in reward && reward.coins) coins += reward.coins;
      if ('reroll' in reward && reward.reroll) consumables.reroll += reward.reroll;
      if ('shield' in reward && reward.shield) consumables.shield += reward.shield;
      if ('moves' in reward && reward.moves) consumables.moves += reward.moves;
      if ('revive' in reward && reward.revive) consumables.revive += reward.revive;
      ok = true;
      message = `Day ${streak} claimed!`;
      return {
        ...p,
        coins,
        consumables,
        daily: { streakDay: streak, lastClaimDate: today },
      };
    });
    return { ok, message };
  }, [update]);

  const applyGrants = (p: PlayerState, grants: StoreItem['grants']): PlayerState => {
    const next = {
      ...p,
      consumables: { ...p.consumables },
      cosmetics: {
        auras: [...p.cosmetics.auras],
        diceSkins: [...p.cosmetics.diceSkins],
        trails: [...p.cosmetics.trails],
        boards: [...p.cosmetics.boards],
      },
    };
    Object.entries(grants).forEach(([k, v]) => {
      if (k === 'coins' && typeof v === 'number') next.coins += v;
      if (k === 'reroll' && typeof v === 'number') next.consumables.reroll += v;
      if (k === 'shield' && typeof v === 'number') next.consumables.shield += v;
      if (k === 'moves' && typeof v === 'number') next.consumables.moves += v;
      if (k === 'revive' && typeof v === 'number') next.consumables.revive += v;
      if (k === 'teleport' && typeof v === 'number') next.consumables.teleport += v;
      if (k === 'lucky' && typeof v === 'number') next.consumables.lucky += v;
      if (k === 'headStart' && typeof v === 'number') next.consumables.headStart += v;
      if (k === 'aura' && typeof v === 'string' && !next.cosmetics.auras.includes(v)) {
        next.cosmetics.auras.push(v);
      }
      if (k === 'diceSkin' && typeof v === 'string' && !next.cosmetics.diceSkins.includes(v)) {
        next.cosmetics.diceSkins.push(v);
      }
      if (k === 'trail' && typeof v === 'string' && !next.cosmetics.trails.includes(v)) {
        next.cosmetics.trails.push(v);
      }
      if (k === 'board' && typeof v === 'string' && !next.cosmetics.boards.includes(v)) {
        next.cosmetics.boards.push(v);
      }
    });
    return next;
  };

  const buyStoreItem = useCallback(
    (itemId: string) => {
      const item = STORE_ITEMS.find((i) => i.id === itemId);
      if (!item) return { ok: false, message: 'Item not found' };
      let message = '';
      let ok = false;
      update((p) => {
        if (item.coinPrice != null) {
          if (p.coins < item.coinPrice) {
            message = 'Not enough coins';
            return p;
          }
          ok = true;
          message = `Bought ${item.name}`;
          return applyGrants({ ...p, coins: p.coins - item.coinPrice }, item.grants);
        }
        // Practice purchase in pounds
        ok = true;
        message = `Practice purchase: ${item.name}`;
        return applyGrants(p, item.grants);
      });
      return { ok, message };
    },
    [update]
  );

  const equipCosmetic = useCallback(
    (slot: 'aura' | 'diceSkin' | 'trail' | 'board', id: string) => {
      update((p) => ({ ...p, equipped: { ...p.equipped, [slot]: id } }));
    },
    [update]
  );

  const applyLevelWin = useCallback(
    (opts: {
      levelId: string;
      stars: number;
      score: number;
      coins: number;
      gems: number;
      noDamage: boolean;
      elapsedMs: number;
    }) => {
      update((p) => {
        const level = getLevel(opts.levelId);
        const prev = p.progress[opts.levelId];
        const firstClear = !prev?.cleared;
        const unlocked = new Set(p.unlockedLevels);
        unlocked.add(opts.levelId);
        const nxt = nextLevelId(opts.levelId);
        if (nxt) unlocked.add(nxt);

        const stats = { ...p.stats };
        if (firstClear) {
          stats.levelsCleared += 1;
          if (level?.worldId === 'sunny-meadows') stats.meadowCleared += 1;
        }
        stats.gems += opts.gems;
        stats.escapes += 1;
        stats.totalScore += opts.score;
        if (opts.levelId === 'cc-6') stats.beatKing = true;
        if (opts.levelId === 'fp-6') stats.beatTitan = true;
        if (opts.stars >= 3 && (prev?.stars ?? 0) < 3) stats.threeStarLevels += 1;
        if (opts.noDamage) stats.untouchable += 1;
        if (opts.elapsedMs < 45000) stats.speedrun = true;

        const coins = p.coins + Math.floor(opts.coins * p.coinRewardMultiplier);

        return {
          ...p,
          coins,
          unlockedLevels: Array.from(unlocked),
          currentLevelId: nxt ?? opts.levelId,
          savedBoard: null,
          progress: {
            ...p.progress,
            [opts.levelId]: {
              cleared: true,
              stars: Math.max(prev?.stars ?? 0, opts.stars),
              bestScore: Math.max(prev?.bestScore ?? 0, opts.score),
            },
          },
          stats,
        };
      });
    },
    [update]
  );

  const setCurrentLevel = useCallback(
    (id: string) => update((p) => ({ ...p, currentLevelId: id })),
    [update]
  );

  const saveBoard = useCallback(
    (levelId: string, snapshot: unknown) =>
      update((p) => ({ ...p, savedBoard: { levelId, snapshot } })),
    [update]
  );

  const clearSavedBoard = useCallback(
    () => update((p) => ({ ...p, savedBoard: null })),
    [update]
  );

  const markTipSeen = useCallback(
    (id: string) =>
      update((p) =>
        p.tipsSeen.includes(id) ? p : { ...p, tipsSeen: [...p.tipsSeen, id] }
      ),
    [update]
  );

  const getAdStatus = useCallback(
    (kind: 'freeCoins' | 'freeReroll' | 'revive' | 'doubleCoins' | 'randomBooster') => {
      const p = resetAdsIfNeeded(player);
      const offer = (p.adOffers ?? []).find((o) => o.id === kind);
      if (!offer || !offer.active) return { ok: false, message: 'Offer unavailable' };
      const slot = p.ads[kind];
      const now = Date.now();
      const coolMs = (offer.cooldownMinutes ?? 0) * 60 * 1000;
      const global = p.ads.globalCount ?? 0;
      if (global >= 15) return { ok: false, message: 'Daily video limit reached (15)' };
      if (slot.count >= offer.dailyLimit) {
        return { ok: false, message: `Daily limit reached (${offer.dailyLimit})` };
      }
      if (coolMs > 0 && now - slot.lastAt < coolMs) {
        const mins = Math.ceil((coolMs - (now - slot.lastAt)) / 60000);
        return { ok: false, message: `Come back in ${mins} min` };
      }
      return { ok: true, message: offer.rewardLabel };
    },
    [player]
  );

  const watchAd = useCallback(
    (kind: 'freeCoins' | 'freeReroll' | 'revive' | 'doubleCoins' | 'randomBooster') => {
      let result = {
        ok: false,
        message: '',
        reward: undefined as undefined | (Partial<PlayerState['consumables']> & { coins?: number }),
      };
      update((raw) => {
        const p = resetAdsIfNeeded(raw);
        const offer = (p.adOffers ?? []).find((o) => o.id === kind);
        if (!offer || !offer.active) {
          result = { ok: false, message: 'Offer unavailable', reward: undefined };
          return p;
        }
        const slot = p.ads[kind];
        const now = Date.now();
        const coolMs = (offer.cooldownMinutes ?? 0) * 60 * 1000;
        const global = p.ads.globalCount ?? 0;
        if (global >= 15) {
          result = { ok: false, message: 'Daily video limit reached (15)', reward: undefined };
          return p;
        }
        if (slot.count >= offer.dailyLimit) {
          result = {
            ok: false,
            message: `Daily limit reached (${offer.dailyLimit})`,
            reward: undefined,
          };
          return p;
        }
        if (coolMs > 0 && now - slot.lastAt < coolMs) {
          const mins = Math.ceil((coolMs - (now - slot.lastAt)) / 60000);
          result = { ok: false, message: `Come back in ${mins} min`, reward: undefined };
          return p;
        }
        const ads = {
          ...p.ads,
          [kind]: { count: slot.count + 1, lastAt: now },
          globalCount: global + 1,
        };
        if (kind === 'freeCoins') {
          result = { ok: true, message: '+100 coins', reward: { coins: 100 } };
          return { ...p, ads, coins: p.coins + 100 };
        }
        if (kind === 'freeReroll') {
          result = { ok: true, message: '+1 reroll', reward: { reroll: 1 } };
          return {
            ...p,
            ads,
            consumables: { ...p.consumables, reroll: p.consumables.reroll + 1 },
          };
        }
        if (kind === 'revive') {
          result = { ok: true, message: 'Revive granted', reward: { revive: 1 } };
          return {
            ...p,
            ads,
            consumables: { ...p.consumables, revive: p.consumables.revive + 1 },
          };
        }
        if (kind === 'doubleCoins') {
          result = { ok: true, message: 'Coins doubled', reward: undefined };
          return { ...p, ads };
        }
        const picks = [{ reroll: 1 }, { shield: 1 }, { moves: 1 }] as const;
        const pick = picks[Math.floor(Math.random() * picks.length)];
        result = { ok: true, message: 'Random booster!', reward: { ...pick } };
        return {
          ...p,
          ads,
          consumables: {
            ...p.consumables,
            ...Object.fromEntries(
              Object.entries(pick).map(([k, v]) => [
                k,
                (p.consumables as Record<string, number>)[k] + v,
              ])
            ),
          },
        };
      });
      return result;
    },
    [update]
  );

  const updateAdOffer = useCallback(
    (
      id: 'freeCoins' | 'freeReroll' | 'revive' | 'doubleCoins' | 'randomBooster',
      patch: Partial<import('../data/adOffers').AdOfferDef>
    ) => {
      update((p) => ({
        ...p,
        adOffers: (p.adOffers ?? []).map((o) => (o.id === id ? { ...o, ...patch, id: o.id } : o)),
      }));
    },
    [update]
  );

  const register = useCallback(
    (email: string, password: string, displayName: string) => {
      if (!email || !password) return { ok: false, message: 'Email and password required' };
      update((p) => ({
        ...p,
        profile: { email: email.trim().toLowerCase(), password, displayName: displayName || p.displayName },
        displayName: displayName || p.displayName,
        loggedIn: true,
        cloudStatus: 'synced',
      }));
      return { ok: true, message: 'Local profile created' };
    },
    [update]
  );

  const login = useCallback(
    (email: string, password: string) => {
      let ok = false;
      let message = 'No local profile';
      update((p) => {
        if (!p.profile) {
          message = 'No local profile — register first';
          return p;
        }
        if (
          p.profile.email === email.trim().toLowerCase() &&
          p.profile.password === password
        ) {
          ok = true;
          message = 'Logged in';
          return { ...p, loggedIn: true, cloudStatus: 'synced' };
        }
        message = 'Wrong email or password';
        return p;
      });
      return { ok, message };
    },
    [update]
  );

  const logout = useCallback(() => {
    update((p) => ({ ...p, loggedIn: false, cloudStatus: 'phone' }));
  }, [update]);

  const resetPassword = useCallback(
    (email: string, password: string) => {
      let ok = false;
      let message = '';
      update((p) => {
        if (!p.profile || p.profile.email !== email.trim().toLowerCase()) {
          message = 'No matching local profile';
          return p;
        }
        ok = true;
        message = 'Password updated';
        return { ...p, profile: { ...p.profile, password } };
      });
      return { ok, message };
    },
    [update]
  );

  const achievementProgress = useCallback(
    (id: string) => {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (!a) return 0;
      const s = player.stats;
      switch (a.track) {
        case 'levelsCleared':
        case 'levelsCleared18':
          return s.levelsCleared;
        case 'meadowCleared':
          return s.meadowCleared;
        case 'gems':
          return s.gems;
        case 'escapes':
          return s.escapes;
        case 'beatKing':
          return s.beatKing ? 1 : 0;
        case 'beatTitan':
          return s.beatTitan ? 1 : 0;
        case 'threeStarLevels':
          return s.threeStarLevels;
        case 'untouchable':
          return s.untouchable;
        case 'speedrun':
          return s.speedrun ? 1 : 0;
        default:
          return 0;
      }
    },
    [player.stats]
  );

  const addCoins = useCallback(
    (amount: number) => {
      if (amount <= 0) return;
      update((p) => ({ ...p, coins: p.coins + amount }));
    },
    [update]
  );

  const syncConsumables = useCallback(
    (c: PlayerState['consumables']) => {
      update((p) => ({ ...p, consumables: { ...c } }));
    },
    [update]
  );

  const resetPhoneSave = useCallback(() => {
    const fresh = createInitialState();
    setPlayer(fresh);
    void savePlayer(fresh);
  }, []);

  const dailyClaimable = player.daily.lastClaimDate !== dayKey();

  const achievementClaimable = ACHIEVEMENTS.some((a) => {
    if (player.achievementsClaimed.includes(a.id)) return false;
    const progress = achievementProgress(a.id);
    return progress >= a.target;
  });

  const claimAchievement = useCallback(
    (id: string) => {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (!a) return;
      update((p) => {
        if (p.achievementsClaimed.includes(id)) return p;
        const progress = (() => {
          const s = p.stats;
          switch (a.track) {
            case 'levelsCleared':
            case 'levelsCleared18':
              return s.levelsCleared;
            case 'meadowCleared':
              return s.meadowCleared;
            case 'gems':
              return s.gems;
            case 'escapes':
              return s.escapes;
            case 'beatKing':
              return s.beatKing ? 1 : 0;
            case 'beatTitan':
              return s.beatTitan ? 1 : 0;
            case 'threeStarLevels':
              return s.threeStarLevels;
            case 'untouchable':
              return s.untouchable;
            case 'speedrun':
              return s.speedrun ? 1 : 0;
            default:
              return 0;
          }
        })();
        if (progress < a.target) return p;
        return {
          ...p,
          coins: p.coins + a.reward,
          achievementsClaimed: [...p.achievementsClaimed, id],
        };
      });
    },
    [update]
  );

  const value = useMemo(
    () => ({
      ready,
      player,
      refresh,
      update,
      completeOnboarding,
      isLevelUnlocked,
      isWorldUnlocked,
      claimDaily,
      buyStoreItem,
      equipCosmetic,
      applyLevelWin,
      setCurrentLevel,
      saveBoard,
      clearSavedBoard,
      markTipSeen,
      watchAd,
      getAdStatus,
      updateAdOffer,
      register,
      login,
      logout,
      resetPassword,
      claimAchievement,
      achievementProgress,
      addCoins,
      syncConsumables,
      resetPhoneSave,
      dailyClaimable,
      achievementClaimable,
    }),
    [
      ready,
      player,
      refresh,
      update,
      completeOnboarding,
      isLevelUnlocked,
      isWorldUnlocked,
      claimDaily,
      buyStoreItem,
      equipCosmetic,
      applyLevelWin,
      setCurrentLevel,
      saveBoard,
      clearSavedBoard,
      markTipSeen,
      watchAd,
      getAdStatus,
      updateAdOffer,
      register,
      login,
      logout,
      resetPassword,
      claimAchievement,
      achievementProgress,
      addCoins,
      syncConsumables,
      resetPhoneSave,
      dailyClaimable,
      achievementClaimable,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer outside provider');
  return ctx;
}
