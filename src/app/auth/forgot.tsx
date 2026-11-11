import { router } from 'expo-router';
import { useState } from 'react';
import { Screen } from '../../components/Screen';
import { BackRow, Body, Field, Panel, PrimaryButton } from '../../components/ui';

export default function ForgotScreen() {
  const [email, setEmail] = useState('');

  return (
    <Screen scroll>
      <BackRow title="Forgot password" onBack={() => router.back()} />
      <Body muted style={{ marginBottom: 12 }}>
        Enter the email for your local profile, then set a new password.
      </Body>
      <Panel>
        <Field
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <PrimaryButton
          label="Continue"
          style={{ marginTop: 14 }}
          onPress={() =>
            router.push({ pathname: '/auth/reset', params: { email } })
          }
        />
      </Panel>
    </Screen>
  );
}
