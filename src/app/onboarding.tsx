import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../components/Screen';
import { Body, Field, Panel, Title } from '../components/ui';
import { AVATARS, AvatarImages } from '../data/assets';
import { usePlayer } from '../state/PlayerContext';
import { colors, radii } from '../theme/colors';

export default function OnboardingScreen() {
  const { completeOnboarding } = usePlayer();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0].id);
  const y = useRef(new Animated.Value(0)).current;

  return (
    <Screen scroll>
      <Title large>Welcome, adventurer</Title>
      <Body muted style={{ marginTop: 6, marginBottom: 16 }}>
        Pick an avatar and a display name. All 18 avatars are free.
      </Body>

      <Panel>
        <Body style={{ marginBottom: 10 }}>Choose your avatar</Body>
        <View style={styles.grid}>
          {AVATARS.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => setAvatar(a.id)}
              style={[styles.avatarWrap, avatar === a.id && styles.avatarSelected]}
            >
              <Image source={AvatarImages[a.id]} style={styles.avatar} />
              <Body style={styles.avatarName}>{a.name}</Body>
            </Pressable>
          ))}
        </View>
      </Panel>

      <Panel style={{ marginTop: 14 }}>
        <Body style={{ marginBottom: 8 }}>Display name</Body>
        <Field
          value={name}
          onChangeText={setName}
          placeholder="Pip"
          maxLength={16}
          autoCapitalize="words"
        />
      </Panel>

      <Pressable
        onPressIn={() =>
          Animated.timing(y, { toValue: 5, duration: 60, useNativeDriver: true }).start()
        }
        onPressOut={() =>
          Animated.timing(y, { toValue: 0, duration: 80, useNativeDriver: true }).start()
        }
        onPress={() => {
          completeOnboarding(name || 'Pip', avatar);
          router.replace('/home');
        }}
        style={{ marginTop: 20 }}
      >
        <Animated.View style={{ transform: [{ translateY: y }] }}>
          <LinearGradient colors={['#FFD85C', '#E8A800']} style={styles.candyBtn}>
            <Body style={styles.candyText}>Start playing</Body>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  avatarWrap: {
    width: '30%',
    alignItems: 'center',
    padding: 8,
    borderRadius: 18,
    backgroundColor: colors.muted,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: colors.accent,
    backgroundColor: '#FFF4D0',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarName: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  candyBtn: {
    borderRadius: radii.button,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(0,0,0,0.18)',
  },
  candyText: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 18,
    color: colors.ink,
  },
});
