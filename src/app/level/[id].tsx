import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { BackRow, Body, Panel, PrimaryButton, Title } from '../../components/ui';
import { GLOOM_META, getLevel, resolveLevel, WORLDS } from '../../data/levels';
import { usePlayer } from '../../state/PlayerContext';
import { colors, radii } from '../../theme/colors';

export default function LevelPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isLevelUnlocked, setCurrentLevel, player } = usePlayer();
  const level = getLevel(id);

  if (!level) {
    return (
      <Screen>
        <BackRow title="Level" onBack={() => router.back()} />
        <Body>Level not found.</Body>
      </Screen>
    );
  }

  const world = WORLDS.find((w) => w.id === level.worldId);
  const resolved = resolveLevel(level);
  const unlocked = isLevelUnlocked(level.id) || player.forceUnlocked.includes(level.id);

  return (
    <Screen scroll>
      <BackRow title={level.name} onBack={() => router.back()} />

      <View style={styles.photoWrap}>
        {world ? (
          <Image source={world.image} style={styles.photo} />
        ) : (
          <View style={[styles.photo, { backgroundColor: colors.muted }]} />
        )}
        <LinearGradient colors={['transparent', 'rgba(20,12,8,0.78)']} style={styles.fade}>
          <Text style={styles.photoTitle}>{level.name}</Text>
          {level.boss ? <Text style={styles.boss}>♔ Boss level</Text> : null}
        </LinearGradient>
      </View>

      <Panel style={{ marginTop: 12 }}>
        <Body>{level.objective}</Body>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{'♥'.repeat(resolved.hearts)}</Text>
          <Text style={styles.meta}>Par {resolved.par}</Text>
          <Text style={styles.meta}>{resolved.reward}●</Text>
        </View>
        {resolved.gemGoal > 0 && (
          <Body muted style={{ marginTop: 6 }}>
            Star Gem goal: {resolved.gemGoal}
          </Body>
        )}
        {level.exitLocked && (
          <Body style={{ marginTop: 6 }}>EXIT starts locked — press every switch.</Body>
        )}
      </Panel>

      <Panel style={{ marginTop: 12 }}>
        <Title style={{ fontSize: 20, marginBottom: 8 }}>Glooms</Title>
        {level.glooms.map((g, i) => {
          const meta = GLOOM_META[g.kind];
          const dmin = g.diceMin ?? meta.diceDefault[0];
          const dmax = g.diceMax ?? meta.diceDefault[1];
          return (
            <View key={i} style={styles.gloomRow}>
              <Image source={meta.image} style={[styles.gloomImg, { borderColor: meta.ring }]} />
              <View style={{ flex: 1 }}>
                <Body style={{ fontFamily: 'Fredoka_600SemiBold' }}>{meta.name}</Body>
                <Body muted>{meta.blurb}</Body>
                <Body muted>
                  Dice {dmin}–{dmax}
                </Body>
              </View>
            </View>
          );
        })}
      </Panel>

      <PrimaryButton
        label={unlocked ? 'Play' : 'Locked'}
        disabled={!unlocked}
        style={{ marginTop: 18, backgroundColor: unlocked ? colors.accent : undefined }}
        onPress={() => {
          setCurrentLevel(level.id);
          router.push(`/play/${level.id}`);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoWrap: {
    height: 160,
    borderRadius: radii.panel,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fff',
  },
  photo: { width: '100%', height: 160 },
  fade: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    padding: 14,
  },
  photoTitle: {
    fontFamily: 'Fredoka_700Bold',
    color: '#fff',
    fontSize: 26,
  },
  boss: {
    fontFamily: 'Fredoka_600SemiBold',
    color: colors.accent,
    marginTop: 2,
  },
  metaRow: { flexDirection: 'row', gap: 14, marginTop: 12 },
  meta: { fontFamily: 'Fredoka_600SemiBold', color: colors.ink },
  gloomRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  gloomImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
  },
});
