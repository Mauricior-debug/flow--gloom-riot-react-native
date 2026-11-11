import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Images } from '../data/assets';
import { GLOOM_META } from '../data/levels';
import { GameState, Pos } from '../engine/types';
import { colors } from '../theme/colors';
import { usePlayer } from '../state/PlayerContext';

const TILE = 36;

function tileColor(kind: string, boardSkin: string) {
  const boards: Record<string, string> = {
    sandstone: colors.cosmetics.sandstone,
    candy: colors.cosmetics.candyBoard,
    frost: colors.cosmetics.frostBoard,
  };
  const base = boards[boardSkin] ?? boards.sandstone;
  switch (kind) {
    case 'water':
      return '#7EC8FF';
    case 'lava':
      return '#FF7A3A';
    case 'rock':
      return '#8B7355';
    case 'gem':
      return '#FFE566';
    case 'hazard':
      return '#E05070';
    case 'sticky':
      return '#C9A0FF';
    case 'crumbly':
      return '#E0A060';
    case 'vanishing':
      return '#B8E0FF';
    case 'ice':
      return '#D7F3FF';
    case 'cracked':
      return '#A8D4E8';
    case 'bridgeClosed':
      return '#A09080';
    case 'bridgeOpen':
      return '#D2B48C';
    case 'exit':
      return '#6BE0A0';
    case 'start':
      return '#B6F0A8';
    case 'switch':
      return '#FFB84D';
    case 'teleport':
      return '#C5A0FF';
    case 'shortcut':
    case 'shortcutLand':
      return '#FF9ECF';
    case 'mystery':
      return '#D4A5FF';
    case 'power':
      return '#B388FF';
    case 'shield':
      return colors.items.shield;
    case 'reroll':
      return colors.items.reroll;
    case 'moves':
      return colors.items.moves;
    case 'arrow':
      return '#FFD18A';
    default:
      return base;
  }
}

function labelFor(kind: string, arrowDir?: Pos) {
  if (kind === 'exit') return 'E';
  if (kind === 'gem') return '★';
  if (kind === 'switch') return 'W';
  if (kind === 'hazard') return '!';
  if (kind === 'mystery') return '?';
  if (kind === 'teleport') return 'T';
  if (kind === 'shortcut') return 'O';
  if (kind === 'shortcutLand') return 'o';
  if (kind === 'sticky') return 'K';
  if (kind === 'arrow' && arrowDir) {
    if (arrowDir.c === 1) return '>';
    if (arrowDir.c === -1) return '<';
    if (arrowDir.r === -1) return '^';
    return 'v';
  }
  return '';
}

export function BoardView({
  state,
  onSelect,
}: {
  state: GameState;
  onSelect: (p: Pos) => void;
}) {
  const { player } = usePlayer();
  const boardSkin = player.equipped.board;
  const reach = new Set(state.reachable.map((p) => `${p.r},${p.c}`));
  const gloomR = new Set(state.gloomReach.map((p) => `${p.r},${p.c}`));

  return (
    <View style={styles.wrap}>
      {state.grid.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((tile, c) => {
            if (!tile) {
              return <View key={c} style={[styles.tile, styles.grass]} />;
            }
            const k = `${r},${c}`;
            const glowing = reach.has(k);
            const danger = gloomR.has(k);
            const pipHere = state.pip.r === r && state.pip.c === c;
            const gloom = state.glooms.find((g) => g.pos.r === r && g.pos.c === c);
            const gone = tile.gone || (tile.kind === 'vanishing' && Math.floor(state.turn / 2) % 2 === 1);

            return (
              <Pressable
                key={c}
                onPress={() => onSelect({ r, c })}
                style={[
                  styles.tile,
                  {
                    backgroundColor: gone ? '#d9d0c0' : tileColor(tile.kind, boardSkin),
                    opacity: gone ? 0.35 : 1,
                  },
                  glowing && styles.glow,
                  danger && styles.dangerDash,
                  tile.kind === 'exit' && state.exitLocked && styles.lockedExit,
                ]}
              >
                <Text style={styles.tileLabel}>{labelFor(tile.kind, tile.arrowDir)}</Text>
                {pipHere && (
                  <Image source={Images.pip} style={styles.sprite} />
                )}
                {gloom && !pipHere && (
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
                        borderWidth: 2,
                        borderRadius: 8,
                      },
                    ]}
                  />
                )}
              </Pressable>
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
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  row: { flexDirection: 'row' },
  tile: {
    width: TILE,
    height: TILE,
    margin: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  grass: { backgroundColor: 'transparent' },
  glow: {
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  dangerDash: {
    borderWidth: 2,
    borderColor: colors.danger,
    borderStyle: 'dashed',
  },
  lockedExit: {
    opacity: 0.55,
  },
  tileLabel: {
    position: 'absolute',
    fontSize: 10,
    fontFamily: 'Fredoka_600SemiBold',
    color: colors.ink,
    opacity: 0.7,
  },
  sprite: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
});
