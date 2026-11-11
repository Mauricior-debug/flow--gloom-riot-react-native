import { router, useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { BackRow, Body, Panel, PrimaryButton, Title } from '../../components/ui';
import { GLOOM_META, getLevel, resolveLevel } from '../../data/levels';
import { usePlayer } from '../../state/PlayerContext';
import { colors } from '../../theme/colors';

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

  const resolved = resolveLevel(level);
  const unlocked = isLevelUnlocked(level.id) || player.forceUnlocked.includes(level.id);

  return (
    <Screen scroll>
      <BackRow title={level.name} onBack={() => router.back()} />
      <Panel>
        <Title style={{ fontSize: 26 }}>{level.name}</Title>
        <Body style={{ marginTop: 8 }}>{level.objective}</Body>
        <Body style={{ marginTop: 12 }}>
          Hearts {resolved.hearts} · Par {resolved.par} · Reward {resolved.reward} coins
        </Body>
        {resolved.gemGoal > 0 && (
          <Body style={{ marginTop: 4 }}>Star Gem goal: {resolved.gemGoal}</Body>
        )}
        {level.boss && <Body style={{ marginTop: 4, color: colors.danger }}>Boss level</Body>}
        {level.exitLocked && (
          <Body style={{ marginTop: 4 }}>EXIT starts locked — press every switch.</Body>
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
                <Body muted>Dice {dmin}–{dmax}</Body>
              </View>
            </View>
          );
        })}
      </Panel>

      <PrimaryButton
        label={unlocked ? 'Play' : 'Locked'}
        disabled={!unlocked}
        style={{ marginTop: 18 }}
        onPress={() => {
          setCurrentLevel(level.id);
          router.push(`/play/${level.id}`);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  gloomRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  gloomImg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 3,
  },
});
