import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GameModal } from '../components/GameModal';
import { Screen } from '../components/Screen';
import { BackRow, Body, Panel, PrimaryButton } from '../components/ui';
import { DAILY_REWARDS } from '../data/catalog';
import { usePlayer } from '../state/PlayerContext';
import { dayKey } from '../state/types';
import { colors } from '../theme/colors';

function rewardLabel(r: (typeof DAILY_REWARDS)[number]) {
  const parts: string[] = [];
  if ('coins' in r && r.coins) parts.push(`${r.coins}●`);
  if ('reroll' in r && r.reroll) parts.push(`${r.reroll}↺`);
  if ('shield' in r && r.shield) parts.push(`${r.shield}🛡`);
  if ('moves' in r && r.moves) parts.push(`${r.moves}+2`);
  if ('revive' in r && r.revive) parts.push(`${r.revive}✚`);
  return parts.join(' ');
}

export default function DailyScreen() {
  const { player, claimDaily } = usePlayer();
  const claimedToday = player.daily.lastClaimDate === dayKey();
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

  return (
    <Screen scroll>
      <BackRow title="Daily gift" onBack={() => router.back()} />
      <Body muted style={{ marginBottom: 12 }}>
        Claim once a day. Day 7 packs coins and a revive.
      </Body>
      <View style={styles.row}>
        {DAILY_REWARDS.map((r) => {
          const done = player.daily.streakDay >= r.day;
          const next =
            !claimedToday &&
            ((player.daily.streakDay % 7) + 1 === r.day ||
              (player.daily.streakDay === 0 && r.day === 1));
          return (
            <Panel
              key={r.day}
              style={{
                ...styles.dayCard,
                ...(done ? styles.dayClaimed : {}),
                ...(next ? styles.dayNext : {}),
              }}
            >
              <Text style={styles.dayNum}>Day {r.day}</Text>
              <Text style={styles.dayReward}>{rewardLabel(r)}</Text>
            </Panel>
          );
        })}
      </View>
      <PrimaryButton
        label={claimedToday ? 'Come back tomorrow' : 'Claim today'}
        disabled={claimedToday}
        style={{ marginTop: 12 }}
        onPress={() => {
          const r = claimDaily();
          setToast({ title: r.ok ? 'Daily gift' : 'Oops', body: r.message });
        }}
      />

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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayCard: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 14,
    minHeight: 96,
    justifyContent: 'center',
  },
  dayClaimed: {
    borderColor: colors.primary,
    opacity: 0.85,
  },
  dayNext: {
    borderColor: colors.accent,
  },
  dayNum: {
    fontFamily: 'Fredoka_700Bold',
    color: colors.ink,
    fontSize: 14,
  },
  dayReward: {
    marginTop: 6,
    fontFamily: 'Fredoka_600SemiBold',
    color: colors.ink,
    fontSize: 13,
    textAlign: 'center',
  },
});
