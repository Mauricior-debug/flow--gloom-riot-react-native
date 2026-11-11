import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Screen } from '../components/Screen';
import { BackRow, Body, Panel, PrimaryButton, Title } from '../components/ui';
import { getLevel, WORLDS } from '../data/levels';
import { usePlayer } from '../state/PlayerContext';
import { colors, radii } from '../theme/colors';

function GlassBanner({ text }: { text: string }) {
  return (
    <View style={styles.glassBanner}>
      <Body style={{ fontSize: 13, lineHeight: 18 }}>{text}</Body>
    </View>
  );
}

function StarlightCard({
  onOpen,
}: {
  onOpen: () => void;
}) {
  const dust = useRef(
    [0, 1, 2, 3, 4, 5].map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const loops = dust.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 280),
          Animated.timing(v, {
            toValue: 1,
            duration: 2200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [dust]);

  return (
    <Pressable onPress={onOpen} style={styles.starlightCard}>
      <View style={styles.starlightPhotoWrap}>
        <Image
          source={WORLDS.find((w) => w.id === 'starlight-skies')!.image}
          style={[styles.worldPhoto, { opacity: 0.72 }]}
        />
        <View style={styles.discoverBadge}>
          <Text style={styles.discoverText}>Discover Star Gates</Text>
        </View>
        <View style={styles.comingRibbon}>
          <Text style={styles.comingRibbonText}>COMING SOON</Text>
        </View>
        {dust.map((v, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dust,
              {
                left: 24 + i * 42,
                opacity: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.9, 0] }),
                transform: [
                  {
                    translateY: v.interpolate({
                      inputRange: [0, 1],
                      outputRange: [120, -20],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.starlightBody}>
        <View style={styles.lockTile}>
          <Text style={styles.lockGlyph}>🔒</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Title style={{ fontSize: 22 }}>Starlight Skies</Title>
          <Body muted style={{ marginTop: 4 }}>
            A new sky-high escape is on the way — hop the floating isles and discover Star Gates!
          </Body>
        </View>
      </View>
    </Pressable>
  );
}

function LevelNode({
  order,
  name,
  stars,
  open,
  boss,
  current,
  reduceMotion,
  onPress,
}: {
  order: number;
  name: string;
  stars: number;
  open: boolean;
  boss: boolean;
  current: boolean;
  reduceMotion: boolean;
  onPress: () => void;
}) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!current || reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [current, reduceMotion, pulse]);

  const size = boss ? 58 : 48;
  const bg = !open
    ? '#9AA0A6'
    : current
      ? '#FFF4D9'
      : boss
        ? '#E8A800'
        : stars > 0
          ? '#2FB463'
          : '#FFF4D9';
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <Pressable
      disabled={!open}
      onPress={onPress}
      style={[styles.nodeWrap, order % 2 === 0 && { marginTop: 22 }]}
    >
      <View style={{ alignItems: 'center' }}>
        {current && (
          <Animated.View
            style={[
              styles.goldRing,
              {
                width: size + 14,
                height: size + 14,
                borderRadius: (size + 14) / 2,
                transform: [{ scale: ringScale }],
              },
            ]}
          />
        )}
        <View
          style={[
            styles.node,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: bg,
            },
            boss && styles.nodeBoss,
          ]}
        >
          {!open ? (
            <Text style={styles.nodeLock}>🔒</Text>
          ) : boss ? (
            <Text style={styles.crown}>♔</Text>
          ) : (
            <Text style={[styles.nodeNum, { color: current ? colors.ink : '#fff' }]}>{order}</Text>
          )}
        </View>
        {open && (
          <Text style={styles.nodeStars}>
            {([1, 2, 3] as const).map((n) => (
              <Text key={n} style={{ color: stars >= n ? '#FFD85C' : '#fff' }}>
                ★
              </Text>
            ))}
          </Text>
        )}
        <View style={styles.namePill}>
          <Text numberOfLines={1} style={styles.namePillText}>
            {name}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function MapScreen() {
  const { player, isWorldUnlocked, isLevelUnlocked, update } = usePlayer();
  const [teaserOpen, setTeaserOpen] = useState(false);
  const playable = WORLDS.filter((w) => w.playable);
  const starlight = WORLDS.find((w) => !w.playable)!;

  return (
    <Screen scroll>
      <BackRow title="World Map" onBack={() => router.back()} />
      <GlassBanner text="Clear each level to unlock the next. Finish a world's final stage to open the next world. Replay any cleared level for more stars!" />

      {playable.map((world, worldIndex) => {
        const theme = colors.worlds[world.theme];
        const unlocked = isWorldUnlocked(world.id);
        const totalStars = world.levels.reduce(
          (sum, l) => sum + (player.progress[l.id]?.stars ?? 0),
          0
        );
        const maxStars = world.levels.length * 3;
        const required = world.unlockAfter ? getLevel(world.unlockAfter) : null;

        return (
          <View key={world.id} style={styles.worldPanel}>
            <View style={styles.photoWrap}>
              <Image
                source={world.image}
                style={[styles.worldPhoto, !unlocked && styles.greyPhoto]}
              />
              <LinearGradient
                colors={['transparent', 'rgba(20,12,8,0.82)']}
                style={styles.photoFade}
              >
                <View style={styles.photoTextRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.worldOrder}>WORLD {worldIndex + 1}</Text>
                    <Text style={styles.worldTitle}>{world.name}</Text>
                    <Text style={styles.worldTag}>{world.tagline}</Text>
                    {world.bossName ? (
                      <Text style={styles.bossLine}>♔ Boss: {world.bossName}</Text>
                    ) : null}
                  </View>
                  <View style={styles.starPill}>
                    <Text style={styles.starPillText}>
                      ★ {totalStars}/{maxStars}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {!unlocked ? (
              <Body style={{ marginTop: 10, color: theme.ink }}>
                Unlocks after completing &quot;{required?.name ?? 'previous world'}&quot;
              </Body>
            ) : (
              <LinearGradient colors={[...theme.gradient]} style={styles.nodesBand}>
                <View style={styles.nodesRow}>
                  {world.levels.map((lvl) => {
                    const open = isLevelUnlocked(lvl.id);
                    const stars = player.progress[lvl.id]?.stars ?? 0;
                    const current = player.currentLevelId === lvl.id;
                    return (
                      <LevelNode
                        key={lvl.id}
                        order={lvl.order}
                        name={lvl.name}
                        stars={stars}
                        open={open}
                        boss={!!lvl.boss}
                        current={current}
                        reduceMotion={player.settings.reduceMotion}
                        onPress={() => router.push(`/level/${lvl.id}`)}
                      />
                    );
                  })}
                </View>
              </LinearGradient>
            )}
          </View>
        );
      })}

      <StarlightCard onOpen={() => setTeaserOpen(true)} />

      <Modal visible={teaserOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <Panel style={styles.modalCard}>
            <Image source={starlight.image} style={styles.modalArt} />
            <Title style={{ fontSize: 22, marginTop: 10 }}>New World Coming Soon</Title>
            <Body style={{ marginTop: 8 }}>{starlight.comingSoon}</Body>
            <PrimaryButton
              label={player.settings.starlightNotify ? 'You\'ll be notified' : 'Notify me'}
              style={{ marginTop: 14 }}
              onPress={() => {
                update((p) => ({
                  ...p,
                  settings: { ...p.settings, starlightNotify: true },
                }));
              }}
            />
            <Pressable onPress={() => setTeaserOpen(false)} style={{ marginTop: 12 }}>
              <Body style={{ textAlign: 'center', color: colors.secondary }}>Close</Body>
            </Pressable>
          </Panel>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  glassBanner: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    padding: 12,
    marginBottom: 14,
  },
  worldPanel: {
    backgroundColor: '#FFF8E8',
    borderRadius: radii.panel,
    borderWidth: 3,
    borderColor: '#fff',
    padding: 12,
    marginBottom: 16,
    shadowColor: '#5c3a1c',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  photoWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 160,
  },
  worldPhoto: {
    width: '100%',
    height: 160,
  },
  greyPhoto: {
    opacity: 0.6,
  },
  photoFade: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    padding: 12,
  },
  photoTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  worldOrder: {
    fontFamily: 'Fredoka_600SemiBold',
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  worldTitle: {
    fontFamily: 'Fredoka_700Bold',
    color: '#fff',
    fontSize: 26,
  },
  worldTag: {
    fontFamily: 'Nunito_500Medium',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  bossLine: {
    fontFamily: 'Fredoka_600SemiBold',
    color: '#FFE566',
    marginTop: 2,
  },
  starPill: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  starPillText: {
    fontFamily: 'Fredoka_600SemiBold',
    color: colors.ink,
    fontSize: 13,
  },
  nodesBand: {
    marginTop: 12,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  nodesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  nodeWrap: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 8,
  },
  node: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(0,0,0,0.18)',
  },
  nodeBoss: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  nodeNum: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 18,
    color: '#fff',
  },
  nodeLock: { fontSize: 16 },
  crown: { fontSize: 22, color: '#fff' },
  goldRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#E8A800',
    top: -7,
  },
  nodeStars: {
    marginTop: 4,
    fontSize: 12,
    letterSpacing: 1,
  },
  namePill: {
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 110,
  },
  namePillText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    color: colors.ink,
    textAlign: 'center',
  },
  starlightCard: {
    backgroundColor: '#F4EEFF',
    borderRadius: radii.panel,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
    marginBottom: 20,
  },
  starlightPhotoWrap: {
    height: 160,
    overflow: 'hidden',
  },
  discoverBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  discoverText: {
    color: '#fff',
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 11,
  },
  comingRibbon: {
    position: 'absolute',
    right: -28,
    top: 22,
    backgroundColor: '#7B3FE4',
    paddingVertical: 6,
    paddingHorizontal: 36,
    transform: [{ rotate: '35deg' }],
  },
  comingRibbonText: {
    color: '#fff',
    fontFamily: 'Fredoka_700Bold',
    fontSize: 11,
    letterSpacing: 1,
  },
  dust: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    bottom: 20,
  },
  starlightBody: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    alignItems: 'center',
  },
  lockTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2A2140',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockGlyph: { fontSize: 18 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { paddingBottom: 18 },
  modalArt: { width: '100%', height: 140, borderRadius: 18 },
});
