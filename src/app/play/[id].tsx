import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { haptic, SoundBus } from '../../audio/synth';
import { BoardView } from '../../components/BoardView';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { GameModal } from '../../components/GameModal';
import { Screen } from '../../components/Screen';
import {
  SponsoredVideoPlayer,
  VideoAdOfferCard,
} from '../../components/VideoAdCard';
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
  if (m.includes('stomp')) return 'Frost Stomp!';
  if (m.includes('summon')) return msg;
  if (msg && !msg.startsWith('Rolled') && !msg.startsWith('Tap')) return msg;
  return null;
}

function TopBar({
  levelName,
  objective,
  hearts,
  gems,
  gemsTotal,
  onPause,
  compact,
}: {
  levelName: string;
  objective: string;
  hearts: number;
  gems: number;
  gemsTotal: number;
  onPause: () => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.topBar, compact && { marginBottom: 6 }]}>
      <Pressable onPress={onPause} style={styles.pause}>
        <Text style={styles.pauseText}>Ⅱ</Text>
      </Pressable>
      <View style={styles.titlePill}>
        <Text style={styles.leaf}>🌿</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.titleName} numberOfLines={1}>
            {levelName}
          </Text>
          {!compact && (
            <Text style={styles.titleObj} numberOfLines={2}>
              {objective}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.statsCol}>
        <Text style={styles.hearts}>{'♥'.repeat(Math.max(0, hearts))}</Text>
        <Text style={styles.gems}>
          ★ {gems}/{gemsTotal}
        </Text>
      </View>
    </View>
  );
}

function PowerRow({
  icon,
  name,
  count,
  onPress,
}: {
  icon: string;
  name: string;
  count: number;
  onPress: () => void;
}) {
  return (
    <View style={styles.powerRow}>
      <View style={styles.powerIcon}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      </View>
      <Text style={styles.powerName}>{name}</Text>
      <Pressable onPress={onPress} style={styles.playCircle}>
        <Text style={styles.playCircleText}>▶</Text>
      </Pressable>
    </View>
  );
}

export default function PlayScreen() {
  const { id, resume } = useLocalSearchParams<{ id: string; resume?: string }>();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const {
    player,
    applyLevelWin,
    saveBoard,
    clearSavedBoard,
    markTipSeen,
    watchAd,
    getAdStatus,
    addCoins,
    syncConsumables,
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
  const [adOfferOpen, setAdOfferOpen] = useState(false);
  const [adPlaying, setAdPlaying] = useState(false);
  const [pendingAd, setPendingAd] = useState<'freeReroll' | 'revive' | 'doubleCoins' | null>(
    null
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

  const applyStepState = (stepState: GameState, prevHearts: number, prevGems: number) => {
    setVisualPip(stepState.pip);
    setState(stepState);
    SoundBus.step(sfx);
    void haptic('step', hapOn);
    if (stepState.gemsCollected > prevGems) {
      SoundBus.gem(sfx);
      showFloat(stepState.pip.r, stepState.pip.c, '+1 Star Gem', '#E8A800');
    }
    if (stepState.hearts < prevHearts) {
      SoundBus.damage(sfx);
      void haptic('damage', hapOn);
      showFloat(stepState.pip.r, stepState.pip.c, 'Ouch', colors.danger);
    }
    const copy = floatCopy(stepState.message);
    if (copy) {
      showFloat(
        stepState.pip.r,
        stepState.pip.c,
        copy,
        copy.includes('Shield') ? '#3D7BEA' : copy.includes('Gem') ? '#E8A800' : '#fff'
      );
      playEventSfx(stepState.message);
    }
  };

  const doRoll = async () => {
    if (busy || state.phase !== 'ready') return;
    setBusy(true);
    SoundBus.roll(sfx);
    void haptic('roll', hapOn);
    if (!reduce) {
      setRolling(true);
      diceAnim.setValue(0);
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

    for (const stepState of sim.steps) {
      applyStepState(stepState, prevHearts, prevGems);
      prevHearts = stepState.hearts;
      prevGems = stepState.gemsCollected;
      if (stepState.phase === 'won' || stepState.phase === 'lost') {
        setVisualPip(undefined);
        setBusy(false);
        return;
      }
      await new Promise((r) => setTimeout(r, stepMs));
    }

    await new Promise((r) => setTimeout(r, reduce ? 120 : 450));
    setVisualPip(undefined);
    for (const frame of sim.gloomFrames) {
      SoundBus.gloom(sfx);
      if (frame.hearts < prevHearts) {
        SoundBus.damage(sfx);
        void haptic('damage', hapOn);
        showFloat(frame.pip.r, frame.pip.c, 'Ouch', colors.danger);
        prevHearts = frame.hearts;
      }
      const copy = floatCopy(frame.message);
      if (copy) {
        showFloat(
          frame.pip.r,
          frame.pip.c,
          copy,
          copy.includes('Shield') ? '#3D7BEA' : '#fff'
        );
        playEventSfx(frame.message);
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

  const openAd = (kind: 'freeReroll' | 'revive' | 'doubleCoins') => {
    setPendingAd(kind);
    setAdOfferOpen(true);
  };

  const adStatus = pendingAd ? getAdStatus(pendingAd) : { ok: false, message: '' };
  const freeRerollStatus = getAdStatus('freeReroll');
  const offerMeta = (player.adOffers ?? []).find((o) => o.id === pendingAd);

  const spin = diceAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '420deg'] });
  const hop = diceAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -16, 0] });

  if (state.phase === 'won' && result) {
    const coins = doubled ? result.coins * 2 : result.coins;
    return (
      <Screen scroll>
        <ConfettiBurst active />
        <Panel style={{ marginTop: 24 }}>
          <Title large>{result.title}</Title>
          <Body style={{ marginTop: 10 }}>
            {'★'.repeat(result.stars)}
            {'☆'.repeat(3 - result.stars)}
          </Body>
          <Body style={{ marginTop: 8 }}>Score {result.score}</Body>
          <Body style={{ marginTop: 4 }}>Coins +{coins}</Body>
          {!doubled && (
            <SecondaryButton
              label="Watch a video to double coins"
              style={{ marginTop: 14 }}
              onPress={() => openAd('doubleCoins')}
            />
          )}
          {doubled && (
            <Body style={{ marginTop: 12, color: colors.primary }}>Coins doubled!</Body>
          )}
          <PrimaryButton
            label="Continue"
            style={{ marginTop: 12 }}
            onPress={() => router.replace('/map')}
          />
        </Panel>
        <VideoAdOfferCard
          visible={adOfferOpen && pendingAd === 'doubleCoins'}
          title={offerMeta?.name ?? 'Double Coins'}
          description={offerMeta?.description ?? ''}
          blockedReason={adStatus.ok ? null : adStatus.message}
          onWatch={() => {
            setAdOfferOpen(false);
            setAdPlaying(true);
          }}
          onClose={() => {
            setAdOfferOpen(false);
            setPendingAd(null);
          }}
        />
        <SponsoredVideoPlayer
          visible={adPlaying && pendingAd === 'doubleCoins'}
          onClose={() => {
            setAdPlaying(false);
            setPendingAd(null);
          }}
          onClaim={() => {
            const r = watchAd('doubleCoins');
            if (r.ok) {
              setDoubled(true);
              addCoins(result.coins);
            }
            showToast(r.message);
            setAdPlaying(false);
            setPendingAd(null);
          }}
        />
      </Screen>
    );
  }

  if (state.phase === 'lost') {
    return (
      <Screen scroll>
        <Panel style={{ marginTop: 24 }}>
          <Title large>{state.hearts <= 0 ? 'Out of hearts' : 'Caught'}</Title>
          <Body style={{ marginTop: 8 }}>{state.message}</Body>
          {state.inventory.revive > 0 ? (
            <PrimaryButton
              label="Use Revive"
              style={{ marginTop: 16 }}
              onPress={() => setState(useRevive(state))}
            />
          ) : (
            <PrimaryButton
              label="Watch video to revive"
              style={{ marginTop: 16 }}
              onPress={() => openAd('revive')}
            />
          )}
          <SecondaryButton
            label="Back to map"
            style={{ marginTop: 10 }}
            onPress={() => {
              clearSavedBoard();
              router.replace('/map');
            }}
          />
        </Panel>
        <VideoAdOfferCard
          visible={adOfferOpen && pendingAd === 'revive'}
          title={offerMeta?.name ?? 'Revive'}
          description={offerMeta?.description ?? ''}
          blockedReason={adStatus.ok ? null : adStatus.message}
          onWatch={() => {
            setAdOfferOpen(false);
            setAdPlaying(true);
          }}
          onClose={() => {
            setAdOfferOpen(false);
            setPendingAd(null);
          }}
        />
        <SponsoredVideoPlayer
          visible={adPlaying && pendingAd === 'revive'}
          onClose={() => {
            setAdPlaying(false);
            setPendingAd(null);
          }}
          onClaim={() => {
            const r = watchAd('revive');
            if (r.ok) {
              setState(
                useRevive({
                  ...state,
                  inventory: { ...state.inventory, revive: state.inventory.revive + 1 },
                })
              );
            }
            showToast(r.message);
            setAdPlaying(false);
            setPendingAd(null);
          }}
        />
      </Screen>
    );
  }

  const statusLine =
    state.phase === 'ready'
      ? 'Tap the die to roll'
      : `Rolled ${state.lastRoll ?? diceFace}! Tap a glowing tile.`;

  const board = (
    <View style={[styles.boardTray, landscape && styles.boardTrayLand]}>
      <BoardView
        state={state}
        onSelect={onSelect}
        visualPip={visualPip}
        floating={floating}
        showDangerOverride={showReach}
        maxTile={landscape ? 72 : 84}
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
  );

  const sharedModals = (
    <>
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
            setState(createGame(level, { ...player.consumables }, false));
            setPaused(false);
          }}
        />
      </GameModal>
      <VideoAdOfferCard
        visible={adOfferOpen && pendingAd === 'freeReroll'}
        title={offerMeta?.name ?? 'Free Reroll'}
        description={offerMeta?.description ?? ''}
        blockedReason={adStatus.ok ? null : adStatus.message}
        onWatch={() => {
          setAdOfferOpen(false);
          setAdPlaying(true);
        }}
        onClose={() => {
          setAdOfferOpen(false);
          setPendingAd(null);
        }}
      />
      <SponsoredVideoPlayer
        visible={adPlaying && pendingAd === 'freeReroll'}
        onClose={() => {
          setAdPlaying(false);
          setPendingAd(null);
        }}
        onClaim={() => {
          const r = watchAd('freeReroll');
          if (r.ok) {
            setState({
              ...state,
              inventory: { ...state.inventory, reroll: state.inventory.reroll + 1 },
            });
          }
          showToast(r.message);
          setAdPlaying(false);
          setPendingAd(null);
        }}
      />
    </>
  );

  if (landscape) {
    return (
      <SafeAreaView style={styles.landRoot} edges={['top', 'left', 'right', 'bottom']}>
        <TopBar
          levelName={level.name}
          objective={level.objective}
          hearts={state.hearts}
          gems={state.gemsCollected}
          gemsTotal={state.gemsTotal}
          onPause={() => setPaused(true)}
        />
        <View style={styles.landBody}>
          <View style={styles.landBoardCol}>{board}</View>
          <View style={styles.landSide}>
            <LinearGradient colors={['#5B3FD1', '#3A2A7A']} style={styles.dieCard}>
              <Pressable
                onPress={doRoll}
                disabled={busy || state.phase !== 'ready'}
                style={{ opacity: state.phase === 'ready' && !busy ? 1 : 0.85 }}
              >
                <Animated.View
                  style={[styles.bigDie, { transform: [{ translateY: hop }, { rotate: spin }] }]}
                >
                  <Text style={styles.sparkle}>✦</Text>
                  <Text style={styles.bigDieFace}>{diceFace}</Text>
                </Animated.View>
              </Pressable>
              <Text style={styles.rolledLabel}>Rolled</Text>
              <Text style={styles.hugeNum}>{state.lastRoll ?? diceFace}</Text>
              <View style={styles.movesPill}>
                <Text style={styles.movesPillText}>Moves left · {state.movesLeft}</Text>
              </View>
              {state.phase === 'ready' ? (
                <Text style={styles.tapDieHint}>Tap the die to roll</Text>
              ) : null}
            </LinearGradient>

            <View style={styles.powerCard}>
              <Text style={styles.powerTitle}>Power-ups</Text>
              <PowerRow
                icon="↺"
                name="Reroll Tile"
                count={state.inventory.reroll}
                onPress={() => {
                  SoundBus.click(sfx);
                  if (state.inventory.reroll <= 0) {
                    openAd('freeReroll');
                    return;
                  }
                  setState(useReroll(state));
                }}
              />
              <PowerRow
                icon="🛡"
                name="Shield"
                count={state.inventory.shield}
                onPress={() => {
                  SoundBus.click(sfx);
                  setState(useShield(state));
                }}
              />
              <PowerRow
                icon="+2"
                name="Extra Moves"
                count={state.inventory.moves}
                onPress={() => {
                  SoundBus.click(sfx);
                  setState(useExtraMoves(state));
                }}
              />
              <PowerRow
                icon="✧"
                name="Reveal Path"
                count={state.inventory.teleport}
                onPress={() => {
                  SoundBus.click(sfx);
                  if (state.inventory.teleport <= 0) {
                    showToast('No Reveal Path left');
                    return;
                  }
                  setTeleportArmed(true);
                  showToast('Reveal Path — tap a tile within 4 steps');
                }}
              />
            </View>

            <View style={styles.landActions}>
              <Pressable
                onPress={() => setShowReach((v) => !v)}
                style={[styles.eyeBtn, showReach && styles.eyeOn]}
              >
                <Text style={{ fontSize: 18 }}>👁</Text>
              </Pressable>
              <View style={[styles.nextBtn, styles.nextHint]}>
                <Text style={styles.nextBtnText}>
                  {state.phase === 'ready' ? 'Tap the die to roll' : 'Tap a glowing tile'}
                </Text>
              </View>
            </View>
            {state.inventory.reroll <= 0 && (
              <Pressable onPress={() => openAd('freeReroll')} style={styles.adReroll}>
                <Text style={styles.adRerollText}>
                  Ad reroll{freeRerollStatus.ok ? '' : ` · ${freeRerollStatus.message}`}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
        {sharedModals}
      </SafeAreaView>
    );
  }

  // Portrait / upright — fixed full-screen chrome (no scroll)
  const portraitBudget = Math.min(width - 36, height * 0.52);
  const portraitTile = Math.max(
    34,
    Math.min(
      78,
      Math.floor((portraitBudget - 20) / Math.max(state.cols, state.rows))
    )
  );

  return (
    <SafeAreaView style={styles.portRoot} edges={['top', 'left', 'right', 'bottom']}>
      <TopBar
        levelName={level.name}
        objective={level.objective}
        hearts={state.hearts}
        gems={state.gemsCollected}
        gemsTotal={state.gemsTotal}
        onPause={() => setPaused(true)}
      />
      <Text style={styles.statusLine}>{statusLine}</Text>
      <View style={styles.portBoardWrap}>
        <View style={styles.boardTray}>
          <BoardView
            state={state}
            onSelect={onSelect}
            visualPip={visualPip}
            floating={floating}
            showDangerOverride={showReach}
            maxTile={portraitTile}
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
      </View>
      <View style={styles.bottomCard}>
        <View style={styles.bottomRow}>
          <Pressable
            onPress={doRoll}
            disabled={busy || state.phase !== 'ready'}
            style={{ opacity: state.phase === 'ready' && !busy ? 1 : 0.9 }}
          >
            <Animated.View
              style={[styles.die, { transform: [{ translateY: hop }, { rotate: spin }] }]}
            >
              <Text style={styles.dieFace}>{diceFace}</Text>
            </Animated.View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.hintTitle}>
              {state.phase === 'ready' ? 'Tap the die to roll' : 'Tap a glowing tile'}
            </Text>
            <Text style={styles.hintMoves}>Moves left: {state.movesLeft}</Text>
          </View>
        </View>
        <View style={styles.orbs}>
          <Pressable
            style={styles.orb}
            onPress={() => {
              SoundBus.click(sfx);
              if (state.inventory.reroll <= 0) openAd('freeReroll');
              else setState(useReroll(state));
            }}
          >
            <Text style={styles.orbLabel}>↺</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{state.inventory.reroll}</Text>
            </View>
          </Pressable>
          <Pressable
            style={styles.orb}
            onPress={() => {
              SoundBus.click(sfx);
              setState(useShield(state));
            }}
          >
            <Text style={styles.orbLabel}>🛡</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{state.inventory.shield}</Text>
            </View>
          </Pressable>
          <Pressable
            style={styles.orb}
            onPress={() => {
              SoundBus.click(sfx);
              setState(useExtraMoves(state));
            }}
          >
            <Text style={styles.orbLabel}>+2</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{state.inventory.moves}</Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.orb, teleportArmed && styles.orbActive]}
            onPress={() => {
              SoundBus.click(sfx);
              if (state.inventory.teleport <= 0) {
                showToast('No Reveal Path left');
                return;
              }
              setTeleportArmed(true);
              showToast('Reveal Path armed');
            }}
          >
            <Text style={styles.orbLabel}>✧</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{state.inventory.teleport}</Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.orb, styles.utilOrb, showReach && styles.orbActive]}
            onPress={() => setShowReach((v) => !v)}
          >
            <Text style={styles.orbLabel}>👁</Text>
          </Pressable>
        </View>
        {state.inventory.reroll <= 0 && (
          <Pressable onPress={() => openAd('freeReroll')} style={styles.adReroll}>
            <Text style={styles.adRerollText}>
              Ad reroll{freeRerollStatus.ok ? '' : ` · ${freeRerollStatus.message}`}
            </Text>
          </Pressable>
        )}
        {(state.shieldActive || state.exitLocked || teleportArmed) && (
          <View style={{ marginTop: 8 }}>
            {teleportArmed && <Body>Reveal Path armed — tap a tile</Body>}
            {state.shieldActive && <Body>Shield active</Body>}
            {state.exitLocked && (
              <Body>
                EXIT locked · switches {state.switchesPressed}/{state.switchTotal}
              </Body>
            )}
          </View>
        )}
      </View>
      {sharedModals}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  landRoot: {
    flex: 1,
    backgroundColor: '#FFF8E8',
    paddingTop: 4,
    paddingHorizontal: 10,
    paddingBottom: 4,
  },
  landBody: { flex: 1, flexDirection: 'row', gap: 10 },
  landBoardCol: { flex: 1.35, justifyContent: 'center' },
  landSide: { width: 250, gap: 8 },
  portRoot: {
    flex: 1,
    backgroundColor: '#FFF8E8',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  portBoardWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 0,
  },
  boardTray: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#fff',
    padding: 8,
    shadowColor: '#5c3a1c',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  boardTrayLand: { alignSelf: 'stretch', flex: 1, justifyContent: 'center' },
  tapDieHint: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 12,
  },
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
  titlePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  leaf: { fontSize: 16 },
  titleName: { fontFamily: 'Fredoka_700Bold', fontSize: 16, color: colors.ink },
  titleObj: { fontFamily: 'Nunito_500Medium', fontSize: 11, color: colors.ink, opacity: 0.75 },
  statsCol: { alignItems: 'flex-end' },
  hearts: { color: colors.danger, fontFamily: 'Fredoka_700Bold', fontSize: 14 },
  gems: { fontFamily: 'Fredoka_600SemiBold', color: '#E8A800', fontSize: 13 },
  statusLine: {
    textAlign: 'center',
    fontFamily: 'Nunito_500Medium',
    color: colors.ink,
    marginBottom: 8,
  },
  dieCard: {
    borderRadius: 22,
    padding: 14,
    alignItems: 'center',
  },
  bigDie: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  sparkle: { position: 'absolute', top: -6, right: -4, color: '#FFD85C', fontSize: 14 },
  bigDieFace: { fontFamily: 'Fredoka_700Bold', fontSize: 34, color: colors.ink },
  rolledLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Fredoka_600SemiBold',
    marginTop: 8,
  },
  hugeNum: { color: '#fff', fontFamily: 'Fredoka_700Bold', fontSize: 42, lineHeight: 46 },
  movesPill: {
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  movesPillText: { fontFamily: 'Fredoka_600SemiBold', color: colors.ink, fontSize: 12 },
  powerCard: {
    backgroundColor: '#FFF4D9',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fff',
    padding: 10,
    flex: 1,
  },
  powerTitle: {
    fontFamily: 'Fredoka_700Bold',
    color: colors.ink,
    marginBottom: 6,
    fontSize: 16,
  },
  powerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  powerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7B3FE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerName: { flex: 1, fontFamily: 'Fredoka_600SemiBold', color: colors.ink, fontSize: 13 },
  playCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD85C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircleText: { color: colors.ink, fontSize: 11, fontFamily: 'Fredoka_700Bold' },
  landActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1FA6C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeOn: { borderWidth: 2, borderColor: '#FFD85C' },
  nextBtn: {
    flex: 1,
    backgroundColor: '#FFD85C',
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  nextHint: {
    backgroundColor: '#FFE9A8',
  },
  nextBtnText: { fontFamily: 'Fredoka_700Bold', color: colors.ink, fontSize: 14 },
  bottomCard: {
    marginTop: 12,
    backgroundColor: '#FFF4D9',
    borderRadius: radii.panel,
    borderWidth: 3,
    borderColor: '#fff',
    padding: 12,
  },
  bottomRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
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
  yellowOrb: { backgroundColor: '#FFD85C' },
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
  adReroll: {
    marginTop: 10,
    backgroundColor: '#FFE0F0',
    borderRadius: 14,
    padding: 10,
  },
  adRerollText: {
    textAlign: 'center',
    fontFamily: 'Fredoka_600SemiBold',
    color: colors.ink,
  },
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
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    backgroundColor: 'rgba(40,28,55,0.92)',
    borderRadius: 16,
    padding: 12,
    zIndex: 20,
  },
  toastText: {
    color: '#fff',
    fontFamily: 'Fredoka_600SemiBold',
    textAlign: 'center',
  },
});
