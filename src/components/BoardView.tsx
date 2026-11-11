import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Images } from '../data/assets';
import { GLOOM_META } from '../data/levels';
import { moveCost } from '../engine/board';
import { GameState, Pos } from '../engine/types';
import { usePlayer } from '../state/PlayerContext';
import { colors } from '../theme/colors';

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
      return '#A5ABB2';
    case 'gem':
      return '#FFD85C';
    case 'hazard':
      return '#FFC7BC';
    case 'sticky':
      return '#FF9ED2';
    case 'crumbly':
      return '#DDA467';
    case 'vanishing':
      return '#CFEFFF';
    case 'ice':
      return '#BDEEFF';
    case 'cracked':
      return '#D7EEF8';
    case 'bridgeClosed':
    case 'bridgeOpen':
      return '#A67C52';
    case 'exit':
      return '#9A66F0';
    case 'start':
      return '#63D66F';
    case 'switch':
      return '#FFE08A';
    case 'teleport':
      return '#E3D4FF';
    case 'shortcut':
    case 'shortcutLand':
      return '#FFE0B5';
    case 'mystery':
      return '#7C4DDB';
    case 'power':
      return '#8E5BE8';
    case 'shield':
      return '#CFE0FF';
    case 'reroll':
      return '#CDF3F7';
    case 'moves':
      return '#D7F5C9';
    case 'arrow':
      return '#FFD08A';
    default:
      return base;
  }
}

function iconFor(kind: string, arrowDir?: Pos, gone?: boolean) {
  if (gone) return '';
  switch (kind) {
    case 'exit':
      return '🚪';
    case 'start':
      return '⚑';
    case 'gem':
      return '★';
    case 'switch':
      return '⚡';
    case 'hazard':
      return '⚠';
    case 'mystery':
      return '?';
    case 'teleport':
      return '✦';
    case 'shortcut':
      return '◎';
    case 'shortcutLand':
      return '○';
    case 'sticky':
      return '🫧';
    case 'ice':
      return '❄';
    case 'water':
      return '🌊';
    case 'lava':
      return '🔥';
    case 'rock':
      return '⛰';
    case 'power':
      return '✨';
    case 'shield':
      return '🛡';
    case 'reroll':
      return '↺';
    case 'moves':
      return '+2';
    case 'crumbly':
      return '🍪';
    case 'cracked':
      return '╳';
    case 'bridgeOpen':
      return '══';
    case 'arrow':
      if (!arrowDir) return '➤';
      if (arrowDir.c === 1) return '➤';
      if (arrowDir.c === -1) return '◀';
      if (arrowDir.r === -1) return '▲';
      return '▼';
    default:
      return '';
  }
}

function CandyTile({
  size,
  color,
  glowing,
  danger,
  hole,
  caption,
  cost,
  onPress,
}: {
  size: number;
  color: string;
  glowing?: boolean;
  danger?: boolean;
  hole?: boolean;
  caption: string;
  cost?: number;
  onPress: () => void;
}) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!glowing) {
      pulse.setValue(0);
      return;
    }
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
      <Pressable
        onPress={onPress}
        style={[
          styles.tile,
          styles.hole,
          { width: size, height: size, borderRadius: Math.max(10, size * 0.22) },
        ]}
      />
    );
  }

  const lift = pulse.interpolate({ inputRange: [0, 1], outputRange: [0, glowing ? -4 : 0] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, glowing ? 1.05 : 1] });

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.tile,
          {
            width: size,
            height: size,
            borderRadius: Math.max(10, size * 0.22),
            backgroundColor: color,
            transform: [{ translateY: lift }, { scale }],
          },
          glowing && styles.glow,
          danger && styles.dangerDash,
        ]}
      >
        <View style={styles.sheen} />
        {!!caption && (
          <Text style={[styles.tileLabel, size < 48 && { fontSize: 8 }]} numberOfLines={1}>
            {caption}
          </Text>
        )}
        {cost != null && <Text style={styles.costBadge}>{cost}</Text>}
      </Animated.View>
    </Pressable>
  );
}

function ActorSprite({
  source,
  ring,
  size,
  left,
  top,
  faded,
  shield,
  zz,
  die,
  springKey,
}: {
  source: number;
  ring: string;
  size: number;
  left: number;
  top: number;
  faded?: boolean;
  shield?: boolean;
  zz?: boolean;
  die?: number | null;
  springKey: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [springKey, anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });
  const bounce = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [6, -4, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.actorAbs,
        {
          left,
          top,
          width: size,
          height: size,
          opacity: faded ? 0.45 : 1,
          transform: [{ translateY: bounce }, { scale }],
        },
      ]}
    >
      <Image
        source={source}
        style={[
          styles.sprite,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: ring,
          },
        ]}
      />
      {shield && (
        <View
          style={[
            styles.shieldRing,
            {
              width: size + 6,
              height: size + 6,
              borderRadius: (size + 6) / 2,
            },
          ]}
        />
      )}
      {zz && <Text style={styles.zz}>zz</Text>}
      {die != null && (
        <View style={styles.gloomDie}>
          <Text style={styles.gloomDieText}>{die}</Text>
        </View>
      )}
    </Animated.View>
  );
}

export function BoardView({
  state,
  onSelect,
  visualPip,
  floating,
  showDangerOverride,
}: {
  state: GameState;
  onSelect: (p: Pos) => void;
  visualPip?: Pos;
  floating?: { r: number; c: number; text: string; color: string } | null;
  showDangerOverride?: boolean;
}) {
  const { player } = usePlayer();
  const boardSkin = player.equipped.board;
  const showDanger =
    showDangerOverride ?? player.settings.showDangerTiles ?? player.settings.showGloomReach ?? true;
  const reach = new Map(state.reachable.map((p) => [`${p.r},${p.c}`, moveCost(state, p)]));
  const gloomR = new Set(state.gloomReach.map((p) => `${p.r},${p.c}`));
  const pipPos = visualPip ?? state.pip;

  const cols = state.cols;
  const rows = state.rows;
  const screenW = Dimensions.get('window').width;
  const tile = useMemo(() => {
    const pad = 28;
    const gap = 3;
    const maxByWidth = Math.floor((screenW - pad * 2 - gap * (cols - 1)) / cols);
    return Math.max(36, Math.min(84, maxByWidth));
  }, [cols, screenW]);
  const gap = 3;
  const actorSize = Math.round(tile * 0.72);

  const boardW = cols * tile + Math.max(0, cols - 1) * gap;
  const boardH = rows * tile + Math.max(0, rows - 1) * gap;

  return (
    <View style={styles.wrap}>
      <View style={{ width: boardW, height: boardH, position: 'relative' }}>
        {state.grid.map((row, r) => (
          <View
            key={r}
            style={[styles.row, { position: 'absolute', top: r * (tile + gap), left: 0 }]}
          >
            {row.map((cell, c) => {
              if (!cell) {
                return (
                  <View
                    key={c}
                    style={{ width: tile, height: tile, marginRight: c < cols - 1 ? gap : 0 }}
                  />
                );
              }
              const k = `${r},${c}`;
              const cost = reach.get(k);
              const glowing = cost != null;
              const danger = showDanger && gloomR.has(k);
              const gone =
                cell.gone ||
                (cell.kind === 'vanishing' && Math.floor(state.turn / 2) % 2 === 1) ||
                cell.kind === 'bridgeClosed';
              const icon = iconFor(cell.kind, cell.arrowDir, gone);
              const caption =
                cell.kind === 'water'
                  ? 'Water (2)'
                  : cell.kind === 'lava'
                    ? 'Lava (2)'
                    : icon;

              return (
                <View key={c} style={{ marginRight: c < cols - 1 ? gap : 0 }}>
                  <CandyTile
                    size={tile}
                    color={tileColor(cell.kind, boardSkin)}
                    glowing={glowing}
                    danger={danger}
                    hole={gone}
                    caption={caption}
                    cost={cost}
                    onPress={() => onSelect({ r, c })}
                  />
                </View>
              );
            })}
          </View>
        ))}

        {/* Actors drawn above the tile grid */}
        <ActorSprite
          source={Images.pip}
          ring="#FFFFFF"
          size={actorSize}
          left={pipPos.c * (tile + gap) + (tile - actorSize) / 2}
          top={pipPos.r * (tile + gap) + (tile - actorSize) / 2}
          shield={state.shieldActive}
          springKey={`pip-${pipPos.r}-${pipPos.c}`}
        />
        {state.glooms.map((g) => {
          const meta =
            g.kind in GLOOM_META
              ? GLOOM_META[g.kind as keyof typeof GLOOM_META]
              : null;
          return (
            <ActorSprite
              key={g.id}
              source={
                g.kind === 'minion' || g.kind === 'emberMinion'
                  ? Images.gloom
                  : meta?.image ?? Images.gloom
              }
              ring={meta?.ring ?? '#3B3B55'}
              size={actorSize}
              left={g.pos.c * (tile + gap) + (tile - actorSize) / 2}
              top={g.pos.r * (tile + gap) + (tile - actorSize) / 2}
              faded={g.stunned > 0}
              zz={g.stunned > 0}
              die={g.stunned > 0 ? null : g.lastRoll ?? null}
              springKey={`${g.id}-${g.pos.r}-${g.pos.c}`}
            />
          );
        })}

        {floating && (
          <Text
            style={[
              styles.floatLabel,
              {
                color: floating.color,
                left: floating.c * (tile + gap),
                top: floating.r * (tile + gap) - 10,
                width: tile,
              },
            ]}
          >
            {floating.text}
          </Text>
        )}
      </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(0,0,0,0.22)',
  },
  hole: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.28)',
    borderBottomWidth: 2,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '32%',
    backgroundColor: 'rgba(255,255,255,0.32)',
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
    fontSize: 13,
    fontFamily: 'Fredoka_700Bold',
    color: colors.ink,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  costBadge: {
    position: 'absolute',
    bottom: 3,
    right: 5,
    fontSize: 11,
    fontFamily: 'Fredoka_700Bold',
    color: '#8a5a00',
  },
  actorAbs: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  sprite: {
    borderWidth: 3,
    resizeMode: 'cover',
    backgroundColor: '#fff',
  },
  shieldRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#3D7BEA',
  },
  zz: {
    position: 'absolute',
    top: -8,
    fontSize: 11,
    fontFamily: 'Fredoka_600SemiBold',
    color: '#5B3FD1',
  },
  gloomDie: {
    position: 'absolute',
    bottom: -6,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: '#2A2438',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gloomDieText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Fredoka_700Bold',
  },
  floatLabel: {
    position: 'absolute',
    zIndex: 8,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 12,
    textAlign: 'center',
  },
});
