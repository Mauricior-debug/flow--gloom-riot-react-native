import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BackRow, Body, Panel, Title } from '../components/ui';
import { WORLDS } from '../data/levels';
import { usePlayer } from '../state/PlayerContext';
import { colors, radii } from '../theme/colors';

export default function MapScreen() {
  const { player, isWorldUnlocked, isLevelUnlocked } = usePlayer();

  return (
    <Screen scroll>
      <BackRow title="World Map" onBack={() => router.back()} />
      <Body muted style={{ marginBottom: 12 }}>
        Five worlds. Unlock them in order. Starlight Skies is coming soon.
      </Body>

      {WORLDS.map((world) => {
        const theme = colors.worlds[world.theme];
        const unlocked = world.playable && isWorldUnlocked(world.id);

        if (!world.playable) {
          return (
            <Panel key={world.id} style={{ marginBottom: 14, opacity: 0.95 }}>
              <Image source={world.image} style={styles.art} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{world.badge}</Text>
              </View>
              <Title style={{ fontSize: 22, marginTop: 8 }}>{world.name}</Title>
              <Body style={{ marginTop: 4 }}>{world.comingSoon}</Body>
              <Body muted style={{ marginTop: 8 }}>Coming Soon · Locked</Body>
            </Panel>
          );
        }

        return (
          <LinearGradient
            key={world.id}
            colors={[...theme.gradient]}
            style={[styles.worldCard, !unlocked && { opacity: 0.55 }]}
          >
            <Image source={world.image} style={styles.art} />
            <Text style={[styles.worldName, { color: theme.ink }]}>{world.name}</Text>
            <Text style={[styles.tagline, { color: theme.ink }]}>{world.tagline}</Text>
            {world.bossName ? (
              <Text style={[styles.boss, { color: theme.ink }]}>Boss: {world.bossName}</Text>
            ) : null}
            {!unlocked ? (
              <Text style={[styles.locked, { color: theme.ink }]}>Locked</Text>
            ) : (
              <View style={styles.levels}>
                {world.levels.map((lvl) => {
                  const open = isLevelUnlocked(lvl.id);
                  const stars = player.progress[lvl.id]?.stars ?? 0;
                  return (
                    <Pressable
                      key={lvl.id}
                      disabled={!open}
                      onPress={() => router.push(`/level/${lvl.id}`)}
                      style={[styles.levelChip, !open && { opacity: 0.45 }]}
                    >
                      <Text style={styles.levelChipText}>
                        {lvl.order}. {lvl.name}
                      </Text>
                      <Text style={styles.stars}>{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </LinearGradient>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  worldCard: {
    borderRadius: radii.panel,
    borderWidth: 3,
    borderColor: '#fff',
    padding: 14,
    marginBottom: 14,
  },
  art: {
    width: '100%',
    height: 120,
    borderRadius: 20,
    marginBottom: 8,
  },
  worldName: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 24,
  },
  tagline: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    marginTop: 2,
  },
  boss: {
    fontFamily: 'Nunito_700Bold',
    marginTop: 4,
  },
  locked: {
    fontFamily: 'Fredoka_600SemiBold',
    marginTop: 8,
  },
  levels: { marginTop: 10, gap: 8 },
  levelChip: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    padding: 12,
  },
  levelChipText: {
    fontFamily: 'Fredoka_600SemiBold',
    color: colors.ink,
    fontSize: 15,
  },
  stars: {
    marginTop: 2,
    color: colors.accent,
    fontSize: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  badgeText: {
    color: '#fff',
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 12,
  },
});
