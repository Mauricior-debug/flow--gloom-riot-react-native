import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Screen } from '../../components/Screen';
import { BackRow, Body, Field, Panel, PrimaryButton, SecondaryButton } from '../../components/ui';
import { usePlayer } from '../../state/PlayerContext';

export default function LoginScreen() {
  const { login } = usePlayer();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Screen scroll>
      <BackRow title="Log in" onBack={() => router.back()} />
      <Body muted style={{ marginBottom: 12 }}>
        Unlocks the same local save. No remote user database.
      </Body>
      <Panel>
        <Field
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Field
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{ marginTop: 10 }}
        />
        <PrimaryButton
          label="Log in"
          style={{ marginTop: 14 }}
          onPress={() => {
            const r = login(email, password);
            Alert.alert(r.ok ? 'Welcome' : 'Login', r.message);
            if (r.ok) router.replace('/profile');
          }}
        />
      </Panel>
      <SecondaryButton
        label="Forgot password"
        style={{ marginTop: 12 }}
        onPress={() => router.push('/auth/forgot')}
      />
      <SecondaryButton
        label="Create account"
        style={{ marginTop: 10 }}
        onPress={() => router.push('/auth/register')}
      />
    </Screen>
  );
}
