import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BackRow, Body, Panel, Title } from '../components/ui';
import { usePlayer } from '../state/PlayerContext';
import { colors } from '../theme/colors';

function Toggle({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.toggleRow}>
      <Body style={{ flex: 1 }}>{label}</Body>
      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { player, update } = usePlayer();
  const s = player.settings;

  return (
    <Screen scroll>
      <BackRow title="Settings" onBack={() => router.back()} />
      <Panel>
        <Title style={{ fontSize: 20, marginBottom: 8 }}>Preferences</Title>
        <Toggle
          label="Sound"
          value={s.sound}
          onToggle={() =>
            update((p) => ({ ...p, settings: { ...p.settings, sound: !p.settings.sound } }))
          }
        />
        <Toggle
          label="Reduce motion"
          value={s.reduceMotion}
          onToggle={() =>
            update((p) => ({
              ...p,
              settings: { ...p.settings, reduceMotion: !p.settings.reduceMotion },
            }))
          }
        />
        <Toggle
          label="Large text"
          value={s.largeText}
          onToggle={() =>
            update((p) => ({
              ...p,
              settings: { ...p.settings, largeText: !p.settings.largeText },
            }))
          }
        />
        <Toggle
          label="High contrast"
          value={s.highContrast}
          onToggle={() =>
            update((p) => ({
              ...p,
              settings: { ...p.settings, highContrast: !p.settings.highContrast },
            }))
          }
        />
      </Panel>
      <Body muted style={{ marginTop: 12 }}>
        Cloud: {player.cloudStatus === 'synced' ? 'Synced' : 'Saved on this phone'}
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  track: {
    width: 52,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#d6cbb8',
    padding: 3,
  },
  trackOn: { backgroundColor: colors.primary },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  knobOn: { alignSelf: 'flex-end' },
});
