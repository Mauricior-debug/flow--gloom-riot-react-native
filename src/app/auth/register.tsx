import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Screen } from '../../components/Screen';
import { BackRow, Body, Field, Panel, PrimaryButton } from '../../components/ui';
import { usePlayer } from '../../state/PlayerContext';

export default function RegisterScreen() {
  const { register, player } = usePlayer();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(player.displayName);

  return (
    <Screen scroll>
      <BackRow title="Register" onBack={() => router.back()} />
      <Body muted style={{ marginBottom: 12 }}>
        Creates a local profile on this phone.
      </Body>
      <Panel>
        <Field placeholder="Display name" value={name} onChangeText={setName} />
        <Field
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={{ marginTop: 10 }}
        />
        <Field
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{ marginTop: 10 }}
        />
        <PrimaryButton
          label="Create profile"
          style={{ marginTop: 14 }}
          onPress={() => {
            const r = register(email, password, name);
            Alert.alert(r.ok ? 'Ready' : 'Register', r.message);
            if (r.ok) router.replace('/profile');
          }}
        />
      </Panel>
    </Screen>
  );
}
