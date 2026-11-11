import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BackRow, Body, Panel, Title } from '../components/ui';
import { usePlayer } from '../state/PlayerContext';
import { colors, radii } from '../theme/colors';

const ITEM_META = [
  { key: 'reroll', name: 'Reroll', color: colors.items.reroll, icon: '↺' },
  { key: 'shield', name: 'Shield', color: colors.items.shield, icon: '🛡' },
  { key: 'moves', name: '+2 Moves', color: colors.items.moves, icon: '+2' },
  { key: 'revive', name: 'Revive', color: colors.items.revive, icon: '✚' },
  { key: 'teleport', name: 'Teleport Boost', color: colors.items.teleport, icon: '✧' },
  { key: 'lucky', name: 'Lucky Dice', color: colors.items.lucky, icon: '🎲' },
  { key: 'headStart', name: 'Head Start', color: colors.items.headStart, icon: '⚡' },
] as const;

function EquipChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.equipChip, selected && styles.equipSelected]}>
      <Text style={styles.equipText}>{label}</Text>
    </Pressable>
  );
}

export default function InventoryScreen() {
  const { player, equipCosmetic } = usePlayer();

  return (
    <Screen scroll>
      <BackRow title="Inventory" onBack={() => router.back()} />

      <Title style={{ fontSize: 20, marginBottom: 8 }}>Items</Title>
      <View style={styles.itemGrid}>
        {ITEM_META.map((item) => (
          <Panel key={item.key} style={styles.itemCard}>
            <View style={[styles.swatch, { backgroundColor: item.color }]}>
              <Text style={styles.swatchIcon}>{item.icon}</Text>
            </View>
            <Body style={{ fontFamily: 'Fredoka_600SemiBold', textAlign: 'center' }}>
              {item.name}
            </Body>
            <Body muted style={{ textAlign: 'center' }}>
              ×{player.consumables[item.key]}
            </Body>
          </Panel>
        ))}
      </View>

      <Title style={{ fontSize: 20, marginVertical: 8 }}>Cosmetics</Title>
      <Panel style={{ marginBottom: 10 }}>
        <Body style={{ fontFamily: 'Fredoka_600SemiBold', marginBottom: 8 }}>Auras</Body>
        <View style={styles.chipRow}>
          {player.cosmetics.auras.map((a) => (
            <EquipChip
              key={a}
              label={a}
              selected={player.equipped.aura === a}
              onPress={() => equipCosmetic('aura', a)}
            />
          ))}
        </View>
      </Panel>
      <Panel style={{ marginBottom: 10 }}>
        <Body style={{ fontFamily: 'Fredoka_600SemiBold', marginBottom: 8 }}>Dice skins</Body>
        <View style={styles.chipRow}>
          {player.cosmetics.diceSkins.map((a) => (
            <EquipChip
              key={a}
              label={a}
              selected={player.equipped.diceSkin === a}
              onPress={() => equipCosmetic('diceSkin', a)}
            />
          ))}
        </View>
      </Panel>
      <Panel style={{ marginBottom: 10 }}>
        <Body style={{ fontFamily: 'Fredoka_600SemiBold', marginBottom: 8 }}>Trails</Body>
        <View style={styles.chipRow}>
          {player.cosmetics.trails.map((a) => (
            <EquipChip
              key={a}
              label={a}
              selected={player.equipped.trail === a}
              onPress={() => equipCosmetic('trail', a)}
            />
          ))}
        </View>
      </Panel>
      <Panel>
        <Body style={{ fontFamily: 'Fredoka_600SemiBold', marginBottom: 8 }}>Boards</Body>
        <View style={styles.chipRow}>
          {player.cosmetics.boards.map((a) => (
            <EquipChip
              key={a}
              label={a}
              selected={player.equipped.board === a}
              onPress={() => equipCosmetic('board', a)}
            />
          ))}
        </View>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  itemCard: { width: '30%', alignItems: 'center', paddingVertical: 12 },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 3,
    borderColor: '#fff',
  },
  swatchIcon: { color: '#fff', fontFamily: 'Fredoka_700Bold', fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  equipChip: {
    backgroundColor: colors.muted,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  equipSelected: {
    borderColor: colors.accent,
    backgroundColor: '#FFF4D0',
  },
  equipText: { fontFamily: 'Fredoka_600SemiBold', color: colors.ink, textTransform: 'capitalize' },
});
