import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
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
import { colors } from '../theme/colors';

export default function StoreScreen() {
  const { player, buyStoreItem, watchAd } = usePlayer();

  return (
    <Screen scroll>
      <BackRow
        title="Store"
        onBack={() => router.back()}
        right={<CoinPill coins={player.coins} />}
      />
      <Body muted style={{ marginBottom: 10 }}>
        Coin prices spend coins. Prices in pounds are practice purchases — they grant the item and do not charge a card.
      </Body>

      <SecondaryButton
        label="Watch ad · Random Booster"
        onPress={() => {
          const r = watchAd('randomBooster');
          Alert.alert(r.ok ? 'Booster' : 'Ads', r.message);
        }}
        style={{ marginBottom: 12 }}
      />

      {STORE_ITEMS.map((item) => (
        <Panel key={item.id} style={{ marginBottom: 10 }}>
          <View style={styles.head}>
            <Title style={{ fontSize: 18, flex: 1 }}>{item.name}</Title>
            {item.badge ? <Text style={styles.badge}>{item.badge}</Text> : null}
          </View>
          <Body muted style={{ marginVertical: 6 }}>
            {item.coinPrice != null
              ? `${item.coinPrice} coins`
              : `£${item.poundPrice?.toFixed(2)} practice`}
          </Body>
          <PrimaryButton
            label={item.coinPrice != null ? 'Buy' : 'Practice buy'}
            onPress={() => {
              const r = buyStoreItem(item.id);
              Alert.alert(r.ok ? 'Store' : 'Store', r.message);
            }}
          />
        </Panel>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    backgroundColor: colors.accent,
    color: colors.ink,
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
