import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

function VolumeSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  const steps = [0, 25, 50, 75, 100];
  return (
    <View style={styles.sliderBlock}>
      <View style={styles.sliderHead}>
        <Body style={{ flex: 1 }}>{label}</Body>
        <Text style={styles.sliderValue}>{value}</Text>
      </View>
      <View style={styles.sliderRow}>
        {steps.map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={[styles.sliderTick, value >= n && styles.sliderTickOn, value === n && styles.sliderTickActive]}
          >
            <Text style={styles.tickText}>{n}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { player, update } = usePlayer();
  const s = player.settings;

  return (
    <Screen scroll>
      <BackRow title="Settings" onBack={() => router.back()} />
      <Panel>
        <Title style={{ fontSize: 20, marginBottom: 8 }}>Audio</Title>
        <VolumeSlider
          label="Music volume"
          value={s.musicVolume ?? 50}
          onChange={(musicVolume) =>
            update((p) => ({ ...p, settings: { ...p.settings, musicVolume } }))
          }
        />
        <VolumeSlider
          label="Sound effects"
          value={s.sfxVolume ?? 80}
          onChange={(sfxVolume) =>
            update((p) => ({ ...p, settings: { ...p.settings, sfxVolume } }))
          }
        />
        <Toggle
          label="Haptics"
          value={s.haptics ?? true}
          onToggle={() =>
            update((p) => ({
              ...p,
              settings: { ...p.settings, haptics: !(p.settings.haptics ?? true) },
            }))
          }
        />
      </Panel>

      <Panel style={{ marginTop: 12 }}>
        <Title style={{ fontSize: 20, marginBottom: 8 }}>Preferences</Title>
        <Toggle
          label="Sound master"
          value={s.sound}
          onToggle={() =>
            update((p) => ({ ...p, settings: { ...p.settings, sound: !p.settings.sound } }))
          }
        />
        <Toggle
          label="Show danger tiles"
          value={s.showDangerTiles ?? true}
          onToggle={() =>
            update((p) => ({
              ...p,
              settings: {
                ...p.settings,
                showDangerTiles: !(p.settings.showDangerTiles ?? true),
              },
            }))
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
  sliderBlock: { marginBottom: 14 },
  sliderHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sliderValue: {
    fontFamily: 'Fredoka_600SemiBold',
    color: colors.ink,
  },
  sliderRow: { flexDirection: 'row', gap: 8 },
  sliderTick: {
    flex: 1,
    backgroundColor: colors.muted,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sliderTickOn: { backgroundColor: '#dffaf5' },
  sliderTickActive: {
    backgroundColor: colors.primary,
  },
  tickText: {
    fontFamily: 'Fredoka_600SemiBold',
    color: colors.ink,
    fontSize: 12,
  },
});
