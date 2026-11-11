import { router } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
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
import { AvatarImages } from '../data/assets';
import { usePlayer } from '../state/PlayerContext';

export default function ProfileScreen() {
  const { player, logout } = usePlayer();

  return (
    <Screen scroll>
      <BackRow
        title="Profile"
        onBack={() => router.back()}
        right={<CoinPill coins={player.coins} />}
      />
      <Panel>
        <View style={styles.head}>
          <Image source={AvatarImages[player.avatarId]} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Title style={{ fontSize: 24 }}>{player.displayName || 'Pip'}</Title>
            <Body muted>
              {player.loggedIn ? 'Local profile · Synced' : 'Guest · Saved on this phone'}
            </Body>
          </View>
        </View>
        <Body style={{ marginTop: 12 }}>
          Levels cleared {player.stats.levelsCleared} · Gems {player.stats.gems} · Score{' '}
          {player.stats.totalScore}
        </Body>
      </Panel>

      {!player.loggedIn ? (
        <>
          <PrimaryButton
            label="Log in"
            style={{ marginTop: 14 }}
            onPress={() => router.push('/auth/login')}
          />
          <SecondaryButton
            label="Create local profile"
            style={{ marginTop: 10 }}
            onPress={() => router.push('/auth/register')}
          />
        </>
      ) : (
        <SecondaryButton label="Log out" style={{ marginTop: 14 }} onPress={logout} />
      )}

      <SecondaryButton
        label="Admin demo"
        style={{ marginTop: 10 }}
        onPress={() => router.push('/admin')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#fff' },
});
