import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GameModal } from '../components/GameModal';
import { Screen } from '../components/Screen';
import {
  BackRow,
  Body,
  CoinPill,
  Panel,
  PrimaryButton,
  SecondaryButton,
  Title,
} from '../components/ui';
import { STORE_ITEMS } from '../data/catalog';
import { usePlayer } from '../state/PlayerContext';
import { colors, radii } from '../theme/colors';

export default function StoreScreen() {
  const { player, buyStoreItem, watchAd } = usePlayer();
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

  return (
    <Screen scroll>
      <BackRow
        title="Store"
        onBack={() => router.back()}
        right={<CoinPill coins={player.coins} />}
      />
      <Body muted style={{ marginBottom: 10 }}>
        Coin prices spend coins. Prices in pounds are practice purchases — they grant the item and
        do not charge a card.
      </Body>

      <SecondaryButton
        label="Watch ad · Random Booster"
        onPress={() => {
          const r = watchAd('randomBooster');
          setToast({ title: r.ok ? 'Booster' : 'Ads', body: r.message });
        }}
        style={{ marginBottom: 12 }}
      />

      <View style={styles.grid}>
        {STORE_ITEMS.map((item) => (
          <Panel key={item.id} style={styles.card}>
            {item.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : null}
            <View style={styles.iconBubble}>
              <Text style={styles.icon}>
                {item.kind === 'coins' ? '●' : item.kind === 'cosmetic' ? '✦' : '◆'}
              </Text>
            </View>
            <Title style={{ fontSize: 16, textAlign: 'center' }}>{item.name}</Title>
            <Body muted style={{ marginVertical: 6, textAlign: 'center', fontSize: 13 }}>
              {item.coinPrice != null
                ? `${item.coinPrice} coins`
                : `£${item.poundPrice?.toFixed(2)} practice`}
            </Body>
            <PrimaryButton
              label={item.coinPrice != null ? 'Buy' : 'Practice buy'}
              onPress={() => {
                const r = buyStoreItem(item.id);
                setToast({ title: 'Store', body: r.message });
              }}
            />
          </Panel>
        ))}
      </View>

      <GameModal
        visible={!!toast}
        title={toast?.title ?? ''}
        body={toast?.body}
        primaryLabel="OK"
        onPrimary={() => setToast(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '47%',
    alignItems: 'center',
    paddingTop: 18,
    position: 'relative',
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  icon: { fontSize: 22, color: colors.secondary },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 11,
    color: colors.ink,
  },
});
