import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameModal } from '../components/GameModal';
import { Body, CoinPill, Panel, PrimaryButton, SecondaryButton, Title } from '../components/ui';
import { AvatarImages, Images } from '../data/assets';
import { getLevel } from '../data/levels';
import { usePlayer } from '../state/PlayerContext';
import { colors, radii } from '../theme/colors';

const TILES: { label: string; href: string; icon: string; color: string; badge?: 'daily' | 'ach' }[] = [
  { label: 'Map', href: '/map', icon: '🗺', color: '#9BE36B' },
  { label: 'Daily gift', href: '/daily', icon: '🎁', color: '#FFD85C', badge: 'daily' },
  { label: 'Store', href: '/store', icon: '🛒', color: '#B388FF' },
  { label: 'Inventory', href: '/inventory', icon: '🎒', color: '#5EE0D0' },
  { label: 'Achievements', href: '/achievements', icon: '🏆', color: '#FFB25C', badge: 'ach' },
  { label: 'Leaderboard', href: '/leaderboard', icon: '📊', color: '#7B9CFF' },
  { label: 'News', href: '/news', icon: '📰', color: '#FF9ECF' },
  { label: 'Profile', href: '/profile', icon: '🙂', color: '#A8F0C0' },
  { label: 'Settings', href: '/settings', icon: '⚙', color: '#D8C7FF' },
  { label: 'Support', href: '/support', icon: '💬', color: '#9FDFFF' },
];

export default function HomeScreen() {
  const { player, watchAd, dailyClaimable, achievementClaimable } = usePlayer();
  const level = getLevel(player.currentLevelId);
  const cloudLabel = player.cloudStatus === 'synced' ? 'Synced' : 'Saved on this phone';
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

  return (
    <LinearGradient colors={[...colors.sky]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View style={styles.top}>
          <View style={styles.identity}>
            <Image source={AvatarImages[player.avatarId]} style={styles.avatar} />
            <View>
              <Title style={{ fontSize: 22 }}>{player.displayName || 'Pip'}</Title>
              <Body muted style={{ fontSize: 13 }}>
                {cloudLabel}
              </Body>
            </View>
          </View>
          <View style={styles.topRight}>
            <CoinPill coins={player.coins} />
            <Text style={styles.cloud}>☁</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Image source={Images.logo} style={styles.logo} />
          <Title large style={styles.brand}>
            GLOOM RIOT
          </Title>

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
            {TILES.map((t) => {
              const showBadge =
                (t.badge === 'daily' && dailyClaimable) ||
                (t.badge === 'ach' && achievementClaimable);
              return (
                <Pressable
                  key={t.href}
                  style={({ pressed }) => [
                    styles.tile,
                    { backgroundColor: t.color },
                    pressed && { transform: [{ translateY: 5 }] },
                  ]}
                  onPress={() => router.push(t.href as never)}
                >
                  <View style={styles.tileIconWrap}>
                    <Text style={styles.tileIcon}>{t.icon}</Text>
                  </View>
                  <Text style={styles.tileText}>{t.label}</Text>
                  {showBadge ? <View style={styles.redBadge} /> : null}
                </Pressable>
              );
            })}
          </View>

          <SecondaryButton
            label="Watch ad · +100 coins"
            style={{ marginTop: 8, marginBottom: 24 }}
            onPress={() => {
              const r = watchAd('freeCoins');
              setToast({ title: r.ok ? 'Reward' : 'Ads', body: r.message });
            }}
          />
        </View>
      </SafeAreaView>

      <GameModal
        visible={!!toast}
        title={toast?.title ?? ''}
        body={toast?.body}
        primaryLabel="OK"
        onPrimary={() => setToast(null)}
      />
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
    borderRadius: 26,
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
    borderRadius: radii.panel,
    borderWidth: 3,
    borderColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 6,
    borderBottomColor: 'rgba(0,0,0,0.14)',
    alignItems: 'center',
    minHeight: 88,
    justifyContent: 'center',
  },
  tileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tileIcon: { fontSize: 20 },
  tileText: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 15,
    color: colors.ink,
    textAlign: 'center',
  },
  redBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
