import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { GameModal } from '../components/GameModal';
import { Screen } from '../components/Screen';
import { BackRow, Body, Field, Panel, PrimaryButton, Title } from '../components/ui';
import { getAllLevels } from '../data/levels';
import { usePlayer } from '../state/PlayerContext';
import { colors } from '../theme/colors';

export default function AdminScreen() {
  const { player, update } = usePlayer();
  const [banner, setBanner] = useState(player.eventBanner);
  const [mult, setMult] = useState(String(player.coinRewardMultiplier));
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

  return (
    <Screen scroll>
      <BackRow title="Admin demo" onBack={() => router.back()} />
      <Body muted style={{ marginBottom: 12 }}>
        Local demo controls. Writes the same on-device save. Not a website.
      </Body>

      <Panel>
        <Title style={{ fontSize: 18 }}>Event banner</Title>
        <Field
          value={banner}
          onChangeText={setBanner}
          placeholder="Weekend gem rush!"
          style={{ marginTop: 8 }}
        />
        <PrimaryButton
          label="Save banner"
          style={{ marginTop: 10 }}
          onPress={() => {
            update((p) => ({ ...p, eventBanner: banner.trim() }));
            setToast({ title: 'Saved', body: 'Event banner updated' });
          }}
        />
      </Panel>

      <Panel style={{ marginTop: 12 }}>
        <Title style={{ fontSize: 18 }}>Coin reward multiplier</Title>
        <Field
          value={mult}
          onChangeText={setMult}
          keyboardType="decimal-pad"
          style={{ marginTop: 8 }}
        />
        <PrimaryButton
          label="Save multiplier"
          style={{ marginTop: 10 }}
          onPress={() => {
            const n = Number(mult);
            if (!n || n <= 0) {
              setToast({ title: 'Invalid', body: 'Enter a positive number' });
              return;
            }
            update((p) => ({ ...p, coinRewardMultiplier: n }));
            setToast({ title: 'Saved', body: `Multiplier set to ${n}` });
          }}
        />
      </Panel>

      <Panel style={{ marginTop: 12 }}>
        <Title style={{ fontSize: 18, marginBottom: 8 }}>Unlock levels</Title>
        {getAllLevels().map((lvl) => {
          const unlocked =
            player.unlockedLevels.includes(lvl.id) || player.forceUnlocked.includes(lvl.id);
          return (
            <Pressable
              key={lvl.id}
              style={styles.levelRow}
              onPress={() => {
                update((p) => {
                  const force = new Set(p.forceUnlocked);
                  const unlockedSet = new Set(p.unlockedLevels);
                  if (force.has(lvl.id) || unlockedSet.has(lvl.id)) {
                    force.delete(lvl.id);
                  } else {
                    force.add(lvl.id);
                    unlockedSet.add(lvl.id);
                  }
                  return {
                    ...p,
                    forceUnlocked: Array.from(force),
                    unlockedLevels: Array.from(unlockedSet),
                  };
                });
              }}
            >
              <Body style={{ flex: 1 }}>
                {lvl.id} · {lvl.name}
              </Body>
              <Body style={{ color: unlocked ? colors.primary : colors.danger }}>
                {unlocked ? 'Unlocked' : 'Locked'}
              </Body>
            </Pressable>
          );
        })}
      </Panel>

      <GameModal
        visible={!!toast}
        title={toast?.title ?? ''}
        body={toast?.body}
        primaryLabel="OK"
        onPrimary={() => setToast(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  levelRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
});
