import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BackRow, Body, Panel, Title } from '../components/ui';
import { usePlayer } from '../state/PlayerContext';
import { colors } from '../theme/colors';

const ITEM_META = [
  { key: 'reroll', name: 'Reroll', color: colors.items.reroll },
  { key: 'shield', name: 'Shield', color: colors.items.shield },
  { key: 'moves', name: '+2 Moves', color: colors.items.moves },
  { key: 'revive', name: 'Revive', color: colors.items.revive },
  { key: 'teleport', name: 'Teleport Boost', color: colors.items.teleport },
  { key: 'lucky', name: 'Lucky Dice', color: colors.items.lucky },
  { key: 'headStart', name: 'Head Start', color: colors.items.headStart },
] as const;

export default function InventoryScreen() {
  const { player, equipCosmetic } = usePlayer();

  return (
    <Screen scroll>
      <BackRow title="Inventory" onBack={() => router.back()} />

      <Title style={{ fontSize: 20, marginBottom: 8 }}>Items</Title>
      {ITEM_META.map((item) => (
        <Panel key={item.key} style={{ marginBottom: 8 }}>
          <View style={styles.row}>
            <View style={[styles.swatch, { backgroundColor: item.color }]} />
            <View style={{ flex: 1 }}>
              <Body style={{ fontFamily: 'Fredoka_600SemiBold' }}>{item.name}</Body>
              <Body muted>Owned: {player.consumables[item.key]}</Body>
            </View>
          </View>
        </Panel>
      ))}

      <Title style={{ fontSize: 20, marginVertical: 8 }}>Cosmetics</Title>
      <Panel style={{ marginBottom: 8 }}>
        <Body style={{ fontFamily: 'Fredoka_600SemiBold' }}>Auras</Body>
        {player.cosmetics.auras.map((a) => (
          <Pressable key={a} onPress={() => equipCosmetic('aura', a)} style={styles.equipRow}>
            <Body>
              {a} {player.equipped.aura === a ? '· equipped' : ''}
            </Body>
          </Pressable>
        ))}
      </Panel>
      <Panel style={{ marginBottom: 8 }}>
        <Body style={{ fontFamily: 'Fredoka_600SemiBold' }}>Dice skins</Body>
        {player.cosmetics.diceSkins.map((a) => (
          <Pressable key={a} onPress={() => equipCosmetic('diceSkin', a)} style={styles.equipRow}>
            <Body>
              {a} {player.equipped.diceSkin === a ? '· equipped' : ''}
            </Body>
          </Pressable>
        ))}
      </Panel>
      <Panel style={{ marginBottom: 8 }}>
        <Body style={{ fontFamily: 'Fredoka_600SemiBold' }}>Trails</Body>
        {player.cosmetics.trails.map((a) => (
          <Pressable key={a} onPress={() => equipCosmetic('trail', a)} style={styles.equipRow}>
            <Body>
              {a} {player.equipped.trail === a ? '· equipped' : ''}
            </Body>
          </Pressable>
        ))}
      </Panel>
      <Panel>
        <Body style={{ fontFamily: 'Fredoka_600SemiBold' }}>Boards</Body>
        {player.cosmetics.boards.map((a) => (
          <Pressable key={a} onPress={() => equipCosmetic('board', a)} style={styles.equipRow}>
            <Body>
              {a} {player.equipped.board === a ? '· equipped' : ''}
            </Body>
          </Pressable>
        ))}
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swatch: { width: 28, height: 28, borderRadius: 10 },
  equipRow: { paddingVertical: 8 },
});
