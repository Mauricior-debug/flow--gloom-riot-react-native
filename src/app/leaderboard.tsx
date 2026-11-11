import { router } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BackRow, Body, Panel, Title } from '../components/ui';
import { AvatarImages, AvatarId } from '../data/assets';
import { LEADERBOARD_SEED } from '../data/catalog';
import { usePlayer } from '../state/PlayerContext';

export default function LeaderboardScreen() {
  const { player } = usePlayer();
  const you = {
    name: player.displayName || 'You',
    score: player.stats.totalScore,
    avatar: player.avatarId,
  };
  const rows = [...LEADERBOARD_SEED, you]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <Screen scroll>
      <BackRow title="Leaderboard" onBack={() => router.back()} />
      <Body muted style={{ marginBottom: 10 }}>
        Local scores mixed with practice rivals. Saved on this phone.
      </Body>
      {rows.map((row, i) => (
        <Panel key={`${row.name}-${i}`} style={styles.row}>
          <Body style={styles.rank}>{i + 1}</Body>
          <Image
            source={AvatarImages[row.avatar as AvatarId] ?? AvatarImages.pip}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Title style={{ fontSize: 18 }}>{row.name}</Title>
            <Body muted>{row.score} pts</Body>
          </View>
        </Panel>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  rank: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 18,
    width: 24,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: '#fff' },
});
