import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { GameModal } from '../../components/GameModal';
import { Screen } from '../../components/Screen';
import { BackRow, Body, Field, Panel, PrimaryButton } from '../../components/ui';
import { usePlayer } from '../../state/PlayerContext';

export default function ResetScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { resetPassword } = usePlayer();
  const [email, setEmail] = useState(emailParam ?? '');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState<{ title: string; body: string; go?: boolean } | null>(null);

  return (
    <Screen scroll>
      <BackRow title="Reset password" onBack={() => router.back()} />
      <Body muted style={{ marginBottom: 12 }}>
        Updates the password on this device only.
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
          placeholder="New password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{ marginTop: 10 }}
        />
        <PrimaryButton
          label="Save password"
          style={{ marginTop: 14 }}
          onPress={() => {
            const r = resetPassword(email, password);
            setToast({ title: r.ok ? 'Updated' : 'Reset', body: r.message, go: r.ok });
          }}
        />
      </Panel>
      <GameModal
        visible={!!toast}
        title={toast?.title ?? ''}
        body={toast?.body}
        primaryLabel="OK"
        onPrimary={() => {
          const go = toast?.go;
          setToast(null);
          if (go) router.replace('/auth/login');
        }}
      />
    </Screen>
  );
}
