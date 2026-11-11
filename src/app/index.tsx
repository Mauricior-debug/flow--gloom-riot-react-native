import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { Images } from '../data/assets';
import { usePlayer } from '../state/PlayerContext';
import { colors } from '../theme/colors';

export default function SplashScreen() {
  const { ready, player } = usePlayer();
  const [progress, setProgress] = useState(0);
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(bar, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();
    const t = setInterval(() => {
      setProgress((p) => Math.min(100, p + 5));
    }, 100);
    return () => clearInterval(t);
  }, [bar]);

  useEffect(() => {
    if (!ready || progress < 100) return;
    const id = setTimeout(() => {
      if (!player.onboarded) router.replace('/onboarding');
      else router.replace('/home');
    }, 200);
    return () => clearTimeout(id);
  }, [ready, progress, player.onboarded]);

  const width = bar.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient colors={[...colors.sky]} style={styles.wrap}>
      <Image source={Images.logo} style={styles.logo} />
      <Text style={styles.name}>GLOOM RIOT</Text>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width }]} />
      </View>
      <Text style={styles.loading}>Loading…</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 36,
    marginBottom: 16,
  },
  name: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 40,
    color: colors.ink,
    letterSpacing: 1,
    marginBottom: 28,
  },
  barTrack: {
    width: '70%',
    height: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.65)',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  loading: {
    marginTop: 12,
    fontFamily: 'Nunito_500Medium',
    color: colors.ink,
  },
});
