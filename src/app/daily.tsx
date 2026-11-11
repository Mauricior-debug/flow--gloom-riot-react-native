import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BackRow, Body, Panel, PrimaryButton, Title } from '../components/ui';
import { DAILY_REWARDS } from '../data/catalog';
import { usePlayer } from '../state/PlayerContext';
import { dayKey } from '../state/types';
import { colors, radii } from '../theme/colors';

function rewardLabel(r: (typeof DAILY_REWARDS)[number]) {
  const parts: string[] = [];
  if ('coins' in r && r.coins) parts.push(`${r.coins} coins`);
  if ('reroll' in r && r.reroll) parts.push(`${r.reroll} reroll`);
  if ('shield' in r && r.shield) parts.push(`${r.shield} shield`);
  if ('moves' in r && r.moves) parts.push(`${r.moves} extra moves`);
  if ('revive' in r && r.revive) parts.push(`${r.revive} revive`);
  return parts.join(' + ');
}

export default function DailyScreen() {
  const { player, claimDaily } = usePlayer();
  const claimedToday = player.daily.lastClaimDate === dayKey();

  return (
    <Screen scroll>
      <BackRow title="Daily gift" onBack={() => router.back()} />
      <Body muted style={{ marginBottom: 12 }}>
        Claim once a day. Day 7 packs coins and a revive.
      </Body>
      {DAILY_REWARDS.map((r) => {
        const active = player.daily.streakDay === r.day && claimedToday;
        const next = !claimedToday && ((player.daily.streakDay % 7) + 1 === r.day || (player.daily.streakDay === 0 && r.day === 1));
        return (
          <Panel
            key={r.day}
            style={{
              ...styles.row,
              ...(active ? { borderColor: colors.primary } : null),
              ...(next ? { borderColor: colors.accent } : null),
            }}
          >
            <Title style={{ fontSize: 18 }}>Day {r.day}</Title>
            <Body>{rewardLabel(r)}</Body>
          </Panel>
        );
      })}
      <PrimaryButton
        label={claimedToday ? 'Come back tomorrow' : 'Claim today'}
        disabled={claimedToday}
        style={{ marginTop: 12 }}
        onPress={() => {
          const r = claimDaily();
          Alert.alert(r.ok ? 'Daily gift' : 'Oops', r.message);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 10,
    borderRadius: radii.panel,
  },
});
