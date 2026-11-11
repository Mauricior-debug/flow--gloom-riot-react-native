import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Body, Field, Panel, PrimaryButton, Title } from '../components/ui';
import { AVATARS, AvatarImages } from '../data/assets';
import { usePlayer } from '../state/PlayerContext';
import { colors, radii } from '../theme/colors';

export default function OnboardingScreen() {
  const { completeOnboarding } = usePlayer();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0].id);

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
              style={[
                styles.avatarWrap,
                avatar === a.id && styles.avatarSelected,
              ]}
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

      <PrimaryButton
        label="Start playing"
        style={{ marginTop: 20 }}
        onPress={() => {
          completeOnboarding(name || 'Pip', avatar);
          router.replace('/home');
        }}
      />
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
  },
  avatarSelected: {
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: '#dffaf5',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radii.button,
  },
  avatarName: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
