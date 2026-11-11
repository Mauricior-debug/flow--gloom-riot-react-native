import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BackRow, Body, Panel, PrimaryButton, Title } from '../components/ui';
import { ACHIEVEMENTS } from '../data/catalog';
import { usePlayer } from '../state/PlayerContext';
import { colors } from '../theme/colors';

export default function AchievementsScreen() {
  const { player, achievementProgress, claimAchievement } = usePlayer();

  return (
    <Screen scroll>
      <BackRow title="Achievements" onBack={() => router.back()} />
      {ACHIEVEMENTS.map((a) => {
        const progress = achievementProgress(a.id);
        const done = progress >= a.target;
        const claimed = player.achievementsClaimed.includes(a.id);
        return (
          <Panel key={a.id} style={{ marginBottom: 10 }}>
            <Title style={{ fontSize: 18 }}>{a.name}</Title>
            <Body muted style={{ marginTop: 4 }}>{a.description}</Body>
            <Body style={{ marginTop: 6 }}>
              {Math.min(progress, a.target)}/{a.target}
              {a.reward > 0 ? ` · ${a.reward} coins` : ''}
            </Body>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.min(100, (progress / a.target) * 100)}%` },
                ]}
              />
            </View>
            {done && !claimed && (
              <PrimaryButton
                label="Claim"
                style={{ marginTop: 10 }}
                onPress={() => claimAchievement(a.id)}
              />
            )}
            {claimed && <Body style={{ marginTop: 8, color: colors.primary }}>Claimed</Body>}
          </Panel>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.muted,
    marginTop: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
});
