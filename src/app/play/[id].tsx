import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { haptic, SoundBus } from '../../audio/synth';
import { BoardView } from '../../components/BoardView';
import { GameModal } from '../../components/GameModal';
import { Screen } from '../../components/Screen';
import { Body, Panel, PrimaryButton, SecondaryButton, Title } from '../../components/ui';
import { getLevel } from '../../data/levels';
import { TIPS } from '../../data/tips';
import { createGame } from '../../engine/board';
import {
  rollDice,
  scoreResult,
  simulateWalk,
  useExtraMoves,
  useReroll,
  useRevive,
  useShield,
  useTeleportBoost,
} from '../../engine/game';
import { GameState, Pos } from '../../engine/types';
import { usePlayer } from '../../state/PlayerContext';
import { colors, radii } from '../../theme/colors';

function ChubbyButton({
  label,
  onPress,
  disabled,
  tone = 'gold',
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'gold' | 'purple' | 'teal';
  style?: object;
}) {
  const y = useRef(new Animated.Value(0)).current;
  const colorsFor: readonly [string, string] =
    tone === 'gold'
      ? ['#FFD85C', '#E8A800']
      : tone === 'purple'
        ? ['#B388FF', '#7B3FE4']
        : ['#5EE0D0', '#1FA6C9'];
  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => Animated.timing(y, { toValue: 5, duration: 60, useNativeDriver: true }).start()}
      onPressOut={() => Animated.timing(y, { toValue: 0, duration: 80, useNativeDriver: true }).start()}
      onPress={onPress}
      style={[{ opacity: disabled ? 0.45 : 1 }, style]}
    >
      <Animated.View style={{ transform: [{ translateY: y }] }}>
        <LinearGradient colors={colorsFor} style={styles.chubby}>
          <Text style={styles.chubbyText}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

function PowerOrb({
  label,
  count,
  onPress,
  active,
}: {
  label: string;
  count: number;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.orb, active && styles.orbActive]}>
      <Text style={styles.orbLabel}>{label}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
    </Pressable>
  );
}

function floatCopy(msg: string): string | null {
  const m = msg.toLowerCase();
  if (m.includes('star gem')) return '+1 Star Gem';
  if (m.includes('ouch') || m.includes('hazard') || m.includes('aura') || m.includes('lava')) {
    return 'Ouch';
  }
  if (m.includes('shield saved') || m.includes('shield blocked')) return 'Shield blocked';
  if (m.includes('bridge') || m.includes('switch') || m.includes('exit unlock')) {
    return 'Bridges flipped';
  }
  if (m.includes('whoosh') || m.includes('teleport')) return 'Whoosh';
  if (m.includes('hop')) return 'Hop!';
  if (m.includes('sticky')) return 'Sticky!';
  if (m.includes('frost stomp') || m.includes('stomp')) return 'Frost Stomp!';
  if (m.includes('summon')) return msg;
  if (msg && !msg.startsWith('Rolled') && !msg.startsWith('Tap')) return msg;
  return null;
}

export default function PlayScreen() {
  const { id, resume } = useLocalSearchParams<{ id: string; resume?: string }>();
  const {
    player,
    applyLevelWin,
    saveBoard,
    clearSavedBoard,
    markTipSeen,
    watchAd,
    addCoins,
    syncConsumables,
    update,
  } = usePlayer();
  const level = getLevel(id);
  const winLogged = useRef(false);
  const soundOn = player.settings.sound;
  const sfx = soundOn ? player.settings.sfxVolume ?? 80 : 0;
  const music = soundOn ? player.settings.musicVolume ?? 50 : 0;
  const reduce = player.settings.reduceMotion;
  const hapOn = player.settings.haptics ?? true;

  const initial = useMemo(() => {
    if (!level) return null;
    if (resume === '1' && player.savedBoard?.levelId === id && player.savedBoard.snapshot) {
      return player.savedBoard.snapshot as GameState;
    }
    const useHead = player.consumables.headStart > 0;
    const inv = { ...player.consumables };
    const g = createGame(level, inv, useHead);
    if (useHead) {
      g.inventory.headStart = Math.max(0, g.inventory.headStart - 1);
      g.shieldActive = true;
    }
    return g;
  }, [level, id, resume]);

  const [state, setState] = useState<GameState | null>(initial);
  const [result, setResult] = useState<ReturnType<typeof scoreResult> | null>(null);
  const [doubled, setDoubled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [visualPip, setVisualPip] = useState<Pos | undefined>();
  const [floating, setFloating] = useState<{
    r: number;
    c: number;
    text: string;
    color: string;
  } | null>(null);
  const [diceFace, setDiceFace] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [teleportArmed, setTeleportArmed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [tipCard, setTipCard] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showReach, setShowReach] = useState(
    player.settings.showGloomReach ?? player.settings.showDangerTiles ?? true
  );
  const diceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (music > 0) SoundBus.startMusic(music);
    else SoundBus.stopMusic();
    return () => SoundBus.stopMusic();
  }, []);

  useEffect(() => {
    SoundBus.setMusicVolume(music);
    if (music <= 0) SoundBus.stopMusic();
  }, [music]);

  useEffect(() => {
    if (!state || !level) return;
    for (const tip of state.tips) {
      if (!player.tipsSeen.includes(tip) && TIPS[tip as keyof typeof TIPS]) {
        markTipSeen(tip);
        setTipCard(TIPS[tip as keyof typeof TIPS]);
        break;
      }
    }
  }, [state?.turn]);

  useEffect(() => {
    if (!state || state.phase === 'won' || state.phase === 'lost' || busy) return;
    saveBoard(id, state);
  }, [state, busy]);

  useEffect(() => {
    if (!state) return;
    if (state.phase === 'won' && !result && !winLogged.current) {
      winLogged.current = true;
      SoundBus.win(sfx);
      void haptic('win', hapOn);
      syncConsumables(state.inventory);
      const scored = scoreResult(state);
      setResult(scored);
      clearSavedBoard();
      applyLevelWin({
        levelId: level!.id,
        stars: scored.stars,
        score: scored.score,
        coins: scored.coins,
        gems: state.gemsCollected,
        noDamage: state.hearts === state.maxHearts,
        elapsedMs: Date.now() - state.startedAt,
      });
    }
    if (state.phase === 'lost') {
      SoundBus.lose(sfx);
      syncConsumables(state.inventory);
    }
  }, [state?.phase]);

  if (!level || !state) {
    return (
      <Screen>
        <Body>Level missing.</Body>
      </Screen>
    );
  }

  const showFloat = (r: number, c: number, text: string, color: string) => {
    setFloating({ r, c, text, color });
    setTimeout(() => setFloating(null), reduce ? 220 : 500);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const doRoll = async () => {
    if (busy || state.phase !== 'ready') return;
    setBusy(true);
    SoundBus.roll(sfx);
    void haptic('roll', hapOn);
    if (!reduce) {
      setRolling(true);
      const tumble = Animated.timing(diceAnim, {
        toValue: 1,
        duration: 750,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      });
      const flicker = setInterval(() => {
        setDiceFace(1 + Math.floor(Math.random() * 6));
      }, 70);
      tumble.start(() => {
        clearInterval(flicker);
        setRolling(false);
        diceAnim.setValue(0);
      });
      await new Promise((r) => setTimeout(r, 750));
    }
    const next = rollDice(state);
    setDiceFace(next.lastRoll ?? 1);
    setState(next);
    setBusy(false);
  };

  const playEventSfx = (msg: string) => {
    const m = msg.toLowerCase();
    if (m.includes('switch') || m.includes('exit unlock') || m.includes('bridge')) {
      SoundBus.switch(sfx);
    }
    if (m.includes('teleport') || m.includes('hop') || m.includes('whoosh') || m.includes('warp')) {
      SoundBus.warp(sfx);
    }
    if (
      m.includes('shield') ||
      m.includes('reroll') ||
      m.includes('+2') ||
      m.includes('power') ||
      m.includes('got a') ||
      m.includes('summon')
    ) {
      SoundBus.power(sfx);
    }
    if (m.includes('stomp')) SoundBus.damage(sfx);
  };

  const onSelect = async (p: Pos) => {
    if (busy) return;

    if (teleportArmed) {
      setBusy(true);
      setTeleportArmed(false);
      SoundBus.warp(sfx);
      const next = useTeleportBoost(state, p);
      setState(next);
      showFloat(p.r, p.c, 'Whoosh', '#7B3FE4');
      setBusy(false);
      return;
    }

    if (state.phase !== 'choosing') return;
    const sim = simulateWalk(state, p);
    if (!sim) return;
    setBusy(true);
    const stepMs = reduce ? 90 : 210;
    const gloomMs = reduce ? 120 : 380;
    let prevHearts = state.hearts;
    let prevGems = state.gemsCollected;
    let prevMsg = state.message;

    for (const stepState of sim.steps) {
      setVisualPip(stepState.pip);
      setState(stepState);
      SoundBus.step(sfx);
      void haptic('step', hapOn);
      if (stepState.gemsCollected > prevGems) {
        SoundBus.gem(sfx);
        showFloat(stepState.pip.r, stepState.pip.c, '+1 Star Gem', '#E8A800');
        prevGems = stepState.gemsCollected;
      }
      if (stepState.hearts < prevHearts) {
        SoundBus.damage(sfx);
        void haptic('damage', hapOn);
        showFloat(stepState.pip.r, stepState.pip.c, 'Ouch', colors.danger);
        prevHearts = stepState.hearts;
      }
      if (stepState.message !== prevMsg) {
        playEventSfx(stepState.message);
        const copy = floatCopy(stepState.message);
        if (copy) {
          const color = copy.includes('Shield')
            ? '#3D7BEA'
            : copy.includes('Gem')
              ? '#E8A800'
              : copy === 'Ouch'
                ? colors.danger
                : '#fff';
          showFloat(stepState.pip.r, stepState.pip.c, copy, color);
        }
        prevMsg = stepState.message;
      }
      if (stepState.phase === 'won' || stepState.phase === 'lost') {
        setVisualPip(undefined);
        setState(stepState);
        setBusy(false);
        return;
      }
      await new Promise((r) => setTimeout(r, stepMs));
    }

    await new Promise((r) => setTimeout(r, reduce ? 120 : 450));
    setVisualPip(undefined);
    let lastGloomMsg = prevMsg;
    for (const frame of sim.gloomFrames) {
      SoundBus.gloom(sfx);
      if (frame.message !== lastGloomMsg) {
        playEventSfx(frame.message);
        const copy = floatCopy(frame.message);
        if (copy) {
          showFloat(
            frame.pip.r,
            frame.pip.c,
            copy,
            copy.includes('Shield') ? '#3D7BEA' : copy === 'Ouch' ? colors.danger : '#fff'
          );
        }
        if (frame.hearts < prevHearts) {
          SoundBus.damage(sfx);
          void haptic('damage', hapOn);
          showFloat(frame.pip.r, frame.pip.c, 'Ouch', colors.danger);
          prevHearts = frame.hearts;
        }
        lastGloomMsg = frame.message;
      }
      setState(frame);
      if (frame.phase === 'won' || frame.phase === 'lost') {
        setBusy(false);
        return;
      }
      await new Promise((r) => setTimeout(r, gloomMs));
    }

    setState(sim.final);
    setBusy(false);
  };

  if (state.phase === 'won' && result) {
    const coins = doubled ? result.coins * 2 : result.coins;
    return (
      <Screen scroll>
        <Panel style={{ marginTop: 24 }}>
          <Title large>{result.title}</Title>
          <Body style={{ marginTop: 10 }}>
            {'★'.repeat(result.stars)}
            {'☆'.repeat(3 - result.stars)}
          </Body>
          <Body style={{ marginTop: 8 }}>Score {result.score}</Body>
          <Body style={{ marginTop: 4 }}>Coins +{coins}</Body>
          <SecondaryButton
            label={doubled ? 'Coins doubled!' : 'Watch ad · Double coins'}
            style={{ marginTop: 14 }}
            onPress={() => {
              if (doubled) return;
              const r = watchAd('doubleCoins');
              if (r.ok) {
                setDoubled(true);
                addCoins(result.coins);
                showToast(r.message);
              } else showToast(r.message);
            }}
          />
          <PrimaryButton
            label="Continue"
            style={{ marginTop: 12 }}
            onPress={() => router.replace('/map')}
          />
        </Panel>
      </Screen>
    );
  }

  if (state.phase === 'lost') {
    return (
      <Screen scroll>
        <Panel style={{ marginTop: 24 }}>
          <Title large>{state.hearts <= 0 ? 'Out of hearts' : 'Caught'}</Title>
          <Body style={{ marginTop: 8 }}>{state.message}</Body>
          <PrimaryButton
            label={state.inventory.revive > 0 ? 'Use Revive' : 'Watch ad · Revive'}
            style={{ marginTop: 16 }}
            onPress={() => {
              if (state.inventory.revive > 0) {
                setState(useRevive(state));
                return;
              }
              const r = watchAd('revive');
              if (r.ok) {
                setState(
                  useRevive({
                    ...state,
                    inventory: { ...state.inventory, revive: state.inventory.revive + 1 },
                  })
                );
                showToast(r.message);
              } else showToast(r.message);
            }}
          />
          <SecondaryButton
            label="Back to map"
            style={{ marginTop: 10 }}
            onPress={() => {
              clearSavedBoard();
              router.replace('/map');
            }}
          />
        </Panel>
      </Screen>
    );
  }

  const spin = diceAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '420deg'] });
  const hop = diceAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -16, 0] });
  // Always pass Animated nodes (never mix number/string into transform) to avoid RN-web layout shrink.

  return (
    <Screen scroll contentStyle={{ paddingBottom: 16 }}>
      <View style={styles.topBar}>
        <Pressable onPress={() => setPaused(true)} style={styles.pause}>
          <Text style={styles.pauseText}>Ⅱ</Text>
        </Pressable>
        <View style={styles.titleGlass}>
          <Text style={styles.titleName} numberOfLines={1}>
            {level.name}
          </Text>
          <Text style={styles.titleObj} numberOfLines={2}>
            {level.objective}
          </Text>
        </View>
        <View style={styles.statsCol}>
          <Text style={styles.hearts}>{'♥'.repeat(Math.max(0, state.hearts))}</Text>
          <Text style={styles.gems}>
            ★ {state.gemsCollected}/{state.gemsTotal}
          </Text>
        </View>
      </View>

      <Body style={styles.msg}>{state.message}</Body>

      <View style={{ position: 'relative' }}>
        <BoardView
          state={state}
          onSelect={onSelect}
          visualPip={visualPip}
          floating={floating}
          showDangerOverride={showReach}
        />
        {tipCard ? (
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Tip</Text>
            <Text style={styles.tipBody}>{tipCard}</Text>
            <Pressable onPress={() => setTipCard(null)}>
              <Text style={styles.tipDismiss}>Got it</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.bottomBar}>
        <Animated.View style={[styles.die, { transform: [{ translateY: hop }, { rotate: spin }] }]}>
          <Text style={styles.dieFace}>{diceFace}</Text>
        </Animated.View>

        <View style={{ flex: 1 }}>
          {state.phase === 'ready' ? (
            <ChubbyButton label="ROLL THE DICE" onPress={doRoll} disabled={busy} />
          ) : (
            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>Tap a glowing tile</Text>
              <Text style={styles.hintMoves}>Moves left: {state.movesLeft}</Text>
            </View>
          )}
          <View style={styles.orbs}>
            <PowerOrb
              label="↺"
              count={state.inventory.reroll}
              onPress={() => {
                SoundBus.click(sfx);
                if (state.inventory.reroll <= 0) {
                  showToast('No rerolls — try the free ad button');
                  return;
                }
                setState(useReroll(state));
              }}
            />
            <PowerOrb
              label="🛡"
              count={state.inventory.shield}
              onPress={() => {
                SoundBus.click(sfx);
                setState(useShield(state));
              }}
            />
            <PowerOrb
              label="+2"
              count={state.inventory.moves}
              onPress={() => {
                SoundBus.click(sfx);
                setState(useExtraMoves(state));
              }}
            />
            <PowerOrb
              label="✧"
              count={state.inventory.teleport}
              active={teleportArmed}
              onPress={() => {
                SoundBus.click(sfx);
                if (state.inventory.teleport <= 0) {
                  showToast('No Teleport Boosts left');
                  return;
                }
                setTeleportArmed(true);
                showToast('Teleport armed — tap a tile within 4 steps');
              }}
            />
            <Pressable
              onPress={() => setShowReach((v) => !v)}
              style={[styles.orb, styles.utilOrb, showReach && styles.orbActive]}
            >
              <Text style={styles.orbLabel}>👁</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                SoundBus.click(sfx);
                const r = watchAd('freeReroll');
                if (r.ok) {
                  setState({
                    ...state,
                    inventory: { ...state.inventory, reroll: state.inventory.reroll + 1 },
                  });
                }
                showToast(r.message);
              }}
              style={[styles.orb, styles.utilOrb]}
            >
              <Text style={styles.orbLabel}>▶</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {(state.shieldActive || state.exitLocked || teleportArmed) && (
        <Panel style={{ marginTop: 8, paddingVertical: 8 }}>
          {teleportArmed && <Body>Teleport armed — tap a tile</Body>}
          {state.shieldActive && <Body>Shield active</Body>}
          {state.exitLocked && (
            <Body>
              EXIT locked · switches {state.switchesPressed}/{state.switchTotal}
            </Body>
          )}
        </Panel>
      )}

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <GameModal
        visible={paused}
        title="Paused"
        primaryLabel="Resume"
        onPrimary={() => setPaused(false)}
        secondaryLabel="Save and leave"
        onSecondary={() => {
          setPaused(false);
          router.replace('/map');
        }}
      >
        <SecondaryButton
          label="Restart"
          style={{ marginTop: 10 }}
          onPress={() => {
            winLogged.current = false;
            setResult(null);
            setDoubled(false);
            const inv = { ...player.consumables };
            setState(createGame(level, inv, false));
            setPaused(false);
          }}
        />
        <SecondaryButton
          label="Settings"
          style={{ marginTop: 10 }}
          onPress={() => {
            setPaused(false);
            router.push('/settings');
          }}
        />
        <Pressable
          onPress={() => {
            update((p) => ({
              ...p,
              settings: {
                ...p.settings,
                showGloomReach: showReach,
                showDangerTiles: showReach,
              },
            }));
          }}
          style={{ marginTop: 8 }}
        />
      </GameModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pause: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.12)',
  },
  pauseText: { fontFamily: 'Fredoka_700Bold', fontSize: 16, color: colors.ink },
  titleGlass: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  titleName: { fontFamily: 'Fredoka_700Bold', fontSize: 16, color: colors.ink },
  titleObj: { fontFamily: 'Nunito_500Medium', fontSize: 11, color: colors.ink, opacity: 0.75 },
  statsCol: { alignItems: 'flex-end' },
  hearts: { color: colors.danger, fontFamily: 'Fredoka_700Bold', fontSize: 14 },
  gems: { fontFamily: 'Fredoka_600SemiBold', color: '#E8A800', fontSize: 13 },
  msg: { textAlign: 'center', marginBottom: 8, minHeight: 20 },
  tipCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  tipTitle: { fontFamily: 'Fredoka_700Bold', color: colors.ink, marginBottom: 4 },
  tipBody: { fontFamily: 'Nunito_500Medium', color: colors.ink, fontSize: 13 },
  tipDismiss: {
    marginTop: 8,
    fontFamily: 'Fredoka_600SemiBold',
    color: colors.secondary,
    textAlign: 'right',
  },
  bottomBar: {
    marginTop: 12,
    backgroundColor: '#FFF4D9',
    borderRadius: radii.panel,
    borderWidth: 3,
    borderColor: '#fff',
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  die: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  dieFace: { fontFamily: 'Fredoka_700Bold', fontSize: 28, color: colors.ink },
  chubby: {
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(0,0,0,0.18)',
  },
  chubbyText: { fontFamily: 'Fredoka_700Bold', fontSize: 16, color: colors.ink },
  hintBox: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    padding: 12,
  },
  hintTitle: { fontFamily: 'Fredoka_600SemiBold', color: colors.ink },
  hintMoves: { fontFamily: 'Nunito_500Medium', color: colors.ink, marginTop: 2 },
  orbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  orb: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#7B3FE4',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  utilOrb: { backgroundColor: '#1FA6C9' },
  orbActive: { borderWidth: 2, borderColor: '#FFD85C' },
  orbLabel: { color: '#fff', fontFamily: 'Fredoka_700Bold', fontSize: 14 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#7B3FE4',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
    minWidth: 18,
    paddingHorizontal: 3,
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: 'Fredoka_700Bold' },
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    backgroundColor: 'rgba(40,28,55,0.92)',
    borderRadius: 16,
    padding: 12,
  },
  toastText: {
    color: '#fff',
    fontFamily: 'Fredoka_600SemiBold',
    textAlign: 'center',
  },
});
