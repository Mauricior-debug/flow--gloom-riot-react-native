import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { BoardView } from '../../components/BoardView';
import { Screen } from '../../components/Screen';
import {
  BackRow,
  Body,
  Panel,
  PrimaryButton,
  SecondaryButton,
  Title,
} from '../../components/ui';
import { TIPS } from '../../data/tips';
import { getLevel } from '../../data/levels';
import { createGame } from '../../engine/board';
import {
  chooseMove,
  rollDice,
  scoreResult,
  useExtraMoves,
  useLucky,
  useReroll,
  useRevive,
  useShield,
} from '../../engine/game';
import { GameState, Pos } from '../../engine/types';
import { usePlayer } from '../../state/PlayerContext';
import { colors } from '../../theme/colors';

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
  } = usePlayer();
  const level = getLevel(id);
  const winLogged = useRef(false);

  const initial = useMemo(() => {
    if (!level) return null;
    if (resume === '1' && player.savedBoard?.levelId === id && player.savedBoard.snapshot) {
      return player.savedBoard.snapshot as GameState;
    }
    const useHead = player.consumables.headStart > 0;
    const inv = {
      reroll: player.consumables.reroll,
      shield: player.consumables.shield,
      moves: player.consumables.moves,
      revive: player.consumables.revive,
      teleport: player.consumables.teleport,
      lucky: player.consumables.lucky,
      headStart: player.consumables.headStart,
    };
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

  useEffect(() => {
    if (!state || !level) return;
    for (const tip of state.tips) {
      if (!player.tipsSeen.includes(tip) && TIPS[tip as keyof typeof TIPS]) {
        markTipSeen(tip);
        Alert.alert('Tip', TIPS[tip as keyof typeof TIPS]);
        break;
      }
    }
  }, [state?.turn]);

  useEffect(() => {
    if (!state || state.phase === 'won' || state.phase === 'lost') return;
    saveBoard(id, state);
  }, [state]);

  if (!level || !state) {
    return (
      <Screen>
        <BackRow title="Play" onBack={() => router.back()} />
        <Body>Level missing.</Body>
      </Screen>
    );
  }

  const onSelect = (p: Pos) => {
    if (state.phase !== 'choosing') return;
    setState(chooseMove(state, p));
  };

  useEffect(() => {
    if (!state) return;
    if (state.phase === 'won' && !result && !winLogged.current) {
      winLogged.current = true;
      syncConsumables(state.inventory);
      const scored = scoreResult(state);
      setResult(scored);
      clearSavedBoard();
      applyLevelWin({
        levelId: level.id,
        stars: scored.stars,
        score: scored.score,
        coins: scored.coins,
        gems: state.gemsCollected,
        noDamage: state.hearts === state.maxHearts,
        elapsedMs: Date.now() - state.startedAt,
      });
    }
    if (state.phase === 'lost') {
      syncConsumables(state.inventory);
    }
  }, [state?.phase]);

  if (state.phase === 'won' && result) {
    const coins = doubled ? result.coins * 2 : result.coins;
    return (
      <Screen scroll>
        <Title large>You escaped!</Title>
        <Panel style={{ marginTop: 12 }}>
          <Body>Stars {'★'.repeat(result.stars)}{'☆'.repeat(3 - result.stars)}</Body>
          <Body style={{ marginTop: 6 }}>Score {result.score}</Body>
          <Body style={{ marginTop: 6 }}>Coins +{coins}</Body>
          <Body style={{ marginTop: 6 }}>
            Gems {state.gemsCollected}/{state.gemsTotal} · Turns {state.turn} / par {state.par}
          </Body>
        </Panel>
        <SecondaryButton
          label="Watch ad · Double coins"
          style={{ marginTop: 12 }}
          onPress={() => {
            const r = watchAd('doubleCoins');
            if (r.ok && !doubled) {
              setDoubled(true);
              addCoins(result.coins);
            } else if (!r.ok) {
              Alert.alert('Ads', r.message);
            }
          }}
        />
        <PrimaryButton
          label="Continue"
          style={{ marginTop: 12 }}
          onPress={() => router.replace('/map')}
        />
      </Screen>
    );
  }

  if (state.phase === 'lost') {
    return (
      <Screen scroll>
        <Title large>Caught!</Title>
        <Body style={{ marginTop: 8 }}>{state.message}</Body>
        <PrimaryButton
          label={state.inventory.revive > 0 ? 'Use Revive' : 'Get Revive (ad)'}
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
            } else {
              Alert.alert('Ads', r.message);
            }
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
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={{ paddingBottom: 48 }}>
      <BackRow
        title={level.name}
        onBack={() => router.back()}
        right={
          <Text style={styles.hearts}>{'♥'.repeat(state.hearts)}</Text>
        }
      />
      <Body muted>
        Turn {state.turn} · Moves {state.movesLeft || '—'} · Gems {state.gemsCollected}/{state.gemsTotal}
      </Body>
      <Body style={{ marginVertical: 6 }}>{state.message}</Body>

      <BoardView state={state} onSelect={onSelect} />

      <View style={styles.actions}>
        <PrimaryButton
          label="ROLL THE DICE"
          onPress={() => setState(rollDice(state))}
          disabled={state.phase !== 'ready'}
        />
        <View style={styles.row}>
          <SecondaryButton
            label={`Reroll (${state.inventory.reroll})`}
            onPress={() => {
              if (state.inventory.reroll <= 0) {
                const r = watchAd('freeReroll');
                if (r.ok) {
                  setState(
                    useReroll({
                      ...state,
                      inventory: { ...state.inventory, reroll: 1 },
                    })
                  );
                } else Alert.alert('Ads', r.message);
              } else setState(useReroll(state));
            }}
            style={styles.half}
          />
          <SecondaryButton
            label={`Shield (${state.inventory.shield})`}
            onPress={() => setState(useShield(state))}
            style={styles.half}
          />
        </View>
        <View style={styles.row}>
          <SecondaryButton
            label={`+2 (${state.inventory.moves})`}
            onPress={() => setState(useExtraMoves(state))}
            style={styles.half}
          />
          <SecondaryButton
            label={`Lucky (${state.inventory.lucky})`}
            onPress={() => setState(useLucky(state))}
            style={styles.half}
          />
        </View>
        {(state.shieldActive || state.exitLocked) && (
          <Panel style={{ marginTop: 8, paddingVertical: 10 }}>
            {state.shieldActive && <Body>Shield active</Body>}
            {state.exitLocked && (
              <Body>
                EXIT locked · switches {state.switchesPressed}/{state.switchTotal}
              </Body>
            )}
          </Panel>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hearts: {
    color: colors.danger,
    fontSize: 16,
    fontFamily: 'Fredoka_600SemiBold',
  },
  actions: { marginTop: 14, gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
});
