import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, CoinPill, Panel, PrimaryButton, SecondaryButton, Title } from '../components/ui';
import { AvatarImages, Images } from '../data/assets';
import { getLevel } from '../data/levels';
import { usePlayer } from '../state/PlayerContext';
import { colors, radii } from '../theme/colors';

const TILES: { label: string; href: string }[] = [
  { label: 'Map', href: '/map' },
  { label: 'Daily gift', href: '/daily' },
  { label: 'Store', href: '/store' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'Achievements', href: '/achievements' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'News', href: '/news' },
  { label: 'Profile', href: '/profile' },
  { label: 'Settings', href: '/settings' },
  { label: 'Support', href: '/support' },
];

export default function HomeScreen() {
  const { player, watchAd } = usePlayer();
  const level = getLevel(player.currentLevelId);
  const cloudLabel = player.cloudStatus === 'synced' ? 'Synced' : 'Saved on this phone';

  return (
    <LinearGradient colors={[...colors.sky]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View style={styles.top}>
          <View style={styles.identity}>
            <Image source={AvatarImages[player.avatarId]} style={styles.avatar} />
            <View>
              <Title style={{ fontSize: 22 }}>{player.displayName || 'Pip'}</Title>
              <Body muted style={{ fontSize: 13 }}>{cloudLabel}</Body>
            </View>
          </View>
          <View style={styles.topRight}>
            <CoinPill coins={player.coins} />
            <Text style={styles.cloud}>☁</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Image source={Images.logo} style={styles.logo} />
          <Title large style={styles.brand}>GLOOM RIOT</Title>

          {!!player.eventBanner && (
            <Panel style={{ marginBottom: 12, paddingVertical: 10 }}>
              <Body>{player.eventBanner}</Body>
            </Panel>
          )}

          <PrimaryButton
            label={level ? `Continue · ${level.name}` : 'Continue'}
            onPress={() => router.push(`/level/${player.currentLevelId}`)}
          />

          {player.savedBoard && (
            <SecondaryButton
              label={`Resume · ${getLevel(player.savedBoard.levelId)?.name ?? 'board'}`}
              style={{ marginTop: 10 }}
              onPress={() => router.push(`/play/${player.savedBoard!.levelId}?resume=1`)}
            />
          )}

          <View style={styles.grid}>
            {TILES.map((t) => (
              <Pressable
                key={t.href}
                style={styles.tile}
                onPress={() => router.push(t.href as never)}
              >
                <Text style={styles.tileText}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          <SecondaryButton
            label="Watch ad · +100 coins"
            style={{ marginTop: 8, marginBottom: 24 }}
            onPress={() => {
              const r = watchAd('freeCoins');
              Alert.alert(r.ok ? 'Reward' : 'Ads', r.message);
            }}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#fff',
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cloud: { fontSize: 22 },
  content: { paddingHorizontal: 16, paddingTop: 8, flex: 1 },
  logo: {
    width: 88,
    height: 88,
    alignSelf: 'center',
    borderRadius: 24,
  },
  brand: {
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  tile: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: radii.panel,
    borderWidth: 3,
    borderColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 12,
    shadowColor: '#5c3a1c',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  tileText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 16,
    color: colors.ink,
    textAlign: 'center',
  },
});
