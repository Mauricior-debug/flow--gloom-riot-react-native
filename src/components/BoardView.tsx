import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Images } from '../data/assets';
import { GLOOM_META } from '../data/levels';
import { moveCost } from '../engine/board';
import { GameState, Pos } from '../engine/types';
import { usePlayer } from '../state/PlayerContext';
import { colors } from '../theme/colors';

const TILE = 40;

function tileColor(kind: string, boardSkin: string) {
  const boards: Record<string, string> = {
    sandstone: colors.cosmetics.sandstone,
    candy: colors.cosmetics.candyBoard,
    frost: colors.cosmetics.frostBoard,
  };
  const base = boards[boardSkin] ?? boards.sandstone;
  switch (kind) {
    case 'water':
      return '#5EC3F2';
    case 'lava':
      return '#FF7A3C';
    case 'rock':
      return '#8B8F98';
    case 'gem':
      return '#FFD85C';
    case 'hazard':
      return '#FF8A8A';
    case 'sticky':
      return '#FF9ECF';
    case 'crumbly':
      return '#E0A060';
    case 'vanishing':
      return '#C9E8FF';
    case 'ice':
      return '#BDEEFF';
    case 'cracked':
      return '#A8D4E8';
    case 'bridgeClosed':
    case 'bridgeOpen':
      return '#A67C52';
    case 'exit':
      return '#9A66F0';
    case 'start':
      return '#63D66F';
    case 'switch':
      return '#FFD85C';
    case 'teleport':
      return '#C5A0FF';
    case 'shortcut':
    case 'shortcutLand':
      return '#FFC39A';
    case 'mystery':
      return '#B388FF';
    case 'power':
      return '#B388FF';
    case 'shield':
      return '#A9D2FF';
    case 'reroll':
      return '#9FE7F0';
    case 'moves':
      return '#A8F0C0';
    case 'arrow':
      return '#FFD85C';
    default:
      return base;
  }
}

function labelFor(kind: string, arrowDir?: Pos, gone?: boolean) {
  if (gone) return '';
  if (kind === 'exit') return 'EXIT';
  if (kind === 'gem') return '★';
  if (kind === 'switch') return 'W';
  if (kind === 'hazard') return '!';
  if (kind === 'mystery') return '?';
  if (kind === 'teleport') return 'T';
  if (kind === 'shortcut') return 'O';
  if (kind === 'shortcutLand') return 'o';
  if (kind === 'sticky') return 'K';
  if (kind === 'ice') return '❄';
  if (kind === 'water') return '🌊';
  if (kind === 'lava') return '🔥';
  if (kind === 'rock') return '⛰';
  if (kind === 'power') return '✦';
  if (kind === 'cracked') return '╳';
  if (kind === 'arrow' && arrowDir) {
    if (arrowDir.c === 1) return '>';
    if (arrowDir.c === -1) return '<';
    if (arrowDir.r === -1) return '^';
    return 'v';
  }
  return '';
}

function CandyTile({
  children,
  color,
  glowing,
  danger,
  hole,
  lift,
  onPress,
}: {
  children: React.ReactNode;
  color: string;
  glowing?: boolean;
  danger?: boolean;
  hole?: boolean;
  lift?: boolean;
  onPress: () => void;
}) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!glowing) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 550, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glowing, pulse]);

  if (hole) {
    return (
      <Pressable onPress={onPress} style={[styles.tile, styles.hole]}>
        {children}
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.tile,
          {
            backgroundColor: color,
            borderBottomColor: 'rgba(0,0,0,0.22)',
            transform: [
              {
                translateY: glowing || lift
                  ? pulse.interpolate({ inputRange: [0, 1], outputRange: [-1, -3] })
                  : 0,
              },
              {
                scale: glowing
                  ? pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] })
                  : 1,
              },
            ],
          },
          glowing && styles.glow,
          danger && styles.dangerDash,
        ]}
      >
        <View style={styles.sheen} />
        {children}
      </Animated.View>
    </Pressable>
  );
}

export function BoardView({
  state,
  onSelect,
  visualPip,
  floating,
}: {
  state: GameState;
  onSelect: (p: Pos) => void;
  visualPip?: Pos;
  floating?: { r: number; c: number; text: string; color: string } | null;
}) {
  const { player } = usePlayer();
  const boardSkin = player.equipped.board;
  const showDanger = player.settings.showDangerTiles;
  const reach = new Map(state.reachable.map((p) => [`${p.r},${p.c}`, moveCost(state, p)]));
  const gloomR = new Set(state.gloomReach.map((p) => `${p.r},${p.c}`));
  const pipPos = visualPip ?? state.pip;

  return (
    <View style={styles.wrap}>
      {state.grid.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((tile, c) => {
            if (!tile) {
              return <View key={c} style={[styles.tile, styles.grass]} />;
            }
            const k = `${r},${c}`;
            const cost = reach.get(k);
            const glowing = cost != null;
            const danger = showDanger && gloomR.has(k);
            const pipHere = pipPos.r === r && pipPos.c === c;
            const gloom = state.glooms.find((g) => g.pos.r === r && g.pos.c === c);
            const gone =
              tile.gone ||
              (tile.kind === 'vanishing' && Math.floor(state.turn / 2) % 2 === 1) ||
              tile.kind === 'bridgeClosed';
            const caption =
              tile.kind === 'water'
                ? 'Water (2)'
                : tile.kind === 'lava'
                  ? 'Lava (2)'
                  : labelFor(tile.kind, tile.arrowDir, gone);

            return (
              <CandyTile
                key={c}
                color={tileColor(tile.kind, boardSkin)}
                glowing={glowing}
                danger={danger}
                hole={gone}
                onPress={() => onSelect({ r, c })}
              >
                <Text style={styles.tileLabel} numberOfLines={1}>
                  {caption}
                </Text>
                {glowing && (
                  <Text style={styles.costBadge}>{cost}</Text>
                )}
                {pipHere && (
                  <View style={styles.actor}>
                    <Image source={Images.pip} style={styles.sprite} />
                    {state.shieldActive && <View style={styles.shieldRing} />}
                  </View>
                )}
                {gloom && !pipHere && (
                  <View style={[styles.actor, gloom.stunned > 0 && { opacity: 0.45 }]}>
                    <Image
                      source={
                        gloom.kind === 'minion' || gloom.kind === 'emberMinion'
                          ? Images.gloom
                          : gloom.kind in GLOOM_META
                            ? GLOOM_META[gloom.kind as keyof typeof GLOOM_META].image
                            : Images.gloom
                      }
                      style={[
                        styles.sprite,
                        {
                          borderColor:
                            gloom.kind in GLOOM_META
                              ? GLOOM_META[gloom.kind as keyof typeof GLOOM_META].ring
                              : '#3B3B55',
                        },
                      ]}
                    />
                    {gloom.stunned > 0 && <Text style={styles.zz}>zz</Text>}
                    {gloom.lastRoll != null && gloom.stunned <= 0 && (
                      <View style={styles.gloomDie}>
                        <Text style={styles.gloomDieText}>{gloom.lastRoll}</Text>
                      </View>
                    )}
                  </View>
                )}
                {floating && floating.r === r && floating.c === c && (
                  <Text style={[styles.floatLabel, { color: floating.color }]}>
                    {floating.text}
                  </Text>
                )}
              </CandyTile>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    padding: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  row: { flexDirection: 'row' },
  tile: {
    width: TILE,
    height: TILE,
    margin: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderBottomWidth: 4,
  },
  hole: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.25)',
    borderBottomWidth: 2,
  },
  grass: { backgroundColor: 'transparent', borderBottomWidth: 0 },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  glow: {
    borderWidth: 2,
    borderColor: '#E8A800',
    shadowColor: '#E8A800',
    shadowOpacity: 0.65,
    shadowRadius: 6,
  },
  dangerDash: {
    borderWidth: 2,
    borderColor: colors.danger,
    borderStyle: 'dashed',
  },
  tileLabel: {
    position: 'absolute',
    top: 2,
    fontSize: 8,
    fontFamily: 'Fredoka_600SemiBold',
    color: colors.ink,
    opacity: 0.75,
  },
  costBadge: {
    position: 'absolute',
    bottom: 2,
    right: 3,
    fontSize: 9,
    fontFamily: 'Fredoka_700Bold',
    color: '#8a5a00',
  },
  actor: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sprite: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
    resizeMode: 'cover',
  },
  shieldRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#3D7BEA',
  },
  zz: {
    position: 'absolute',
    top: -6,
    fontSize: 9,
    fontFamily: 'Fredoka_600SemiBold',
    color: '#5B3FD1',
  },
  gloomDie: {
    position: 'absolute',
    bottom: -6,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#2A2438',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gloomDieText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Fredoka_700Bold',
  },
  floatLabel: {
    position: 'absolute',
    top: -8,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 11,
  },
});
